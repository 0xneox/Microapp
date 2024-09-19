const User = require('../models/User');
const { verifyTelegramWebAppData } = require('../utils/telegramUtils');
const logger = require('../utils/logger');

exports.authenticateTelegram = async (req, res) => {
  try {
    logger.info('Received authentication request');
    const { initData } = req.body;
    logger.debug('InitData:', initData);
    
    if (!initData) {
      logger.error('No initData provided');
      return res.status(400).json({ message: 'No Telegram data provided' });
    }

    if (!verifyTelegramWebAppData(initData)) {
      logger.error('Invalid Telegram data');
      return res.status(401).json({ message: 'Invalid Telegram data' });
    }

    const params = new URLSearchParams(initData);
    const userString = params.get('user');
    if (!userString) {
      logger.error('No user data found in initData');
      return res.status(400).json({ message: 'No user data found' });
    }

    const userData = JSON.parse(decodeURIComponent(userString));
    logger.debug('Parsed user data:', userData);

    let user = await User.findOneAndUpdate(
      { telegramId: userData.id },
      { 
        $set: { 
          username: userData.username,
          firstName: userData.first_name,
          lastName: userData.last_name,
          languageCode: userData.language_code,
          photoUrl: userData.photo_url
        },
        $setOnInsert: { telegramId: userData.id }
      },
      { new: true, upsert: true }
    );

    const token = user.generateAuthToken();

    logger.info(`User authenticated successfully: ${user.telegramId}`);
    res.json({
      token,
      user: {
        id: user.telegramId,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        languageCode: user.languageCode,
        photoUrl: user.photoUrl,
        xp: user.xp
      }
    });
  } catch (error) {
    logger.error('Authentication error:', error);
    res.status(500).json({ error: 'Authentication failed', details: error.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findOne({ telegramId: req.user.telegramId });
    if (!user) {
      logger.warn(`User not found: ${req.user.telegramId}`);
      return res.status(404).json({ message: 'User not found' });
    }
    logger.info(`Profile retrieved for user: ${user.telegramId}`);
    res.json(user);
  } catch (error) {
    logger.error(`Get profile error: ${error.message}`);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['username', 'avatarUrl', 'language', 'theme'];
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));

    if (!isValidOperation) {
      logger.warn(`Invalid update attempt: ${req.user.telegramId}`);
      return res.status(400).json({ error: 'Invalid updates!' });
    }

    updates.forEach(update => req.user[update] = req.body[update]);
    await req.user.save();

    logger.info(`Profile updated: ${req.user.telegramId}`);
    res.json(req.user);
  } catch (error) {
    logger.error(`Update profile error: ${error.message}`);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.claimDailyXP = async (req, res) => {
  try {
    const user = await User.findOne({ telegramId: req.user.telegramId });
    if (!user) {
      logger.warn(`User not found for daily XP claim: ${req.user.telegramId}`);
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.canClaimDailyXP()) {
      const xpGained = 500;
      user.xp += xpGained;
      user.lastDailyClaimDate = new Date();
      user.checkInStreak += 1;
      await user.save();
      logger.info(`Daily XP claimed: ${user.telegramId}, XP gained: ${xpGained}`);
      res.json({ message: 'Daily XP claimed successfully', xpGained, newTotalXp: user.xp });
    } else {
      logger.warn(`Attempted to claim XP too soon: ${user.telegramId}`);
      res.status(400).json({ message: 'Daily XP already claimed' });
    }
  } catch (error) {
    logger.error(`Claim daily XP error: ${error.message}`);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.tap = async (req, res) => {
  try {
    const now = new Date();
    if (req.user.cooldownEndTime && now < req.user.cooldownEndTime) {
      logger.info(`Tap rejected due to cooldown: ${req.user.telegramId}`);
      return res.status(400).json({ 
        message: 'GPU is cooling down', 
        cooldownEndTime: req.user.cooldownEndTime
      });
    }

    req.user.totalTaps += 1;
    req.user.compute += req.user.computePower;
    req.user.lastTapTime = now;

    if (req.user.totalTaps % 1000 === 0) {
      req.user.cooldownEndTime = new Date(now.getTime() + 5 * 60 * 1000);
      logger.info(`Cooldown initiated for user: ${req.user.telegramId}`);
    }

    await req.user.save();

    logger.info(`Successful tap: ${req.user.telegramId}`);
    res.json({ 
      message: 'Tap successful', 
      user: {
        compute: req.user.compute,
        totalTaps: req.user.totalTaps,
        computePower: req.user.computePower,
        cooldownEndTime: req.user.cooldownEndTime
      }
    });
  } catch (error) {
    logger.error(`Tap error: ${error.message}`);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getCooldownStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      logger.warn(`User not found for cooldown status: ${req.user._id}`);
      return res.status(404).json({ message: 'User not found' });
    }
    logger.info(`Cooldown status retrieved for user: ${user.telegramId}`);
    res.json({
      cooldownEndTime: user.cooldownEndTime,
      isCoolingDown: user.cooldownEndTime > Date.now()
    });
  } catch (error) {
    logger.error(`Get cooldown status error: ${error.message}`);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getDailyPoints = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      logger.warn(`User not found for daily points: ${req.user._id}`);
      return res.status(404).json({ message: 'User not found' });
    }
    logger.info(`Daily points retrieved for user: ${user.telegramId}`);
    res.json({ dailyPoints: user.dailyPoints });
  } catch (error) {
    logger.error(`Get daily points error: ${error.message}`);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.upgradeGPU = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      logger.warn(`User not found for GPU upgrade: ${req.user._id}`);
      return res.status(404).json({ message: 'User not found' });
    }

    // Implement GPU upgrade logic here
    // This is a placeholder implementation
    user.computePower += 1;
    await user.save();

    logger.info(`GPU upgraded for user: ${user.telegramId}, New compute power: ${user.computePower}`);
    res.json({ message: 'GPU upgraded successfully', newComputePower: user.computePower });
  } catch (error) {
    logger.error(`Upgrade GPU error: ${error.message}`);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
