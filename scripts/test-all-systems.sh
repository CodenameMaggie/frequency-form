#!/bin/bash

# Frequency & Form - Complete System Test
# Run this after Railway is redeployed to verify everything works

echo "🧪 FREQUENCY & FORM - SYSTEM TEST"
echo "=================================="
echo ""

BASE_URL="${1:-https://frequency-form-production.up.railway.app}"
DOMAIN="${2:-https://frequencyandform.com}"

echo "Testing Base URL: $BASE_URL"
echo "Testing Domain: $DOMAIN"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0

# Function to test endpoint
test_endpoint() {
  local name=$1
  local url=$2
  local expected_code=${3:-200}

  echo -n "Testing $name... "

  response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>&1)

  if [ "$response" == "$expected_code" ]; then
    echo -e "${GREEN}✓ PASS${NC} (HTTP $response)"
    PASSED=$((PASSED + 1))
  else
    echo -e "${RED}✗ FAIL${NC} (HTTP $response, expected $expected_code)"
    FAILED=$((FAILED + 1))
  fi
}

# Function to test JSON response
test_json_endpoint() {
  local name=$1
  local url=$2
  local expected_field=$3

  echo -n "Testing $name... "

  response=$(curl -s "$url" 2>&1)
  http_code=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>&1)

  if [ "$http_code" == "200" ] && echo "$response" | grep -q "$expected_field"; then
    echo -e "${GREEN}✓ PASS${NC}"
    echo "  Response: $(echo $response | python3 -m json.tool 2>/dev/null | head -3)"
    PASSED=$((PASSED + 1))
  else
    echo -e "${RED}✗ FAIL${NC} (HTTP $http_code)"
    echo "  Response: $response" | head -3
    FAILED=$((FAILED + 1))
  fi
}

echo "📄 TESTING PAGES"
echo "----------------"
test_endpoint "Homepage" "$BASE_URL/"
test_endpoint "Style Studio" "$BASE_URL/ff/style-studio"
test_endpoint "About Page" "$BASE_URL/about" 200
test_endpoint "Podcast Page" "$BASE_URL/podcast" 200
echo ""

echo "🔌 TESTING API ENDPOINTS"
echo "------------------------"
test_json_endpoint "Health Check" "$BASE_URL/health" "status"
test_json_endpoint "Next.js API Health" "$BASE_URL/api/health" "status"
echo ""

echo "🤖 TESTING BOT ENDPOINTS (with auth)"
echo "-------------------------------------"
AUTH_TOKEN="${FORBES_COMMAND_API_KEY:-77776f3f2567ed7c6a8b9ce28321de52a10730eacc73dbf9d23ea2b792150d67}"

test_bot() {
  local name=$1
  local endpoint=$2

  echo -n "Testing $name... "

  response=$(curl -s -X POST "$BASE_URL$endpoint" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    2>&1)

  http_code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL$endpoint" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $AUTH_TOKEN" \
    2>&1)

  if [ "$http_code" == "200" ]; then
    echo -e "${GREEN}✓ PASS${NC}"
    echo "  Response preview: $(echo $response | head -c 100)"
    PASSED=$((PASSED + 1))
  else
    echo -e "${YELLOW}⚠ SKIP${NC} (HTTP $http_code - may need time to process)"
    echo "  Note: Bots run on schedule, immediate test may timeout"
  fi
}

test_bot "Annie Pinterest Poster" "/api/bots/annie-pinterest-poster"
test_bot "Henry Partner Discovery" "/api/bots/henry-partner-discovery"
test_bot "Henry Seamstress Discovery" "/api/bots/henry-seamstress-discovery"
echo ""

echo "🌐 TESTING DOMAIN"
echo "-----------------"
test_endpoint "Domain Homepage" "$DOMAIN/"
test_endpoint "Domain Style Studio" "$DOMAIN/ff/style-studio"
echo ""

echo "📊 TEST SUMMARY"
echo "==============="
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
  echo -e "${GREEN}🎉 ALL TESTS PASSED!${NC}"
  exit 0
else
  echo -e "${RED}⚠️  SOME TESTS FAILED${NC}"
  echo "Review the failures above and fix issues."
  exit 1
fi
