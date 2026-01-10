#!/bin/bash

# Load environment variables from .env.local
if [ -f .env.local ]; then
  export $(grep -v '^#' .env.local | xargs)
fi

# Generate types
npx @neondatabase/neon-js gen-types --db-url "$DATABASE_URL" --output lib/types/database.ts
