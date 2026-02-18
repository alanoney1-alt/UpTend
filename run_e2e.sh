#!/bin/bash
BASE="https://uptendapp.com"
RESULTS="E2E_TEST_RESULTS.md"
PASS=0
FAIL=0
TOTAL=0

log_result() {
  local name="$1" status="$2" body="$3"
  TOTAL=$((TOTAL+1))
  local pf="✅ PASS"
  if [ "$status" -ge 400 ] 2>/dev/null || [ -z "$status" ]; then
    pf="❌ FAIL"
    FAIL=$((FAIL+1))
  else
    PASS=$((PASS+1))
  fi
  local short="${body:0:200}"
  echo "| $name | $status | $pf | \`${short//|/∣}\` |" >> "$RESULTS"
  echo "$pf $name ($status)"
}

echo "# UpTend E2E Test Results" > "$RESULTS"
echo "" >> "$RESULTS"
echo "**Date:** $(date)" >> "$RESULTS"
echo "**Target:** $BASE" >> "$RESULTS"
echo "" >> "$RESULTS"
echo "| Endpoint | Status | Result | Response (first 200 chars) |" >> "$RESULTS"
echo "|----------|--------|--------|---------------------------|" >> "$RESULTS"

# 1. Auth - Customer
echo "=== AUTH ==="
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/api/customers/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"capntest@uptend.app","password":"TestPass123!"}')
CUST_STATUS=$(echo "$RESP" | tail -1)
CUST_BODY=$(echo "$RESP" | sed '$d')
log_result "POST /api/customers/login" "$CUST_STATUS" "$CUST_BODY"

CUST_TOKEN=$(echo "$CUST_BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('token',''))" 2>/dev/null)
CUST_ID=$(echo "$CUST_BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); c=d.get('customer',d); print(c.get('id',c.get('customerId','')))" 2>/dev/null)
echo "Customer token: ${CUST_TOKEN:0:20}... ID: $CUST_ID"

# Auth - Pro
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/api/haulers/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"testpro@uptend.app","password":"TestPass123!"}')
PRO_STATUS=$(echo "$RESP" | tail -1)
PRO_BODY=$(echo "$RESP" | sed '$d')
log_result "POST /api/haulers/login" "$PRO_STATUS" "$PRO_BODY"

PRO_TOKEN=$(echo "$PRO_BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('token',''))" 2>/dev/null)
PRO_ID=$(echo "$PRO_BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); h=d.get('hauler',d); print(h.get('id',h.get('haulerId','')))" 2>/dev/null)
echo "Pro token: ${PRO_TOKEN:0:20}... ID: $PRO_ID"

AUTH="Authorization: Bearer $CUST_TOKEN"
PRO_AUTH="Authorization: Bearer $PRO_TOKEN"

# 2. Core APIs
echo "=== CORE APIs ==="
endpoints=(
  "GET|/api/pricing|"
  "GET|/api/pricing/junk_removal|"
  "POST|/api/pricing/quote|{\"serviceType\":\"gutter_cleaning\",\"options\":{\"size\":\"small\"}}"
  "POST|/api/ai/chat|{\"message\":\"What services do you offer?\",\"sessionId\":\"test-123\"}"
  "GET|/api/home-scan/progress/$CUST_ID|"
  "GET|/api/wallet/$CUST_ID|"
  "GET|/api/loyalty/$CUST_ID|"
  "POST|/api/referrals/generate-code|{\"customerId\":\"$CUST_ID\"}"
  "GET|/api/community/events/32827|"
  "GET|/api/insurance/storm-prep|"
  "GET|/api/home/dashboard/$CUST_ID|"
  "GET|/api/hoa/lookup?address=123+Main&city=Orlando&state=FL&zip=32827|"
  "GET|/api/smart-home/platforms|"
  "GET|/api/briefing/$CUST_ID|"
  "GET|/api/diy/hvac|"
  "POST|/api/shopping/search|{\"query\":\"HVAC filter 20x25x1\"}"
  "GET|/api/auto/vehicles/$CUST_ID|"
  "GET|/api/consent/$CUST_ID|"
)

for ep in "${endpoints[@]}"; do
  IFS='|' read -r method path body <<< "$ep"
  if [ "$method" = "POST" ]; then
    RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE$path" \
      -H "Content-Type: application/json" -H "$AUTH" -d "$body")
  else
    RESP=$(curl -s -w "\n%{http_code}" -H "$AUTH" "$BASE$path")
  fi
  STATUS=$(echo "$RESP" | tail -1)
  BODY=$(echo "$RESP" | sed '$d')
  log_result "$method $path" "$STATUS" "$BODY"
done

# 3. Pro APIs
echo "=== PRO APIs ==="
pro_endpoints=(
  "GET|/api/pro/goals/$PRO_ID|"
  "GET|/api/pro/forecast/$PRO_ID|"
  "GET|/api/pro/route/$PRO_ID/2026-02-18|"
  "GET|/api/pro/field-assist/knowledge/plumbing|"
)

for ep in "${pro_endpoints[@]}"; do
  IFS='|' read -r method path body <<< "$ep"
  RESP=$(curl -s -w "\n%{http_code}" -H "$PRO_AUTH" "$BASE$path")
  STATUS=$(echo "$RESP" | tail -1)
  BODY=$(echo "$RESP" | sed '$d')
  log_result "$method $path" "$STATUS" "$BODY"
done

# 4. George conversation
echo "=== GEORGE ==="
george_msgs=(
  "How much for gutter cleaning?|e2e-test-1"
  "I want to scan my home|e2e-test-2"
  "My car is making a grinding noise when I brake|e2e-test-3"
)

for gm in "${george_msgs[@]}"; do
  IFS='|' read -r msg sid <<< "$gm"
  RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE/api/ai/chat" \
    -H "Content-Type: application/json" -H "$AUTH" \
    -d "{\"message\":\"$msg\",\"sessionId\":\"$sid\"}")
  STATUS=$(echo "$RESP" | tail -1)
  BODY=$(echo "$RESP" | sed '$d')
  log_result "POST /api/ai/chat ($msg)" "$STATUS" "$BODY"
done

# Summary
echo "" >> "$RESULTS"
echo "## Summary" >> "$RESULTS"
echo "" >> "$RESULTS"
echo "**$PASS/$TOTAL endpoints passing** ($FAIL failures)" >> "$RESULTS"
echo "" >> "$RESULTS"
echo "Done! $PASS/$TOTAL passing, $FAIL failures"
