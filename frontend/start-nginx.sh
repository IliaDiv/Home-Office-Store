#!/bin/sh

# Set default API_URL if not provided
export API_URL=${API_URL:-http://backend-svc}

# Debug: show the API_URL value
echo "API_URL is set to: $API_URL"

# Substitute only API_URL in nginx config, leave nginx variables alone
envsubst '$API_URL' < /nginx.conf.template > /etc/nginx/conf.d/default.conf

# Debug: show the generated config
echo "Generated nginx config:"
cat /etc/nginx/conf.d/default.conf

# Test nginx configuration
nginx -t

# Start nginx
nginx -g 'daemon off;'
