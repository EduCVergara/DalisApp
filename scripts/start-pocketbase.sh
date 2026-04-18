#!/bin/sh
set -eu

PORT_VALUE="${PORT:-8080}"

exec /pb/pocketbase serve --http="0.0.0.0:${PORT_VALUE}"
