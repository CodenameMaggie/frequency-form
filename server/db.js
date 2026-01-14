/**
 * Database Module - PostgreSQL with Supabase-like API
 *
 * CRITICAL FIX: Falls back to Supabase when DATABASE_URL is not available
 * This fixes the issue where Vercel serverless functions don't have DATABASE_URL
 * but DO have NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 */

const { Pool } = require('pg');
const { createClient } = require('@supabase/supabase-js');
const { URL } = require('url');

// Determine which database connection to use
// Support both Vercel (NEXT_PUBLIC_SUPABASE_URL) and Railway (SUPABASE_URL) variable names
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
// Railway uses SUPABASE_KEY for the service role JWT, not SUPABASE_SERVICE_KEY
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

const useSupabase = !process.env.DATABASE_URL && supabaseUrl && supabaseKey;

if (useSupabase) {
  console.log('[DB] Using Supabase client (DATABASE_URL not configured)');
  console.log(`[DB] Supabase URL: ${supabaseUrl}`);
} else if (!process.env.DATABASE_URL) {
  console.error('[DB] WARNING: Neither DATABASE_URL nor Supabase credentials configured');
}

// CRITICAL: Always create Supabase client if credentials are available
// This is needed for RLS bypass in migrations even when using PostgreSQL pool
const supabaseClient = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null;

// Parse DATABASE_URL to extract components for IPv4-only connection
function parseConnectionString(connStr) {
  const url = new URL(connStr.replace('postgresql://', 'http://'));
  return {
    user: url.username,
    password: decodeURIComponent(url.password),
    host: url.hostname,
    port: parseInt(url.port) || 5432,
    database: url.pathname.slice(1) // Remove leading /
  };
}

// Create connection pool with better error handling
const pool = process.env.DATABASE_URL ? new Pool({
  ...parseConnectionString(process.env.DATABASE_URL),
  // Force IPv4 to avoid Railway IPv6 connectivity issues with Supabase
  family: 4,
  // Enable SSL for hosted databases (Supabase, Railway, etc.)
  // Supabase REQUIRES SSL for all connections
  ssl: (() => {
    const url = process.env.DATABASE_URL || '';
    // Check if connecting to hosted database (not localhost)
    const isHosted = (url.includes('supabase') ||
                      url.includes('railway') ||
                      url.includes('.com') ||
                      url.includes('.net')) &&
                     !url.includes('localhost');

    if (!isHosted) {
      return false;  // Local database, no SSL
    }

    // Railway proxy and Supabase pooler can have certificate issues, use lenient SSL
    if (url.includes('railway') || url.includes('rlwy') || url.includes('pooler.supabase.com')) {
      return {
        rejectUnauthorized: false  // Railway proxy and Supabase pooler don't always have valid certs
      };
    }

    return {
      rejectUnauthorized: true  // SECURITY: Validate SSL certificates for other hosts
    };
  })(),
  max: 10, // PRODUCTION: Reduced for Supabase pooler (max 15 per client)
  min: 0, // Don't establish connections until needed
  idleTimeoutMillis: 30000, // 30s - close idle connections faster
  connectionTimeoutMillis: 10000, // 10s - fail fast on connection issues
  // Retry configuration for Railway
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000, // Increased to 10s - less aggressive keep-alive
  // Additional Railway optimizations
  statement_timeout: 60000, // Increased to 60s for slow Railway proxy
  query_timeout: 60000, // Increased to 60s for slow Railway proxy
}) : null;

// Log connection status if pool exists
if (pool) {
  pool.on('connect', () => {
    console.log('[DB] Connected to PostgreSQL');
  });

  pool.on('error', (err) => {
    console.error('[DB] Unexpected error on idle client:', err.message);
    // Log connection resets separately for monitoring
    if (err.code === 'ECONNRESET' || err.message.includes('Connection terminated')) {
      console.log('[DB] Connection was reset - pool will retry automatically');
    }
  });
}

/**
 * Retry wrapper for database queries
 * Handles transient connection errors common in Railway deployments
 * FIXED: Now works with both PostgreSQL pool and Supabase client
 */
async function retryQuery(queryFn, maxRetries = 3, delayMs = 1000) {
  // CRITICAL: Check if database is configured (either pool or supabaseClient)
  if (!pool && !supabaseClient) {
    throw new Error('Database not configured - Neither DATABASE_URL nor Supabase credentials available');
  }

  // If using Supabase, no retry needed - Supabase handles retries internally
  if (supabaseClient && !pool) {
    return await queryFn();
  }

  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await queryFn();
    } catch (error) {
      lastError = error;

      // Only retry on connection errors
      const isConnectionError =
        error.code === 'ECONNRESET' ||
        error.code === 'ETIMEDOUT' ||
        error.code === 'ECONNREFUSED' ||
        error.message?.includes('Connection terminated') ||
        error.message?.includes('connect ETIMEDOUT');

      if (!isConnectionError || attempt === maxRetries) {
        throw error;
      }

      console.log(`[DB] Retry attempt ${attempt}/${maxRetries} after connection error: ${error.message}`);
      await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
    }
  }

  throw lastError;
}

/**
 * Query Builder Class - Mimics Supabase API
 */
class QueryBuilder {
  constructor(tableName) {
    this.tableName = tableName;
    this.selectColumns = '*';
    this.whereClauses = [];
    this.whereValues = [];
    this.orderByClause = '';
    this.limitClause = '';
    this.offsetClause = '';
    this.isSingle = false;
    this.isMaybeSingle = false;
    this.isCount = false;
    this.isInsert = false;
    this.isUpdate = false;
    this.isDelete = false;
    this.isUpsert = false;
    this.upsertConflict = '';
    this.insertData = null;
    this.updateData = null;
    this.returningColumns = '*';
    this.joins = [];
    this.joinColumns = [];
  }

