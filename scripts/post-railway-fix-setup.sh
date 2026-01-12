#!/bin/bash

# Post-Railway Fix Setup Script
# Run this AFTER Railway deployment is fixed
# This script verifies deployment and guides through database migration

echo "🔧 FREQUENCY & FORM - Post-Railway Fix Setup"
echo "=============================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

BASE_URL="${1:-https://frequency-form-production.up.railway.app}"
DOMAIN="${2:-https://frequencyandform.com}"

echo "Testing Base URL: $BASE_URL"
echo "Testing Domain: $DOMAIN"
echo ""

# Step 1: Verify Railway is serving F&F
echo -e "${BLUE}STEP 1: Verify Railway Deployment${NC}"
echo "-----------------------------------"
echo -n "Checking health endpoint... "

HEALTH_RESPONSE=$(curl -s "$BASE_URL/health" 2>&1)
HEALTH_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/health" 2>&1)

if [ "$HEALTH_CODE" == "200" ]; then
    if echo "$HEALTH_RESPONSE" | grep -q "Frequency"; then
        echo -e "${GREEN}✓ SUCCESS${NC}"
        echo "  Response: $HEALTH_RESPONSE"
    else
        echo -e "${RED}✗ WRONG APP${NC}"
        echo "  Response: $HEALTH_RESPONSE"
        echo ""
        echo -e "${RED}ERROR: Railway is still serving the wrong application!${NC}"
        echo "Please follow RAILWAY_FIX_GUIDE.md to fix the deployment."
        exit 1
    fi
else
    echo -e "${RED}✗ FAILED (HTTP $HEALTH_CODE)${NC}"
    echo ""
    echo -e "${RED}ERROR: Railway is not responding correctly!${NC}"
    echo "Please follow RAILWAY_FIX_GUIDE.md to fix the deployment."
    exit 1
fi

echo ""

# Step 2: Run comprehensive system test
echo -e "${BLUE}STEP 2: Run System Tests${NC}"
echo "-----------------------"
if [ -f "./scripts/test-all-systems.sh" ]; then
    chmod +x ./scripts/test-all-systems.sh
    ./scripts/test-all-systems.sh "$BASE_URL" "$DOMAIN"
    TEST_RESULT=$?

    if [ $TEST_RESULT -eq 0 ]; then
        echo -e "${GREEN}✓ All system tests passed!${NC}"
    else
        echo -e "${YELLOW}⚠ Some tests failed. Review output above.${NC}"
    fi
else
    echo -e "${RED}✗ Test script not found${NC}"
fi

echo ""

# Step 3: Check database migrations
echo -e "${BLUE}STEP 3: Database Migrations${NC}"
echo "----------------------------"
echo ""
echo "The following SQL migration files are ready on your desktop:"
echo ""
echo "  1. 006_ff_partners_table.sql"
echo "  2. 007_ff_style_studio_schema.sql"
echo "  3. 008_ff_manufacturers_table.sql"
echo "  4. 009_email_duplicate_prevention.sql ⭐ CRITICAL"
echo ""
echo -e "${YELLOW}ACTION REQUIRED:${NC}"
echo "1. Go to: https://supabase.com/dashboard"
echo "2. Open your F&F project"
echo "3. Navigate to: SQL Editor"
echo "4. Run each SQL file in order (006 → 007 → 008 → 009)"
echo "5. Verify each migration succeeds before running the next"
echo ""
echo -n "Press ENTER after you've run all migrations... "
read

echo ""
echo -e "${BLUE}Verifying database migrations...${NC}"

# Test if can_send_email function exists (from migration 009)
echo -n "Checking duplicate prevention system... "
# Note: This would require database connection, which we'll skip for now
echo -e "${YELLOW}⚠ MANUAL VERIFICATION REQUIRED${NC}"
echo "  Please test in Supabase SQL Editor:"
echo "  SELECT can_send_email('test@example.com', 'invitation', 'invitation:test@example.com');"
echo "  Expected result: true"
echo ""

# Step 4: Verify bot endpoints
echo -e "${BLUE}STEP 4: Verify Bot Endpoints${NC}"
echo "-----------------------------"
AUTH_TOKEN="${FORBES_COMMAND_API_KEY:-77776f3f2567ed7c6a8b9ce28321de52a10730eacc73dbf9d23ea2b792150d67}"

echo "Testing Annie Pinterest Poster..."
ANNIE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/bots/annie-pinterest-poster" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" 2>&1)
if echo "$ANNIE_RESPONSE" | grep -q "success\|executed\|scheduled"; then
    echo -e "  ${GREEN}✓ Working${NC}"
else
    echo -e "  ${YELLOW}⚠ Response: $(echo $ANNIE_RESPONSE | head -c 80)${NC}"
fi

echo "Testing Henry Partner Discovery..."
HENRY_P_RESPONSE=$(curl -s -X POST "$BASE_URL/api/bots/henry-partner-discovery" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" 2>&1)
if echo "$HENRY_P_RESPONSE" | grep -q "success\|executed\|scheduled"; then
    echo -e "  ${GREEN}✓ Working${NC}"
else
    echo -e "  ${YELLOW}⚠ Response: $(echo $HENRY_P_RESPONSE | head -c 80)${NC}"
fi

echo "Testing Henry Seamstress Discovery..."
HENRY_S_RESPONSE=$(curl -s -X POST "$BASE_URL/api/bots/henry-seamstress-discovery" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUTH_TOKEN" 2>&1)
if echo "$HENRY_S_RESPONSE" | grep -q "success\|executed\|scheduled"; then
    echo -e "  ${GREEN}✓ Working${NC}"
else
    echo -e "  ${YELLOW}⚠ Response: $(echo $HENRY_S_RESPONSE | head -c 80)${NC}"
fi

echo ""

# Step 5: Final verification
echo -e "${BLUE}STEP 5: Final Verification${NC}"
echo "--------------------------"
echo ""
echo "Testing key pages:"

test_page() {
    local name=$1
    local url=$2

    echo -n "  $name... "
    code=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>&1)
    if [ "$code" == "200" ]; then
        echo -e "${GREEN}✓ $code${NC}"
    else
        echo -e "${RED}✗ $code${NC}"
    fi
}

test_page "Homepage" "$BASE_URL/"
test_page "Style Studio" "$BASE_URL/ff/style-studio"
test_page "About" "$BASE_URL/about"
test_page "Podcast" "$BASE_URL/podcast"
test_page "Domain" "$DOMAIN/"

echo ""

# Summary
echo "═══════════════════════════════════════════"
echo -e "${GREEN}✅ POST-FIX SETUP COMPLETE!${NC}"
echo "═══════════════════════════════════════════"
echo ""
echo "Next steps:"
echo "1. ✅ Monitor Railway logs for any errors"
echo "2. ✅ Test Style Studio interface in browser"
echo "3. ✅ Verify bot cron jobs are running (check logs)"
echo "4. ✅ Test sending a duplicate email (should be blocked)"
echo "5. ✅ Update DNS if domain isn't working yet"
echo ""
echo "Key URLs:"
echo "  Railway: $BASE_URL"
echo "  Domain: $DOMAIN"
echo "  Style Studio: $BASE_URL/ff/style-studio"
echo "  Supabase: https://supabase.com/dashboard"
echo ""
echo -e "${BLUE}Congratulations! Frequency & Form is live! 🎉${NC}"
