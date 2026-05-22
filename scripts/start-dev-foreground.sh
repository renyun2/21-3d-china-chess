#!/usr/bin/env bash
set -euo pipefail
cd /app

pnpm --filter @xq/shared build
pnpm db:generate 2>/dev/null || true
pnpm db:push 2>/dev/null || true

exec pnpm exec concurrently -n client,server -c cyan,magenta \
  "pnpm --filter @xq/client exec vite --host 0.0.0.0 --port 5173" \
  "pnpm --filter @xq/server dev"
