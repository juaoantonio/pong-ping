#!/usr/bin/env sh
set -eu

COMPOSE_FILE="../../docker-compose.yml"
POSTGRES_SERVICE="${POSTGRES_SERVICE:-postgres}"
DB_USERNAME="${DB_USERNAME:-postgres}"
DB_DATABASE="${DB_DATABASE:-pong_ping_api}"

docker compose -f "$COMPOSE_FILE" up -d --wait "$POSTGRES_SERVICE"

if docker compose -f "$COMPOSE_FILE" exec -T "$POSTGRES_SERVICE" \
  psql -U "$DB_USERNAME" -d "$DB_DATABASE" -v ON_ERROR_STOP=1 -c "SELECT 1" >/dev/null 2>&1; then
  echo "Postgres is ready and database '$DB_DATABASE' exists."
  exit 0
fi

POSTGRES_MAINTENANCE_DATABASE="${POSTGRES_MAINTENANCE_DATABASE:-mydb}"

docker compose -f "$COMPOSE_FILE" exec -T "$POSTGRES_SERVICE" \
  psql -U "$DB_USERNAME" -d "$POSTGRES_MAINTENANCE_DATABASE" \
  -v ON_ERROR_STOP=1 \
  -v target_db="$DB_DATABASE" <<'SQL'
SELECT format('CREATE DATABASE %I', :'target_db')
WHERE NOT EXISTS (
  SELECT FROM pg_database WHERE datname = :'target_db'
)\gexec
SQL

echo "Postgres is ready and database '$DB_DATABASE' exists."
