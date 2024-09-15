const Queue = require('bull');
const User = require('../models/User');

const achievementQueue = new Queue('achievement-processing', process.env.REDIS_URL);

achievementQueue.process(async (job) => {
  const { userId, achievementId } = job.data;
  const user = await User.findById(userId);
  // Process achievement logic here
});

module.exports = achievementQueue;