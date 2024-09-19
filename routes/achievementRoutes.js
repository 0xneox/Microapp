const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const logger = require('../utils/logger');

const achievements = [
  { id: 'firstTap', name: 'First Tap', xpReward: 10, requirement: 1 },
  { id: 'tenTaps', name: '10 Taps', xpReward: 100, requirement: 10 },
  { id: 'hundredTaps', name: '100 Taps', xpReward: 500, requirement: 100 },
  { id: 'thousandTaps', name: '1000 Taps', xpReward: 1000, requirement: 1000 },
  { id: 'level5', name: 'Reach Level 5', xpReward: 2000, requirement: 5 },
  { id: 'level10', name: 'Reach Level 10', xpReward: 5000, requirement: 10 },
  // Add more achievements here
];

router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findOne({ telegramId: req.user.telegramId });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const userAchievements = user.achievements || [];
    const allAchievements = achievements.map(achievement => ({
      ...achievement,
      completed: userAchievements.some(ua => ua.id === achievement.id && ua.completed),
      progress: achievement.id.startsWith('level') ? user.level : user.totalTaps
    }));

    res.json(allAchievements);
  } catch (error) {
    logger.error(`Error fetching achievements: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
});

router.post('/claim/:achievementId', auth, async (req, res) => {
  try {
    const { achievementId } = req.params;
    const user = await User.findOne({ telegramId: req.user.telegramId });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const achievement = achievements.find(a => a.id === achievementId);
    if (!achievement) return res.status(404).json({ message: 'Achievement not found' });

    const userAchievement = user.achievements.find(ua => ua.id === achievementId);
    if (userAchievement && userAchievement.completed) {
      return res.status(400).json({ message: 'Achievement already claimed' });
    }

    const progress = achievement.id.startsWith('level') ? user.level : user.totalTaps;
    if (progress < achievement.requirement) {
      return res.status(400).json({ message: 'Achievement requirements not met' });
    }

    if (!userAchievement) {
      user.achievements.push({ id: achievementId, completed: true });
    } else {
      userAchievement.completed = true;
    }

    user.xp += achievement.xpReward;
    await user.save();

    logger.info(`Achievement claimed: ${achievementId} for user ${user.telegramId}`);
    res.json({ message: 'Achievement claimed', xp: user.xp });
  } catch (error) {
    logger.error(`Error claiming achievement: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;