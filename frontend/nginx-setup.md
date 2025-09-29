# Frontend Nginx Configuration

This document explains how the frontend React/Next.js application is configured to work with nginx.

## Overview

The frontend is now configured to use nginx as the web server instead of the Next.js standalone server. This provides better performance, caching, and flexibility for production deployments.

## Configuration Files

### 1. Dockerfile
- Uses a multi-stage build with Node.js for building and nginx:alpine for serving
- Builds the Next.js app as static files using `output: 'export'`
- Copies static files to nginx's document root (`/usr/share/nginx/html`)
- Uses nginx's built-in environment variable substitution (no additional tools needed)

### 2. nginx.conf.template
- Template for nginx configuration with environment variable placeholders
- Proxies `/api/` requests to the backend service
- Serves static files with proper caching headers
- Handles client-side routing by serving `index.html` for non-API routes

### 3. Environment Variable Substitution
- Uses nginx's built-in `envsubst` functionality
- No custom entrypoint script needed
- Environment variables are automatically substituted at container startup

## Environment Variables

The following environment variables can be used to configure the frontend:

- `API_URL`: Backend API URL (default: `http://backend:5000`)
- `NGINX_PORT`: Port for nginx to listen on (default: `80`)
- `NEXT_PUBLIC_API_URL`: Public API URL for client-side requests

## Usage

### Docker Compose
```yaml
frontend:
  build: ./frontend
  ports:
    - "3000:80"
  environment:
    - API_URL=http://backend:5000
    - NEXT_PUBLIC_API_URL=http://localhost:5000
    - NGINX_PORT=80
```

### Custom API URL
To use a different API URL, set the `API_URL` environment variable:

```bash
docker run -e API_URL=http://my-api-server:8080 -p 3000:80 frontend
```

### Custom Port
To use a different port, set the `NGINX_PORT` environment variable:

```bash
docker run -e NGINX_PORT=8080 -p 8080:8080 frontend
```

## Features

- **Static File Serving**: Serves Next.js static files with proper caching headers
- **API Proxying**: Proxies API requests to the backend service
- **Client-side Routing**: Handles React Router routes by serving index.html
- **Gzip Compression**: Enables gzip compression for better performance
- **Security Headers**: Adds security headers for better security
- **Health Check**: Provides a `/health` endpoint for monitoring

## Testing

The nginx configuration is automatically tested when the container starts. No additional testing scripts are needed.
