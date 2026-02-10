#!/bin/bash

# UpTend AI Features - Comprehensive Test Script
# Tests all AI features to ensure they're working with real or mock APIs

echo "🧪 UpTend AI Features - Test Suite"
echo "===================================="
echo ""

BASE_URL="http://localhost:5000"
TEST_RESULTS=()

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to test API endpoint
test_endpoint() {
    local name=$1
    local method=$2
    local endpoint=$3
    local data=$4
    local expected_status=$5

    echo -n "Testing $name... "

    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" -X GET "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi

    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)

    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✓ PASS${NC} (HTTP $status_code)"
        TEST_RESULTS+=("PASS: $name")
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (Expected $expected_status, got $status_code)"
        echo "   Response: $(echo $body | head -c 100)..."
        TEST_RESULTS+=("FAIL: $name")
        return 1
    fi
}

# Check if server is running
echo "Checking if server is running..."
if ! curl -s "$BASE_URL/api/health" > /dev/null 2>&1; then
    echo -e "${RED}❌ Server is not running!${NC}"
    echo "Start the server with: npm run dev"
    exit 1
fi
echo -e "${GREEN}✓ Server is running${NC}"
echo ""

# Check environment variables
echo "Checking environment configuration..."
ENV_FILE="/Users/ao/uptend/.env"

check_env_var() {
    local var_name=$1
    local required=$2

    if grep -q "^${var_name}=" "$ENV_FILE" && [ -n "$(grep "^${var_name}=" "$ENV_FILE" | cut -d'=' -f2)" ]; then
        echo -e "  ${GREEN}✓${NC} $var_name configured"
        return 0
    else
        if [ "$required" = "true" ]; then
            echo -e "  ${RED}✗${NC} $var_name missing (required)"
        else
            echo -e "  ${YELLOW}⚠${NC} $var_name missing (optional - using mocks)"
        fi
        return 1
    fi
}

check_env_var "ANTHROPIC_API_KEY" "false"
check_env_var "SENDGRID_API_KEY" "false"
check_env_var "DATABASE_URL" "true"
check_env_var "GOOGLE_PLACES_API_KEY" "false"
echo ""

# Test Database
echo "Testing Database Connection..."
if psql "$DATABASE_URL" -c "SELECT 1;" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Database connection successful${NC}"
else
    echo -e "${RED}✗ Database connection failed${NC}"
    TEST_RESULTS+=("FAIL: Database connection")
fi
echo ""

# Test AI Features
echo "Testing AI Feature Endpoints..."
echo ""

# Note: These tests require authentication
# For full testing, we'd need to:
# 1. Create test users
# 2. Get auth tokens
# 3. Make authenticated requests

echo "⚠️  Note: Full endpoint testing requires authentication"
echo "   Run these tests after logging in to the application"
echo ""

# Test 1: AI Chat (requires auth)
echo "1. AI Chat & Concierge"
echo "   - POST /api/ai/chat"
echo "   - GET /api/ai/conversations"
echo "   Status: ${YELLOW}Requires authentication${NC}"
echo ""

# Test 2: Photo-to-Quote (requires auth)
echo "2. Photo-to-Quote"
echo "   - POST /api/ai/photo-quote"
echo "   - GET /api/ai/photo-quote/:id"
echo "   Status: ${YELLOW}Requires authentication${NC}"
echo ""

# Test 3: Seasonal Advisories
echo "3. Seasonal Advisories"
# This endpoint is public
test_endpoint "Get advisories by zip" "GET" "/api/ai/seasonal/advisories/32801" "" "200"
echo ""

# Test 4: Smart Scheduling (requires auth)
echo "4. Smart Scheduling"
echo "   - POST /api/ai/schedule/suggest"
echo "   - GET /api/ai/schedule/suggestions"
echo "   Status: ${YELLOW}Requires authentication${NC}"
echo ""

# Test 5: Pro Features (requires pro auth)
echo "5. Pro Features (Route Optimization, Quality Scoring)"
echo "   - POST /api/ai/pro/route/optimize"
echo "   - GET /api/ai/pro/quality/score"
echo "   Status: ${YELLOW}Requires pro authentication${NC}"
echo ""

