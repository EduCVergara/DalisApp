#!/bin/sh
set -eu

cat > /app/dist/runtime-config.js <<EOF
window.__DALISAPP_CONFIG__ = {
  VITE_APP_URL: "${VITE_APP_URL:-}",
  VITE_POCKETBASE_URL: "${VITE_POCKETBASE_URL:-}"
};
EOF

exec serve -c /app/serve.json -l "${PORT:-3000}" dist
