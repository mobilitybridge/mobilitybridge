#!/usr/bin/env bash
# Runs the database tests against a throwaway database on a local PostgreSQL 16.
# Usage: PGHOST=localhost PGPORT=5432 PGUSER=postgres ./supabase/tests/run.sh
set -euo pipefail
cd "$(dirname "$0")/.."

DB="alumni_test_$$"
createdb "$DB"
trap 'dropdb --if-exists "$DB"; psql -q -d postgres -c "drop role if exists anon; drop role if exists authenticated;" >/dev/null 2>&1 || true' EXIT

run() { psql -q -v ON_ERROR_STOP=1 -d "$DB" -f "$1" >/dev/null; }

psql -q -d postgres -c "drop role if exists anon; drop role if exists authenticated;" >/dev/null 2>&1 || true
run tests/supabase_stub.sql
for f in migrations/*.sql; do run "$f"; done
run seed.sql
psql -q -v ON_ERROR_STOP=1 -d "$DB" -c "delete from public.mobilities; delete from public.alumni;" >/dev/null
psql -v ON_ERROR_STOP=1 -d "$DB" -f tests/database.test.sql | tail -1
