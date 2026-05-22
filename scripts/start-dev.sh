#!/usr/bin/env bash
# Default container CMD: client (Vite :5173) + server (:3001) in tmux.
set -euo pipefail
cd /app

pnpm --filter @xq/shared build
pnpm db:generate 2>/dev/null || true
pnpm db:push 2>/dev/null || true

SESSION=xq-dev
tmux kill-session -t "${SESSION}" 2>/dev/null || true

tmux new-session -d -s "${SESSION}" \
  "cd /app && exec pnpm exec concurrently -n client,server -c cyan,magenta \
    \"pnpm --filter @xq/client exec vite --host 0.0.0.0 --port 5173\" \
    \"pnpm --filter @xq/server dev\""

printf '%s\n' \
  '[dev] 3D China Chess starting in tmux session: xq-dev' \
  '[dev] App URL (map 8817:5173 on host): http://localhost:8817/' \
  '[dev] API/Socket.IO inside container: http://localhost:3001' \
  '[dev] Attach:  tmux attach -t xq-dev' \
  '[dev] Detach without stopping:  Ctrl+b then d' \
  '[dev] Foreground (no tmux):  /app/scripts/start-dev-foreground.sh'
