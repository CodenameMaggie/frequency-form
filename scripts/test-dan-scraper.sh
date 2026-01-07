#!/bin/bash
# Test Dan's Brand Discovery System
# Usage: ./scripts/test-dan-scraper.sh

echo "🧪 Testing Dan's Brand Discovery..."
echo ""

# Check if CRON_SECRET is set
if [ -z "$CRON_SECRET" ]; then
    echo "❌ CRON_SECRET not set"
    echo "Please set your CRON_SECRET from Railway:"
    echo "export CRON_SECRET='your-secret-here'"
    exit 1
fi

# Test the scraper
echo "📡 Calling Dan Free Scraper..."
curl -X POST "https://frequency-form-production.up.railway.app/api/bots/dan-free-scraper" \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"triggered_by":"manual_test"}' \
  -s | jq '.'

echo ""
echo "✅ Test complete! Check the output above for discovered brands."
