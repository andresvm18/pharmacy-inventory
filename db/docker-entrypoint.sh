#!/bin/bash
set -e

SQLCMD=$(command -v sqlcmd || echo "/opt/mssql-tools18/bin/sqlcmd")
if [ ! -x "$SQLCMD" ]; then
  SQLCMD="/opt/mssql-tools/bin/sqlcmd"
fi

echo "Using sqlcmd at: $SQLCMD"
echo "Waiting for SQL Server to be ready..."

RETRIES=30
until "$SQLCMD" -S db -U sa -P "$SA_PASSWORD" -C -Q "SELECT 1"
do
  RETRIES=$((RETRIES - 1))
  if [ $RETRIES -le 0 ]; then
    echo "SQL Server did not become ready in time. Giving up."
    exit 1
  fi
  echo "Not ready yet, retrying in 2s... ($RETRIES attempts left)"
  sleep 2
done

echo "SQL Server is ready. Loading schema..."
"$SQLCMD" -S db -U sa -P "$SA_PASSWORD" -C -i /scripts/schema.sql

echo "Loading seed data..."
"$SQLCMD" -S db -U sa -P "$SA_PASSWORD" -C -i /scripts/seed.sql

echo "Database initialization complete."