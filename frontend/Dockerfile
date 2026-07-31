# Stage 1: Build Angular application
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci || npm install

COPY . .

RUN npm run build -- --configuration production

# Stage 2: Serve built assets with Nginx
FROM nginx:alpine

COPY --from=builder /app/dist/frontend/browser /usr/share/nginx/html

COPY nginx.conf /etc/nginx/templates/default.conf.template

ENV BACKEND_URL=http://backend:3000/api/
ENV NGINX_ENVSUBST_FILTER=BACKEND_URL

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

