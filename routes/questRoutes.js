const express = require('express');
const router = express.Router();
const Quest = require('../models/Quest');
const User = require('../models/User');
const auth = require('../middleware/auth');
const isTeamMember = require('../middleware/isTeamMember');
const { verifyTwitterQuest, verifyTelegramQuest } = require('../utils/questVerification');
const { body, validationResult } = require('express-validator');

// Get all quests
router.get('/', auth, async (req, res) => {
  try {
    const quests = await Quest.find({ expiresAt: { $gt: new Date() } });
    res.json(quests);
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

    if (quest.type === 'twitter') {
      const verified = await verifyTwitterQuest(quest.action, quest.targetId, user.twitterId);
      if (!verified) return res.status(400).json({ message: 'Twitter quest not completed' });
    } else if (quest.type === 'telegram') {
      const verified = await verifyTelegramQuest(quest.action, quest.targetId, user.telegramId);
      if (!verified) return res.status(400).json({ message: 'Telegram quest not completed' });
    }

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
  body('type').isIn(['daily', 'weekly', 'twitter', 'telegram']),
  body('action').isIn(['follow', 'retweet', 'like', 'join']),
  body('targetId').notEmpty(),
  body('expiresAt').isISO8601()
]], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const newQuest = new Quest(req.body);
    await newQuest.save();
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
    res.json({ message: 'Quest deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting quest', error: error.message });
  }
});

module.exports = router;