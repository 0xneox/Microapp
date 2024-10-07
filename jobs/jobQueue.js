const Queue = require('bull');
const logger = require('../utils/logger');
const createRedisClient = require('../utils/redisClient');

const updateLeaderboardQueue = new Queue('updateLeaderboard', process.env.REDIS_URL, {
  createClient: (type) => {
    switch (type) {
      case 'client':
        return createRedisClient();
      case 'subscriber':
        return createRedisClient();
      case 'bclient':
        return createRedisClient();
      default:
        return createRedisClient();
    }
  },
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail: false,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    }
  }
});

// Process jobs
updateLeaderboardQueue.process(async (job) => {
  const { userId, score } = job.data;
  logger.info(`Processing leaderboard update for user: ${userId}`);

  try {
    // Implement leaderboard update logic here
    // For example:
    // await Leaderboard.updateEntry(userId, score);
    
    logger.info(`Leaderboard update completed for user: ${userId}`);
  } catch (error) {
    logger.error(`Error updating leaderboard for user ${userId}:`, error);
    throw error;
  }
});

// Function to add a job to the queue
const queueLeaderboardUpdate = async (userId, score) => {
  try {
    await updateLeaderboardQueue.add({ userId, score });
    logger.info(`Queued leaderboard update for user: ${userId}`);
  } catch (error) {
    logger.error(`Error queueing leaderboard update for user ${userId}:`, error);
    throw error;
  }
};

// Event listeners for the queue
updateLeaderboardQueue.on('completed', (job) => {
  logger.info(`Job ${job.id} completed for user ${job.data.userId}`);
});

updateLeaderboardQueue.on('failed', (job, err) => {
  logger.error(`Job ${job.id} failed for user ${job.data.userId}:`, err);
});

updateLeaderboardQueue.on('error', (error) => {
  logger.error('Queue error:', error);
});

// Graceful shutdown function
const gracefulShutdown = async () => {
  logger.info('Shutting down leaderboard update queue');
  await updateLeaderboardQueue.close();
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

module.exports = { queueLeaderboardUpdate, gracefulShutdown };
