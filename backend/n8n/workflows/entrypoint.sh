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

echo "Setting up credentials from environment variables..."
# Create credentials directory if it doesn't exist
mkdir -p /home/node/.n8n/credentials

# Check if OpenAI credentials already exist in n8n
if ! n8n list:credentials | grep -q "openai-env-credentials" 2>/dev/null; then
  # Create OpenAI credentials file from environment variable
  if [ -n "$OPENAI_API_KEY" ]; then
    cat > /home/node/.n8n/credentials/openai-env-credentials.json << EOF
[
  {
    "id": "openai-env-credentials",
    "name": "OpenAI Environment Credentials",
    "type": "openAiApi",
    "data": {
      "apiKey": "$OPENAI_API_KEY"
    }
  }
]
EOF
    echo "✅ OpenAI credentials created from environment variable"
    # Import the credentials
    n8n import:credentials --input=/home/node/.n8n/credentials/openai-env-credentials.json
  else
    echo "⚠️  Warning: OPENAI_API_KEY environment variable not set"
  fi
else
  echo "✅ OpenAI credentials already exist, skipping import"
fi

# Check if PostgreSQL credentials already exist in n8n
if ! n8n list:credentials | grep -q "postgres-env-credentials" 2>/dev/null; then
  # Create PostgreSQL credentials file from environment variables
  if [ -n "$DB_POSTGRESDB_HOST" ] && [ -n "$DB_POSTGRESDB_DATABASE" ] && [ -n "$DB_POSTGRESDB_USER" ] && [ -n "$DB_POSTGRESDB_PASSWORD" ]; then
    cat > /home/node/.n8n/credentials/postgres-env-credentials.json << EOF
[
  {
    "id": "postgres-env-credentials",
    "name": "Postgres Environment Credentials",
    "type": "postgres",
    "data": {
      "host": "$DB_POSTGRESDB_HOST",
      "port": "$DB_POSTGRESDB_PORT",
      "database": "$DB_POSTGRESDB_DATABASE",
      "user": "$DB_POSTGRESDB_USER",
      "password": "$DB_POSTGRESDB_PASSWORD",
      "ssl": "disable"
    }
  }
]
EOF
    echo "✅ PostgreSQL credentials created from environment variables"
    # Import the credentials
    n8n import:credentials --input=/home/node/.n8n/credentials/postgres-env-credentials.json
  else
    echo "⚠️  Warning: Database environment variables not set (DB_POSTGRESDB_HOST, DB_POSTGRESDB_DATABASE, DB_POSTGRESDB_USER, DB_POSTGRESDB_PASSWORD)"
  fi
else
  echo "✅ PostgreSQL credentials already exist, skipping import"
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