  /**
   * SELECT columns
   * Supports Supabase-style nested selects like:
   * select('*, contacts(id, full_name, email)')
   */
  select(columns = '*', options = {}) {
    if (options.count === 'exact' && options.head) {
      this.isCount = true;
      this.selectColumns = 'COUNT(*)';
    } else {
      // Parse Supabase-style nested selects: table(col1, col2)
      const nestedPattern = /(\w+)\s*\(\s*([^)]+)\s*\)/g;
      let match;
      let cleanColumns = columns;

      while ((match = nestedPattern.exec(columns)) !== null) {
        const joinTable = match[1];
        const joinCols = match[2].split(',').map(c => c.trim());

        // Determine the foreign key - assume it's {joinTable}_id or contact_id for contacts
        let foreignKey = `${joinTable}_id`;
        if (joinTable === 'contacts') foreignKey = 'contact_id';
        if (joinTable === 'users') foreignKey = 'user_id';

        this.joins.push({
          table: joinTable,
          foreignKey: foreignKey,
          columns: joinCols
        });

        // Add prefixed columns for the join
        joinCols.forEach(col => {
          this.joinColumns.push(`${joinTable}.${col} AS "${joinTable}.${col}"`);
        });

        // Remove the nested select from the columns string
        cleanColumns = cleanColumns.replace(match[0], '').replace(/,\s*,/g, ',').replace(/^\s*,|,\s*$/g, '').trim();
      }

      this.selectColumns = cleanColumns || '*';
    }
    return this;
  }

  /**
   * INSERT data
   */
  insert(data) {
    this.isInsert = true;
    this.insertData = Array.isArray(data) ? data : [data];
    return this;
  }

  /**
   * UPDATE data
   */
  update(data) {
    this.isUpdate = true;
    this.updateData = data;
    return this;
  }

  /**
   * DELETE
   */
  delete() {
    this.isDelete = true;
    return this;
  }

  /**
   * UPSERT (insert or update on conflict)
   */
  upsert(data, { onConflict } = {}) {
    this.isUpsert = true;
    this.insertData = Array.isArray(data) ? data : [data];
    this.upsertConflict = onConflict || 'id';
    return this;
  }

  /**
   * WHERE clause - eq (equals)
   */
  eq(column, value) {
    this.whereValues.push(value);
    this.whereClauses.push(`${column} = $${this.whereValues.length}`);
    return this;
  }

  /**
   * WHERE clause - neq (not equals)
   */
  neq(column, value) {
    this.whereValues.push(value);
    this.whereClauses.push(`${column} != $${this.whereValues.length}`);
    return this;
  }

  /**
   * WHERE clause - gt (greater than)
   */
  gt(column, value) {
    this.whereValues.push(value);
    this.whereClauses.push(`${column} > $${this.whereValues.length}`);
    return this;
  }

  /**
   * WHERE clause - gte (greater than or equal)
   */
  gte(column, value) {
    this.whereValues.push(value);
    this.whereClauses.push(`${column} >= $${this.whereValues.length}`);
    return this;
  }

  /**
   * WHERE clause - lt (less than)
   */
  lt(column, value) {
    this.whereValues.push(value);
    this.whereClauses.push(`${column} < $${this.whereValues.length}`);
    return this;
  }

  /**
   * WHERE clause - lte (less than or equal)
   */
  lte(column, value) {
    this.whereValues.push(value);
    this.whereClauses.push(`${column} <= $${this.whereValues.length}`);
    return this;
  }

  /**
   * WHERE clause - like (pattern match)
   */
  like(column, pattern) {
    this.whereValues.push(pattern);
    this.whereClauses.push(`${column} LIKE $${this.whereValues.length}`);
    return this;
  }

  /**
   * WHERE clause - ilike (case-insensitive pattern match)
   */
  ilike(column, pattern) {
    this.whereValues.push(pattern);
    this.whereClauses.push(`${column} ILIKE $${this.whereValues.length}`);
    return this;
  }

  /**
   * WHERE clause - is (for NULL checks)
   */
  is(column, value) {
    if (value === null) {
      this.whereClauses.push(`${column} IS NULL`);
    } else {
      this.whereValues.push(value);
      this.whereClauses.push(`${column} IS $${this.whereValues.length}`);
    }
    return this;
  }

  /**
   * WHERE clause - in (value in array)
   */
  in(column, values) {
    if (!values || values.length === 0) {
      this.whereClauses.push('FALSE'); // No matches possible
      return this;
    }
    const placeholders = values.map((_, i) => `$${this.whereValues.length + i + 1}`).join(', ');
    this.whereValues.push(...values);
    this.whereClauses.push(`${column} IN (${placeholders})`);
    return this;
  }

  /**
   * WHERE clause - not.in (value not in array)
   */
  not(column, operator, value) {
    if (operator === 'in') {
      if (!value || value.length === 0) {
        return this; // No exclusions
      }
      const placeholders = value.map((_, i) => `$${this.whereValues.length + i + 1}`).join(', ');
      this.whereValues.push(...value);
      this.whereClauses.push(`${column} NOT IN (${placeholders})`);
    }
    return this;
  }

  /**
   * WHERE clause - contains (for JSONB/arrays)
   */
  contains(column, value) {
    this.whereValues.push(JSON.stringify(value));
    this.whereClauses.push(`${column} @> $${this.whereValues.length}::jsonb`);
    return this;
  }

  /**
   * WHERE clause - or (combine conditions with OR)
   */
  or(conditions) {
    // conditions is a string like "status.eq.active,status.eq.pending"
    const parts = conditions.split(',').map(cond => {
      const match = cond.match(/(\w+)\.(\w+)\.(.+)/);
      if (match) {
        const [, col, op, val] = match;
        this.whereValues.push(val);
        return `${col} = $${this.whereValues.length}`;
      }
      return null;
    }).filter(Boolean);

    if (parts.length > 0) {
      this.whereClauses.push(`(${parts.join(' OR ')})`);
    }
    return this;
  }

  /**
   * ORDER BY clause
   */
  order(column, { ascending = true } = {}) {
    const direction = ascending ? 'ASC' : 'DESC';
    if (this.orderByClause) {
      this.orderByClause += `, ${column} ${direction}`;
    } else {
      this.orderByClause = `ORDER BY ${column} ${direction}`;
    }
    return this;
  }

  /**
   * LIMIT clause
   */
  limit(count) {
    this.limitClause = `LIMIT ${count}`;
    return this;
  }

  /**
   * OFFSET clause (for range queries)
   */
  range(from, to) {
    this.offsetClause = `OFFSET ${from}`;
    this.limitClause = `LIMIT ${to - from + 1}`;
    return this;
  }

  /**
   * Return single result
   */
  single() {
    this.isSingle = true;
    this.limitClause = 'LIMIT 1';
    return this;
  }

  /**
   * Maybe return single result (no error if not found)
   */
  maybeSingle() {
    this.isSingle = true;
    this.isMaybeSingle = true; // Add flag to differentiate from single()
    this.limitClause = 'LIMIT 1';
    return this;
  }

  /**
   * Build and execute the query
   */
  async then(resolve, reject) {
    try {
      const result = await this._execute();
      resolve(result);
    } catch (error) {
      reject(error);
    }
  }

  /**
   * Internal: Execute the built query
   */
  async _execute() {
    let query = '';
    let values = [];

    if (this.isInsert || this.isUpsert) {
      return this._executeInsert();
    } else if (this.isUpdate) {
      return this._executeUpdate();
    } else if (this.isDelete) {
      return this._executeDelete();
    } else {
      return this._executeSelect();
    }
  }

  async _executeSelect() {
    // Use Supabase client if available (Vercel serverless functions)
    if (supabaseClient && !pool) {
      try {
        let query = supabaseClient.from(this.tableName).select(this.selectColumns);

        // Apply where clauses using Supabase's filter methods
        for (let i = 0; i < this.whereClauses.length; i++) {
          const clause = this.whereClauses[i];
          const value = this.whereValues[i];

          // Parse the clause to extract column, operator, and apply filter
          // This is a simplified version - handles basic eq operations
          const match = clause.match(/(\w+)\s*=\s*\$\d+/);
          if (match) {
            query = query.eq(match[1], value);
          }
        }

        // Apply order, limit, and range
        if (this.orderByClause) {
          const orderMatch = this.orderByClause.match(/ORDER BY (\w+) (ASC|DESC)/);
          if (orderMatch) {
            query = query.order(orderMatch[1], { ascending: orderMatch[2] === 'ASC' });
          }
        }

        if (this.isSingle || this.isMaybeSingle) {
          const { data, error } = await query.maybeSingle();
          return {
            data: data || null,
            error: (error || (!data && !this.isMaybeSingle)) ? { message: error?.message || 'No rows found' } : null
          };
        }

        const { data, error } = await query;
        return { data: data || [], error: error ? { message: error.message } : null };
      } catch (error) {
        console.error('[DB] Supabase Select error:', error.message);
        return { data: null, error: { message: error.message } };
      }
    }

    // Original PostgreSQL pool implementation
    // Build column list with join columns
    let selectCols = this.selectColumns;
    if (this.joins.length > 0) {
      // Prefix main table columns
      if (selectCols === '*') {
        selectCols = `${this.tableName}.*`;
      }
      // Add join columns
      if (this.joinColumns.length > 0) {
        selectCols += ', ' + this.joinColumns.join(', ');
      }
    }

    let query = `SELECT ${selectCols} FROM ${this.tableName}`;

    // Add LEFT JOINs
    for (const join of this.joins) {
      query += ` LEFT JOIN ${join.table} ON ${this.tableName}.${join.foreignKey} = ${join.table}.id`;
    }

    if (this.whereClauses.length > 0) {
      query += ` WHERE ${this.whereClauses.join(' AND ')}`;
    }

    if (this.orderByClause) {
      query += ` ${this.orderByClause}`;
    }

    if (this.limitClause) {
      query += ` ${this.limitClause}`;
    }

    if (this.offsetClause) {
      query += ` ${this.offsetClause}`;
    }

    try {
      const result = await retryQuery(() => pool.query(query, this.whereValues));

      // Transform flat join columns back into nested objects
      if (this.joins.length > 0) {
        result.rows = result.rows.map(row => {
          const transformed = { ...row };
          for (const join of this.joins) {
            transformed[join.table] = {};
            for (const col of join.columns) {
              const key = `${join.table}.${col}`;
              if (row[key] !== undefined) {
                transformed[join.table][col] = row[key];
                delete transformed[key];
              }
            }
            // If all join columns are null, set the nested object to null
            const allNull = join.columns.every(col => row[`${join.table}.${col}`] === null);
            if (allNull) {
              transformed[join.table] = null;
            }
          }
          return transformed;
        });
      }

      if (this.isCount) {
        return { count: parseInt(result.rows[0].count), error: null };
      }

      if (this.isSingle) {
        return {
          data: result.rows[0] || null,
          error: (result.rows.length === 0 && !this.isMaybeSingle) ? { message: 'No rows found' } : null
        };
      }

      return { data: result.rows, error: null };
    } catch (error) {
      console.error('[DB] Select error:', error.message);
      return { data: null, error: { message: error.message, code: error.code } };
    }
  }

  async _executeInsert() {
    const data = this.insertData[0]; // For simplicity, handle single insert
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');

    let query = `INSERT INTO ${this.tableName} (${columns.join(', ')}) VALUES (${placeholders})`;

    if (this.isUpsert) {
      const updateCols = columns
        .filter(c => c !== this.upsertConflict)
        .map(c => `${c} = EXCLUDED.${c}`)
        .join(', ');
      query += ` ON CONFLICT (${this.upsertConflict}) DO UPDATE SET ${updateCols}`;
    }

    query += ` RETURNING ${this.returningColumns}`;

    try {
      const result = await retryQuery(() => pool.query(query, values));
      return {
        data: this.isSingle ? result.rows[0] : result.rows,
        error: null
      };
    } catch (error) {
      console.error('[DB] Insert error:', error.message);
      return { data: null, error: { message: error.message, code: error.code } };
    }
  }

  async _executeUpdate() {
    const columns = Object.keys(this.updateData);
    const values = Object.values(this.updateData);
    const setClause = columns.map((col, i) => `${col} = $${i + 1}`).join(', ');

    // Adjust where clause placeholders
    const whereClausesAdjusted = this.whereClauses.map((clause, i) => {
      return clause.replace(/\$(\d+)/g, (_, num) => `$${parseInt(num) + columns.length}`);
    });

    let query = `UPDATE ${this.tableName} SET ${setClause}`;

    if (whereClausesAdjusted.length > 0) {
      query += ` WHERE ${whereClausesAdjusted.join(' AND ')}`;
    }

    query += ` RETURNING ${this.returningColumns}`;

    const allValues = [...values, ...this.whereValues];

    try {
      const result = await retryQuery(() => pool.query(query, allValues));
      return {
        data: this.isSingle ? result.rows[0] : result.rows,
        error: null
      };
    } catch (error) {
      console.error('[DB] Update error:', error.message);
      return { data: null, error: { message: error.message, code: error.code } };
    }
  }

  async _executeDelete() {
    let query = `DELETE FROM ${this.tableName}`;

    if (this.whereClauses.length > 0) {
      query += ` WHERE ${this.whereClauses.join(' AND ')}`;
    }

    query += ` RETURNING ${this.returningColumns}`;

    try {
      // Check if pool exists before attempting query
      if (!pool && !supabaseClient) {
        throw new Error('Database not configured');
      }

      const result = await retryQuery(() => {
        if (pool) {
          return pool.query(query, this.whereValues);
        } else if (supabaseClient) {
          // Use Supabase for delete
          const parsedTable = this.tableName.replace(/"/g, '');
          let builder = supabaseClient.from(parsedTable).delete();

          // Apply where clauses
          this.whereClauses.forEach((clause, i) => {
            const match = clause.match(/(\w+)\s*=\s*\$\d+/);
            if (match) {
              builder = builder.eq(match[1], this.whereValues[i]);
            }
          });

          return builder.then(result => ({
            rows: result.data || [],
            rowCount: result.data ? result.data.length : 0
          }));
        }
      });

      return { data: result.rows, error: null, count: result.rowCount };
    } catch (error) {
      console.error('[DB] Delete error:', error.message);
      return { data: null, error: { message: error.message, code: error.code } };
    }
  }
}

