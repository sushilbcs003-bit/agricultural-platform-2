#!/bin/bash

# ==========================================================
# API Endpoint Testing Script
# Tests all available endpoints
# ==========================================================

BASE_URL="http://localhost:3001"
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🧪 Testing Agricultural Platform API Endpoints${NC}"
echo "Base URL: $BASE_URL"
echo ""

# Test counter
PASSED=0
FAILED=0

# Test function
test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    local data=$4
    
    echo -e "${YELLOW}Testing: $description${NC}"
    echo "  $method $endpoint"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$BASE_URL$endpoint")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo -e "${GREEN}  ✅ PASSED (HTTP $http_code)${NC}"
        ((PASSED++))
    elif [ "$http_code" -eq 401 ] || [ "$http_code" -eq 403 ]; then
        echo -e "${YELLOW}  ⚠️  AUTH REQUIRED (HTTP $http_code)${NC}"
        ((PASSED++))
    else
        echo -e "${RED}  ❌ FAILED (HTTP $http_code)${NC}"
        echo "  Response: $body"
        ((FAILED++))
    fi
    echo ""
}

# Health & Info
echo -e "${BLUE}=== Health & Info ===${NC}"
test_endpoint "GET" "/health" "Health Check"
test_endpoint "GET" "/" "API Root"

# Authentication (Public)
echo -e "${BLUE}=== Authentication ===${NC}"
test_endpoint "POST" "/api/auth/check-phone" "Check Phone" '{"phone": "+919876543210"}'
test_endpoint "POST" "/api/auth/otp/request" "Request OTP" '{"phone": "+919876543210", "purpose": "LOGIN"}'

# Products (Public)
echo -e "${BLUE}=== Products ===${NC}"
test_endpoint "GET" "/api/products" "Get All Products"

# Location (Public)
echo -e "${BLUE}=== Location ===${NC}"
test_endpoint "GET" "/api/location/lgd/villages/search?q=test" "Search Villages"
test_endpoint "GET" "/api/location/countries/default" "Get Default Country"

# Protected Endpoints (Will show auth required)
echo -e "${BLUE}=== Protected Endpoints (Auth Required) ===${NC}"
test_endpoint "GET" "/api/users/profile" "Get User Profile"
test_endpoint "GET" "/api/cart" "Get Cart"
test_endpoint "GET" "/api/machinery/types?category=FARMING" "Get Machinery Types"
test_endpoint "GET" "/api/machinery/farming" "Browse Farming Machinery"

# Summary
echo ""
echo -e "${BLUE}=== Test Summary ===${NC}"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All tests passed!${NC}"
else
    echo -e "${YELLOW}⚠️  Some tests failed or require authentication${NC}"
fi

echo ""
echo -e "${BLUE}📋 Next Steps:${NC}"
echo "1. Login/Register to get authentication token"
echo "2. Test protected endpoints with token"
echo "3. Use Postman or browser for interactive testing"
echo ""
