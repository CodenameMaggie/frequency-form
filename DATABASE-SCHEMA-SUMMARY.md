# 📊 Frequency & Form - Database Schema Summary

## Overview

The bot system uses **22 database tables** organized into 7 functional categories. All tables are created in your existing Supabase PostgreSQL database.

**Schema File:** `database/frequency-form-bot-schema.sql`

---

## Table Categories

### 1. Core Business Configuration (2 tables)

#### `system_config`
**Purpose:** Stores Frequency & Form business configuration

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| business_code | VARCHAR(10) | "FF" for Frequency & Form |
| business_name | TEXT | "Frequency & Form" |
| domain | TEXT | "frequencyandform.com" |
| settings | JSONB | Additional configuration |
| created_at | TIMESTAMP | When created |
| updated_at | TIMESTAMP | Last modified |

**Initial Data:**
```sql
business_code: 'FF'
business_name: 'Frequency & Form'
domain: 'frequencyandform.com'
```

#### `tenants`
**Purpose:** Multi-tenant support (future expansion)

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Tenant ID (00000000-0000-0000-0000-000000000001) |
| name | TEXT | Tenant name |
| status | TEXT | active/inactive/suspended |
| created_at | TIMESTAMP | When created |

---

### 2. User & Contact Management (2 tables)

#### `users`
**Purpose:** Customer accounts and preferences

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| tenant_id | UUID | Foreign key to tenants |
| email | TEXT | Customer email (unique) |
| full_name | TEXT | Customer name |
| phone | TEXT | Phone number |
| role | TEXT | customer/admin/support |
| preferences | JSONB | User preferences |
| created_at | TIMESTAMP | Account created date |
| last_login | TIMESTAMP | Last login time |

**Indexes:**
- `idx_users_email` on email
- `idx_users_tenant` on tenant_id

#### `contacts`
**Purpose:** Leads, prospects, and marketing contacts

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| tenant_id | UUID | Foreign key |
| email | TEXT | Contact email |
| first_name | TEXT | First name |
| last_name | TEXT | Last name |
| company | TEXT | Company name |
| phone | TEXT | Phone number |
| source | TEXT | Where lead came from |
| status | TEXT | new/qualified/contacted/customer/lost |
| lead_score | INTEGER | 0-100 qualification score |
| last_contact_date | TIMESTAMP | Last outreach |
| notes | TEXT | Dan's notes |
| metadata | JSONB | Additional data |
| created_at | TIMESTAMP | When discovered |
| updated_at | TIMESTAMP | Last modified |

**Indexes:**
- `idx_contacts_email` on email
- `idx_contacts_status` on status
- `idx_contacts_tenant` on tenant_id

---

### 3. Email System (3 tables)

#### `emails`
**Purpose:** Outbound email tracking

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| tenant_id | UUID | Foreign key |
| to_email | TEXT | Recipient |
| from_email | TEXT | Sender |
| subject | TEXT | Email subject |
| body_text | TEXT | Plain text body |
| body_html | TEXT | HTML body |
| status | TEXT | draft/queued/sent/failed |
| sent_at | TIMESTAMP | When sent |
| sent_by_bot | TEXT | Which bot sent it |
| reply_to_email_id | UUID | If this is a reply |
| metadata | JSONB | Campaign data, etc. |
| created_at | TIMESTAMP | When created |

**Indexes:**
- `idx_emails_to` on to_email
- `idx_emails_status` on status
- `idx_emails_sent_by_bot` on sent_by_bot

#### `email_inbound`
**Purpose:** Received emails (replies, inquiries)

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| tenant_id | UUID | Foreign key |
| from_email | TEXT | Sender email |
| to_email | TEXT | Recipient (your email) |
| subject | TEXT | Subject line |
| body_text | TEXT | Email body |
| body_html | TEXT | HTML body |
| received_at | TIMESTAMP | When received |
| processed | BOOLEAN | Has bot handled it? |
| classification | TEXT | inquiry/reply/complaint/spam |
| sentiment | TEXT | positive/neutral/negative |
| assigned_to_bot | TEXT | Which bot is handling |
| metadata | JSONB | Headers, attachments |
| created_at | TIMESTAMP | When recorded |

