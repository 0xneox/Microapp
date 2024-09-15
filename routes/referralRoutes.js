const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const { generateReferralCode, validateReferralCode } = require('../utils/referralUtils');
const { body, validationResult } = require('express-validator');

router.post('/generate-code', auth, async (req, res) => {
  try {
    const user = await User.findOne({ telegramId: req.user.telegramId });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (!user.referralCode) {
      user.referralCode = generateReferralCode();
      await user.save();
    }

    res.json({ referralCode: user.referralCode });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.post('/apply-code', [
  auth,
  body('referralCode').isString().trim().notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { referralCode } = req.body;
    if (!validateReferralCode(referralCode)) {
      return res.status(400).json({ message: 'Invalid referral code format' });
    }

    const referredUser = await User.findOne({ telegramId: req.user.telegramId });
    if (!referredUser) return res.status(404).json({ message: 'User not found' });
    if (referredUser.referredBy) return res.status(400).json({ message: 'You have already used a referral code' });

    const referrer = await User.findOne({ referralCode });
    if (!referrer) return res.status(400).json({ message: 'Invalid referral code' });
    if (referrer.telegramId === referredUser.telegramId) return res.status(400).json({ message: 'You cannot refer yourself' });

    referredUser.referredBy = referrer._id;
    referrer.referrals.push(referredUser._id);

    // Update referral chain (limit to 3 levels)
    const referralChain = [referrer._id, ...referrer.referralChain.slice(0, 2)];
    referredUser.referralChain = referralChain;

    // Distribute XP to referral chain
    const baseXP = 500;
    const xpPercentages = [0.1, 0.05, 0.025];
    for (let i = 0; i < referralChain.length; i++) {
      const chainUser = await User.findById(referralChain[i]);
      if (chainUser) {
        const xpReward = i === 0 ? baseXP : Math.floor(referredUser.xp * xpPercentages[i]);
        chainUser.xp += xpReward;
        await chainUser.save();
      }
    }

    await referredUser.save();
    await referrer.save();

    res.json({ message: 'Referral code applied successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/stats', auth, async (req, res) => {
  try {
    const user = await User.findOne({ telegramId: req.user.telegramId })
      .populate('referrals', 'username xp computePower');
    
    if (!user) return res.status(404).json({ message: 'User not found' });

    const stats = {
      totalReferrals: user.referrals.length,
      referralXP: user.referrals.reduce((total, referral) => total + referral.xp, 0),
      topReferrals: user.referrals
        .sort((a, b) => b.computePower - a.computePower)
        .slice(0, 5)
        .map(r => ({ username: r.username, computePower: r.computePower }))
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;