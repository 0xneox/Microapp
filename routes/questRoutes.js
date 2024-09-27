const express = require('express');
const router = express.Router();
const Quest = require('../models/Quest');
const TelegramQuest = require('../models/TelegramQuest');
const TwitterQuest = require('../models/TwitterQuest');
const User = require('../models/User');
const auth = require('../middleware/auth');
const isTeamMember = require('../middleware/isTeamMember');
const { verifyTwitterQuest, verifyTelegramQuest } = require('../utils/questVerification');
const { body, validationResult } = require('express-validator');

// Get all quests
router.get('/', auth, async (req, res) => {
  try {
    const completedQuests = req?.user?.completedQuests;
    console.log(completedQuests);
    // const quests = await Quest.find({ expiresAt: { $gt: new Date() } });
    // Aggregation for to find if completed
    const allQuests = await Quest.aggregate([
      {
        $addFields: {
          claimed: {
            $in: ['$_id', completedQuests] // Check if quest ID is in completedQuests
          }
        }
      }
    ]);
    res.json(allQuests);
  } catch (error) {
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

    let verified = false;
    // if (quest.type === 'twitter') {
    //   const twitterQuest = await TwitterQuest.findOne({ questId: quest._id });
    //   verified = await verifyTwitterQuest(quest.action, twitterQuest.targetId, user.twitterId);
    // }
    //  if (quest.type === 'telegram') {
    //   const telegramQuest = await TelegramQuest.findOne({ questId: quest._id });
    //   verified = await verifyTelegramQuest(quest.action, telegramQuest.targetId, user.telegramId);
    // } else
     if (['daily', 'weekly', 'discord', 'tap', 'level', 'twitter', 'leaderboard', 'telegram'].includes(quest.type)) {
      // Implement verification for other quest types
      verified = true; // Placeholder, implement actual verification logic
    }

    if (!verified) return res.status(400).json({ message: `${quest.type.charAt(0).toUpperCase() + quest.type.slice(1)} quest not completed` });

    user.xp += quest.xpReward;
    user.completedQuests.push(questId);
    await user.save();

    res.json({ message: 'Quest claimed successfully', xp: user.xp });
  } catch (error) {
    res.status(500).json({ message: 'Error claiming quest', error: error.message });
  }
});

// Create a new quest (team members only)
router.post('/', [auth, isTeamMember, [
  body('title').notEmpty(),
  body('description').notEmpty(),
  body('xpReward').isInt({ min: 1 }),
  body('type').isIn(['daily', 'weekly', 'twitter', 'telegram', 'discord', 'tap', 'level']),
  body('action').isIn(['follow', 'retweet', 'like', 'comment', 'join', 'tap', 'reach_level']),
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

    // Create platform-specific quest entries
    if (newQuest.type === 'twitter') {
      await new TwitterQuest({ questId: newQuest._id, targetId: req.body.targetId }).save();
    } else if (newQuest.type === 'telegram') {
      await new TelegramQuest({ questId: newQuest._id, targetId: req.body.targetId }).save();
    }

    res.status(201).json(newQuest);
  } catch (error) {
    res.status(500).json({ message: 'Error creating quest', error: error.message });
  }
});

// Update a quest (team members only)
router.put('/:questId', [auth, isTeamMember], async (req, res) => {
  try {
    const updatedQuest = await Quest.findByIdAndUpdate(req.params.questId, req.body, { new: true });
    if (!updatedQuest) return res.status(404).json({ message: 'Quest not found' });

    // Update platform-specific quest entries if necessary
    if (updatedQuest.type === 'twitter') {
      await TwitterQuest.findOneAndUpdate({ questId: updatedQuest._id }, { targetId: req.body.targetId });
    } else if (updatedQuest.type === 'telegram') {
      await TelegramQuest.findOneAndUpdate({ questId: updatedQuest._id }, { targetId: req.body.targetId });
    }

    res.json(updatedQuest);
  } catch (error) {
    res.status(500).json({ message: 'Error updating quest', error: error.message });
  }
});

// Delete a quest (team members only)
router.delete('/:questId', [auth, isTeamMember], async (req, res) => {
  try {
    const deletedQuest = await Quest.findByIdAndDelete(req.params.questId);
    if (!deletedQuest) return res.status(404).json({ message: 'Quest not found' });

    // Delete platform-specific quest entries
    await TwitterQuest.deleteOne({ questId: req.params.questId });
    await TelegramQuest.deleteOne({ questId: req.params.questId });

    res.json({ message: 'Quest deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting quest', error: error.message });
  }
});

module.exports = router;