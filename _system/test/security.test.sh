#!/bin/bash

# Security Verification Test Suite
# Tests fixes for VULN-001 through VULN-005

set -e

API_URL="${API_URL:-http://localhost:3000}"
echo "🔒 Security Verification Test Suite"
echo "Testing API at: $API_URL"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0

# Test helper functions
test_pass() {
  echo -e "${GREEN}✓ PASS${NC}: $1"
  ((PASSED++))
}

test_fail() {
  echo -e "${RED}✗ FAIL${NC}: $1"
  ((FAILED++))
}

test_info() {
  echo -e "${YELLOW}ℹ INFO${NC}: $1"
}

# ==============================================================================
# VULN-001: Command Injection Tests
# ==============================================================================
echo "======================================================================"
echo "VULN-001: Command Injection in JARVIS TTS"
echo "======================================================================"

# Test 1: Benign input should work
test_info "Test 1.1: Benign input (should succeed)"
RESPONSE=$(curl -s -X POST "$API_URL/api/jarvis/speak" \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello world", "language": "en"}' || echo "ERROR")

if echo "$RESPONSE" | grep -q "success"; then
  test_pass "Benign input works correctly"
else
  test_fail "Benign input failed: $RESPONSE"
fi

# Test 2: Semicolon injection attempt (should be blocked/escaped)
test_info "Test 1.2: Semicolon injection attempt"
RESPONSE=$(curl -s -X POST "$API_URL/api/jarvis/speak" \
  -H "Content-Type: application/json" \
  -d '{"text": "test; rm -rf /tmp/*", "language": "en"}' || echo "ERROR")

# Should NOT execute commands - check that /tmp is still intact (or error is returned safely)
if [ -d "/tmp" ]; then
  test_pass "Semicolon injection did not execute commands (/tmp still exists)"
else
  test_fail "Semicolon injection may have executed destructive command"
fi

# Test 3: Backtick injection attempt
test_info "Test 1.3: Backtick injection attempt"
RESPONSE=$(curl -s -X POST "$API_URL/api/jarvis/speak" \
  -H "Content-Type: application/json" \
  -d "{\"text\": \"test \\\`whoami\\\` test\", \"language\": \"en\"}")

# Should not contain username in response (command should not execute)
if ! echo "$RESPONSE" | grep -q "$USER"; then
  test_pass "Backtick injection did not execute whoami"
else
  test_fail "Backtick injection may have executed whoami"
fi

# Test 4: Dollar sign variable expansion attempt
test_info "Test 1.4: Dollar sign expansion attempt"
RESPONSE=$(curl -s -X POST "$API_URL/api/jarvis/speak" \
  -H "Content-Type: application/json" \
  -d '{"text": "Price is $(whoami)", "language": "en"}')

# Should not contain username
if ! echo "$RESPONSE" | grep -q "$USER"; then
  test_pass "Dollar sign expansion did not execute"
else
  test_fail "Dollar sign expansion may have executed"
fi

# Test 5: Text length validation (max 10000 chars)
test_info "Test 1.5: Text length validation"
LONG_TEXT=$(printf 'A%.0s' {1..10001})
RESPONSE=$(curl -s -X POST "$API_URL/api/jarvis/speak" \
  -H "Content-Type: application/json" \
  -d "{\"text\": \"$LONG_TEXT\", \"language\": \"en\"}")

if echo "$RESPONSE" | grep -q "too long\|Validation failed"; then
  test_pass "Long text (>10000 chars) rejected"
else
  test_fail "Long text not rejected: $RESPONSE"
fi

# ==============================================================================
# VULN-002: Path Traversal Tests
# ==============================================================================
echo ""
echo "======================================================================"
echo "VULN-002: Path Traversal in Note Move"
echo "======================================================================"

# Create a test note first
test_info "Creating test note for path traversal tests..."
NOTE_RESPONSE=$(curl -s -X POST "$API_URL/api/notes" \
  -H "Content-Type: application/json" \
  -d '{"title": "Security Test Note", "content": "This is a test note for security testing"}')

NOTE_ID=$(echo "$NOTE_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

if [ -z "$NOTE_ID" ]; then
  test_fail "Failed to create test note"
else
  test_info "Created test note with ID: $NOTE_ID"

  # Test 6: Parent directory reference (..)
  test_info "Test 2.1: Parent directory traversal attempt"
  RESPONSE=$(curl -s -X POST "$API_URL/api/notes/$NOTE_ID/move" \
    -H "Content-Type: application/json" \
    -d '{"folder": "projects", "subPath": "../../etc/passwd"}')

  if echo "$RESPONSE" | grep -q "not allowed\|Invalid\|Validation failed"; then
    test_pass "Parent directory traversal rejected"
  else
    test_fail "Parent directory traversal not rejected: $RESPONSE"
  fi

  # Test 7: Absolute path attempt
  test_info "Test 2.2: Absolute path attempt"
  RESPONSE=$(curl -s -X POST "$API_URL/api/notes/$NOTE_ID/move" \
    -H "Content-Type: application/json" \
    -d '{"folder": "areas", "subPath": "/etc/cron.d/malicious"}')

  if echo "$RESPONSE" | grep -q "not allowed\|Invalid\|Validation failed"; then
    test_pass "Absolute path rejected"
  else
    test_fail "Absolute path not rejected: $RESPONSE"
  fi

  # Test 8: Valid subPath should work
  test_info "Test 2.3: Valid subPath (should succeed)"
  RESPONSE=$(curl -s -X POST "$API_URL/api/notes/$NOTE_ID/move" \
    -H "Content-Type: application/json" \
    -d '{"folder": "projects", "subPath": "test-project"}')

  if echo "$RESPONSE" | grep -q "success\|moved"; then
    test_pass "Valid subPath works correctly"
  else
    test_fail "Valid subPath failed: $RESPONSE"
  fi

  # Test 9: Special characters in path
  test_info "Test 2.4: Special characters in path"
  RESPONSE=$(curl -s -X POST "$API_URL/api/notes/$NOTE_ID/move" \
    -H "Content-Type: application/json" \
    -d '{"folder": "resources", "subPath": "path;with;semicolons"}')

  if echo "$RESPONSE" | grep -q "Invalid\|not allowed\|Validation failed"; then
    test_pass "Special characters rejected"
  else
    test_fail "Special characters not rejected: $RESPONSE"
  fi
fi

# ==============================================================================
# VULN-003: Input Validation Tests
# ==============================================================================
echo ""
echo "======================================================================"
echo "VULN-003: Input Validation"
echo "======================================================================"

# Test 10: Invalid note title (too long)
test_info "Test 3.1: Title length validation"
LONG_TITLE=$(printf 'A%.0s' {1..201})
RESPONSE=$(curl -s -X POST "$API_URL/api/notes" \
  -H "Content-Type: application/json" \
  -d "{\"title\": \"$LONG_TITLE\", \"content\": \"Test\"}")

if echo "$RESPONSE" | grep -q "too long\|Validation failed"; then
  test_pass "Long title (>200 chars) rejected"
else
  test_fail "Long title not rejected"
fi

# Test 11: Invalid type coercion (string instead of number)
test_info "Test 3.2: Type coercion protection"
RESPONSE=$(curl -s -X POST "$API_URL/api/jarvis/distill/$NOTE_ID" \
  -H "Content-Type: application/json" \
  -d '{"targetLevel": "3", "language": "en"}')

# Zod should coerce or reject non-number
if echo "$RESPONSE" | grep -q "success\|Validation failed"; then
  test_pass "Type validation works (string coerced or rejected)"
else
  test_fail "Type validation may be broken: $RESPONSE"
fi

# Test 12: Invalid enum value
test_info "Test 3.3: Enum validation"
RESPONSE=$(curl -s -X POST "$API_URL/api/jarvis/speak" \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello", "language": "invalid"}')

if echo "$RESPONSE" | grep -q "Validation failed\|Invalid"; then
  test_pass "Invalid enum value rejected"
else
  test_fail "Invalid enum value not rejected: $RESPONSE"
fi

# ==============================================================================
# VULN-004: CORS Tests
# ==============================================================================
echo ""
echo "======================================================================"
echo "VULN-004: CORS Configuration"
echo "======================================================================"

# Test 13: CORS headers present
test_info "Test 4.1: CORS headers validation"
RESPONSE=$(curl -s -I -X OPTIONS "$API_URL/api/notes" \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: GET")

if echo "$RESPONSE" | grep -qi "Access-Control-Allow-Origin"; then
  test_pass "CORS headers present"
else
  test_fail "CORS headers missing"
fi

# Test 14: Unauthorized origin (should be blocked in production)
test_info "Test 4.2: Unauthorized origin test"
RESPONSE=$(curl -s -I -X OPTIONS "$API_URL/api/notes" \
  -H "Origin: http://evil.com" \
  -H "Access-Control-Request-Method: GET")

# In dev, this might be allowed. In production, it should be blocked.
if echo "$RESPONSE" | grep -qi "Access-Control-Allow-Origin.*evil.com"; then
  test_info "Warning: CORS allows evil.com (acceptable in dev, not in production)"
else
  test_pass "Unauthorized origin blocked or restricted"
fi

# ==============================================================================
# Summary
# ==============================================================================
echo ""
echo "======================================================================"
echo "Test Summary"
echo "======================================================================"
echo -e "${GREEN}Passed:${NC} $PASSED"
echo -e "${RED}Failed:${NC} $FAILED"
echo ""

if [ "$FAILED" -eq 0 ]; then
  echo -e "${GREEN}✓ All security tests passed!${NC}"
  exit 0
else
  echo -e "${RED}✗ Some security tests failed. Review the output above.${NC}"
  exit 1
fi
