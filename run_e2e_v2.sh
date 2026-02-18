#!/bin/bash
BASE="https://uptendapp.com"
RESULTS="E2E_TEST_RESULTS.md"
CJAR="/tmp/uptend_cust.jar"
PJAR="/tmp/uptend_pro.jar"
PASS=0; FAIL=0; TOTAL=0

log_result() {
  local name="$1" status="$2" body="$3"
  TOTAL=$((TOTAL+1))
  local pf="✅ PASS"
  if [ "$status" -ge 400 ] 2>/dev/null || [ -z "$status" ]; then
    pf="❌ FAIL"; FAIL=$((FAIL+1))
  else
    PASS=$((PASS+1))
  fi
  local short=$(echo "$body" | head -c 200 | tr '|' '∣' | tr '\n' ' ')
  echo "| $name | $status | $pf | \`$short\` |" >> "$RESULTS"
  echo "$pf $name ($status)"
}

do_get() { # jar, path
  RESP=$(curl -s -w "\n%{http_code}" -b "$1" "$BASE$2")
  echo "$RESP"
}

do_post() { # jar, path, body
  RESP=$(curl -s -w "\n%{http_code}" -b "$1" -X POST "$BASE$2" -H "Content-Type: application/json" -d "$3")
  echo "$RESP"
}

echo "# UpTend E2E Test Results" > "$RESULTS"
echo "" >> "$RESULTS"
echo "**Date:** $(date)" >> "$RESULTS"
echo "**Target:** $BASE" >> "$RESULTS"
echo "" >> "$RESULTS"
echo "| Endpoint | Status | Result | Response (first 200 chars) |" >> "$RESULTS"
echo "|----------|--------|--------|---------------------------|" >> "$RESULTS"

# Auth
echo "=== AUTH ==="
RESP=$(curl -s -w "\n%{http_code}" -c "$CJAR" -X POST "$BASE/api/customers/login" \
  -H "Content-Type: application/json" -d '{"email":"capntest@uptend.app","password":"TestPass123!"}')
STATUS=$(echo "$RESP" | tail -1); BODY=$(echo "$RESP" | sed '$d')
log_result "POST /api/customers/login" "$STATUS" "$BODY"

# Get customer ID from /api/me or similar
ME_RESP=$(curl -s -b "$CJAR" "$BASE/api/customers/me" 2>/dev/null)
CUST_ID=$(echo "$ME_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('id',d.get('customerId','UNKNOWN')))" 2>/dev/null)
[ -z "$CUST_ID" ] && CUST_ID="UNKNOWN"
echo "Customer ID: $CUST_ID (me response: ${ME_RESP:0:100})"

RESP=$(curl -s -w "\n%{http_code}" -c "$PJAR" -X POST "$BASE/api/haulers/login" \
  -H "Content-Type: application/json" -d '{"email":"testpro@uptend.app","password":"TestPass123!"}')
STATUS=$(echo "$RESP" | tail -1); BODY=$(echo "$RESP" | sed '$d')
log_result "POST /api/haulers/login" "$STATUS" "$BODY"

PRO_ME=$(curl -s -b "$PJAR" "$BASE/api/haulers/me" 2>/dev/null)
PRO_ID=$(echo "$PRO_ME" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('id',d.get('haulerId','UNKNOWN')))" 2>/dev/null)
[ -z "$PRO_ID" ] && PRO_ID="UNKNOWN"
echo "Pro ID: $PRO_ID (me response: ${PRO_ME:0:100})"

# If no /me endpoint, try to use a default test ID
if [ "$CUST_ID" = "UNKNOWN" ]; then CUST_ID="1"; fi
if [ "$PRO_ID" = "UNKNOWN" ]; then PRO_ID="1"; fi

# Core APIs
echo "=== CORE APIs ==="
test_core() {
  local method="$1" path="$2" body="$3"
  if [ "$method" = "POST" ]; then
    RESP=$(curl -s -w "\n%{http_code}" -b "$CJAR" -X POST "$BASE$path" -H "Content-Type: application/json" -d "$body")
  else
    RESP=$(curl -s -w "\n%{http_code}" -b "$CJAR" "$BASE$path")
  fi
  STATUS=$(echo "$RESP" | tail -1); BODY=$(echo "$RESP" | sed '$d')
  log_result "$method $path" "$STATUS" "$BODY"
}

test_core GET "/api/pricing" ""
test_core GET "/api/pricing/junk_removal" ""
test_core POST "/api/pricing/quote" '{"serviceType":"gutter_cleaning","options":{"size":"small"}}'
test_core POST "/api/ai/chat" '{"message":"What services do you offer?","sessionId":"test-123"}'
test_core GET "/api/home-scan/progress/$CUST_ID" ""
test_core GET "/api/wallet/$CUST_ID" ""
test_core GET "/api/loyalty/$CUST_ID" ""
test_core POST "/api/referrals/generate-code" "{\"customerId\":\"$CUST_ID\"}"
test_core GET "/api/community/events/32827" ""
test_core GET "/api/insurance/storm-prep" ""
test_core GET "/api/home/dashboard/$CUST_ID" ""
test_core GET "/api/hoa/lookup?address=123+Main&city=Orlando&state=FL&zip=32827" ""
test_core GET "/api/smart-home/platforms" ""
test_core GET "/api/briefing/$CUST_ID" ""
test_core GET "/api/diy/hvac" ""
test_core POST "/api/shopping/search" '{"query":"HVAC filter 20x25x1"}'
test_core GET "/api/auto/vehicles/$CUST_ID" ""
test_core GET "/api/consent/$CUST_ID" ""

# Pro APIs
echo "=== PRO APIs ==="
test_pro() {
  local path="$1"
  RESP=$(curl -s -w "\n%{http_code}" -b "$PJAR" "$BASE$path")
  STATUS=$(echo "$RESP" | tail -1); BODY=$(echo "$RESP" | sed '$d')
  log_result "GET $path" "$STATUS" "$BODY"
}

test_pro "/api/pro/goals/$PRO_ID"
test_pro "/api/pro/forecast/$PRO_ID"
test_pro "/api/pro/route/$PRO_ID/2026-02-18"
test_pro "/api/pro/field-assist/knowledge/plumbing"

# George
echo "=== GEORGE ==="
george() {
  local msg="$1" sid="$2"
  RESP=$(curl -s -w "\n%{http_code}" -b "$CJAR" -X POST "$BASE/api/ai/chat" \
    -H "Content-Type: application/json" -d "{\"message\":\"$msg\",\"sessionId\":\"$sid\"}")
  STATUS=$(echo "$RESP" | tail -1); BODY=$(echo "$RESP" | sed '$d')
  log_result "POST /api/ai/chat ($sid)" "$STATUS" "$BODY"
}

george "How much for gutter cleaning?" "e2e-test-1"
george "I want to scan my home" "e2e-test-2"
george "My car is making a grinding noise when I brake" "e2e-test-3"

echo "" >> "$RESULTS"
echo "## Summary" >> "$RESULTS"
echo "" >> "$RESULTS"
echo "**$PASS/$TOTAL endpoints passing** ($FAIL failures)" >> "$RESULTS"
echo "" >> "$RESULTS"
echo "### Notes" >> "$RESULTS"
echo "- Auth uses session cookies (connect.sid), not Bearer tokens" >> "$RESULTS"
echo "- Login responses don't include customer/hauler IDs" >> "$RESULTS"
echo "- Customer ID used: $CUST_ID, Pro ID used: $PRO_ID" >> "$RESULTS"
echo "" >> "$RESULTS"
echo "Done! $PASS/$TOTAL passing, $FAIL failures"
