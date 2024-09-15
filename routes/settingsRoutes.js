const express = require('express');
const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findOne({ telegramId: req.user.telegramId });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const settings = {
      notifications: user.notifications,
      language: user.language,
      theme: user.theme,
      soundEnabled: user.soundEnabled,
      vibrationEnabled: user.vibrationEnabled
    };

    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/', [
  auth,
  body('notifications').optional().isBoolean(),
  body('language').optional().isIn(['en', 'ru']),
  body('theme').optional().isIn(['light', 'dark']),
  body('soundEnabled').optional().isBoolean(),
  body('vibrationEnabled').optional().isBoolean()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { notifications, language, theme, soundEnabled, vibrationEnabled } = req.body;
    const user = await User.findOneAndUpdate(
      { telegramId: req.user.telegramId },
      { $set: { notifications, language, theme, soundEnabled, vibrationEnabled } },
      { new: true, runValidators: true }
    );

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({
      message: 'Settings updated successfully',
      settings: {
        notifications: user.notifications,
        language: user.language,
        theme: user.theme,
        soundEnabled: user.soundEnabled,
        vibrationEnabled: user.vibrationEnabled
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;