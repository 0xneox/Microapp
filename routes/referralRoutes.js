const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Referral = require('../models/Referral');
const auth = require('../middleware/auth');
const { generateReferralCode, validateReferralCode } = require('../utils/referralUtils');
const logger = require('../utils/logger');

// Generate referral code
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
    logger.error('Error generating referral code:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Apply referral code
router.post('/apply-code', auth, async (req, res) => {
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

    // Create a new Referral document
    const newReferral = new Referral({
      referrer: referrer._id,
      referred: referredUser._id,
      code: referralCode,
      tier: 1, // First-level referral
    });

    await Promise.all([referredUser.save(), referrer.save(), newReferral.save()]);
    await referredUser.updateReferralChain();

    res.json({ message: 'Referral code applied successfully' });
  } catch (error) {
    logger.error('Error applying referral code:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get referral stats
router.get('/stats', auth, async (req, res) => {
  try {
    const user = await User.findOne({ telegramId: req.user.telegramId }).populate('referrals');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const referrals = await Referral.find({ referrer: user._id });

    const stats = {
      totalReferrals: user.referrals.length,
      totalReferralXP: user.totalReferralXP,
      referralCode: user.referralCode,
      referralStats: referrals.map(r => ({
        username: r.referred.username,
        date: r.dateReferred,
        tier: r.tier,
        rewardsDistributed: r.totalRewardsDistributed
      }))
    };

    res.json(stats);
  } catch (error) {
    logger.error('Error fetching referral stats:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