**Indexes:**
- `idx_email_inbound_from` on from_email
- `idx_email_inbound_processed` on processed
- `idx_email_inbound_classification` on classification

#### `email_queue`
**Purpose:** Email sending queue with retry logic

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| tenant_id | UUID | Foreign key |
| email_id | UUID | Foreign key to emails |
| status | TEXT | pending/sending/sent/failed |
| retry_count | INTEGER | Number of retries |
| max_retries | INTEGER | Max retry attempts |
| scheduled_for | TIMESTAMP | When to send |
| last_attempt_at | TIMESTAMP | Last send attempt |
| error_message | TEXT | If failed, why? |
| metadata | JSONB | Additional context |
| created_at | TIMESTAMP | When queued |
| processed_at | TIMESTAMP | When sent |

**Indexes:**
- `idx_email_queue_status` on status
- `idx_email_queue_scheduled` on scheduled_for

---

### 4. Bot System Core (4 tables)

#### `bot_actions_log`
**Purpose:** Tracks every action taken by all bots

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| tenant_id | UUID | Foreign key |
| bot_name | TEXT | henry/dave/dan/jordan/annie/alex |
| action_type | TEXT | Type of action |
| action_description | TEXT | What the bot did |
| status | TEXT | success/failed/pending |
| metadata | JSONB | Action details |
| error_message | TEXT | If failed |
| created_at | TIMESTAMP | When action occurred |

**Indexes:**
- `idx_bot_actions_bot_name` on bot_name
- `idx_bot_actions_created_at` on created_at
- `idx_bot_actions_status` on status

**Example Actions:**
- Henry: "Set Q1 revenue goal to $50K"
- Dan: "Discovered 15 new leads from LinkedIn"
- Annie: "Responded to chat about linen care"
- Dave: "Generated proposal for lead #123"
- Alex: "Detected high error rate in checkout API"
- Jordan: "Flagged GDPR compliance issue"

#### `ai_governance_rules`
**Purpose:** Bot behavior limits and compliance rules

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| tenant_id | UUID | Foreign key |
| rule_name | TEXT | Rule identifier |
| bot_name | TEXT | Which bot (or 'all') |
| rule_type | TEXT | rate_limit/content_filter/approval_required |
| limit_value | INTEGER | Max actions per period |
| time_window | TEXT | hourly/daily/weekly |
| is_active | BOOLEAN | Is rule enforced? |
| created_at | TIMESTAMP | When created |
| updated_at | TIMESTAMP | Last modified |

**Indexes:**
- `idx_governance_bot_name` on bot_name
- `idx_governance_active` on is_active

**Default Rules:**
```sql
-- Dan cannot send more than 50 emails per day
rule_name: 'dan_email_limit'
bot_name: 'dan'
rule_type: 'rate_limit'
limit_value: 50
time_window: 'daily'

-- All bots require approval for payments
rule_name: 'payment_approval'
bot_name: 'all'
rule_type: 'approval_required'
```

#### `ai_kill_switch`
**Purpose:** Emergency stop for all bots

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| tenant_id | UUID | Foreign key |
| is_active | BOOLEAN | Is kill switch ON? |
| activated_by | TEXT | Who activated it |
| reason | TEXT | Why was it activated |
| activated_at | TIMESTAMP | When activated |
| deactivated_at | TIMESTAMP | When turned off |

**Usage:**
- When `is_active = true`, all bots stop
- No emails sent, no actions taken
- Use for emergencies or maintenance

#### `ai_memory_store`
**Purpose:** Atlas shared memory for cross-bot coordination

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| tenant_id | UUID | Foreign key |
| memory_key | TEXT | Unique identifier |
| memory_value | JSONB | Stored data |
| bot_name | TEXT | Which bot created it |
| context | TEXT | What this memory is for |
| expires_at | TIMESTAMP | When to delete |
| created_at | TIMESTAMP | When created |
| updated_at | TIMESTAMP | Last accessed |

