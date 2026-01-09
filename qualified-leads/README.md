# Qualified Leads Folder

This folder contains exported qualified leads from your database. All leads with grades **B or better** (B, A, A+) are considered qualified.

## Quick Start

### 1. Export Qualified Leads

Export all qualified leads from database to this folder:

```bash
# Export as JSON (default)
node scripts/export-qualified-leads.js

# Export as CSV
node scripts/export-qualified-leads.js --format csv

# Export only A-grade leads
node scripts/export-qualified-leads.js --grade A

# Export for specific tenant
node scripts/export-qualified-leads.js --tenant YOUR_TENANT_ID
```

**Output Files:**
- `qualified-leads-TIMESTAMP.json` - Timestamped export
- `latest.json` - Always contains most recent export
- `export-summary.json` - Summary with counts and breakdown

### 2. Send Emails to Qualified Leads

```bash
# DRY RUN (test without sending)
node scripts/send-to-qualified-leads.js --dry-run

# Send to first 10 leads only (test)
node scripts/send-to-qualified-leads.js --limit 10

# Send to all qualified leads
node scripts/send-to-qualified-leads.js

# Use brief template
node scripts/send-to-qualified-leads.js --template brief

# Custom subject line
node scripts/send-to-qualified-leads.js --subject "Your Custom Subject"

# Use specific export file
node scripts/send-to-qualified-leads.js --file qualified-leads/qualified-leads-2026-01-09.json
```

## Email Templates

### Default Template
Full partnership pitch with:
- Professional header with branding
- Detailed value proposition
- Bullet points of benefits
- Call-to-action button
- Unsubscribe link

### Brief Template
Short and direct:
- Quick introduction
- One-line value prop
- Link to apply
- Minimal design

## File Formats

### JSON Format
```json
[
  {
    "id": "uuid",
    "email": "contact@example.com",
    "first_name": "Jane",
    "last_name": "Doe",
    "company": "Example Co",
    "lead_score": 85,
    "lead_grade": "A",
    "qualification_status": "qualified",
    "industry": "Home Goods",
    "company_size": "10-50",
    "location": "Portland, OR"
  }
]
```

### CSV Format
Headers: id, email, first_name, last_name, company, phone, industry, company_size, location, lead_score, lead_grade, qualification_status, source, created_at

## Automation

### Daily Auto-Export (Recommended)

Add to your crontab to auto-export qualified leads daily:

```bash
# Edit crontab
crontab -e

# Add this line (exports every day at 8am)
0 8 * * * cd /Users/Kristi/frequency-form && node scripts/export-qualified-leads.js >> qualified-leads/export.log 2>&1
```

### Weekly Auto-Send

Auto-send emails to new qualified leads weekly:

```bash
# Add to crontab (sends every Monday at 9am)
0 9 * * 1 cd /Users/Kristi/frequency-form && node scripts/send-to-qualified-leads.js --limit 50 >> qualified-leads/send.log 2>&1
```

## Lead Grading System

Leads are automatically graded by `lib/business-matching-engine.js`:

| Grade | Score Range | Status |
|-------|-------------|--------|
| A+ | 90-100 | Top priority, immediate outreach |
| A | 80-89 | High priority, strong fit |
| B | 70-79 | Qualified, good fit |
| C | 60-69 | Needs nurturing |
| D | 50-59 | Low priority |
| F | 0-49 | Disqualified |

**Qualified Leads = B or better**

## Scoring Criteria

Leads are scored based on:
- **Company Name** (20 points) - Must have company
- **Email Address** (15 points) - Must have valid email
- **Industry Match** (25 points) - Home goods, retail, design-related
- **Company Size** (20 points) - 10-500 employees ideal
- **Budget Indicators** (10 points) - Revenue, funding, etc.
- **Engagement** (10 points) - Website visits, form fills, etc.

## Email Queue System

Emails are NOT sent immediately. They are added to the `email_queue` table and processed by:
- **Email Queue Processor** (runs every 5 minutes)
- Handles retries automatically
- Tracks delivery status
- Prevents duplicates

## Best Practices

1. **Always test with --dry-run first**
   ```bash
   node scripts/send-to-qualified-leads.js --dry-run
   ```

2. **Start with a small batch**
   ```bash
   node scripts/send-to-qualified-leads.js --limit 10
   ```

3. **Check export summary before sending**
   ```bash
   cat qualified-leads/export-summary.json
   ```

4. **Monitor email queue**
   - Check Railway logs for email processor
   - Review Supabase `email_queue` table

5. **Export regularly**
   - Daily exports keep data fresh
   - Use cron job for automation

## Folder Structure

```
qualified-leads/
├── README.md                           # This file
├── latest.json                         # Most recent export (auto-updated)
├── latest.csv                          # Most recent CSV export
├── export-summary.json                 # Summary of last export
├── qualified-leads-2026-01-09T08-00.json
├── qualified-leads-2026-01-10T08-00.json
├── export.log                          # Auto-export logs (if using cron)
└── send.log                            # Auto-send logs (if using cron)
```

## Troubleshooting

### No leads exported
- Check database has leads with grades B+
- Run qualification first: `curl https://your-bot-server.railway.app/api/qualify-leads`
- Check Supabase `leads` table

### Emails not sending
- Check `email_queue` table in Supabase
- Verify SMTP settings in Railway environment
- Check Railway logs for email processor errors

### Invalid email addresses
- Script automatically skips leads with no email
- Check `skipped` count in output

## Manual Database Query

If you prefer SQL, query qualified leads directly:

```sql
SELECT
  id, email, first_name, last_name, company,
  lead_score, lead_grade, qualification_status,
  industry, company_size, location
FROM leads
WHERE tenant_id = '00000000-0000-0000-0000-000000000001'
  AND lead_grade IN ('A+', 'A', 'B')
ORDER BY lead_score DESC;
```

## Support

For issues or questions:
- Check Railway logs: `railway logs`
- Check Supabase dashboard
- Review `lib/business-matching-engine.js` for qualification logic
- Review `api/email-queue-processor.js` for email sending

---

**Last Updated:** 2026-01-09
