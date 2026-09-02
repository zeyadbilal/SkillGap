const { getRedisClient } = require('../config/redis');
const logger = require('../utils/logger');

// How long to keep data in cache (in seconds)
const TTL = {
  JOB_LISTINGS: 60 * 60,        // 1 hour
  JOB_DETAILS: 2 * 60 * 60,     // 2 hours
  ALL_SKILLS: 24 * 60 * 60,     // 24 hours
  SKILL_DETAILS: 12 * 60 * 60,  // 12 hours
  USER_GAPS: 30 * 60,           // 30 minutes
  USER_RECOMMENDATIONS: 60 * 60,// 1 hour
  TRENDS: 12 * 60 * 60,         // 12 hours
};

async function get(key) {
  try {
    const client = await getRedisClient();
    const value = await client.get(key);
    return value ? JSON.parse(value) : null;
  } catch (err) {
    logger.error('Cache get failed', { key, error: err.message });
    return null; // fail open — don't break the request path on cache errors
  }
}

async function set(key, value, ttlSeconds) {
  try {
    const client = await getRedisClient();
    await client.set(key, JSON.stringify(value), { EX: ttlSeconds });
  } catch (err) {
    logger.error('Cache set failed', { key, error: err.message });
  }
}

async function del(keyOrPattern) {
  try {
    const client = await getRedisClient();
    if (keyOrPattern.includes('*')) {
      const keys = await client.keys(keyOrPattern);
      if (keys.length) await client.del(keys);
    } else {
      await client.del(keyOrPattern);
    }
  } catch (err) {
    logger.error('Cache delete failed', { keyOrPattern, error: err.message });
  }
}

// Helper functions to create consistent cache key names
const keys = {
  jobListing: (queryHash) => `jobs:list:${queryHash}`,
  jobDetails: (id) => `jobs:details:${id}`,
  allSkills: (queryHash) => `skills:all:${queryHash}`,
  skillDetails: (id) => `skills:details:${id}`,
  userGaps: (userId, sector) => `user:${userId}:gaps:${sector || 'all'}`,
  userRecommendations: (userId) => `user:${userId}:recommendations`,
  trends: (sector, days) => `trends:${sector || 'all'}:${days}`,
};

// Clear job cache when job data changes
async function invalidateJobCaches(jobId) {
  await del('jobs:list:*');
  if (jobId) await del(keys.jobDetails(jobId));
}

async function invalidateUserGapCaches(userId) {
  await del(`user:${userId}:gaps:*`);
}

async function invalidateUserRecommendationCaches(userId) {
  await del(keys.userRecommendations(userId));
}

module.exports = {
  TTL,
  keys,
  get,
  set,
  del,
  invalidateJobCaches,
  invalidateUserGapCaches,
  invalidateUserRecommendationCaches,
};
