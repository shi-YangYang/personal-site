#!/bin/sh
set -eu

export PATH="/opt/venv/bin:$PATH"

uvicorn backend.main:app --host 127.0.0.1 --port 8000 --log-level info &
API_PID=$!

node server.js &
WEB_PID=$!

cleanup() {
  kill "$API_PID" "$WEB_PID" "${CADDY_PID:-}" 2>/dev/null || true
}
trap cleanup EXIT TERM INT

python - <<'PY'
import time
import urllib.request

checks = (
    "http://127.0.0.1:8000/api/health",
    "http://127.0.0.1:3001/zh",
)
for url in checks:
    for _ in range(120):
        try:
            urllib.request.urlopen(url, timeout=1).read()
            break
        except Exception:
            time.sleep(0.5)
    else:
        raise SystemExit(f"service did not become ready: {url}")
PY

caddy run --config /app/Caddyfile --adapter caddyfile &
CADDY_PID=$!
wait "$CADDY_PID"
