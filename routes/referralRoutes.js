

const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const referralController = require('../controllers/referralController');
const logger = require('../utils/logger');

/**
 * @route POST /api/referral/generate-code
 * @desc Generate unique referral code for user
 * @access Private
 */
router.post('/generate-code', auth, async (req, res) => {
    try {
        await referralController.generateReferralCode(req, res);
    } catch (error) {
        logger.error('Route - Generate referral code error:', error);
        res.status(500).json({ 
            message: 'Failed to generate referral code',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @route POST /api/referral/apply-code
 * @desc Apply referral code and create referral chain
 * @access Private
 */
router.post('/apply-code', auth, async (req, res) => {
    try {
        await referralController.applyReferralCode(req, res);
    } catch (error) {
        logger.error('Route - Apply referral code error:', error);
        res.status(500).json({ 
            message: 'Failed to apply referral code',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @route GET /api/referral/stats
 * @desc Get user's referral statistics
 * @access Private
 */
router.get('/stats', auth, async (req, res) => {
    try {
        await referralController.getReferralStats(req, res);
    } catch (error) {
        logger.error('Route - Get referral stats error:', error);
        res.status(500).json({ 
            message: 'Failed to fetch referral statistics',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

/**
 * @route GET /api/referral/rewards/:userId
 * @desc Get specific user's referral rewards
 * @access Private
 */
router.get('/rewards/:userId', auth, async (req, res) => {
    try {
        const userId = req.params.userId;
        if (req.user.telegramId !== userId && !req.user.isTeamMember) {
            return res.status(403).json({ message: 'Not authorized to view these rewards' });
        }
        
        const rewards = await referralController.getUserReferralRewards(userId);
        res.json(rewards);
    } catch (error) {
        logger.error('Route - Get user rewards error:', error);
        res.status(500).json({ 
            message: 'Failed to fetch user rewards',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});



module.exports = router;
