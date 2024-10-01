const mongoose = require('mongoose');

const referralSchema = new mongoose.Schema({
  referrer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  referred: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  code: { type: String, required: true, unique: true, index: true },
  tier: { type: Number, required: true, min: 1, max: 3 },
  dateReferred: { type: Date, default: Date.now },
  totalRewardsDistributed: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
});

referralSchema.index({ referrer: 1, dateReferred: -1 });

module.exports = mongoose.model('Referral', referralSchema);
