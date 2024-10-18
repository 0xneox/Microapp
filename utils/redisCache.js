

const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL);

const cacheUser = async (userId, userData) => {
  await redis.set(`user:${userId}`, JSON.stringify(userData), 'EX', 300); // Cache for 5 minutes
};

const getCachedUser = async (userId) => {
  const cachedUser = await redis.get(`user:${userId}`);
  return cachedUser ? JSON.parse(cachedUser) : null;
};

module.exports = { cacheUser, getCachedUser };
