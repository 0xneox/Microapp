const express = require('express');
const router = express.Router();
const userRoutes = require('./userRoutes');
const questRoutes = require('./questRoutes');
const leaderboardRoutes = require('./leaderboardRoutes');
const profileDashboardRoutes = require('./profileDashboardRoutes');
const referralRoutes = require('./referralRoutes');
const settingsRoutes = require('./settingsRoutes');
const achievementRoutes = require('./achievementRoutes');

router.use('/users', userRoutes);
router.use('/quests', questRoutes);
router.use('/achievements', achievementRoutes);
router.use('/leaderboard', leaderboardRoutes);
router.use('/profile-dashboard', profileDashboardRoutes);
router.use('/referral', referralRoutes);
router.use('/settings', settingsRoutes);

module.exports = router;