const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const { validateUser, validateTelegramAuth } = require('../validation/userValidation');

router.post('/auth/telegram', validateTelegramAuth, userController.authenticateTelegram);
router.get('/profile', auth, userController.getProfile);
router.put('/profile', auth, validateUser, userController.updateProfile);
router.post('/claim-daily-xp', auth, userController.claimDailyXP);
router.post('/tap', auth, userController.tap);

module.exports = router;