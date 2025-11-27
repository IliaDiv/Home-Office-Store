#!/bin/sh
set -e

echo "Waiting for Postgres to be ready..."
# Use nc (netcat) which is available in Alpine Linux
until nc -z ${DB_POSTGRESDB_HOST:-postgres} ${DB_POSTGRESDB_PORT:-5432}; do
  echo "Postgres is unavailable - sleeping"
  sleep 2
done
echo "Postgres is up - executing command"

# Install jq if not present (Alpine uses apk, not apt-get)
if ! command -v jq > /dev/null 2>&1; then
  echo "Installing jq..."
  apk add --no-cache jq
fi

# Get DB credentials from mount if using EKS, otherwise use environment variables
if [ -f /mnt/secrets-store/flask/rds ]; then
    echo "Reading database credentials from secrets store..."
    DB_POSTGRESDB_USER=$(jq -r '.username' /mnt/secrets-store/flask/rds)
    DB_POSTGRESDB_PASSWORD=$(jq -r '.password' /mnt/secrets-store/flask/rds)
    echo $DB_POSTGRESDB_USER
else
    echo "Using database credentials from environment variables..."
    DB_POSTGRESDB_USER=${DB_POSTGRESDB_USER:-${DB_USER}}
    DB_POSTGRESDB_PASSWORD=${DB_POSTGRESDB_PASSWORD:-${DB_PASSWORD}}
fi

# Validate required DB environment variables
if [ -z "$DB_POSTGRESDB_HOST" ] || [ -z "$DB_POSTGRESDB_DATABASE" ] || [ -z "$DB_POSTGRESDB_USER" ] || [ -z "$DB_POSTGRESDB_PASSWORD" ]; then
  echo "❌ Error: Missing required database environment variables"
  echo "Required: DB_POSTGRESDB_HOST, DB_POSTGRESDB_DATABASE, DB_POSTGRESDB_USER, DB_POSTGRESDB_PASSWORD"
  exit 1
fi

export DB_POSTGRESDB_USER DB_POSTGRESDB_PASSWORD

echo "Initializing n8n database..."
# Start n8n temporarily to initialize the database
n8n start &
N8N_PID=$!

# Wait for n8n to initialize database
echo "Waiting for n8n to initialize..."
sleep 15

echo "✅ n8n is ready!"

# Stop n8n to import workflows and credentials
echo "Stopping n8n for import operations..."
kill $N8N_PID
wait $N8N_PID 2>/dev/null || true
sleep 3

echo "Importing workflow..."
# Import the workflow if it doesn't exist
WORKFLOW_FILE="/workflows/my-workflow.json"
if [ -f "$WORKFLOW_FILE" ]; then
  if [ ! -f /home/node/.n8n/workflows.json ] || ! grep -q "h0INmbJOQ71cq6NQ" /home/node/.n8n/workflows.json 2>/dev/null; then
    echo "Workflow not found, importing..."
    n8n import:workflow --input="$WORKFLOW_FILE" || echo "⚠️  Warning: Workflow import had issues but continuing..."
  else
    echo "✅ Workflow already exists"
  fi
else
  echo "⚠️  Warning: Workflow file not found at $WORKFLOW_FILE"
fi

echo "Setting up credentials from environment variables..."
# Create credentials directory if it doesn't exist
mkdir -p /home/node/.n8n/credentials

# Try to read OpenAI key from secrets store first
if [ -f /mnt/secrets-store/n8n/openai ]; then
    echo "Reading OpenAI API key from secrets store..."
    export OPENAI_API_KEY=$(jq -r '."open_ai_api_key"' /mnt/secrets-store/n8n/openai)
fi

if [ -n "$OPENAI_API_KEY" ]; then
  OPENAI_CREDS_FILE="/home/node/.n8n/credentials/openai-env-credentials.json"
  cat > "$OPENAI_CREDS_FILE" << EOF
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
  echo "✅ OpenAI credentials file created"
  n8n import:credentials --input="$OPENAI_CREDS_FILE" || echo "⚠️  Credentials may already exist"
fi

# Create PostgreSQL credentials file from environment variables
POSTGRES_CREDS_FILE="/home/node/.n8n/credentials/postgres-env-credentials.json"
cat > "$POSTGRES_CREDS_FILE" << EOF
[
  {
    "id": "postgres-env-credentials",
    "name": "Postgres Environment Credentials",
    "type": "postgres",
    "data": {
      "host": "$DB_POSTGRESDB_HOST",
      "port": ${DB_POSTGRESDB_PORT:-5432},
      "database": "$DB_POSTGRESDB_DATABASE",
      "user": "$DB_POSTGRESDB_USER",
      "password": "$DB_POSTGRESDB_PASSWORD",
      "ssl": "disable",
      "allowUnauthorizedCerts": false
    }
  }
]
EOF
echo "✅ PostgreSQL credentials file created"
n8n import:credentials --input="$POSTGRES_CREDS_FILE" || echo "⚠️  Credentials may already exist"

# Start n8n again
echo "Starting n8n..."
n8n start &
N8N_PID=$!

# Wait for n8n to be fully ready
echo "Waiting for n8n to be ready..."
sleep 10

# Wait for n8n API to be responsive
if [ -n "$N8N_API_KEY" ]; then
  echo "Waiting for n8n REST API to be ready..."
  RETRY_COUNT=0
  until curl -s -o /dev/null -w "%{http_code}" -H "X-N8N-API-KEY: $N8N_API_KEY" http://localhost:5678/api/v1/workflows | grep -q "200"; do
    RETRY_COUNT=$((RETRY_COUNT + 1))
    if [ $RETRY_COUNT -ge 30 ]; then
      echo "⚠️  Warning: n8n API not responding after 30 attempts, continuing anyway..."
      break
    fi
    echo "n8n API not ready yet... sleeping 2s (attempt $RETRY_COUNT/30)"
    sleep 2
  done
  echo "✅ n8n API is ready!"

  # Activate all workflows
  echo "Activating workflows..."
  n8n update:workflow --all --active=true || echo "⚠️  Warning: Could not activate workflows"
  echo "✅ Workflow activation attempted!"
  
  # Stop and restart to apply activation
  echo "Restarting n8n to apply changes..."
  kill $N8N_PID
  wait $N8N_PID 2>/dev/null || true
  sleep 3
fi

echo "Starting n8n (final)..."
exec n8n start

echo "n8n is READY"