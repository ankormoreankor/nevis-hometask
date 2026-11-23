#!/usr/bin/env bash
#
# Smoke checks for the API contract in apps/api/src/index.ts.
#
#   npm run dev:api        one terminal, tsx watch restarts on save
#   npm run api:check      another terminal, prints ok or FAIL per check
#
# BASE points the checks somewhere else, for example another port:
#   BASE=http://localhost:4000 npm run api:check
#
# The numbers in here are the payload from docs/brief.md, month by month:
# index 0 is Feb 2024 and index 11 is Jan 2025. The quirk checks exist on
# purpose. The payload is served as given, so a check that pins a mismatched
# month is a check that the data was not quietly reconciled.

set -uo pipefail

BASE="${BASE:-http://localhost:3000}"
BASE="${BASE%/}"
passed=0
failed=0

if ! command -v jq > /dev/null; then
  echo "jq is not installed, so the body checks cannot run."
  exit 1
fi

if ! curl -s -o /dev/null --max-time 2 "$BASE/api/health"; then
  echo "No answer at $BASE/api/health"
  echo "start the API with: npm run dev:api"
  exit 1
fi

pass() {
  printf '  ok    %-46s %s\n' "$1" "$2"
  passed=$((passed + 1))
}

fail() {
  printf '  FAIL  %-46s %s\n' "$1" "$2"
  failed=$((failed + 1))
}

status() { curl -s -o /dev/null -w '%{http_code}' "$BASE$1"; }
body() { curl -s "$BASE$1"; }

want_status() {
  local name="$1" path="$2" want="$3" got
  got="$(status "$path")"
  if [ "$got" = "$want" ]; then
    pass "$name" "$got"
  else
    fail "$name" "got $got, wanted $want"
  fi
}

want_json() {
  local name="$1" path="$2" filter="$3" want="$4" got
  got="$(body "$path" | jq -r "$filter" 2>/dev/null)"
  if [ "$got" = "$want" ]; then
    pass "$name" "$got"
  else
    fail "$name" "got '$got', wanted '$want'"
  fi
}

# The wording of an error body is not pinned. What matters is that there is an
# error field with something in it, so the client can show it.
want_json_error() {
  local name="$1" path="$2" got
  got="$(body "$path" | jq -r 'if ((.error | type) == "string" and (.error | length) > 0) then "yes" else "no" end' 2>/dev/null)"
  if [ "$got" = "yes" ]; then
    pass "$name" "a non-empty error field"
  else
    fail "$name" "no usable error field in the body"
  fi
}

want_text() {
  local name="$1" path="$2" bytes
  bytes="$(body "$path" | wc -c | tr -d ' ')"
  if [ "$bytes" -gt 0 ]; then
    pass "$name" "${bytes} bytes of text"
  else
    fail "$name" "empty body"
  fi
}

echo "API smoke checks against $BASE"

echo "health"
want_status "health answers 200" "/api/health" "200"
want_json "health body" "/api/health" ".ok" "true"

echo "fiscal year 2024"
want_status "2024 answers 200" "/api/dashboard/2024" "200"
want_json "the body is the company object" "/api/dashboard/2024" ".name" "Company"
want_json "no wrapper around the payload" "/api/dashboard/2024" ".data" "null"
want_json "twelve months of values" "/api/dashboard/2024" ".values | length" "12"
want_json "three branches" "/api/dashboard/2024" ".branches | length" "3"
want_json "the first branch" "/api/dashboard/2024" ".branches[0].name" "Branch 1"
want_json "five advisers in Branch 1" "/api/dashboard/2024" ".branches[0].employees | length" "5"
want_json "the first adviser" "/api/dashboard/2024" ".branches[0].employees[0].name" "Anna Blackwood"
want_json "three channels for Anna" "/api/dashboard/2024" ".branches[0].employees[0].channels | length" "3"
want_json "Branch 2 has no employees" "/api/dashboard/2024" ".branches[1] | has(\"employees\")" "false"
want_json "Branch 3 has no employees" "/api/dashboard/2024" ".branches[2] | has(\"employees\")" "false"
want_json "James Walker has no channels" "/api/dashboard/2024" ".branches[0].employees[1] | has(\"channels\")" "false"

echo "the payload is served as given"
want_json "Feb 2024 company value" "/api/dashboard/2024" ".values[0]" "250"
want_json "May 2024 company value" "/api/dashboard/2024" ".values[3]" "301"
want_json "May 2024 branches sum to 279" "/api/dashboard/2024" ".branches | map(.values[3]) | add" "279"
want_json "Aug 2024 Branch 1 value" "/api/dashboard/2024" ".branches[0].values[6]" "214"
want_json "Aug 2024 advisers sum to 216" "/api/dashboard/2024" ".branches[0].employees | map(.values[6]) | add" "216"
want_json "Aug 2024 Anna channels sum to 36" "/api/dashboard/2024" ".branches[0].employees[0].channels | map(.values[6]) | add" "36"

echo "years without data"
want_status "2025 answers 404" "/api/dashboard/2025" "404"
want_json_error "2025 says why" "/api/dashboard/2025"
want_status "a malformed year answers 400" "/api/dashboard/abc" "400"
want_json_error "a malformed year says why" "/api/dashboard/abc"
want_status "a leading zero answers 400" "/api/dashboard/0024" "400"
want_status "1999 is well formed but has no data" "/api/dashboard/1999" "404"
want_status "no year at all answers 404" "/api/dashboard" "404"

echo "unknown paths"
want_status "an unknown path answers 404" "/api/nope" "404"
want_text "an unknown path answers text" "/api/nope"

echo
printf '%d passed, %d failed\n' "$passed" "$failed"
[ "$failed" -eq 0 ]
