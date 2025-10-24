#!/bin/sh

# Set default API_URL if not provided
export API_URL=${API_URL:-http://backend:5000/}

# Debug: show the API_URL value
echo "API_URL is set to: $API_URL"

# Wait for backend to be available (optional, but helpful)
echo "Waiting for backend to be available..."
if command -v nc >/dev/null 2>&1; then
  until nc -z backend 5000 2>/dev/null; do
    echo "Backend not ready, waiting..."
    sleep 2
  done
  echo "Backend is ready!"
else
  echo "nc not available, skipping backend check"
fi

# Substitute only API_URL in nginx config, leave nginx variables alone
envsubst '$API_URL' < /nginx.conf.template > /etc/nginx/conf.d/default.conf

# Debug: show the generated config
echo "Generated nginx config:"
cat /etc/nginx/conf.d/default.conf

# Test nginx configuration
nginx -t

# Start nginx
nginx -g 'daemon off;'
