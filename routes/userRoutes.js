
const userController = require('../controllers/userController');
const { validateUser, validateTelegramAuth } = require('../validation/userValidation');
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// Public routes
router.post('/auth/telegram', userController.authenticateTelegram);

// Protected routes
router.get('/profile', auth, userController.getProfile);
router.put('/profile', auth, userController.updateProfile);
router.post('/claim-daily-xp', auth, userController.claimDailyXP);
router.post('/tap', auth, userController.tap);
router.post('/boost', auth, userController.boost);
router.get('/cooldown-status', auth, userController.getCooldownStatus);
router.get('/daily-points', auth, userController.getDailyPoints);
router.post('/upgrade-gpu', auth, userController.upgradeGPU);

// Add this new route for getting user stats
router.get('/stats', auth, userController.getUserStats);

module.exports = router;
