const cron = require('node-cron');
const Quest = require('../models/Quest');
const Leaderboard = require('../models/Leaderboard');
const logger = require('./logger');

const resetDailyQuests = async () => {
  try {
    await Quest.updateMany(
      { type: 'daily' },
      { $set: { completed: false, progress: 0 } }
    );
    logger.info('Daily quests reset successfully');
  } catch (error) {
    logger.error(`Error resetting daily quests: ${error.message}`);
  }
};

const resetWeeklyQuests = async () => {
  try {
    await Quest.updateMany(
      { type: 'weekly' },
      { $set: { completed: false, progress: 0 } }
    );
    logger.info('Weekly quests reset successfully');
  } catch (error) {
    logger.error(`Error resetting weekly quests: ${error.message}`);
  }
};

const resetLeaderboards = async () => {
  try {
    await Leaderboard.updateOne(
      { type: 'daily' },
      { $set: { rankings: [] } },
      { upsert: true }
    );
    await Leaderboard.updateOne(
      { type: 'weekly' },
      { $set: { rankings: [] } },
      { upsert: true }
    );
    logger.info('Leaderboards reset successfully');
  } catch (error) {
    logger.error(`Error resetting leaderboards: ${error.message}`);
  }
};

const initCronJobs = () => {
  // Reset daily quests and leaderboard every day at midnight
  cron.schedule('0 0 * * *', async () => {
    await resetDailyQuests();
    await resetLeaderboards();
  });

  // Reset weekly quests and leaderboard every Monday at midnight
  cron.schedule('0 0 * * 1', async () => {
    await resetWeeklyQuests();
    await resetLeaderboards();
  });

  logger.info('Cron jobs initialized');
};

module.exports = { initCronJobs };