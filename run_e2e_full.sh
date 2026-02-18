#!/bin/bash
set -euo pipefail

BASE="https://uptendapp.com"
REPORT="/Users/ao/uptend-openclaw/E2E_FULL_TEST_2026-02-18.md"

# Login and get cookie
COOKIE=$(curl -s -c - -X POST "$BASE/api/customers/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"capntest@uptend.app","password":"TestPass123!"}' | grep connect.sid | awk '{print "connect.sid="$NF}')

CID="37814f76-1de4-4dc3-8fd0-367081fb8734"

# Helper: call API and record status + truncated body
call() {
  local method="$1" url="$2" body="${3:-}" label="$4"
  local tmpf=$(mktemp)
  local http_code
  if [ "$method" = "GET" ]; then
    http_code=$(curl -s -o "$tmpf" -w "%{http_code}" -b "$COOKIE" "$BASE$url")
  else
    http_code=$(curl -s -o "$tmpf" -w "%{http_code}" -b "$COOKIE" -X POST -H "Content-Type: application/json" -d "$body" "$BASE$url")
  fi
  local snippet=$(cat "$tmpf" | head -c 300 | tr '\n' ' ')
  rm -f "$tmpf"
  local status="✅ PASS"
  [ "$http_code" -ge 400 ] && status="❌ FAIL"
  echo "| $label | $method $url | $http_code | $status | ${snippet:0:200} |"
}

{
cat <<'HEADER'
# UpTend Full E2E Test Report
**Date:** 2026-02-18 09:04 EST
**Site:** https://uptendapp.com
**Customer:** capntest@uptend.app (37814f76-1de4-4dc3-8fd0-367081fb8734)

---

HEADER

echo "## 1. George Chat (AI)"
echo ""
echo "| Test | Endpoint | HTTP | Status | Response Snippet |"
echo "|------|----------|------|--------|-----------------|"

call POST "/api/ai/chat" '{"messages":[{"role":"user","content":"I need help fixing a running toilet"}],"customerId":"'"$CID"'"}' "DIY toilet"
call POST "/api/ai/chat" '{"messages":[{"role":"user","content":"Book me a pressure washing"}],"customerId":"'"$CID"'"}' "Booking flow"
call POST "/api/ai/chat" '{"messages":[{"role":"user","content":"Scan my home"}],"customerId":"'"$CID"'"}' "Home scan"
call POST "/api/ai/chat" '{"messages":[{"role":"user","content":"Help with my car"}],"customerId":"'"$CID"'"}' "Vehicle diag"
call POST "/api/ai/chat" '{"messages":[{"role":"user","content":"Necesito ayuda con mi casa"}],"customerId":"'"$CID"'"}' "Spanish/Jorge"

echo ""
echo "## 2. DIY Flow"
echo ""
echo "| Test | Endpoint | HTTP | Status | Response Snippet |"
echo "|------|----------|------|--------|-----------------|"

call GET "/api/diy/plumbing" "" "DIY plumbing"
call GET "/api/diy/hvac" "" "DIY HVAC"
call GET "/api/diy/electrical" "" "DIY electrical"

echo ""
echo "## 3. Home Scan"
echo ""
echo "| Test | Endpoint | HTTP | Status | Response Snippet |"
echo "|------|----------|------|--------|-----------------|"

call POST "/api/home-scan/start" '{"customerId":"'"$CID"'","propertyAddress":"123 Test St"}' "Start scan"
call GET "/api/home-scan/progress/$CID" "" "Scan progress"

echo ""
echo "## 4. Automotive"
echo ""
echo "| Test | Endpoint | HTTP | Status | Response Snippet |"
echo "|------|----------|------|--------|-----------------|"

call POST "/api/auto/vehicles" '{"customerId":"'"$CID"'","year":2020,"make":"Toyota","model":"Camry","vin":"1HGBH41JXMN109186"}' "Add vehicle"
call POST "/api/auto/diagnose" '{"customerId":"'"$CID"'","symptomDescription":"brakes squeaking when stopping"}' "Diagnose"
call GET "/api/auto/recalls/1HGBH41JXMN109186" "" "Recalls VIN"
call POST "/api/auto/diy-start" '{"customerId":"'"$CID"'","taskType":"oil_change","vehicleYear":2020,"vehicleMake":"Toyota","vehicleModel":"Camry"}' "Auto DIY start"

echo ""
echo "## 5. Video/Tutorials"
echo ""
echo "| Test | Endpoint | HTTP | Status | Response Snippet |"
echo "|------|----------|------|--------|-----------------|"

call GET "/api/tutorials/search?q=fix+running+toilet" "" "Tutorial search"
call GET "/api/tutorials/maintenance/plumbing" "" "Maintenance plumbing"

echo ""
echo "## 6. Pricing"
echo ""
echo "| Test | Endpoint | HTTP | Status | Response Snippet |"
echo "|------|----------|------|--------|-----------------|"

call GET "/api/pricing" "" "Pricing list"
call POST "/api/pricing/quote" '{"serviceType":"pressure_washing","sqft":1500,"zipCode":"32827"}' "Price quote"

echo ""
echo "## 7. Insurance & Emergency"
echo ""
echo "| Test | Endpoint | HTTP | Status | Response Snippet |"
echo "|------|----------|------|--------|-----------------|"

call GET "/api/insurance/storm-prep" "" "Storm prep"
call POST "/api/emergency/dispatch" '{"customerId":"'"$CID"'","emergencyType":"water_leak","description":"Pipe burst in kitchen","address":"123 Test St, Orlando FL"}' "Emergency dispatch"
call GET "/api/emergency/active" "" "Active emergencies"

echo ""
echo "## 8. Pro Features"
echo ""
echo "| Test | Endpoint | HTTP | Status | Response Snippet |"
echo "|------|----------|------|--------|-----------------|"

call GET "/api/pro/forecast/current" "" "Pro forecast"
call GET "/api/pro/analytics/current/weekly" "" "Pro analytics"

echo ""
echo "## 9. All Other Groups (from DEEP_FEATURE_TEST.md)"
echo ""
echo "### Warranty"
echo "| Test | Endpoint | HTTP | Status | Response Snippet |"
echo "|------|----------|------|--------|-----------------|"
call GET "/api/purchases/warranties/$CID" "" "Warranties"
call POST "/api/purchases/warranty-register" '{"customerId":"'"$CID"'","productName":"Test Widget","purchaseDate":"2026-01-15","expirationDate":"2028-01-15","retailer":"Home Depot"}' "Register warranty"

echo ""
echo "### Home Utilities"
echo "| Test | Endpoint | HTTP | Status | Response Snippet |"
echo "|------|----------|------|--------|-----------------|"
call GET "/api/home/dashboard/$CID" "" "Dashboard"
call GET "/api/home/trash-schedule/$CID" "" "Trash schedule"
call GET "/api/home/sprinklers/$CID" "" "Sprinklers"
call GET "/api/home/reminders/$CID" "" "Reminders"
call GET "/api/home/tonight/$CID" "" "Tonight checklist"

echo ""
echo "### Shopping"
echo "| Test | Endpoint | HTTP | Status | Response Snippet |"
echo "|------|----------|------|--------|-----------------|"
call POST "/api/shopping/search" '{"query":"HVAC filter 16x25x1"}' "Shopping HVAC"
call GET "/api/shopping/recommendations/$CID" "" "Shopping recs"

echo ""
echo "### Loyalty & Referrals"
echo "| Test | Endpoint | HTTP | Status | Response Snippet |"
echo "|------|----------|------|--------|-----------------|"
call GET "/api/loyalty/$CID" "" "Loyalty"
call GET "/api/loyalty/rewards/$CID" "" "Rewards"
call POST "/api/referrals/generate-code" '{"customerId":"'"$CID"'"}' "Referral code"
call GET "/api/referrals/$CID" "" "Referrals"

echo ""
echo "### Community"
echo "| Test | Endpoint | HTTP | Status | Response Snippet |"
echo "|------|----------|------|--------|-----------------|"
call GET "/api/community/activity/32827" "" "Community activity"
call GET "/api/community/events/32827" "" "Community events"
call POST "/api/community/tips" '{"customerId":"'"$CID"'","category":"plumbing","tip":"Always turn off water supply before repairs","zipCode":"32827"}' "Submit tip"

echo ""
echo "### HOA"
echo "| Test | Endpoint | HTTP | Status | Response Snippet |"
echo "|------|----------|------|--------|-----------------|"
call GET "/api/hoa/lookup" "" "HOA lookup"
call GET "/api/hoa/customer/$CID" "" "HOA customer"

echo ""
echo "### Smart Home"
echo "| Test | Endpoint | HTTP | Status | Response Snippet |"
echo "|------|----------|------|--------|-----------------|"
call GET "/api/smart-home/platforms" "" "Platforms"
call GET "/api/smart-home/devices?customerId=$CID" "" "Devices"

echo ""
echo "### Consent & Data"
echo "| Test | Endpoint | HTTP | Status | Response Snippet |"
echo "|------|----------|------|--------|-----------------|"
call GET "/api/consent/$CID" "" "Consent status"
call POST "/api/consent/grant" '{"customerId":"'"$CID"'","consentType":"marketing_email","granted":true}' "Grant consent"

echo ""
echo "### B2B"
echo "| Test | Endpoint | HTTP | Status | Response Snippet |"
echo "|------|----------|------|--------|-----------------|"
call POST "/api/auth/business/login" '{"email":"sarah@orlandopremier.com","password":"BusinessPass123!"}' "B2B login"

echo ""
echo "### Drone Scan"
echo "| Test | Endpoint | HTTP | Status | Response Snippet |"
echo "|------|----------|------|--------|-----------------|"
call GET "/api/drone-scan/customer/$CID" "" "Drone scans"

echo ""
echo "### Morning Briefing & Weather"
echo "| Test | Endpoint | HTTP | Status | Response Snippet |"
echo "|------|----------|------|--------|-----------------|"
call GET "/api/briefing/$CID" "" "Briefing"
call GET "/api/weather/32827" "" "Weather"

echo ""
echo "### Receipt / Purchases"
echo "| Test | Endpoint | HTTP | Status | Response Snippet |"
echo "|------|----------|------|--------|-----------------|"
call GET "/api/purchases/$CID" "" "Purchases"
call GET "/api/purchases/retailers/$CID" "" "Retailers"

echo ""
echo "### Pro Field Assist"
echo "| Test | Endpoint | HTTP | Status | Response Snippet |"
echo "|------|----------|------|--------|-----------------|"
call GET "/api/pro/field-assist/knowledge/plumbing" "" "Knowledge plumbing"
call GET "/api/pro/field-assist/knowledge/electrical" "" "Knowledge electrical"
call GET "/api/pro/field-assist/knowledge/hvac" "" "Knowledge HVAC"
call GET "/api/pro/goals/current" "" "Pro goals"
call GET "/api/pro/route/current/2026-02-18" "" "Pro route"

echo ""
echo "### Auto extras"
echo "| Test | Endpoint | HTTP | Status | Response Snippet |"
echo "|------|----------|------|--------|-----------------|"
call POST "/api/auto/vin-lookup" '{"vin":"1HGBH41JXMN109186"}' "VIN lookup"
call GET "/api/auto/obd/P0420" "" "OBD code"

echo ""
echo "### Wallet"
echo "| Test | Endpoint | HTTP | Status | Response Snippet |"
echo "|------|----------|------|--------|-----------------|"
call GET "/api/wallet/$CID" "" "Wallet"

echo ""
echo "---"
echo ""
echo "## Summary"
echo ""
echo "Report generated: $(date)"

} > "$REPORT"

echo "Done. Report at $REPORT"
