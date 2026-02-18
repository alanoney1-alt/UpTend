#!/bin/bash
cd ~/uptend-openclaw
BASE="https://uptendapp.com"
REPORT="FULL_E2E_REPORT.md"
TIMEOUT=30

C() {
  # C <num> <desc> <method> <endpoint> [data] [cookiefile]
  local n="$1" d="$2" m="$3" ep="$4" data="${5:-}" cf="${6:-}"
  local url="${BASE}${ep}"
  local args=(-s --max-time $TIMEOUT -w "\nHTTP_CODE:%{http_code}")
  [ -n "$cf" ] && args+=(-b "$cf")
  [ "$m" = "POST" ] && args+=(-X POST -H "Content-Type: application/json" -d "$data")
  local resp
  resp=$(curl "${args[@]}" "$url" 2>/dev/null) || resp="HTTP_CODE:000"
  local code=$(echo "$resp" | grep -o 'HTTP_CODE:[0-9]*' | tail -1 | cut -d: -f2)
  [ -z "$code" ] && code="000"
  local body=$(echo "$resp" | sed 's/HTTP_CODE:[0-9]*$//' | head -c 150 | tr '\n' ' ' | tr '|' '/')
  local r="FAIL"; [[ "$code" =~ ^2 ]] && r="PASS"
  echo "| $n | \`$m $ep\` | $code | **$r** | ${body:0:100} |" >> "$REPORT"
  echo "$n: $code $r - $d"
}

# Auth
echo "=== AUTH ==="
CR=$(curl -s --max-time 15 -c cookies.txt -X POST -H "Content-Type: application/json" \
  -d '{"email":"capntest@uptend.app","password":"TestPass123!"}' "$BASE/api/customers/login")
echo "Cust: $CR"
CID=$(echo "$CR" | python3 -c "import sys,json;print(json.load(sys.stdin).get('userId','UNKNOWN'))" 2>/dev/null || echo "UNKNOWN")

PR=$(curl -s --max-time 15 -c pro-cookies.txt -X POST -H "Content-Type: application/json" \
  -d '{"email":"testpro@uptend.app","password":"TestPass123!"}' "$BASE/api/haulers/login")
echo "Pro: $PR"
PID=$(echo "$PR" | python3 -c "import sys,json;d=json.load(sys.stdin);print(d.get('userId',d.get('haulerId','UNKNOWN')))" 2>/dev/null || echo "UNKNOWN")

echo "CID=$CID PID=$PID"

