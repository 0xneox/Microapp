const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const logger = require('../utils/logger');

const achievements = [
  { id: 'noviceMiner', name: 'Novice Miner', description: "You've taken your first steps into the world of GPU mining", xpReward: 100, requirement: 1, type: 'tap' },
  { id: 'socialButterfly', name: 'Social Butterfly', description: "Connected on all social platforms. You're officially part of the community", xpReward: 500, requirement: 3, type: 'social' },
  { id: 'tapMaster', name: 'Tap Master', description: "Your fingers are on fire! 1 million taps and counting.", xpReward: 10000, requirement: 1000000, type: 'tap' },
  { id: 'referralGuru', name: 'Referral Guru', description: "Your network is your net worth. 100 referrals reached!", xpReward: 5000, requirement: 100, type: 'referral' },
  { id: 'powerSurge', name: 'Power Surge', description: "Reached Computing Power Level 10. Your rig is unstoppable!", xpReward: 2000, requirement: 10, type: 'level' },
  { id: 'consistentMiner', name: 'Consistent Miner', description: "30-day login streak. Your dedication is admirable!", xpReward: 3000, requirement: 30, type: 'login' },
  { id: 'rigCustomizer', name: 'Rig Customizer', description: "Created a truly unique mining setup. It's a work of art!", xpReward: 1000, requirement: 1, type: 'customization' },
  { id: 'cryptoPioneer', name: 'Crypto Pioneer', description: "Successfully mined your first full coin. To the moon!", xpReward: 5000, requirement: 1, type: 'mining' },
  { id: 'legendaryTapper', name: 'Legendary Tapper', description: "Reached the #1 spot on the global leaderboard. You're a legend!", xpReward: 20000, requirement: 1, type: 'leaderboard' },
];

router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findOne({ telegramId: req.user.telegramId });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const userAchievements = user.achievements || [];
    const allAchievements = achievements.map(achievement => ({
      ...achievement,
      completed: userAchievements.some(ua => ua.id === achievement.id && ua.completed),
      progress: getAchievementProgress(user, achievement)
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

    const progress = getAchievementProgress(user, achievement);
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

function getAchievementProgress(user, achievement) {
  switch (achievement.type) {
    case 'tap':
      return user.totalTaps || 0;
    case 'social':
      return (user.twitterConnected ? 1 : 0) + (user.telegramConnected ? 1 : 0) + (user.discordConnected ? 1 : 0);
    case 'referral':
      return user.referrals ? user.referrals.length : 0;
    case 'level':
      return user.level || 0;
    case 'login':
      return user.loginStreak || 0;
    case 'customization':
      return user.hasCustomizedRig ? 1 : 0;
    case 'mining':
      return user.fullCoinsMined || 0;
    case 'leaderboard':
      return user.highestLeaderboardRank === 1 ? 1 : 0;
    default:
      return 0;
  }
}

module.exports = router;