/**
 * Database client with Supabase-like API
 */
const db = {
  /**
   * Query a table - returns QueryBuilder or Supabase query
   * Uses Supabase client directly when available for full query support
   */
  from(tableName) {
    // Use Supabase client directly when available - supports all query types
    if (supabaseClient) {
      return supabaseClient.from(tableName);
    }
    // Fall back to custom QueryBuilder for PostgreSQL pool
    return new QueryBuilder(tableName);
  },

  /**
   * Raw query execution with Supabase fallback
   * PRIORITY: Use PostgreSQL pool when available for raw SQL (handles complex queries)
   * FALLBACK: Use Supabase client SQL parser only when pool is unavailable
   */
  async query(text, params = []) {
    // PRIORITY: Use PostgreSQL pool for raw SQL queries when available
    // The pool handles complex JOINs, INTERVAL, NOW(), subqueries, etc.
    if (pool) {
      try {
        const result = await retryQuery(() => pool.query(text, params));
        return { data: result.rows, error: null, rowCount: result.rowCount };
      } catch (error) {
        console.error('[DB] Query error:', error.message);
        return { data: null, error: { message: error.message, code: error.code } };
      }
    }

    // FALLBACK: Use Supabase client only when pool is unavailable (Vercel serverless)
    // Note: Supabase SQL parser has limitations - can't handle complex queries
    if (supabaseClient) {
      try {
        // Parse simple SQL queries and convert to Supabase calls
        const sql = text.trim().toUpperCase();

        // SELECT queries
        if (sql.startsWith('SELECT')) {
          return await this._executeSupabaseSelect(text, params);
        }

        // INSERT queries
        if (sql.startsWith('INSERT')) {
          return await this._executeSupabaseInsert(text, params);
        }

        // UPDATE queries
        if (sql.startsWith('UPDATE')) {
          return await this._executeSupabaseUpdate(text, params);
        }

        // DELETE queries
        if (sql.startsWith('DELETE')) {
          return await this._executeSupabaseDelete(text, params);
        }

        // Complex queries not supported
        console.warn('[DB SQL Parser] Unhandled query type:', text.substring(0, 50));
        return { data: null, error: { message: 'Complex SQL queries require DATABASE_URL (PostgreSQL pool)' } };

      } catch (error) {
        console.error('[DB] Supabase SQL parse error:', error.message);
        return { data: null, error: { message: error.message } };
      }
    }

    // No database configured
    console.error('[DB] No database connection available');
    return { data: null, error: { message: 'Database not configured - set DATABASE_URL or Supabase credentials' } };
  },

  /**
   * Execute SELECT queries via Supabase
   */
  async _executeSupabaseSelect(sql, params) {
    // Normalize whitespace in SQL
    const normalizedSql = sql.replace(/\s+/g, ' ').trim();

    // Extract table name from "SELECT ... FROM table_name"
    const fromMatch = normalizedSql.match(/FROM\s+([a-z_]+)/i);
    if (!fromMatch) {
      console.error('[DB SQL Parser] Could not parse table name from:', normalizedSql.substring(0, 100));
      return { data: null, error: { message: 'Could not parse table name from SELECT' } };
    }

    const tableName = fromMatch[1];
    let query = supabaseClient.from(tableName).select('*');

    // Parse WHERE clauses
    const whereMatch = normalizedSql.match(/WHERE\s+(.+?)(?:\s+ORDER\s+BY|\s+LIMIT|$)/i);
    if (whereMatch) {
      const whereClauses = whereMatch[1].trim();

      // Parse WHERE clauses - supports both $1 parameters and literal values
      let paramIndex = 0;
      const clauses = whereClauses.split(/\s+AND\s+/i);

      for (const clause of clauses) {
        const trimmedClause = clause.trim();

        // Skip complex clauses we can't handle (JOINs, subqueries, etc.)
        // These will be filtered out and the query will return all rows
        if (trimmedClause.includes('EXISTS') ||
            trimmedClause.includes('SELECT') ||
            trimmedClause.includes(' JOIN ')) {
          console.log('[DB SQL Parser] Skipping complex clause (not supported):', trimmedClause.substring(0, 50));
          continue;
        }

        // Match column = $N (parameterized equals)
        const paramEqMatch = trimmedClause.match(/^([a-z_\.]+)\s*=\s*\$(\d+)$/i);
        if (paramEqMatch) {
          const paramNum = parseInt(paramEqMatch[2]) - 1;
          if (params[paramNum] !== undefined) {
            query = query.eq(paramEqMatch[1], params[paramNum]);
          }
          continue;
        }

        // Match column <= $N (parameterized less than or equal)
        const paramLteMatch = trimmedClause.match(/^([a-z_\.]+)\s*<=\s*\$(\d+)$/i);
        if (paramLteMatch) {
          const paramNum = parseInt(paramLteMatch[2]) - 1;
          if (params[paramNum] !== undefined) {
            query = query.lte(paramLteMatch[1], params[paramNum]);
          }
          continue;
        }

        // Match column >= $N (parameterized greater than or equal)
        const paramGteMatch = trimmedClause.match(/^([a-z_\.]+)\s*>=\s*\$(\d+)$/i);
        if (paramGteMatch) {
          const paramNum = parseInt(paramGteMatch[2]) - 1;
          if (params[paramNum] !== undefined) {
            query = query.gte(paramGteMatch[1], params[paramNum]);
          }
          continue;
        }

        // Match column < $N (parameterized less than)
        const paramLtMatch = trimmedClause.match(/^([a-z_\.]+)\s*<\s*\$(\d+)$/i);
        if (paramLtMatch) {
          const paramNum = parseInt(paramLtMatch[2]) - 1;
          if (params[paramNum] !== undefined) {
            query = query.lt(paramLtMatch[1], params[paramNum]);
          }
          continue;
        }

        // Match column > $N (parameterized greater than)
        const paramGtMatch = trimmedClause.match(/^([a-z_\.]+)\s*>\s*\$(\d+)$/i);
        if (paramGtMatch) {
          const paramNum = parseInt(paramGtMatch[2]) - 1;
          if (params[paramNum] !== undefined) {
            query = query.gt(paramGtMatch[1], params[paramNum]);
          }
          continue;
        }

        // Match column < NOW() - INTERVAL 'X hours/days/etc'
        const nowIntervalLtMatch = trimmedClause.match(/^([a-z_\.]+)\s*<\s*NOW\(\)\s*-\s*INTERVAL\s*'(\d+)\s*(hour|hours|day|days|minute|minutes)'/i);
        if (nowIntervalLtMatch) {
          const column = nowIntervalLtMatch[1];
          const amount = parseInt(nowIntervalLtMatch[2]);
          const unit = nowIntervalLtMatch[3].toLowerCase();
          let ms = amount;
          if (unit.startsWith('hour')) ms = amount * 60 * 60 * 1000;
          else if (unit.startsWith('day')) ms = amount * 24 * 60 * 60 * 1000;
          else if (unit.startsWith('minute')) ms = amount * 60 * 1000;
          const cutoffDate = new Date(Date.now() - ms).toISOString();
          query = query.lt(column, cutoffDate);
          continue;
        }

        // Match column > NOW() - INTERVAL 'X hours/days/etc'
        const nowIntervalGtMatch = trimmedClause.match(/^([a-z_\.]+)\s*>\s*NOW\(\)\s*-\s*INTERVAL\s*'(\d+)\s*(hour|hours|day|days|minute|minutes)'/i);
        if (nowIntervalGtMatch) {
          const column = nowIntervalGtMatch[1];
          const amount = parseInt(nowIntervalGtMatch[2]);
          const unit = nowIntervalGtMatch[3].toLowerCase();
          let ms = amount;
          if (unit.startsWith('hour')) ms = amount * 60 * 60 * 1000;
          else if (unit.startsWith('day')) ms = amount * 24 * 60 * 60 * 1000;
          else if (unit.startsWith('minute')) ms = amount * 60 * 1000;
          const cutoffDate = new Date(Date.now() - ms).toISOString();
          query = query.gt(column, cutoffDate);
          continue;
        }

        // Match column = 'literal' (string literal)
        const literalMatch = trimmedClause.match(/^([a-z_\.]+)\s*=\s*'([^']*)'$/i);
        if (literalMatch) {
          query = query.eq(literalMatch[1], literalMatch[2]);
          continue;
        }

        // Match column IN ('val1', 'val2')
        const inMatch = trimmedClause.match(/^([a-z_\.]+)\s+IN\s*\(([^)]+)\)$/i);
        if (inMatch) {
          const values = inMatch[2].split(',').map(v => v.trim().replace(/^'|'$/g, ''));
          query = query.in(inMatch[1], values);
          continue;
        }

        // Match column NOT IN ('val1', 'val2')
        const notInMatch = trimmedClause.match(/^([a-z_\.]+)\s+NOT\s+IN\s*\(([^)]+)\)$/i);
        if (notInMatch) {
          const values = notInMatch[2].split(',').map(v => v.trim().replace(/^'|'$/g, ''));
          query = query.not(notInMatch[1], 'in', `(${values.join(',')})`);
          continue;
        }

        // Log unhandled clauses for debugging (but don't fail)
        console.warn('[DB SQL Parser] Unhandled WHERE clause:', trimmedClause);
      }
    }

    // Parse ORDER BY
    const orderMatch = normalizedSql.match(/ORDER\s+BY\s+([a-z_]+)\s*(ASC|DESC)?/i);
    if (orderMatch) {
      const orderColumn = orderMatch[1];
      const orderDirection = orderMatch[2] ? orderMatch[2].toUpperCase() === 'ASC' : false;
      query = query.order(orderColumn, { ascending: orderDirection });
    }

    // Parse LIMIT
    const limitMatch = normalizedSql.match(/LIMIT\s+(\d+)/i);
    if (limitMatch) {
      query = query.limit(parseInt(limitMatch[1]));
    }

    const { data, error } = await query;
    return { data: data || [], error: error ? { message: error.message } : null };
  },

  /**
   * Execute INSERT queries via Supabase
   * FIXED: Now correctly handles NOW(), CURRENT_DATE, and other SQL functions in VALUES
   */
  async _executeSupabaseInsert(sql, params) {
    const tableMatch = sql.match(/INSERT INTO\s+([a-z_]+)/i);
    if (!tableMatch) {
      return { data: null, error: { message: 'Could not parse table name from INSERT' } };
    }

    const tableName = tableMatch[1];
    const columnsMatch = sql.match(/\(([^)]+)\)\s+VALUES/i);

    if (!columnsMatch) {
      return { data: null, error: { message: 'Could not parse columns from INSERT' } };
    }

    // Extract VALUES clause - handle nested parentheses like NOW(), gen_random_uuid()
    // Find VALUES ( and then match until the closing ) accounting for nested parens
    const valuesStart = sql.toUpperCase().indexOf('VALUES');
    if (valuesStart === -1) {
      return { data: null, error: { message: 'Could not find VALUES in INSERT' } };
    }

    const afterValues = sql.substring(valuesStart + 6).trim();
    if (!afterValues.startsWith('(')) {
      return { data: null, error: { message: 'Could not parse VALUES from INSERT' } };
    }

    // Extract content between parentheses, handling nested parens
    let depth = 0;
    let valuesContent = '';
    for (let i = 0; i < afterValues.length; i++) {
      const char = afterValues[i];
      if (char === '(') depth++;
      else if (char === ')') {
        depth--;
        if (depth === 0) break;
      }
      if (depth > 0 && i > 0) {
        valuesContent += char;
      }
    }

    if (!valuesContent) {
      return { data: null, error: { message: 'Could not parse VALUES content from INSERT' } };
    }

    const columns = columnsMatch[1].split(',').map(c => c.trim());

    // Split values by comma, but respect parentheses (for function calls)
    const valuePlaceholders = [];
    let currentValue = '';
    let parenDepth = 0;
    for (const char of valuesContent) {
      if (char === '(') parenDepth++;
      else if (char === ')') parenDepth--;
      else if (char === ',' && parenDepth === 0) {
        valuePlaceholders.push(currentValue.trim());
        currentValue = '';
        continue;
      }
      currentValue += char;
    }
    if (currentValue.trim()) {
      valuePlaceholders.push(currentValue.trim());
    }

    const insertData = {};
    let paramIndex = 0;

    columns.forEach((col, i) => {
      const valuePlaceholder = valuePlaceholders[i];

      if (!valuePlaceholder) return;

      // Handle SQL functions
      if (/^NOW\(\)$/i.test(valuePlaceholder)) {
        insertData[col] = new Date().toISOString();
      } else if (/^CURRENT_DATE$/i.test(valuePlaceholder)) {
        insertData[col] = new Date().toISOString().split('T')[0];
      } else if (/^CURRENT_TIMESTAMP$/i.test(valuePlaceholder)) {
        insertData[col] = new Date().toISOString();
      } else if (/^\$\d+$/i.test(valuePlaceholder)) {
        // This is a parameter placeholder like $1, $2, etc.
        const paramNum = parseInt(valuePlaceholder.substring(1)) - 1;
        if (params[paramNum] !== undefined) {
          insertData[col] = params[paramNum];
        }
      } else if (/^gen_random_uuid\(\)$/i.test(valuePlaceholder)) {
        // Let Supabase handle UUID generation by not setting the column
        // (Supabase will use the default)
      } else if (/^DEFAULT$/i.test(valuePlaceholder)) {
        // Skip DEFAULT values - let database handle them
      } else {
        // Literal value (rare, but handle it)
        insertData[col] = valuePlaceholder.replace(/^'|'$/g, '');
      }
    });

    try {
      const { data, error } = await supabaseClient
        .from(tableName)
        .insert(insertData)
        .select()
        .single();

      return { data: data ? [data] : [], error: error ? { message: error.message } : null, rowCount: data ? 1 : 0 };
    } catch (err) {
      console.error('[DB] Supabase INSERT error:', err.message);
      return { data: null, error: { message: err.message }, rowCount: 0 };
    }
  },

  /**
   * Execute UPDATE queries via Supabase
   * FIXED: Now correctly handles NOW(), CURRENT_DATE, and other SQL functions in SET clause
   */
  async _executeSupabaseUpdate(sql, params) {
    const tableMatch = sql.match(/UPDATE\s+([a-z_]+)/i);
    if (!tableMatch) {
      return { data: null, error: { message: 'Could not parse table name from UPDATE' } };
    }

    const tableName = tableMatch[1];
    // Use 's' flag (dotall) to match across newlines
    const setMatch = sql.match(/SET\s+(.+?)\s+WHERE/is);
    const whereMatch = sql.match(/WHERE\s+(.+?)(?:\s+RETURNING|$)/is);

    if (!setMatch || !whereMatch) {
      return { data: null, error: { message: 'Could not parse UPDATE query' } };
    }

    // Parse SET clause - handle SQL functions like NOW() and string literals
    const updateData = {};
    const setClauses = setMatch[1].split(',');

    setClauses.forEach(clause => {
      const trimmedClause = clause.trim();

      // Match column = NOW() or other SQL functions
      const nowMatch = trimmedClause.match(/^([a-z_]+)\s*=\s*NOW\(\)$/i);
      if (nowMatch) {
        updateData[nowMatch[1]] = new Date().toISOString();
        return;
      }

      const currentDateMatch = trimmedClause.match(/^([a-z_]+)\s*=\s*CURRENT_DATE$/i);
      if (currentDateMatch) {
        updateData[currentDateMatch[1]] = new Date().toISOString().split('T')[0];
        return;
      }

      const currentTimestampMatch = trimmedClause.match(/^([a-z_]+)\s*=\s*CURRENT_TIMESTAMP$/i);
      if (currentTimestampMatch) {
        updateData[currentTimestampMatch[1]] = new Date().toISOString();
        return;
      }

      // Match column = 'string literal'
      const stringLiteralMatch = trimmedClause.match(/^([a-z_]+)\s*=\s*'([^']*)'$/i);
      if (stringLiteralMatch) {
        updateData[stringLiteralMatch[1]] = stringLiteralMatch[2];
        return;
      }

      // Match column = $N (parameterized value)
      const paramMatch = trimmedClause.match(/^([a-z_]+)\s*=\s*\$(\d+)$/i);
      if (paramMatch) {
        const paramNum = parseInt(paramMatch[2]) - 1;
        if (params[paramNum] !== undefined) {
          updateData[paramMatch[1]] = params[paramNum];
        }
        return;
      }
    });

    // Build query
    let query = supabaseClient.from(tableName).update(updateData);

    // Parse WHERE clause
    whereMatch[1].split(/\s+AND\s+/i).forEach(clause => {
      const trimmedClause = clause.trim();
      const eqMatch = trimmedClause.match(/^([a-z_]+)\s*=\s*\$(\d+)$/i);
      if (eqMatch) {
        const paramNum = parseInt(eqMatch[2]) - 1;
        if (params[paramNum] !== undefined) {
          query = query.eq(eqMatch[1], params[paramNum]);
        }
      }
    });

    try {
      const { data, error } = await query.select();
      return { data: data || [], error: error ? { message: error.message } : null, rowCount: data?.length || 0 };
    } catch (err) {
      console.error('[DB] Supabase UPDATE error:', err.message);
      return { data: null, error: { message: err.message }, rowCount: 0 };
    }
  },

  /**
   * Execute DELETE queries via Supabase
   */
  async _executeSupabaseDelete(sql, params) {
    const tableMatch = sql.match(/DELETE FROM\s+([a-z_]+)/i);
    if (!tableMatch) {
      return { data: null, error: { message: 'Could not parse table name from DELETE' } };
    }

    const tableName = tableMatch[1];
    const whereMatch = sql.match(/WHERE\s+(.+?)(?:RETURNING|$)/i);

    let query = supabaseClient.from(tableName).delete();

    // Parse WHERE clause
    if (whereMatch) {
      let paramIndex = 0;
      whereMatch[1].split(/\s+AND\s+/i).forEach(clause => {
        const eqMatch = clause.match(/([a-z_]+)\s*=\s*\$\d+/i);
        if (eqMatch && params[paramIndex] !== undefined) {
          query = query.eq(eqMatch[1], params[paramIndex]);
          paramIndex++;
        }
      });
    }

    const { data, error } = await query.select();
    return { data: data || [], error: error ? { message: error.message } : null, rowCount: data?.length || 0 };
  },

  /**
   * Execute RPC function (stored procedure)
   */
  async rpc(functionName, params = {}) {
    const paramNames = Object.keys(params);
    const paramValues = Object.values(params);
    const placeholders = paramNames.map((name, i) => `${name} := $${i + 1}`).join(', ');

    const query = `SELECT * FROM ${functionName}(${placeholders})`;

    try {
      const result = await retryQuery(() => pool.query(query, paramValues));
      return { data: result.rows, error: null };
    } catch (error) {
      console.error('[DB] RPC error:', error.message);
      return { data: null, error: { message: error.message, code: error.code } };
    }
  },

  /**
   * Get the underlying pool for advanced operations
   */
  pool,

  /**
   * Close pool (for graceful shutdown)
   */
  async close() {
    await pool.end();
    console.log('[DB] Connection pool closed');
  },

  /**
   * Run startup migrations to ensure all columns exist
   * Called when server starts
   */
  async runStartupMigrations() {
    console.log('[DB] Running startup migrations...');

    // CRITICAL FIX: Use pool.query() directly without acquiring a dedicated connection
    // This avoids the "Tenant or user not found" error that occurs during pool.connect()
    // in Supabase when RLS policies are evaluated at connection time
    if (!pool && !supabaseClient) {
      console.error('[DB] Cannot run migrations - No database connection configured');
      console.error('[DB] Please set either DATABASE_URL or SUPABASE credentials');
      return { success: false, error: 'Database not configured' };
    }

    if (pool) {
      console.log('[DB] Using PostgreSQL pool for migrations (no dedicated connection)');
    } else {
      console.log('[DB] Using Supabase client with service role key for migrations');
    }

    const migrations = [
      // ============ CORE TABLES ============
      // These are foundational tables that other tables reference

      // ============ TENANTS TABLE ============
      // Multi-tenant architecture - each business/organization is a tenant
      `CREATE TABLE IF NOT EXISTS tenants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        email TEXT,
        business_name TEXT,
        domain TEXT,
        subscription_tier TEXT DEFAULT 'free',
        subscription_status TEXT DEFAULT 'active',
        trial_end_date TIMESTAMP WITH TIME ZONE,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,

      // ============ FALLBACK TENANT ============
      // Create the fallback tenant used by OAuth and other systems
      `INSERT INTO tenants (id, name, business_name, email)
       VALUES ('00000000-0000-0000-0000-000000000001', 'Maggie Forbes Strategies', 'Maggie Forbes Strategies', 'maggie@growthmanagerpro.com')
       ON CONFLICT (id) DO NOTHING`,

      // ============ USERS TABLE ============
      // User accounts - belong to tenants
      `CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        first_name TEXT,
        last_name TEXT,
        phone TEXT,
        role TEXT DEFAULT 'user',
        status TEXT DEFAULT 'active',
        user_type TEXT,
        company_name TEXT,
        managed_by UUID,
        ai_analyzer_mode TEXT DEFAULT 'generic_feedback',
        meeting_type_config JSONB,
        automation_preferences JSONB,
        metadata JSONB DEFAULT '{}',
        onboarding_completed BOOLEAN DEFAULT false,
        onboarding_step INTEGER DEFAULT 0,
        joined_team_at TIMESTAMP WITH TIME ZONE,
        trial_start_date DATE,
        trial_end_date DATE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,

      // ============ CONTACTS TABLE ============
      // CRM contacts - prospects and clients
      `CREATE TABLE IF NOT EXISTS contacts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        email TEXT NOT NULL,
        first_name TEXT,
        last_name TEXT,
        full_name TEXT GENERATED ALWAYS AS (COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')) STORED,
        phone TEXT,
        company TEXT,
        title TEXT,
        source TEXT,
        stage TEXT DEFAULT 'lead',
        client_type TEXT DEFAULT 'gmp_user',
        booking_response_status TEXT,
        managed_by UUID,
        program_start_date TIMESTAMP WITH TIME ZONE,
        notes TEXT,
        tags TEXT[],
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(tenant_id, email)
      )`,

      // ============ DEALS TABLE ============
      // Sales pipeline deals
      `CREATE TABLE IF NOT EXISTS deals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
        proposal_id UUID REFERENCES proposals(id) ON DELETE SET NULL,
        deal_name TEXT NOT NULL,
        email TEXT,
        deal_value DECIMAL(10,2),
        currency TEXT DEFAULT 'USD',
        deal_stage TEXT DEFAULT 'prospecting',
        probability INTEGER DEFAULT 0,
        expected_close_date DATE,
        closed_date DATE,
        start_date DATE,
        status TEXT DEFAULT 'open',
        won BOOLEAN DEFAULT FALSE,
        notes TEXT,
        assigned_to_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,

      // ============ PROPOSALS TABLE ============
      // Business proposals sent to clients
      `CREATE TABLE IF NOT EXISTS proposals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
        title TEXT NOT NULL,
        contact_name TEXT,
        description TEXT,
        total_value NUMERIC(10, 2),
        services JSONB DEFAULT '[]',
        start_date DATE,
        duration_months INTEGER,
        terms_and_conditions TEXT,
        status TEXT DEFAULT 'draft',
        signed_at TIMESTAMP WITH TIME ZONE,
        signature_data TEXT,
        signer_name TEXT,
        signer_title TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,

      // ============ INVITATIONS TABLE ============
      // Team member and client invitations
      `CREATE TABLE IF NOT EXISTS invitations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        email TEXT NOT NULL,
        role TEXT NOT NULL,
        invitation_type TEXT DEFAULT 'team',
        invited_by UUID,
        token TEXT NOT NULL UNIQUE,
        status TEXT DEFAULT 'pending',
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        accepted_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,

      // ============ AI CONVERSATIONS TABLE ============
      // Stores AI bot conversations for authenticated users
      `CREATE TABLE IF NOT EXISTS ai_conversations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        user_id UUID,
        bot_type TEXT NOT NULL DEFAULT 'assistant',
        messages JSONB DEFAULT '[]',
        message_count INTEGER DEFAULT 0,
        context JSONB DEFAULT '{}',
        conversation_summary TEXT,
        key_facts JSONB DEFAULT '{}',
        openai_thread_id TEXT,
        started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        status TEXT DEFAULT 'active',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,

      // ============ CHAT CONVERSATIONS TABLE ============
      // Stores public website chat conversations (unauthenticated visitors)
      `CREATE TABLE IF NOT EXISTS chat_conversations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        session_data JSONB DEFAULT '{}',
        visitor_info JSONB DEFAULT '{}',
        messages JSONB DEFAULT '[]',
        started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        status TEXT DEFAULT 'active',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,

      // ============ AI MEMORY STORE TABLE ============
      // Stores verified facts and knowledge for AI bots
      `CREATE TABLE IF NOT EXISTS ai_memory_store (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        bot_type TEXT NOT NULL DEFAULT 'assistant',
        memory_type TEXT NOT NULL,
        memory_key TEXT NOT NULL,
        memory_value TEXT NOT NULL,
        importance INTEGER DEFAULT 5,
        verified_by TEXT DEFAULT 'Maggie',
        version INTEGER DEFAULT 1,
        tags TEXT[],
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(tenant_id, bot_type, memory_type, memory_key)
      )`,

      // ============ AI TASK QUEUE TABLE ============
      // Stores tasks created by AI bots (Henry, Legal bot, etc.)
      `CREATE TABLE IF NOT EXISTS ai_task_queue (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        task_type TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        context JSONB DEFAULT '{}',
        created_by TEXT,
        assigned_to TEXT,
        priority TEXT DEFAULT 'medium',
        status TEXT DEFAULT 'pending',
        support_ticket_id UUID,
        completed_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,

      // ============ SUPPORT TICKETS TABLE ============
      // Stores support tickets created by Legal bot and users
      `CREATE TABLE IF NOT EXISTS support_tickets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        user_id UUID,
        contact_id UUID,
        title TEXT NOT NULL,
        description TEXT,
        category TEXT DEFAULT 'general',
        priority TEXT DEFAULT 'medium',
        status TEXT DEFAULT 'open',
        is_bug BOOLEAN DEFAULT false,
        resolution TEXT,
        assigned_to TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        resolved_at TIMESTAMP WITH TIME ZONE
      )`,

      // ============ INTEGRATION CONFIG TABLES ============
      // These tables store OAuth tokens and API keys for integrations
      `CREATE TABLE IF NOT EXISTS zoom_config (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        access_token TEXT,
        refresh_token TEXT,
        token_expires_at TIMESTAMP WITH TIME ZONE,
        zoom_user_id TEXT,
        zoom_account_id TEXT,
        zoom_client_id TEXT,
        zoom_client_secret TEXT,
        zoom_user_email TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(tenant_id)
      )`,

      `CREATE TABLE IF NOT EXISTS calendly_config (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        access_token TEXT NOT NULL,
        refresh_token TEXT,
        expires_at TIMESTAMP,
        organization_uri TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(tenant_id)
      )`,

      `CREATE TABLE IF NOT EXISTS gmail_config (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        access_token TEXT NOT NULL,
        refresh_token TEXT NOT NULL,
        expires_at TIMESTAMP,
        email_address TEXT,
        scopes TEXT[],
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(tenant_id)
      )`,

      `CREATE TABLE IF NOT EXISTS outlook_config (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        access_token TEXT NOT NULL,
        refresh_token TEXT NOT NULL,
        expires_at TIMESTAMP,
        email_address TEXT,
        scopes TEXT[],
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(tenant_id)
      )`,

      `CREATE TABLE IF NOT EXISTS instantly_config (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        api_key TEXT NOT NULL,
        verified BOOLEAN DEFAULT false,
        last_verified_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(tenant_id)
      )`,

      // ============ PASSWORD RESETS TABLE ============
      `CREATE TABLE IF NOT EXISTS password_resets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        email TEXT NOT NULL,
        token TEXT NOT NULL UNIQUE,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,

      // ============ EMAIL QUEUE TABLE ============
      `CREATE TABLE IF NOT EXISTS email_queue (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        to_email VARCHAR(255) NOT NULL,
        from_email VARCHAR(255) DEFAULT 'support@growthmanagerpro.com',
        subject TEXT NOT NULL,
        html_body TEXT NOT NULL,
        template_name VARCHAR(100),
        template_data JSONB,
        send_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        priority INTEGER DEFAULT 5,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        retry_count INTEGER DEFAULT 0,
        max_retries INTEGER DEFAULT 3,
        last_error TEXT,
        sent_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,

      // ============ FUNNEL STAGE TABLES ============
      `CREATE TABLE IF NOT EXISTS pre_qualification_calls (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
        scheduled_at TIMESTAMP WITH TIME ZONE,
        completed_at TIMESTAMP WITH TIME ZONE,
        duration_minutes INTEGER,
        status TEXT DEFAULT 'scheduled',
        notes TEXT,
        score INTEGER,
        qualified BOOLEAN,
        zoom_meeting_id TEXT UNIQUE,
        zoom_meeting_url TEXT,
        meeting_url TEXT,
        reminder_24hr_sent BOOLEAN DEFAULT FALSE,
        reminder_1hr_sent BOOLEAN DEFAULT FALSE,
        ai_analysis JSONB,
        ai_analyzed_at TIMESTAMP WITH TIME ZONE,
        ai_score INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,

      `CREATE TABLE IF NOT EXISTS podcast_interviews (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
        episode_title TEXT,
        scheduled_at TIMESTAMP WITH TIME ZONE,
        completed_at TIMESTAMP WITH TIME ZONE,
        duration_minutes INTEGER,
        status TEXT DEFAULT 'scheduled',
        recording_url TEXT,
        notes TEXT,
        score INTEGER,
        zoom_meeting_id TEXT UNIQUE,
        zoom_meeting_url TEXT,
        meeting_url TEXT,
        reminder_24hr_sent BOOLEAN DEFAULT FALSE,
        reminder_1hr_sent BOOLEAN DEFAULT FALSE,
        key_insights JSONB DEFAULT '[]',
        ai_analysis JSONB,
        ai_analyzed_at TIMESTAMP WITH TIME ZONE,
        ai_score INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,

      `CREATE TABLE IF NOT EXISTS discovery_calls (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
        scheduled_at TIMESTAMP WITH TIME ZONE,
        completed_at TIMESTAMP WITH TIME ZONE,
        duration_minutes INTEGER,
        status TEXT DEFAULT 'scheduled',
        notes TEXT,
        pain_points TEXT,
        budget_range TEXT,
        decision_timeline TEXT,
        next_steps TEXT,
        score INTEGER,
        zoom_meeting_id TEXT UNIQUE,
        zoom_meeting_url TEXT,
        meeting_url TEXT,
        reminder_24hr_sent BOOLEAN DEFAULT FALSE,
        reminder_1hr_sent BOOLEAN DEFAULT FALSE,
        ai_analysis JSONB,
        ai_analyzed_at TIMESTAMP WITH TIME ZONE,
        ai_score INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,

      `CREATE TABLE IF NOT EXISTS strategy_calls (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
        scheduled_at TIMESTAMP WITH TIME ZONE,
        completed_at TIMESTAMP WITH TIME ZONE,
        duration_minutes INTEGER,
        status TEXT DEFAULT 'scheduled',
        notes TEXT,
        strategy_outline TEXT,
        deliverables TEXT,
        timeline TEXT,
        investment TEXT,
        next_steps TEXT,
        proposal_id UUID REFERENCES proposals(id) ON DELETE SET NULL,
        score INTEGER,
        zoom_meeting_id TEXT UNIQUE,
        zoom_meeting_url TEXT,
        meeting_url TEXT,
        reminder_24hr_sent BOOLEAN DEFAULT FALSE,
        reminder_1hr_sent BOOLEAN DEFAULT FALSE,
        ai_analysis JSONB,
        ai_analyzed_at TIMESTAMP WITH TIME ZONE,
        ai_score INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,

      // ============ ACTIVITY TRACKING TABLES ============
      `CREATE TABLE IF NOT EXISTS contact_activities (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
        activity_type TEXT NOT NULL,
        description TEXT,
        created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,

      `CREATE TABLE IF NOT EXISTS deal_activities (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
        activity_type TEXT NOT NULL,
        description TEXT,
        old_value TEXT,
        new_value TEXT,
        created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,

      // ============ CAMPAIGNS TABLE ============
      `CREATE TABLE IF NOT EXISTS campaigns (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        type TEXT,
        notes TEXT,
        target_audience TEXT,
        channels JSONB,
        goals JSONB,
        metrics JSONB,
        status TEXT DEFAULT 'draft',
        start_date DATE,
        end_date DATE,
        budget DECIMAL(10,2),
        spent DECIMAL(10,2) DEFAULT 0,
        leads_generated INTEGER DEFAULT 0,
        created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,

      // ============ SOCIAL MEDIA TABLES ============
      `CREATE TABLE IF NOT EXISTS social_posts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        platform TEXT NOT NULL CHECK (platform IN ('linkedin', 'twitter', 'facebook', 'instagram')),
        post_type TEXT DEFAULT 'ai_generated',
        content TEXT NOT NULL,
        media_urls TEXT[],
        hashtags TEXT[],
        status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'needs_revision', 'scheduled', 'published', 'failed')),
        scheduled_for TIMESTAMP WITH TIME ZONE,
        published_at TIMESTAMP WITH TIME ZONE,
        approved_by VARCHAR,
        approved_at TIMESTAMP WITH TIME ZONE,
        rejection_reason TEXT,
        brand_compliance_notes TEXT,
        utm_params JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,

      `CREATE TABLE IF NOT EXISTS newsletter_subscribers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
        email TEXT NOT NULL UNIQUE,
        full_name TEXT,
        subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        unsubscribed_at TIMESTAMP WITH TIME ZONE,
        status TEXT DEFAULT 'active',
        source TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,

      // ============ SPRINTS TABLE ============
      `CREATE TABLE IF NOT EXISTS sprints (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        start_date DATE,
        end_date DATE,
        status TEXT DEFAULT 'planning',
        created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,

      // ============ EXPENSES TABLE ============
      `CREATE TABLE IF NOT EXISTS expenses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        category TEXT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        currency TEXT DEFAULT 'USD',
        description TEXT,
        expense_date DATE NOT NULL,
        receipt_url TEXT,
        created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,

      // ============ LEGAL ALERTS TABLE ============
      `CREATE TABLE IF NOT EXISTS legal_alerts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        alert_type TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
        status TEXT DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved', 'dismissed')),
        recommendation TEXT,
        deadline TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        resolved_at TIMESTAMP WITH TIME ZONE
      )`,

      // ============ AI GOVERNANCE TABLES ============
      `CREATE TABLE IF NOT EXISTS ai_action_log (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        bot_name TEXT NOT NULL,
        action_type TEXT NOT NULL,
        action_data JSONB NOT NULL,
        requires_approval BOOLEAN DEFAULT FALSE,
        status TEXT DEFAULT 'pending',
        approved_by TEXT,
        approved_at TIMESTAMP WITH TIME ZONE,
        rejection_reason TEXT,
        executed_at TIMESTAMP WITH TIME ZONE,
        execution_result JSONB,
        error_message TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,

      `CREATE TABLE IF NOT EXISTS ai_governance_rules (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        rule_name TEXT NOT NULL,
        rule_type TEXT NOT NULL,
        bot_name TEXT,
        action_type TEXT,
        conditions JSONB DEFAULT '{}',
        action TEXT NOT NULL,
        approval_level TEXT,
        daily_limit INTEGER,
        hourly_limit INTEGER,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,

      `CREATE TABLE IF NOT EXISTS ai_kill_switch (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        is_active BOOLEAN DEFAULT FALSE,
        triggered_by TEXT,
        trigger_reason TEXT,
        triggered_at TIMESTAMP WITH TIME ZONE,
        re_enabled_by TEXT,
        re_enabled_at TIMESTAMP WITH TIME ZONE,
        re_enable_reason TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(tenant_id)
      )`,

      `CREATE TABLE IF NOT EXISTS ai_bot_health (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        bot_name TEXT NOT NULL,
        status TEXT DEFAULT 'healthy',
        last_active TIMESTAMP WITH TIME ZONE,
        actions_today INTEGER DEFAULT 0,
        actions_this_hour INTEGER DEFAULT 0,
        success_count_24h INTEGER DEFAULT 0,
        failure_count_24h INTEGER DEFAULT 0,
        success_rate NUMERIC(5,2),
        last_error TEXT,
        last_error_at TIMESTAMP WITH TIME ZONE,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,

      // ============ VIDEO STUDIO TABLES ============
      `CREATE TABLE IF NOT EXISTS video_jobs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        job_type TEXT NOT NULL CHECK (job_type IN ('podcast', 'sales', 'social_clip', 'testimonial', 'explainer', 'custom')),
        template_name TEXT,
        status TEXT DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'rendering', 'uploading', 'completed', 'failed')),
        progress INTEGER DEFAULT 0,
        source_type TEXT CHECK (source_type IN ('podcast_interview', 'manual', 'automated')),
        source_id UUID,
        audio_url TEXT,
        transcript TEXT,
        config JSONB DEFAULT '{}',
        duration_seconds INTEGER,
        resolution TEXT DEFAULT '1080p' CHECK (resolution IN ('720p', '1080p', '4k')),
        output_path TEXT,
        output_url TEXT,
        thumbnail_url TEXT,
        error_message TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        completed_at TIMESTAMP WITH TIME ZONE
      )`,

      `CREATE TABLE IF NOT EXISTS video_templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('podcast', 'sales', 'social_clip', 'testimonial', 'explainer', 'custom')),
        description TEXT,
        config JSONB NOT NULL DEFAULT '{}',
        usage_count INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        is_default BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,

      `CREATE TABLE IF NOT EXISTS video_assets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
        asset_type TEXT NOT NULL CHECK (asset_type IN ('intro', 'outro', 'logo', 'watermark', 'background_music', 'sound_effect', 'overlay')),
        name TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_url TEXT,
        file_size_mb NUMERIC(10, 2),
        duration_seconds INTEGER,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,

      // ============ MEETING MANAGEMENT TABLES ============
      `CREATE TABLE IF NOT EXISTS time_slots (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
        time_of_day TIME NOT NULL,
        end_time TIME,
        timezone TEXT DEFAULT 'America/New_York',
        stage TEXT NOT NULL,
        specific_date DATE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,

      `CREATE TABLE IF NOT EXISTS proposed_meetings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
        meeting_type TEXT NOT NULL,
        option_1 TIMESTAMP WITH TIME ZONE,
        option_2 TIMESTAMP WITH TIME ZONE,
        option_3 TIMESTAMP WITH TIME ZONE,
        selected_option INTEGER,
        confirmed_time TIMESTAMP WITH TIME ZONE,
        status TEXT DEFAULT 'proposed',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,

      `CREATE TABLE IF NOT EXISTS meeting_types (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        label TEXT NOT NULL,
        color TEXT NOT NULL,
        icon TEXT,
        calendly_url TEXT,
        available_days INTEGER[],
        duration_minutes INTEGER DEFAULT 30,
        is_active BOOLEAN DEFAULT TRUE,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(tenant_id, name)
      )`,

      `CREATE TABLE IF NOT EXISTS meeting_reminders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        podcast_interview_id UUID REFERENCES podcast_interviews(id) ON DELETE CASCADE,
        discovery_call_id UUID REFERENCES discovery_calls(id) ON DELETE CASCADE,
        strategy_call_id UUID REFERENCES strategy_calls(id) ON DELETE CASCADE,
        pre_qual_call_id UUID REFERENCES pre_qualification_calls(id) ON DELETE CASCADE,
        reminder_type TEXT NOT NULL,
        send_at TIMESTAMP WITH TIME ZONE NOT NULL,
        recipient_email TEXT NOT NULL,
        recipient_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'canceled')),
        sent_at TIMESTAMP WITH TIME ZONE,
        error_message TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,

      // ============ SUPPORTING FEATURE TABLES ============
      `CREATE TABLE IF NOT EXISTS financial_documents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        document_type TEXT NOT NULL,
        title TEXT NOT NULL,
        file_path TEXT,
        file_url TEXT,
        generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,

      `CREATE TABLE IF NOT EXISTS user_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        setting_key TEXT NOT NULL,
        setting_value JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, setting_key)
      )`,

      `CREATE TABLE IF NOT EXISTS integration_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
        user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        integration_name TEXT NOT NULL,
        description TEXT,
        vote_count INTEGER DEFAULT 1,
        status TEXT DEFAULT 'requested' CHECK (status IN ('requested', 'planned', 'in_progress', 'completed', 'declined')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,

      `CREATE TABLE IF NOT EXISTS integration_request_votes (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        integration_request_id UUID NOT NULL REFERENCES integration_requests(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(integration_request_id, user_id)
      )`,

      `CREATE TABLE IF NOT EXISTS onboarding_tours (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        tour_name TEXT NOT NULL,
        completed BOOLEAN DEFAULT FALSE,
        current_step INTEGER DEFAULT 0,
        started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        completed_at TIMESTAMP WITH TIME ZONE,
        UNIQUE(user_id, tour_name)
      )`,

      `CREATE TABLE IF NOT EXISTS onboarding_email_log (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        email_type TEXT NOT NULL,
        sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        opened_at TIMESTAMP WITH TIME ZONE,
        clicked_at TIMESTAMP WITH TIME ZONE
      )`,

      `CREATE TABLE IF NOT EXISTS email_preferences (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        preference_key TEXT NOT NULL,
        enabled BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, preference_key)
      )`,

      `CREATE TABLE IF NOT EXISTS weekly_reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        week_start_date DATE NOT NULL,
        report_data JSONB NOT NULL,
        generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,

      `CREATE TABLE IF NOT EXISTS client_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
        from_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,

      `CREATE TABLE IF NOT EXISTS client_portals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
        access_token TEXT UNIQUE,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        last_accessed_at TIMESTAMP WITH TIME ZONE
      )`,

      `CREATE TABLE IF NOT EXISTS advisor_dashboards (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        advisor_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        dashboard_data JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(tenant_id, advisor_user_id)
      )`,

      `CREATE TABLE IF NOT EXISTS funnel_progression_log (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
        from_stage TEXT,
        to_stage TEXT NOT NULL,
        progressed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        triggered_by TEXT
      )`,

      `CREATE TABLE IF NOT EXISTS call_transcripts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
        call_type TEXT NOT NULL,
        call_id UUID,
        transcript_text TEXT,
        transcript_url TEXT,
        ai_summary TEXT,
        key_points JSONB DEFAULT '[]',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )`,

      // ============ USERS TABLE ============
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS managed_by UUID`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS user_type TEXT`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_analyzer_mode TEXT DEFAULT 'generic_feedback'`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS meeting_type_config JSONB`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS automation_preferences JSONB`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS company_name TEXT`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 0`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS joined_team_at TIMESTAMP WITH TIME ZONE`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_start_date DATE`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_end_date DATE`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`,

      // ============ AI_CONVERSATIONS TABLE ============
      `ALTER TABLE ai_conversations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`,
      `ALTER TABLE ai_conversations ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'`,

      // ============ TENANTS TABLE ============
      `ALTER TABLE tenants ADD COLUMN IF NOT EXISTS metadata JSONB`,
      `ALTER TABLE tenants ADD COLUMN IF NOT EXISTS email TEXT`,
      `ALTER TABLE tenants ADD COLUMN IF NOT EXISTS business_name TEXT`,

      // ============ CONTACTS TABLE ============
      `ALTER TABLE contacts ADD COLUMN IF NOT EXISTS first_name TEXT`,
      `ALTER TABLE contacts ADD COLUMN IF NOT EXISTS last_name TEXT`,
      `ALTER TABLE contacts ADD COLUMN IF NOT EXISTS full_name TEXT GENERATED ALWAYS AS (COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')) STORED`,
      `ALTER TABLE contacts ADD COLUMN IF NOT EXISTS client_type TEXT DEFAULT 'gmp_user'`,
      `ALTER TABLE contacts ADD COLUMN IF NOT EXISTS booking_response_status TEXT`,

      // ============ DEALS TABLE ============
      // Rename old column names to match API expectations
      `DO $$ BEGIN
        IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='deals' AND column_name='title') THEN
          ALTER TABLE deals RENAME COLUMN title TO deal_name;
        END IF;
       END $$`,
      `DO $$ BEGIN
        IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='deals' AND column_name='value') THEN
          ALTER TABLE deals RENAME COLUMN value TO deal_value;
        END IF;
       END $$`,
      `DO $$ BEGIN
        IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name='deals' AND column_name='stage') THEN
          ALTER TABLE deals RENAME COLUMN stage TO deal_stage;
        END IF;
       END $$`,
      // Add missing columns
      `ALTER TABLE deals ADD COLUMN IF NOT EXISTS email TEXT`,
      `ALTER TABLE deals ADD COLUMN IF NOT EXISTS proposal_id UUID REFERENCES proposals(id) ON DELETE SET NULL`,
      `ALTER TABLE deals ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD'`,
      `ALTER TABLE deals ADD COLUMN IF NOT EXISTS closed_date DATE`,
      `ALTER TABLE deals ADD COLUMN IF NOT EXISTS start_date DATE`,
      `ALTER TABLE deals ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'open'`,
      `ALTER TABLE deals ADD COLUMN IF NOT EXISTS won BOOLEAN DEFAULT FALSE`,
      `ALTER TABLE deals ADD COLUMN IF NOT EXISTS assigned_to_user_id UUID REFERENCES users(id) ON DELETE SET NULL`,

      // ============ SOCIAL_POSTS TABLE ============
      `ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS approved_by VARCHAR`,
      `ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE`,
      `ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS rejection_reason TEXT`,
      `ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS brand_compliance_notes TEXT`,

      // ============ SUPPORT_TICKETS TABLE ============
      `ALTER TABLE support_tickets ADD COLUMN IF NOT EXISTS contact_id UUID`,

      // ============ AI_MEMORY_STORE TABLE ============
      `ALTER TABLE ai_memory_store ADD COLUMN IF NOT EXISTS verified_by TEXT DEFAULT 'Maggie'`,
      `ALTER TABLE ai_memory_store ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1`,
      `ALTER TABLE ai_memory_store ADD COLUMN IF NOT EXISTS tags TEXT[]`,
      `ALTER TABLE ai_memory_store ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`,

      // ============ AI_TASK_QUEUE TABLE ============
      `ALTER TABLE ai_task_queue ADD COLUMN IF NOT EXISTS support_ticket_id UUID`,

      // ============ INVITATIONS TABLE ============
      `ALTER TABLE invitations ADD COLUMN IF NOT EXISTS invitation_type TEXT DEFAULT 'team'`,

      // ============ CONTACTS TABLE (from audit) ============
      `ALTER TABLE contacts ADD COLUMN IF NOT EXISTS managed_by UUID`,
      `ALTER TABLE contacts ADD COLUMN IF NOT EXISTS program_start_date TIMESTAMP WITH TIME ZONE`,

      // ============ ADVISOR_CLIENT_RELATIONSHIPS TABLE ============
      `CREATE TABLE IF NOT EXISTS advisor_client_relationships (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL,
        advisor_user_id UUID NOT NULL,
        client_user_id UUID NOT NULL,
        relationship_type TEXT DEFAULT 'active',
        started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        ended_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(tenant_id, advisor_user_id, client_user_id)
      )`,

      // ============ PERFORMANCE INDEXES ============
      // Integration config table indexes
      `CREATE INDEX IF NOT EXISTS idx_zoom_config_tenant ON zoom_config(tenant_id)`,
      `CREATE INDEX IF NOT EXISTS idx_calendly_config_tenant ON calendly_config(tenant_id)`,
      `CREATE INDEX IF NOT EXISTS idx_gmail_config_tenant ON gmail_config(tenant_id)`,
      `CREATE INDEX IF NOT EXISTS idx_outlook_config_tenant ON outlook_config(tenant_id)`,
      `CREATE INDEX IF NOT EXISTS idx_instantly_config_tenant ON instantly_config(tenant_id)`,

      // Critical indexes for tenant isolation (affects ALL queries)
      `CREATE INDEX IF NOT EXISTS idx_contacts_tenant_id ON contacts(tenant_id)`,
      `CREATE INDEX IF NOT EXISTS idx_deals_tenant_id ON deals(tenant_id)`,
      `CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id)`,
      `CREATE INDEX IF NOT EXISTS idx_ai_conversations_tenant_id ON ai_conversations(tenant_id)`,
      `CREATE INDEX IF NOT EXISTS idx_proposals_tenant_id ON proposals(tenant_id)`,
      `CREATE INDEX IF NOT EXISTS idx_support_tickets_tenant_id ON support_tickets(tenant_id)`,
      `CREATE INDEX IF NOT EXISTS idx_email_queue_tenant_id ON email_queue(tenant_id)`,
      `CREATE INDEX IF NOT EXISTS idx_sprints_tenant_id ON sprints(tenant_id)`,

      // Foreign key indexes (for JOINs)
      `CREATE INDEX IF NOT EXISTS idx_deals_contact_id ON deals(contact_id)`,
      `CREATE INDEX IF NOT EXISTS idx_proposals_contact_id ON proposals(contact_id)`,
      `CREATE INDEX IF NOT EXISTS idx_pre_qual_contact_id ON pre_qualification_calls(contact_id)`,
      `CREATE INDEX IF NOT EXISTS idx_podcast_contact_id ON podcast_interviews(contact_id)`,
      `CREATE INDEX IF NOT EXISTS idx_discovery_contact_id ON discovery_calls(contact_id)`,
      `CREATE INDEX IF NOT EXISTS idx_strategy_contact_id ON strategy_calls(contact_id)`,

      // Status/stage indexes (for filtered queries)
      `CREATE INDEX IF NOT EXISTS idx_deals_deal_stage ON deals(deal_stage)`,
      `CREATE INDEX IF NOT EXISTS idx_contacts_stage ON contacts(stage)`,
      `CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status)`,
      `CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status)`,
      `CREATE INDEX IF NOT EXISTS idx_ai_conversations_bot_type ON ai_conversations(bot_type)`,

      // Composite indexes for common query patterns
      `CREATE INDEX IF NOT EXISTS idx_email_queue_status_send_at ON email_queue(status, send_at)`,
      `CREATE INDEX IF NOT EXISTS idx_contacts_tenant_stage ON contacts(tenant_id, stage)`,
      `CREATE INDEX IF NOT EXISTS idx_deals_tenant_stage ON deals(tenant_id, deal_stage)`,

      // User lookup indexes
      `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`,
      `CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email)`,
      `CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token)`,
      `CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets(token)`,
    ];

    // CRITICAL FIX: Skip all DDL migrations (tables already exist in Supabase)
    // Only create the default tenant using Supabase client which bypasses RLS with service role key
    console.log('[DB] Skipping DDL migrations (database schema managed in Supabase)');
    console.log('[DB] Creating default tenant using Supabase client...');

    if (!supabaseClient) {
      console.error('[DB] ❌ Cannot create tenant - Supabase client not configured');
      console.error('[DB] Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      // Use Supabase client to create tenant (service role key bypasses RLS automatically)
      const tenantData = {
        id: '00000000-0000-0000-0000-000000000001',
        name: 'Maggie Forbes Strategies',
        business_name: 'Maggie Forbes Strategies',
        email: 'maggie@growthmanagerpro.com',
        subscription_tier: 'enterprise',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      console.log('[DB] Upserting default tenant:', tenantData.id);

      const { data, error } = await supabaseClient
        .from('tenants')
        .upsert(tenantData, { onConflict: 'id' });

      if (error) {
        console.error('[DB] ❌ Failed to create default tenant:', error);
        console.log('[DB] Startup migrations complete (0 applied, 0 skipped, 1 failed)');
        return { success: false, error: error.message };
      }

      console.log('[DB] ✅ Default tenant created successfully');
      console.log('[DB] Startup migrations complete (1 applied, 0 skipped, 0 failed)');
      return { success: true };

    } catch (error) {
      console.error('[DB] ❌ Exception during tenant creation:', error);
      console.log('[DB] Startup migrations complete (0 applied, 0 skipped, 1 failed)');
      return { success: false, error: error.message };
    }
  }
};

module.exports = db;
