const mongoose = require('mongoose');

const referralSchema = new mongoose.Schema({
  referrer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  referred: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  code: { type: String, required: true, unique: true, index: true },
  dateReferred: { type: Date, default: Date.now },
  rewardsDistributed: { type: Boolean, default: false },
});

referralSchema.index({ referrer: 1, dateReferred: -1 });

module.exports = mongoose.model('Referral', referralSchema);
