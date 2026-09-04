FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build


FROM nginx:stable-alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf.template /etc/nginx/templates/default.conf.template

RUN touch /var/run/nginx.pid && \
    chown -R nginx:nginx /usr/share/nginx/html /var/cache/nginx /var/log/nginx /etc/nginx/conf.d /var/run/nginx.pid

USER nginx

ARG DEFAULT_PORT=8080
ENV PORT=$DEFAULT_PORT

ENV BACKEND_URL=http://localhost:5000

EXPOSE $PORT

CMD ["nginx", "-g", "daemon off;"]