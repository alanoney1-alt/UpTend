#!/bin/bash
BASE="https://uptendapp.com"
CID="37814f76-1de4-4dc3-8fd0-367081fb8734"
CC="-s -b cookies.txt -c cookies.txt"

t() {
  echo "=== TEST $1: $2 ==="
  eval "curl $CC -w '\nHTTP:%{http_code}' $3"
  echo -e "\n"
}

# Group 1: Home Scan
t 1 "home-scan/start" "-X POST '$BASE/api/home-scan/start' -H 'Content-Type: application/json' -d '{\"customerId\":\"$CID\"}'"
# extract session id for test 3
SCAN_RESP=$(curl $CC -X POST "$BASE/api/home-scan/start" -H "Content-Type: application/json" -d "{\"customerId\":\"$CID\"}")
SCAN_ID=$(echo "$SCAN_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('sessionId','') or d.get('scanId','') or d.get('id',''))" 2>/dev/null)
echo "SCAN_ID=$SCAN_ID"

t 3 "home-scan/scan-item" "-X POST '$BASE/api/home-scan/scan-item' -H 'Content-Type: application/json' -d '{\"customerId\":\"$CID\",\"sessionId\":\"$SCAN_ID\",\"photoUrl\":\"https://example.com/photo.jpg\",\"room\":\"kitchen\"}'"
t 4 "home-scan/progress" "'$BASE/api/home-scan/progress/$CID'"
t 5 "wallet" "'$BASE/api/wallet/$CID'"

# Group 2: Warranties
t 6 "warranties" "'$BASE/api/purchases/warranties/$CID'"
t 7 "warranty-register" "-X POST '$BASE/api/purchases/warranty-register' -H 'Content-Type: application/json' -d '{\"customerId\":\"$CID\",\"productName\":\"Test Dishwasher\",\"brand\":\"Bosch\",\"purchaseDate\":\"2025-06-15\",\"warrantyExpires\":\"2027-06-15\",\"retailer\":\"Home Depot\"}'"

# Group 3: Home Utilities
t 8 "home/dashboard" "'$BASE/api/home/dashboard/$CID'"
t 9 "home/trash-schedule" "'$BASE/api/home/trash-schedule/$CID'"
t 10 "home/sprinklers" "'$BASE/api/home/sprinklers/$CID'"
t 11 "home/reminders" "'$BASE/api/home/reminders/$CID'"
t 12 "home/tonight" "'$BASE/api/home/tonight/$CID'"

# Group 4: Shopping
t 13 "shopping/search HVAC" "-X POST '$BASE/api/shopping/search' -H 'Content-Type: application/json' -d '{\"query\":\"HVAC filter 20x25x1\"}'"
t 14 "shopping/search Moen" "-X POST '$BASE/api/shopping/search' -H 'Content-Type: application/json' -d '{\"query\":\"Moen 1222 faucet cartridge\"}'"
t 15 "shopping/recommendations" "'$BASE/api/shopping/recommendations/$CID'"
t 16 "tutorials/search" "'$BASE/api/tutorials/search?task=change+hvac+filter'"
t 17 "tutorials/maintenance/hvac" "'$BASE/api/tutorials/maintenance/hvac'"

# Group 5: Auto
t 18 "auto/vehicles" "-X POST '$BASE/api/auto/vehicles' -H 'Content-Type: application/json' -d '{\"customerId\":\"$CID\",\"year\":2019,\"make\":\"Honda\",\"model\":\"Civic\",\"mileage\":45000}'"

# Get vehicle ID
VEH_RESP=$(curl $CC -X POST "$BASE/api/auto/vehicles" -H "Content-Type: application/json" -d "{\"customerId\":\"$CID\",\"year\":2019,\"make\":\"Honda\",\"model\":\"Civic\",\"mileage\":45000}")
VEH_ID=$(echo "$VEH_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('vehicleId','') or d.get('id',''))" 2>/dev/null)
echo "VEH_ID=$VEH_ID"

