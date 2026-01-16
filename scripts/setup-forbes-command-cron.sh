#!/bin/bash
# ============================================
# FREQUENCY & FORM - CRON SETUP SCRIPT
# Run this ONCE on Forbes Command server
# ============================================

echo "Setting up F&F cron jobs..."

# Add cron jobs (preserves existing crons)
(crontab -l 2>/dev/null | grep -v "frequencyandform.com"; cat << 'CRON'
# FREQUENCY & FORM - FULL AUTOMATION
0 6 * * * curl -s -X POST 'https://frequencyandform.com/api/bots/henry-partner-discovery?secret=forbes-command-cron-2024'
0 10 * * * curl -s -X POST 'https://frequencyandform.com/api/bots/dan-partner-outreach?secret=forbes-command-cron-2024'
0 14 * * * curl -s -X POST 'https://frequencyandform.com/api/bots/dan-partner-followup?secret=forbes-command-cron-2024'
*/5 * * * * curl -s -X POST 'https://frequencyandform.com/api/email-queue-processor?secret=forbes-command-cron-2024'
CRON
) | crontab -

echo ""
echo "✅ Cron jobs installed!"
echo ""
crontab -l | grep frequencyandform
echo ""
echo "Testing Henry now..."
curl -s -X POST 'https://frequencyandform.com/api/bots/henry-partner-discovery?secret=forbes-command-cron-2024'
echo ""
echo "✅ Setup complete!"