**Indexes:**
- `idx_memory_key` on memory_key
- `idx_memory_bot_name` on bot_name

**Example Memories:**
```json
{
  "memory_key": "customer_123_preferences",
  "memory_value": {
    "fabric_tier": "healing",
    "favorite_color": "sage",
    "size": "M",
    "never_wool": true
  },
  "bot_name": "annie",
  "context": "Customer styling profile"
}
```

---

### 5. Customer Support (3 tables)

#### `tickets`
**Purpose:** Customer support tickets (handled by Annie & Henry)

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| tenant_id | UUID | Foreign key |
| customer_id | UUID | Foreign key to users |
| subject | TEXT | Ticket subject |
| description | TEXT | Issue description |
| status | TEXT | open/in_progress/resolved/closed |
| priority | TEXT | low/medium/high/urgent |
| category | TEXT | order/product/technical/styling |
| assigned_to_bot | TEXT | annie/henry/human |
| resolution_notes | TEXT | How it was resolved |
| created_at | TIMESTAMP | When opened |
| resolved_at | TIMESTAMP | When closed |
| updated_at | TIMESTAMP | Last modified |

**Indexes:**
- `idx_tickets_customer` on customer_id
- `idx_tickets_status` on status
- `idx_tickets_priority` on priority

#### `annie_conversations`
**Purpose:** Annie chat widget conversation history

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| tenant_id | UUID | Foreign key |
| visitor_id | TEXT | Anonymous or customer ID |
| customer_id | UUID | If logged in |
| conversation_summary | TEXT | AI summary |
| message_count | INTEGER | Total messages |
| sentiment | TEXT | positive/neutral/negative |
| topics | TEXT[] | Array of topics discussed |
| product_interest | TEXT[] | Products mentioned |
| created_at | TIMESTAMP | Conversation started |
| last_message_at | TIMESTAMP | Most recent message |
| metadata | JSONB | Page URL, device, etc. |

**Indexes:**
- `idx_annie_visitor` on visitor_id
- `idx_annie_customer` on customer_id
- `idx_annie_last_message` on last_message_at

#### `annie_messages`
**Purpose:** Individual chat messages in conversations

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| conversation_id | UUID | Foreign key to annie_conversations |
| sender | TEXT | 'customer' or 'annie' |
| message | TEXT | Message content |
| timestamp | TIMESTAMP | When sent |
| metadata | JSONB | Attachments, etc. |

**Indexes:**
- `idx_annie_messages_conversation` on conversation_id
- `idx_annie_messages_timestamp` on timestamp

---

### 6. Frequency & Form Specific (2 tables)

#### `styling_profiles`
**Purpose:** Customer styling preferences (FF-specific)

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| customer_id | UUID | Foreign key to users |
| preferred_tier | TEXT | healing/foundation/both |
| favorite_fabrics | TEXT[] | linen/wool/silk/cotton/hemp |
| avoid_fabrics | TEXT[] | Fabrics to avoid |
| color_preferences | TEXT[] | Colors they like |
| size_preferences | JSONB | Size for each garment type |
| style_notes | TEXT | Annie's styling notes |
| last_purchase_date | TIMESTAMP | Most recent order |
| created_at | TIMESTAMP | Profile created |
| updated_at | TIMESTAMP | Last modified |

**Indexes:**
- `idx_styling_customer` on customer_id
- `idx_styling_tier` on preferred_tier

**Example:**
```json
{
  "preferred_tier": "healing",
  "favorite_fabrics": ["linen", "silk"],
  "avoid_fabrics": ["wool"],  // allergic or energy-sensitive
  "color_preferences": ["sage", "ivory", "soft gray"],
  "size_preferences": {
    "tops": "M",
    "bottoms": "8",
    "dresses": "M"
  },
  "style_notes": "Prefers flowing silhouettes, loves linen for summer"
}
```

#### `product_recommendations`
**Purpose:** Annie's personalized product suggestions

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| customer_id | UUID | Foreign key to users |
| product_id | UUID | Shopify/Stripe product ID |
| product_name | TEXT | Product name |
| recommendation_reason | TEXT | Why Annie suggested it |
| confidence_score | DECIMAL | 0-1 confidence |
| presented_at | TIMESTAMP | When shown to customer |
| customer_response | TEXT | clicked/purchased/dismissed |
| metadata | JSONB | Context, price, etc. |
| created_at | TIMESTAMP | When generated |

