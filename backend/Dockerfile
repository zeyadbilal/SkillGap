FROM node:22-alpine

# for solve security Vulnerabilities 
RUN apk update && apk upgrade --no-cache 
RUN npm install -g npm@latest

ARG DEFAULT_PORT=5000

WORKDIR /app

ENV PORT=$DEFAULT_PORT

COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src

EXPOSE $PORT

CMD ["npm", "start"]
