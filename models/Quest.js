const mongoose = require('mongoose');

const questSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  xpReward: { type: Number, required: true },
  type: { 
    type: String, 
    enum: ['daily', 'weekly', 'twitter', 'telegram', 'discord', 'referral', 'achievement', 'level', 'leaderboard'], 
    required: true 
  },
  action: {
    type: String,
    enum: ['follow', 'retweet', 'like', 'comment', 'join', 'tap', 'reach_level', 'refer', 'login', 'unlock_skin', 'rank'],
    required: true
  },
  platform: {
    type: String,
    enum: ['twitter', 'telegram', 'discord'],
    required: function() { return ['twitter', 'telegram', 'discord'].includes(this.type); }
  },
  targetId: { 
    type: String, 
    required: function() { return ['twitter', 'telegram', 'discord'].includes(this.type); }
  },
  requirement: { type: Number, default: 1 },
  expiresAt: { type: Date, required: true },
});

module.exports = mongoose.model('Quest', questSchema);