**Indexes:**
- `idx_recommendations_customer` on customer_id
- `idx_recommendations_product` on product_id

**Example:**
```json
{
  "product_name": "Pure Linen Summer Dress - Sage",
  "recommendation_reason": "Based on your love of linen's 5,000 Hz healing frequency and preference for sage tones. This dress will help you feel grounded and energized.",
  "confidence_score": 0.92
}
```

---

### 7. Compliance & Monitoring (4 tables)

#### `compliance_logs`
**Purpose:** Jordan's compliance and legal tracking

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| tenant_id | UUID | Foreign key |
| compliance_type | TEXT | gdpr/ccpa/accessibility/email_compliance |
| check_name | TEXT | What was checked |
| status | TEXT | passed/failed/warning |
| details | TEXT | Findings |
| action_required | TEXT | What needs to be done |
| checked_by_bot | TEXT | jordan |
| created_at | TIMESTAMP | When checked |

**Indexes:**
- `idx_compliance_type` on compliance_type
- `idx_compliance_status` on status

#### `system_health_log`
**Purpose:** Alex's system monitoring data

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| tenant_id | UUID | Foreign key |
| metric_name | TEXT | What was monitored |
| metric_value | DECIMAL | Measurement |
| status | TEXT | healthy/warning/critical |
| threshold | DECIMAL | Alert threshold |
| details | TEXT | Additional context |
| created_at | TIMESTAMP | When measured |

**Indexes:**
- `idx_health_metric` on metric_name
- `idx_health_created` on created_at

**Example Metrics:**
```sql
metric_name: 'api_response_time'
metric_value: 245  -- ms
status: 'healthy'

metric_name: 'error_rate'
metric_value: 2.3  -- %
status: 'warning'

metric_name: 'database_connections'
metric_value: 12
status: 'healthy'
```

#### `deal_pipeline`
**Purpose:** Sales pipeline tracking (Dave & Dan)

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| tenant_id | UUID | Foreign key |
| contact_id | UUID | Foreign key to contacts |
| deal_name | TEXT | Deal title |
| deal_value | DECIMAL | Estimated revenue |
| stage | TEXT | lead/qualified/proposal/negotiation/won/lost |
| probability | INTEGER | 0-100% chance |
| expected_close_date | DATE | When deal might close |
| assigned_to_bot | TEXT | dave/dan |
| notes | TEXT | Deal notes |
| created_at | TIMESTAMP | Deal created |
| updated_at | TIMESTAMP | Last stage change |
| closed_at | TIMESTAMP | When won/lost |

**Indexes:**
- `idx_deal_stage` on stage
- `idx_deal_contact` on contact_id

#### `mainframe_sync_queue`
**Purpose:** Syncing with Forbes mainframe (enterprise feature)

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| tenant_id | UUID | Foreign key |
| sync_type | TEXT | Type of data to sync |
| payload | JSONB | Data to send |
| status | TEXT | pending/sent/failed |
| retry_count | INTEGER | Retry attempts |
| created_at | TIMESTAMP | When queued |
| synced_at | TIMESTAMP | When synced |

---

## Database Setup Instructions

### Step 1: Access Supabase SQL Editor

1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql
2. Open a new query

### Step 2: Run Schema File

```sql
-- Copy entire contents of database/frequency-form-bot-schema.sql
-- Paste into SQL Editor
-- Click "Run"
```

### Step 3: Verify Tables Created

```sql
-- Check if all 22 tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

Expected output:
```
ai_governance_rules
ai_kill_switch
ai_memory_store
annie_conversations
annie_messages
bot_actions_log
compliance_logs
contacts
deal_pipeline
email_inbound
email_queue
emails
mainframe_sync_queue
product_recommendations
styling_profiles
system_config
system_health_log
tenants
tickets
users
```

### Step 4: Verify Initial Data

```sql
-- Check system config
SELECT * FROM system_config WHERE business_code = 'FF';

