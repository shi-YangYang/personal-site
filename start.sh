#!/bin/sh
set -eu

export PATH="/opt/venv/bin:$PATH"

uvicorn backend.main:app --host 127.0.0.1 --port 8000 --log-level info &
API_PID=$!
WEB_PID=""

cleanup() {
  kill "$API_PID" 2>/dev/null || true
  if [ -n "$WEB_PID" ]; then kill "$WEB_PID" 2>/dev/null || true; fi
}
trap cleanup EXIT TERM INT

# Wait until FastAPI answers before starting Next.
python - <<'PY'
import time
import urllib.request

for _ in range(60):
    try:
        urllib.request.urlopen("http://127.0.0.1:8000/api/health", timeout=1).read()
        raise SystemExit(0)
    except Exception:
        time.sleep(0.5)
raise SystemExit("FastAPI did not become ready")
PY

node server.js &
WEB_PID=$!
wait "$WEB_PID"
