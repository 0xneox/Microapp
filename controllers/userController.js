const User = require('../models/User');
const { handleServerError } = require('../middleware/errorHandler');

exports.authenticateTelegram = async (req, res) => {
  try {
    const { id, first_name, username, photo_url } = req.body;
    
    let user = await User.findOneAndUpdate(
      { telegramId: id },
      { 
        $set: { 
          username: username || first_name,
          avatarUrl: photo_url
        },
        $setOnInsert: { telegramId: id }
      },
      { new: true, upsert: true }
    );

    const token = user.generateAuthToken();

    res.json({ token, user: user.toJSON() });
  } catch (error) {
    handleServerError(res, error);
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    handleServerError(res, error);
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const updates = Object.keys(req.body);
    const allowedUpdates = ['username', 'avatarUrl', 'language', 'theme'];
    const isValidOperation = updates.every(update => allowedUpdates.includes(update));

    if (!isValidOperation) {
      return res.status(400).json({ error: 'Invalid updates!' });
    }

    updates.forEach(update => req.user[update] = req.body[update]);
    await req.user.save();

    res.json(req.user);
  } catch (error) {
    handleServerError(res, error);
  }
};

exports.claimDailyXP = async (req, res) => {
  try {
    if (req.user.canClaimDailyXP()) {
      const xpGained = 500;
      req.user.xp += xpGained;
      req.user.lastDailyClaimDate = new Date();
      req.user.checkInStreak += 1;
      await req.user.save();
      res.json({ message: 'Daily XP claimed successfully', xpGained, newTotalXp: req.user.xp });
    } else {
      res.status(400).json({ message: 'Daily XP already claimed' });
    }
  } catch (error) {
    handleServerError(res, error);
  }
};

exports.tap = async (req, res) => {
  try {
    const now = new Date();
    if (req.user.cooldownEndTime && now < req.user.cooldownEndTime) {
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
    }

    await req.user.save();

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
    handleServerError(res, error);
  }
};