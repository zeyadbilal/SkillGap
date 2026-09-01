FROM node:20-alpine

ARG DEFAULT_PORT=5000

WORKDIR /app

ENV PORT=$DEFAULT_PORT

COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src

EXPOSE $PORT

CMD ["npm", "start"]
