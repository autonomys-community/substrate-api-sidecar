#!/bin/bash

# Substrate API Sidecar Endpoint Test Script

set -e

BASE_URL="http://127.0.0.1:8080"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to test an endpoint
test_endpoint() {
    local endpoint="$1"
    local description="$2"
    local method="${3:-GET}"
    local data="$4"
    
    echo -e "\n${BLUE}Testing: $description${NC}"
    echo -e "Endpoint: ${YELLOW}$method $endpoint${NC}"
    
    if [[ "$method" == "POST" ]]; then
        response=$(curl -s -w "\n%{http_code}" -X POST \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$BASE_URL$endpoint" 2>/dev/null || echo -e "\nERROR")
    else
        response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint" 2>/dev/null || echo -e "\nERROR")
    fi
    
    # Extract status code (last line) and body (everything except last line)
    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [[ "$status_code" == "200" ]]; then
        echo -e "Status: ${GREEN}✓ $status_code${NC}"
        # Show first 1000 characters of response
        if [[ ${#body} -gt 1000 ]]; then
            echo "${body:0:1000}..." | sed 's/^/  /'
        else
            echo "$body" | sed 's/^/  /'
        fi
    elif [[ "$status_code" == "ERROR" ]]; then
        echo -e "Status: ${RED}✗ Connection Error${NC}"
    else
        echo -e "Status: ${RED}✗ $status_code${NC}"
        # Show first 1000 characters of error response
        if [[ ${#body} -gt 1000 ]]; then
            echo "${body:0:1000}..." | sed 's/^/  /'
        else
            echo "$body" | sed 's/^/  /'
        fi
    fi
}

# Function to get latest block number
get_latest_block() {
    curl -s "$BASE_URL/blocks/head" | grep -o '"number":"[^"]*"' | cut -d'"' -f4 | head -1 || echo "0"
}

echo -e "${GREEN}🚀 Substrate API Sidecar Endpoint Tests${NC}"
echo "Testing against: $BASE_URL"
echo "======================================"

# Core Block Endpoints
test_endpoint "/blocks/head/header" "Latest Block Header"

# Get a specific block number for testing
latest_block=$(get_latest_block)
if [[ "$latest_block" != "0" ]] && [[ "$latest_block" =~ ^[0-9]+$ ]]; then
    # Test with a block that's a few blocks back to ensure it exists
    test_block=$((latest_block - 5))
    test_endpoint "/blocks/$test_block" "Specific Block ($test_block)"
    test_endpoint "/blocks/$test_block/header" "Specific Block Header ($test_block)"
fi

# Node Information
test_endpoint "/node/version" "Node Version"
test_endpoint "/node/network" "Network Information"
test_endpoint "/node/transaction-pool" "Transaction Pool"

# Runtime Information  
test_endpoint "/runtime/spec" "Runtime Specification"
test_endpoint "/runtime/metadata" "Runtime Metadata"

# Account Endpoints (using a zero address as placeholder)
sample_address="sudsmzacWHtCn8rhPixDqBWxYqPWCxV7E9DxrfZafitKEXkf1"
test_endpoint "/accounts/$sample_address/balance-info" "Account Balance Info"
test_endpoint "/accounts/$sample_address/validate" "Account Validation"

# Transaction Endpoints
test_endpoint "/transaction/material" "Transaction Material"

if [ "$status_code" = "400" ] || [[ "$body" == *"Missing field"* ]]; then
    echo -e "Status: ${GREEN}✓ Endpoint accessible (expects 'tx' field as expected)${NC}"
else
    echo -e "Status: ${RED}✗ $status_code${NC}"
    # Show first 1000 characters of error response
    if [[ ${#body} -gt 1000 ]]; then
        echo "  ${body:0:1000}..."
    else
        echo "  $body"
    fi
fi

# Root endpoint
test_endpoint "/" "API Root/Documentation"

echo -e "\n${GREEN}🎉 Endpoint testing complete!${NC}"
echo -e "\n${YELLOW}Note: Some endpoints may return errors if the chain doesn't support certain features.${NC}"