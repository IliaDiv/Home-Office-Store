#!/bin/sh
set -e

echo "Waiting for Postgres to be ready..."
# Use nc (netcat) which is available in Alpine Linux
until nc -z ${DB_POSTGRESDB_HOST:-postgres} ${DB_POSTGRESDB_PORT:-5432}; do
  echo "Postgres is unavailable - sleeping"
  sleep 2
done
echo "Postgres is up - executing command"

echo "Initializing n8n database..."
# n8n CLI automatically creates DB schema in Postgres on first run
# User creation will be handled through the web interface on first access

echo "Importing workflow..."
# Import the workflow if it doesn't exist
if [ ! -f /home/node/.n8n/workflows.json ] || ! grep -q "h0INmbJOQ71cq6NQ" /home/node/.n8n/workflows.json 2>/dev/null; then
  echo "Workflow not found, importing..."
  n8n import:workflow --input=/workflows/my-workflow.json
else
  echo "Workflow already exists"
fi

echo "Importing credentials..."
# Import credentials
if [ -f /home/node/.n8n/credentials.json ]; then
  n8n import:credentials --input=/home/node/.n8n/credentials.json
fi

echo "Starting n8n..."
# Start n8n in background
n8n start &
N8N_PID=$!

# Wait for n8n to be ready
echo "Waiting for n8n to be ready..."
sleep 10

# Wait until n8n REST API is ready
echo "Waiting for n8n REST API to be ready..."
until curl -s -o /dev/null -H "X-N8N-API-KEY: $N8N_API_KEY" http://localhost:5678/api/v1/workflows; do
  echo "n8n not ready yet... sleeping 2s"
  sleep 2
done
echo "n8n is ready!"

# Activate the workflow
echo "Activating workflow..."
export N8N_API_KEY=${N8N_API_KEY:-n8n-api-key-12345}
# Activate all workflows using n8n CLI
n8n update:workflow --all --active=true
echo "✅ Workflows activated successfully!"

# Stop n8n to apply the activation changes
echo "Stopping n8n to apply workflow activation changes..."
kill $N8N_PID
wait $N8N_PID 2>/dev/null || true

# Start n8n again with activated workflows
echo "Restarting n8n with activated workflows..."
n8n start