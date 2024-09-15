const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');

const achievements = [
  { id: 'firstTap', name: 'First Tap', xpReward: 10 },
  { id: 'tenTaps', name: '10 Taps', xpReward: 100 },
  { id: 'hundredTaps', name: '100 Taps', xpReward: 500 },
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
      progress: userAchievements.find(ua => ua.id === achievement.id)?.progress || 0
    }));

    res.json(allAchievements);
  } catch (error) {
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
    if (!userAchievement || userAchievement.completed) {
      return res.status(400).json({ message: 'Achievement not claimable' });
    }

    userAchievement.completed = true;
    user.xp += achievement.xpReward;
    await user.save();

    res.json({ message: 'Achievement claimed', xp: user.xp });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
