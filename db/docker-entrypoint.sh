#!/bin/bash
set -e

echo "Waiting for SQL Server to be ready..."
until /opt/mssql-tools18/bin/sqlcmd -S db -U sa -P "$SA_PASSWORD" -C -Q "SELECT 1" &> /dev/null
do
  sleep 2
done

echo "SQL Server is ready. Loading schema..."
/opt/mssql-tools18/bin/sqlcmd -S db -U sa -P "$SA_PASSWORD" -C -f 65001 -i /scripts/schema.sql

echo "Loading seed data..."
/opt/mssql-tools18/bin/sqlcmd -S db -U sa -P "$SA_PASSWORD" -C -f 65001 -i /scripts/seed.sql

echo "Database initialization complete."