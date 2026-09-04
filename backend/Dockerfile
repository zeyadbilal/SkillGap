FROM node:24-alpine AS deps

WORKDIR /app
COPY package*.json ./

RUN npm ci --omit=dev


# -------------------

FROM node:24-alpine AS prod

# for solve security Vulnerabilities 
RUN apk update && apk upgrade --no-cache 

USER node 
WORKDIR /app

COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node package.json ./
COPY --chown=node:node src ./src
COPY --chown=node:node docs ./docs


ARG DEFAULT_PORT=5000
ENV PORT=$DEFAULT_PORT
EXPOSE $PORT

# run node with pid 1 to solve SIGTERM
CMD ["node", "src/app.js"] 
