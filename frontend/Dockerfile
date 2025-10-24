FROM node:18-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY nginx.conf.template /nginx.conf.template
COPY start-nginx.sh /start-nginx.sh
RUN chmod +x /start-nginx.sh
COPY --from=builder /app/out /usr/share/nginx/html
EXPOSE 80
CMD ["/start-nginx.sh"]
