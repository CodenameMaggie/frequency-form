/**
 * Export Qualified Leads
 * Exports all qualified leads from database to qualified-leads folder
 * Qualified = lead_grade B or better (B, A, A+)
 *
 * Usage:
 *   node scripts/export-qualified-leads.js
 *   node scripts/export-qualified-leads.js --format csv
 *   node scripts/export-qualified-leads.js --grade A
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const OUTPUT_DIR = path.join(__dirname, '..', 'qualified-leads');

// Parse command line arguments
const args = process.argv.slice(2);
const format = args.includes('--format') ? args[args.indexOf('--format') + 1] : 'json';
const minGrade = args.includes('--grade') ? args[args.indexOf('--grade') + 1] : 'B';
const tenantId = args.includes('--tenant') ? args[args.indexOf('--tenant') + 1] : '00000000-0000-0000-0000-000000000001';

// Grade hierarchy
const gradeOrder = ['F', 'D', 'C', 'B', 'A', 'A+'];

async function exportQualifiedLeads() {
  console.log('\n🔍 Exporting Qualified Leads...');
  console.log(`   Tenant: ${tenantId}`);
  console.log(`   Minimum Grade: ${minGrade}`);
  console.log(`   Format: ${format}`);
  console.log(`   Output: ${OUTPUT_DIR}`);

  try {
    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    // Get qualified leads (grade B or better)
    const minGradeIndex = gradeOrder.indexOf(minGrade);
    const acceptedGrades = gradeOrder.slice(minGradeIndex);

    console.log(`\n📊 Fetching leads with grades: ${acceptedGrades.join(', ')}`);

    const { data: leads, error } = await supabase
      .from('leads')
      .select('*')
      .eq('tenant_id', tenantId)
      .in('lead_grade', acceptedGrades)
      .order('lead_score', { ascending: false });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    if (!leads || leads.length === 0) {
      console.log('\n⚠️  No qualified leads found');
      return;
    }

    console.log(`\n✅ Found ${leads.length} qualified leads`);

    // Grade breakdown
    const breakdown = {};
    leads.forEach(lead => {
      breakdown[lead.lead_grade] = (breakdown[lead.lead_grade] || 0) + 1;
    });
    console.log('\n📈 Grade Breakdown:');
    Object.entries(breakdown).forEach(([grade, count]) => {
      console.log(`   ${grade}: ${count} leads`);
    });

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `qualified-leads-${timestamp}`;

    if (format === 'csv') {
      // Export as CSV
      const csvPath = path.join(OUTPUT_DIR, `${filename}.csv`);
      const csv = convertToCSV(leads);
      fs.writeFileSync(csvPath, csv, 'utf8');
      console.log(`\n💾 Exported to: ${csvPath}`);
    } else {
      // Export as JSON
      const jsonPath = path.join(OUTPUT_DIR, `${filename}.json`);
      fs.writeFileSync(jsonPath, JSON.stringify(leads, null, 2), 'utf8');
      console.log(`\n💾 Exported to: ${jsonPath}`);
    }

    // Also create a "latest" symlink-style file
    const latestPath = path.join(OUTPUT_DIR, `latest.${format}`);
    if (format === 'csv') {
      fs.writeFileSync(latestPath, convertToCSV(leads), 'utf8');
    } else {
      fs.writeFileSync(latestPath, JSON.stringify(leads, null, 2), 'utf8');
    }
    console.log(`💾 Updated: ${latestPath}`);

    // Create summary file
    const summary = {
      exported_at: new Date().toISOString(),
      total_leads: leads.length,
      grade_breakdown: breakdown,
      minimum_grade: minGrade,
      format: format,
      file: `${filename}.${format}`
    };

    const summaryPath = path.join(OUTPUT_DIR, 'export-summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), 'utf8');
    console.log(`💾 Summary: ${summaryPath}`);

    console.log('\n✅ Export complete!');

    return {
      success: true,
      leads_count: leads.length,
      file: `${filename}.${format}`
    };

  } catch (error) {
    console.error('\n❌ Export failed:', error.message);
    throw error;
  }
}

function convertToCSV(leads) {
  if (!leads || leads.length === 0) return '';

  // Define CSV columns
  const columns = [
    'id',
    'email',
    'first_name',
    'last_name',
    'company',
    'phone',
    'industry',
    'company_size',
    'location',
    'lead_score',
    'lead_grade',
    'qualification_status',
    'source',
    'created_at'
  ];

  // Create header row
  const header = columns.join(',');

  // Create data rows
  const rows = leads.map(lead => {
    return columns.map(col => {
      const value = lead[col] || '';
      // Escape commas and quotes in CSV
      const escaped = String(value).replace(/"/g, '""');
      return `"${escaped}"`;
    }).join(',');
  });

  return [header, ...rows].join('\n');
}

// Run if called directly
if (require.main === module) {
  exportQualifiedLeads()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = { exportQualifiedLeads };
