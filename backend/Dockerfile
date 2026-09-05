FROM node:24-alpine AS deps

WORKDIR /app
COPY package*.json ./

RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev


# -------------------

FROM node:24-alpine AS prod

# for solve security Vulnerabilities 
RUN apk update && apk upgrade --no-cache 

USER node 
WORKDIR /app

# Copy only the necessary files for production 
# We use --chown=node:node instead of COPY . . to avoid creating an extra layer with root ownership.
# Using a separate 'RUN chown' command would duplicate the files in a new layer, significantly increasing the image size.
COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node package.json ./
COPY --chown=node:node src ./src
COPY --chown=node:node docs ./docs


ARG DEFAULT_PORT=5000
ENV PORT=$DEFAULT_PORT
ENV NODE_ENV=production

# env for database and redis and jwt secret
ENV DATABASE_URL=""
ENV REDIS_URL=""
ENV JWT_SECRET=""

EXPOSE $PORT

# run node with pid 1 to solve SIGTERM
CMD ["node", "src/app.js"]