cat > "$REPORT" << EOF
# Uptend Full E2E Test Report
**Date:** 2026-02-18 ~07:00 EST | **Target:** $BASE
**Customer ID:** \`$CID\` | **Pro ID:** \`$PID\`

## Results

| # | Endpoint | Code | Result | Response (first 100 chars) |
|---|----------|------|--------|---------------------------|
EOF

# PUBLIC
C 1  "Homepage"        GET  "/"
C 2  "Home scan page"  GET  "/ai/home-scan"
C 3  "George:services" POST "/api/ai/chat" '{"message":"What services do you offer?","sessionId":"test-pub-1"}'
C 4  "George:gutter$"  POST "/api/ai/chat" '{"message":"How much for gutter cleaning?","sessionId":"test-pub-2"}'
C 5  "George:scan"     POST "/api/ai/chat" '{"message":"I want to scan my home","sessionId":"test-pub-3"}'
C 6  "George:Spanish"  POST "/api/ai/chat" '{"message":"Mi carro hace un ruido raro al frenar","sessionId":"test-pub-4"}'
C 7  "Pricing menu"    GET  "/api/pricing"
C 8  "Junk removal"    GET  "/api/pricing/junk_removal"
C 9  "Gutter pricing"  GET  "/api/pricing/gutter_cleaning"
C 10 "Quote"           POST "/api/pricing/quote" '{"serviceType":"handyman","loadSize":"medium"}'
C 11 "Events"          GET  "/api/community/events/32827"
C 12 "DIY HVAC"        GET  "/api/diy/hvac"
C 13 "DIY plumbing"    GET  "/api/diy/plumbing"
C 14 "OBD P0420"       GET  "/api/auto/obd/P0420"

# CUSTOMER
C 15 "Scan progress"   GET  "/api/home-scan/progress/$CID"   "" cookies.txt
C 16 "Wallet"          GET  "/api/wallet/$CID"                "" cookies.txt
C 17 "Loyalty"         GET  "/api/loyalty/$CID"               "" cookies.txt
C 18 "Referral"        POST "/api/referrals/generate-code"    "{\"customerId\":\"$CID\"}" cookies.txt
C 19 "Dashboard"       GET  "/api/home/dashboard/$CID"        "" cookies.txt
C 20 "Utilities"       GET  "/api/home/utilities/$CID"        "" cookies.txt
C 21 "Consent"         GET  "/api/consent/$CID"               "" cookies.txt
C 22 "Vehicles"        GET  "/api/auto/vehicles/$CID"         "" cookies.txt
C 23 "HOA lookup"      GET  "/api/hoa/lookup?address=123+Main&city=Orlando&state=FL&zip=32827" "" cookies.txt
C 24 "Smart home"      GET  "/api/smart-home/platforms"       "" cookies.txt
C 25 "Briefing"        GET  "/api/briefing/$CID"              "" cookies.txt
C 26 "Storm prep"      GET  "/api/insurance/storm-prep?stormType=hurricane" "" cookies.txt
C 27 "Start scan"      POST "/api/home-scan/start"            "{\"customerId\":\"$CID\"}" cookies.txt
C 28 "Shopping"        POST "/api/shopping/search"            '{"query":"HVAC filter 20x25x1"}' cookies.txt
C 29 "Neighborhood"    GET  "/api/neighborhood/32827"          "" cookies.txt

# PRO
C 30 "Pro goals"       GET  "/api/pro/goals/$PID"             "" pro-cookies.txt
C 31 "Pro forecast"    GET  "/api/pro/forecast/$PID"           "" pro-cookies.txt
C 32 "Pro route"       GET  "/api/pro/route/$PID/2026-02-18"   "" pro-cookies.txt
C 33 "Pro analytics"   GET  "/api/pro/analytics/$PID/weekly"   "" pro-cookies.txt
C 34 "KB plumbing"     GET  "/api/pro/field-assist/knowledge/plumbing"   "" pro-cookies.txt
C 35 "KB electrical"   GET  "/api/pro/field-assist/knowledge/electrical" "" pro-cookies.txt

# GEORGE DEPTH
C 36 "George:FL gutters" POST "/api/ai/chat" '{"message":"Whats the best time to clean gutters in Florida?","sessionId":"depth-1"}'
C 37 "George:HVAC filt"  POST "/api/ai/chat" '{"message":"How do I change my HVAC filter?","sessionId":"depth-2"}'
C 38 "George:emergency"  POST "/api/ai/chat" '{"message":"I need emergency help, my pipe burst!","sessionId":"depth-3"}'
C 39 "George:home val"   POST "/api/ai/chat" '{"message":"Whats my home worth maintaining?","sessionId":"depth-4"}'
C 40 "George:Honda oil"  POST "/api/ai/chat" '{"message":"I have a 2019 Honda Civic, when do I need an oil change?","sessionId":"depth-5"}'

# Summary
PASS=$(grep -c '**PASS**' "$REPORT" || echo 0)
FAIL=$(grep -c '**FAIL**' "$REPORT" || echo 0)
cat >> "$REPORT" << EOF

## Summary: ${PASS}/40 passing, ${FAIL} failing

### By Section
- **Public (1-14):** $(awk '/^\| [0-9]+ / && $2 ~ /^[0-9]+$/ && $2>=1 && $2<=14' "$REPORT" | grep -c 'PASS' || echo 0)/14
- **Customer (15-29):** $(awk '/^\| [0-9]+ / && $2 ~ /^[0-9]+$/ && $2>=15 && $2<=29' "$REPORT" | grep -c 'PASS' || echo 0)/15
- **Pro (30-35):** $(awk '/^\| [0-9]+ / && $2 ~ /^[0-9]+$/ && $2>=30 && $2<=35' "$REPORT" | grep -c 'PASS' || echo 0)/6
- **George Depth (36-40):** $(awk '/^\| [0-9]+ / && $2 ~ /^[0-9]+$/ && $2>=36 && $2<=40' "$REPORT" | grep -c 'PASS' || echo 0)/5
EOF

echo "=== DONE: $PASS pass, $FAIL fail ==="