# Test 6: Admin Features (requires admin auth)
echo "6. Admin Features (Fraud Detection)"
echo "   - GET /api/ai/admin/fraud/alerts"
echo "   - POST /api/ai/admin/fraud/alerts/:id/review"
echo "   Status: ${YELLOW}Requires admin authentication${NC}"
echo ""

# Test 7: Neighborhood Intelligence
echo "7. Neighborhood Intelligence"
test_endpoint "Get neighborhood data" "GET" "/api/ai/neighborhood/32801" "" "200"
echo ""

# Test Database Tables
echo "Testing Database Tables..."
if psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM ai_conversations;" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ ai_conversations table exists${NC}"
else
    echo -e "${RED}✗ ai_conversations table missing${NC}"
    TEST_RESULTS+=("FAIL: ai_conversations table")
fi

if psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM photo_quote_requests;" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ photo_quote_requests table exists${NC}"
else
    echo -e "${RED}✗ photo_quote_requests table missing${NC}"
    TEST_RESULTS+=("FAIL: photo_quote_requests table")
fi

if psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM pro_quality_scores;" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ pro_quality_scores table exists${NC}"
else
    echo -e "${RED}✗ pro_quality_scores table missing${NC}"
    TEST_RESULTS+=("FAIL: pro_quality_scores table")
fi

if psql "$DATABASE_URL" -c "SELECT COUNT(*) FROM fraud_alerts;" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ fraud_alerts table exists${NC}"
else
    echo -e "${RED}✗ fraud_alerts table missing${NC}"
    TEST_RESULTS+=("FAIL: fraud_alerts table")
fi
echo ""

# Test CRON Jobs
echo "Testing CRON Jobs..."
if grep -q "AI CRON Jobs initialized" server.log 2>/dev/null; then
    echo -e "${GREEN}✓ CRON jobs initialized${NC}"
else
    echo -e "${YELLOW}⚠ CRON jobs status unknown (check server.log)${NC}"
fi
echo ""

# Test Build
echo "Testing Build..."
if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Build successful${NC}"
else
    echo -e "${RED}✗ Build failed${NC}"
    TEST_RESULTS+=("FAIL: Build")
fi
echo ""

# Summary
echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo ""

passed=0
failed=0
for result in "${TEST_RESULTS[@]}"; do
    if [[ $result == PASS:* ]]; then
        ((passed++))
        echo -e "${GREEN}✓${NC} ${result#PASS: }"
    else
        ((failed++))
        echo -e "${RED}✗${NC} ${result#FAIL: }"
    fi
done

echo ""
echo "Total: $passed passed, $failed failed"
echo ""

# Recommendations
echo "=========================================="
echo "Recommendations"
echo "=========================================="
echo ""

if ! grep -q "ANTHROPIC_API_KEY=" "$ENV_FILE" 2>/dev/null; then
    echo "📝 Add ANTHROPIC_API_KEY to enable real AI features"
    echo "   Get your key at: https://console.anthropic.com/"
    echo ""
fi

if ! grep -q "SENDGRID_API_KEY=" "$ENV_FILE" 2>/dev/null; then
    echo "📝 Add SENDGRID_API_KEY to enable email notifications"
    echo "   Get your key at: https://app.sendgrid.com/"
    echo ""
fi

echo "🚀 To test all features end-to-end:"
echo "   1. Start the server: npm run dev"
echo "   2. Open http://localhost:5000 in your browser"
echo "   3. Login as customer/pro/admin"
echo "   4. Test each AI feature from the UI"
echo ""
echo "📊 To monitor CRON jobs:"
echo "   tail -f server.log | grep 'AI CRON'"
echo ""
echo "📧 To test email sending:"
echo "   Set SENDGRID_API_KEY and check SendGrid dashboard"
echo ""

if [ $failed -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  Some tests failed. Check the errors above.${NC}"
    exit 1
fi