-- Check tenant
SELECT * FROM tenants;
```

---

## Key Relationships

```
tenants
  ├── users (customers)
  │   ├── styling_profiles
  │   ├── product_recommendations
  │   ├── tickets
  │   └── annie_conversations
  │
  ├── contacts (leads/prospects)
  │   └── deal_pipeline
  │
  ├── emails
  │   └── email_queue
  │
  ├── email_inbound
  ├── bot_actions_log
  ├── ai_memory_store
  ├── compliance_logs
  └── system_health_log
```

---

## Storage Estimates

Based on typical usage:

| Table | Expected Size | Growth Rate |
|-------|--------------|-------------|
| bot_actions_log | 10K rows/month | High |
| emails | 5K rows/month | High |
| annie_conversations | 500 rows/month | Medium |
| contacts | 1K rows/month | Medium |
| users | 200 rows/month | Low |
| ai_memory_store | 2K rows/month | Medium |

**Total Estimate:** ~20K new rows per month across all tables

**Recommended Cleanup:**
- Archive `bot_actions_log` older than 90 days
- Delete `email_queue` processed rows older than 30 days
- Keep `annie_conversations` indefinitely for training

---

## Security Considerations

### Row Level Security (RLS)

The schema includes RLS policies for:

1. **Tenant Isolation** - Each tenant only sees their own data
2. **Bot Access** - Bots can only modify their own actions
3. **User Privacy** - Customers can only see their own conversations

### Sensitive Data

Tables with PII/sensitive data:
- `users` - Customer emails, names, phones
- `contacts` - Prospect information
- `emails` - Email content
- `annie_conversations` - Chat history
- `styling_profiles` - Personal preferences

Ensure:
- ✅ GDPR compliance (data deletion on request)
- ✅ Encryption at rest (Supabase default)
- ✅ Regular backups (Supabase automatic)
- ✅ Access logging via `bot_actions_log`

---

## Maintenance Queries

### Check Bot Activity (Last 24 hours)

```sql
SELECT
  bot_name,
  COUNT(*) as actions,
  COUNT(*) FILTER (WHERE status = 'success') as successful,
  COUNT(*) FILTER (WHERE status = 'failed') as failed
FROM bot_actions_log
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY bot_name
ORDER BY actions DESC;
```

### View Annie's Recent Conversations

```sql
SELECT
  c.id,
  c.conversation_summary,
  c.message_count,
  c.sentiment,
  c.created_at,
  u.email as customer_email
FROM annie_conversations c
LEFT JOIN users u ON c.customer_id = u.id
WHERE c.created_at > NOW() - INTERVAL '7 days'
ORDER BY c.last_message_at DESC
LIMIT 20;
```

### Check Email Queue Status

```sql
SELECT
  status,
  COUNT(*) as count,
  MIN(scheduled_for) as earliest_scheduled,
  MAX(retry_count) as max_retries
FROM email_queue
GROUP BY status;
```

### Monitor Governance Rules

```sql
SELECT
  rule_name,
  bot_name,
  rule_type,
  limit_value,
  time_window,
  is_active
FROM ai_governance_rules
WHERE is_active = true
ORDER BY bot_name, rule_type;
```

---

## Summary

✅ **22 tables created** across 7 functional categories
✅ **5 core bots** (Henry, Dave, Dan, Jordan, Annie) + **2 support bots** (Alex, Atlas)
✅ **Complete email system** with queue, retry logic, and inbound handling
✅ **AI governance** with rules and kill switch
✅ **FF-specific features** for styling profiles and product recommendations
✅ **Compliance tracking** for legal requirements
✅ **System monitoring** for health and performance
✅ **Tenant isolation** for multi-business support

**Next Steps:**
1. Run `database/frequency-form-bot-schema.sql` in Supabase
2. Verify all 22 tables are created
3. Deploy bot server to Railway
4. Test Annie chat widget
5. Monitor `bot_actions_log` for activity

Your database is now ready for the full 6-bot AI system! 🚀
