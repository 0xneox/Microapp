const express = require('express');
const router = express.Router();
const Quest = require('../models/Quest');
const User = require('../models/User');
const auth = require('../middleware/auth');
const isTeamMember = require('../middleware/isTeamMember');
const { body, validationResult } = require('express-validator');
const logger = require('../utils/logger');

// Get all quests
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findOne({ telegramId: req.user.telegramId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const completedQuests = user.completedQuests || [];

    const allQuests = await Quest.aggregate([
      {
        $match: { expiresAt: { $gt: new Date() } }
      },
      {
        $addFields: {
          claimed: {
            $in: ['$_id', completedQuests]
          }
        }
      }
    ]);

    res.json(allQuests);
  } catch (error) {
    logger.error('Error fetching quests:', error);
    res.status(500).json({ message: 'Error fetching quests', error: error.message });
  }
});

// Claim a quest
router.post('/claim/:questId', auth, async (req, res) => {
  try {
    const { questId } = req.params;
    const user = await User.findOne({ telegramId: req.user.telegramId });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const quest = await Quest.findById(questId);
    if (!quest) return res.status(404).json({ message: 'Quest not found' });

    if (user.completedQuests.includes(questId)) {
      return res.status(400).json({ message: 'Quest already claimed' });
    }

    // Verify quest completion logic here
    // This is a simplified version. In production, implement proper verification for each quest type
    let verified = await verifyQuestCompletion(user, quest);

    if (!verified) {
      return res.status(400).json({ message: 'Quest requirements not met' });
    }

    user.xp += quest.xpReward;
    user.completedQuests.push(questId);
    await user.save();

    logger.info(`User ${user.telegramId} claimed quest ${questId}`);
    res.json({ message: 'Quest claimed successfully', xp: user.xp });
  } catch (error) {
    logger.error('Error claiming quest:', error);
    res.status(500).json({ message: 'Error claiming quest', error: error.message });
  }
});

// Helper function to verify quest completion
async function verifyQuestCompletion(user, quest) {
  switch (quest.type) {
    case 'daily':
    case 'weekly':
      // Implement daily/weekly quest verification
      return true;
    case 'twitter':
    case 'telegram':
    case 'discord':
      // Implement social media quest verification
      return true;
    case 'tap':
      return user.totalTaps >= quest.requirement;
    case 'level':
      return user.level >= quest.requirement;
    default:
      return false;
  }
}

// Create a new quest (team members only)
router.post('/', [auth, isTeamMember, [
  body('title').notEmpty().trim(),
  body('description').notEmpty().trim(),
  body('xpReward').isInt({ min: 1 }),
  body('type').isIn(['daily', 'weekly', 'twitter', 'telegram', 'discord', 'tap', 'level', 'referral', 'achievement', 'leaderboard']),
  body('action').isIn(['follow', 'retweet', 'like', 'comment', 'join', 'tap', 'reach_level', 'refer', 'login', 'unlock_skin', 'rank']),
  body('platform').optional().isIn(['twitter', 'discord', 'telegram']),
  body('targetId').optional(),
  body('requirement').optional().isInt({ min: 1 }),
  body('expiresAt').isISO8601()
]], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const newQuest = new Quest(req.body);
    await newQuest.save();
    logger.info(`New quest created: ${newQuest._id}`);
    res.status(201).json(newQuest);
  } catch (error) {
    logger.error('Error creating quest:', error);
    res.status(500).json({ message: 'Error creating quest', error: error.message });
  }
});

// Update a quest (team members only)
router.put('/:questId', [auth, isTeamMember], async (req, res) => {
  try {
    const updatedQuest = await Quest.findByIdAndUpdate(req.params.questId, req.body, { new: true, runValidators: true });
    if (!updatedQuest) return res.status(404).json({ message: 'Quest not found' });

    logger.info(`Quest updated: ${updatedQuest._id}`);
    res.json(updatedQuest);
  } catch (error) {
    logger.error('Error updating quest:', error);
    res.status(500).json({ message: 'Error updating quest', error: error.message });
  }
});

// Delete a quest (team members only)
router.delete('/:questId', [auth, isTeamMember], async (req, res) => {
  try {
    const deletedQuest = await Quest.findByIdAndDelete(req.params.questId);
    if (!deletedQuest) return res.status(404).json({ message: 'Quest not found' });

    logger.info(`Quest deleted: ${deletedQuest._id}`);
    res.json({ message: 'Quest deleted successfully' });
  } catch (error) {
    logger.error('Error deleting quest:', error);
    res.status(500).json({ message: 'Error deleting quest', error: error.message });
  }
});

module.exports = router;