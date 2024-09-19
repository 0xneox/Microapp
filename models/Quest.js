const mongoose = require('mongoose');

const questSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  xpReward: { type: Number, required: true },
  type: { 
    type: String, 
    enum: ['daily', 'weekly', 'twitter', 'discord', 'telegram', 'tap', 'level'], 
    required: true 
  },
  platform: {
    type: String,
    enum: ['twitter', 'discord', 'telegram'],
    required: function() { return ['twitter', 'discord', 'telegram'].includes(this.type); }
  },
  action: {
    type: String,
    enum: ['follow', 'retweet', 'like', 'comment', 'join', 'tap', 'reach_level'],
    required: true
  },
  targetId: { 
    type: String, 
    required: function() { return ['twitter', 'discord', 'telegram'].includes(this.type); }
  },
  requirement: { type: Number, default: 1 },
  expiresAt: { type: Date, required: true },
});

module.exports = mongoose.model('Quest', questSchema);