t 19 "auto/vin-lookup" "-X POST '$BASE/api/auto/vin-lookup' -H 'Content-Type: application/json' -d '{\"vin\":\"1HGBH41JXMN109186\"}'"
t 20 "auto/maintenance" "'$BASE/api/auto/maintenance/$VEH_ID'"
t 21 "auto/diagnose" "-X POST '$BASE/api/auto/diagnose' -H 'Content-Type: application/json' -d '{\"symptom\":\"grinding noise when braking\",\"vehicleId\":\"$VEH_ID\"}'"
t 22 "auto/parts-search" "-X POST '$BASE/api/auto/parts-search' -H 'Content-Type: application/json' -d '{\"partName\":\"brake pads\",\"year\":2019,\"make\":\"Honda\",\"model\":\"Civic\"}'"
t 23 "auto/obd" "'$BASE/api/auto/obd/P0420'"

# Group 6: Insurance & Emergency
t 24 "insurance/storm-prep" "'$BASE/api/insurance/storm-prep?stormType=hurricane'"
t 25 "emergency/dispatch" "-X POST '$BASE/api/emergency/dispatch' -H 'Content-Type: application/json' -d '{\"emergencyType\":\"pipe_burst\",\"severity\":\"critical\",\"address\":\"123 Main St\",\"description\":\"Water everywhere\",\"customerId\":\"$CID\"}'"
t 26 "emergency/active" "'$BASE/api/emergency/active'"

# Group 7: Loyalty
t 27 "loyalty" "'$BASE/api/loyalty/$CID'"
t 28 "loyalty/rewards" "'$BASE/api/loyalty/rewards/$CID'"
t 29 "referrals/generate-code" "-X POST '$BASE/api/referrals/generate-code' -H 'Content-Type: application/json' -d '{\"customerId\":\"$CID\"}'"
t 30 "referrals" "'$BASE/api/referrals/$CID'"
t 31 "referrals/deals" "'$BASE/api/referrals/deals/32827'"

# Group 8: Community
t 32 "community/activity" "'$BASE/api/community/activity/32827'"
t 33 "community/events" "'$BASE/api/community/events/32827'"
t 34 "community/tips" "-X POST '$BASE/api/community/tips' -H 'Content-Type: application/json' -d '{\"zip\":\"32827\",\"category\":\"pro_recommendation\",\"title\":\"Great plumber\",\"content\":\"John from XYZ was amazing\",\"customerId\":\"$CID\"}'"

# Group 9: HOA
t 35 "hoa/lookup" "'$BASE/api/hoa/lookup?address=123+Main+St&city=Orlando&state=FL&zip=32827'"
t 36 "hoa/customer" "'$BASE/api/hoa/customer/$CID'"

# Group 10: Smart Home
t 37 "smart-home/platforms" "'$BASE/api/smart-home/platforms'"
t 38 "smart-home/devices" "'$BASE/api/smart-home/devices'"

# Group 11: Consent
t 39 "consent" "'$BASE/api/consent/$CID'"
t 40 "consent/grant" "-X POST '$BASE/api/consent/grant' -H 'Content-Type: application/json' -d '{\"userId\":\"$CID\",\"consentType\":\"marketing_sms\",\"method\":\"conversational\",\"consentText\":\"Yes, send me tips\"}'"

# Group 12: DIY
t 41 "diy-coach/diagnose" "-X POST '$BASE/api/diy-coach/diagnose' -H 'Content-Type: application/json' -d '{\"issueDescription\":\"garbage disposal humming but not working\"}'"
t 42 "diy/hvac" "'$BASE/api/diy/hvac'"
t 43 "diy/plumbing" "'$BASE/api/diy/plumbing'"

# Group 13: Pricing
t 44 "pricing" "'$BASE/api/pricing'"
t 45 "pricing/quote" "-X POST '$BASE/api/pricing/quote' -H 'Content-Type: application/json' -d '{\"serviceType\":\"gutter_cleaning\",\"size\":\"small\",\"zip\":\"32827\"}'"
t 46 "pricing/bundle" "-X POST '$BASE/api/pricing/bundle' -H 'Content-Type: application/json' -d '{\"serviceTypes\":[\"gutter_cleaning\",\"pressure_washing\"]}'"

# Group 16: Drone
t 57 "drone-scan/customer" "'$BASE/api/drone-scan/customer/$CID'"

# Group 17: Briefing
t 58 "briefing" "'$BASE/api/briefing/$CID'"
t 59 "weather" "'$BASE/api/weather/32827'"

# Group 18: Receipt
t 60 "purchases" "'$BASE/api/purchases/$CID'"
t 61 "purchases/retailers" "'$BASE/api/purchases/retailers/$CID'"

