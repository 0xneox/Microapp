const Redis = require('ioredis');
const logger = require('./logger');

const createRedisClient = (config = {}) => {
  const client = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    ...config
  });

  client.on('error', (err) => {
    logger.error('Redis Client Error:', err);
  });

  client.on('connect', () => {
    logger.info('Redis Client Connected');
  });

  return client;
};

module.exports = createRedisClient;
