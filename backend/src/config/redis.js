const { createClient } = require('redis');
const logger = require('../utils/logger');

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

redisClient.on('error', (err) => logger.error('Redis client error', { error: err.message }));
redisClient.on('connect', () => logger.info('Redis connected'));

let connected = false;
async function getRedisClient() {
  if (!connected) {
    await redisClient.connect();
    connected = true;
  }
  return redisClient;
}

module.exports = { redisClient, getRedisClient };
