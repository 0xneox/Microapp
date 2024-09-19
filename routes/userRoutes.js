const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const { validateUser, validateTelegramAuth } = require('../validation/userValidation');

// Public routes
router.post('/auth/telegram', validateTelegramAuth, userController.authenticateTelegram);

// Protected routes
router.get('/profile', auth, userController.getProfile);
router.put('/profile', auth, validateUser, userController.updateProfile);
router.post('/claim-daily-xp', auth, userController.claimDailyXP);
router.post('/tap', auth, userController.tap);
router.post('/boost', auth, userController.boost);
router.get('/cooldown-status', auth, userController.getCooldownStatus);
router.get('/daily-points', auth, userController.getDailyPoints);
router.post('/upgrade-gpu', auth, userController.upgradeGPU);

module.exports = router;