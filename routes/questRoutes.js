const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const { param, validationResult } = require('express-validator');

const dailyQuests = [
  { id: 'tap100', name: 'Tap 100 times', xpReward: 50, requirement: 100 },
  { id: 'earnCompute', name: 'Earn 1000 compute', xpReward: 100, requirement: 1000 },
  // Add more daily quests here
];

router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findOne({ telegramId: req.user.telegramId });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const now = new Date();
    if (!user.dailyQuests || user.dailyQuests[0]?.date?.toDateString() !== now.toDateString()) {
      user.dailyQuests = dailyQuests.map(quest => ({
        ...quest,
        date: now,
        completed: false,
        progress: 0
      }));
      await user.save();
    }

    res.json(user.dailyQuests);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/claim/:questId', [
  auth,
  param('questId').isString().trim().notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { questId } = req.params;
    const user = await User.findOne({ telegramId: req.user.telegramId });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const questIndex = user.dailyQuests.findIndex(q => q.id === questId);
    if (questIndex === -1) return res.status(404).json({ message: 'Quest not found' });

    const quest = user.dailyQuests[questIndex];
    if (quest.completed) return res.status(400).json({ message: 'Quest already claimed' });

    if (quest.progress >= quest.requirement) {
      quest.completed = true;
      user.xp += quest.xpReward;
      user.markModified('dailyQuests');
      await user.save();
      res.json({ message: 'Quest claimed successfully', xp: user.xp });
    } else {
      res.status(400).json({ message: 'Quest requirements not met' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;