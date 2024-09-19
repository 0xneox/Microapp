const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { 
    type: String, 
    required: true, 
    enum: ['tap', 'quest_complete', 'referral', 'gpu_upgrade', 'boost_used', 'achievement_unlocked', 'daily_claim'],
    index: true
  },
  timestamp: { type: Date, default: Date.now, index: true },
  details: { type: mongoose.Schema.Types.Mixed },
});

// Compound index for querying user activities efficiently
activitySchema.index({ user: 1, type: 1, timestamp: -1 });

module.exports = mongoose.model('Activity', activitySchema);