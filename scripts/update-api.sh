#!/bin/bash
set -e

BACKEND_REPO_URL="${BACKEND_REPO_URL:-https://raw.githubusercontent.com/bissquit/incident-garden/main}"
OUTPUT_FILE="src/api/openapi.yaml"

echo "Downloading OpenAPI spec from backend..."
curl -fsSL "${BACKEND_REPO_URL}/api/openapi/openapi.yaml" -o "${OUTPUT_FILE}"

echo "Generating TypeScript types..."
npm run api:generate

echo "Done! API types updated."
