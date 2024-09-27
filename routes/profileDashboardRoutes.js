const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Quest = require('../models/Quest');
const auth = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findOne({ telegramId: req.user.telegramId })
      .populate('referredBy', 'username')
      .populate('referrals', 'username');

    const activeQuests = await Quest.find({ expiresAt: { $gt: new Date() } });

    const dashboardData = {
      user: {
        username: user.username,
        xp: user.xp,
        compute: user.compute,
        computePower: user.computePower,
        totalTaps: user.totalTaps,
        referredBy: user.referredBy ? user.referredBy.username : null,
        referrals: user.referrals.map(r => r.username),
        lastDailyClaimDate: user.lastDailyClaimDate,
        id: user.telegramId
      },
      quests: activeQuests,
      cooldownStatus: user.cooldownEndTime > Date.now() ? {
        cooling: true,
        remainingTime: Math.ceil((user.cooldownEndTime - Date.now()) / 1000)
      } : { cooling: false },
    };

    res.json(dashboardData);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/update', [
  auth,
  body('username').optional().isString().trim().isLength({ min: 3, max: 30 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { username } = req.body;
    const user = await User.findOneAndUpdate(
      { telegramId: req.user.telegramId },
      { $set: { username } },
      { new: true, runValidators: true }
    );

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({ message: 'Profile updated successfully', user: { username: user.username } });
  } catch (error) {
    res.status(400).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;