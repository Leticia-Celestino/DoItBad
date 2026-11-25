#!/bin/sh
# Runs only inside a disposable postgres container, with the repo mounted read-only.
set -eu
docker-entrypoint.sh postgres >/tmp/rhythm-postgres.log 2>&1 &
server_pid=$!
trap 'kill "$server_pid" 2>/dev/null || true' EXIT
attempt=0
until pg_isready -U postgres >/dev/null 2>&1; do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge 30 ]; then cat /tmp/rhythm-postgres.log; exit 1; fi
  sleep 1
done
psql -U postgres -d postgres -f /repo/scripts/verify-rhythm-migration.sql
