# Frontend Docker Setup with Nginx

This frontend now uses nginx as a reverse proxy with Next.js and supports dynamic API URL configuration via environment variables.

## How it works

1. **Build Process**: Next.js builds the app in standalone mode
2. **Nginx Proxy**: nginx acts as a reverse proxy, forwarding requests to Next.js and API calls to backend
3. **Environment Variables**: API URL is configurable via `API_URL` environment variable

## Environment Variables

- `API_URL`: The backend API URL (default: `/api`)
- `NGINX_PORT`: nginx port (default: `80`)

## Usage Examples

### Docker Compose (Development)
```yaml
frontend:
  build: ./frontend
  ports:
    - "3000:80"
  environment:
    - API_URL=http://backend:5000
    - NGINX_PORT=80
```

### Docker Compose (Production)
```yaml
frontend:
  build: ./frontend
  ports:
    - "80:80"
  environment:
    - API_URL=https://api.yourdomain.com
    - NGINX_PORT=80
```

### Kubernetes
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
spec:
  template:
    spec:
      containers:
      - name: frontend
        image: your-registry/frontend:latest
        ports:
        - containerPort: 80
        env:
        - name: API_URL
          value: "http://backend-service:5000"
        - name: NGINX_PORT
          value: "80"
```

### Docker Run
```bash
# Development
docker run -p 3000:80 -e API_URL=http://localhost:5000 your-frontend-image

# Production
docker run -p 80:80 -e API_URL=https://api.yourdomain.com your-frontend-image
```

## Benefits

1. **Single Image**: One Docker image works for all environments
2. **Environment Flexibility**: Change API URL without rebuilding
3. **Performance**: nginx provides efficient request handling and compression
4. **Security**: nginx provides additional security headers
5. **Scalability**: nginx can handle high traffic loads
6. **Flexibility**: Supports both static and dynamic content

## API Proxy

The nginx configuration automatically proxies requests from `/api/*` to your backend service based on the `API_URL` environment variable.
