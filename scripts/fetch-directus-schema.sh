#!/usr/bin/env bash

set -euo pipefail

# Load environment variables from .env if it exists
if [ -f .env ]; then
  set -a
  source .env
  set +a
fi

# Check if DIRECTUS_URL is set
if [ -z "${DIRECTUS_URL:-}" ]; then
  echo "Error: Missing DIRECTUS_URL in environment" >&2
  exit 1
fi

# Prepare curl command
CURL_ARGS=(
  -sS
  -X GET
  "$DIRECTUS_URL/server/specs/oas"
  -H "Content-Type: application/json"
)

# Add authorization header if DIRECTUS_TOKEN is set
if [ -n "${DIRECTUS_TOKEN:-}" ]; then
  CURL_ARGS+=(-H "Authorization: Bearer $DIRECTUS_TOKEN")
fi

# Fetch schema
echo "Fetching schema from $DIRECTUS_URL..."
if ! RESPONSE=$(curl "${CURL_ARGS[@]}"); then
  echo "Error: Failed to fetch schema" >&2
  exit 1
fi

# Create output directory
OUT_DIR="$(pwd)/lib/api"
mkdir -p "$OUT_DIR"

# Save response to file
OUT_FILE="$OUT_DIR/schema.json"

# Format JSON if jq is available, otherwise save as-is
if command -v jq &> /dev/null; then
  echo "$RESPONSE" | jq . > "$OUT_FILE"
else
  echo "$RESPONSE" > "$OUT_FILE"
fi

echo "Saved schema to $OUT_FILE"
