const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const config = require('../config');

const userSchema = new mongoose.Schema({
  telegramId: { type: String, required: true, unique: true, index: true },
  // twitterId: { type: String, unique: true, sparse: true },
  username: { type: String, required: true, index: true },
  firstName: { type: String },
  lastName: { type: String },
  languageCode: { type: String },
  photoUrl: { type: String },
  xp: { type: Number, default: 0, index: true },
  compute: { type: Number, default: 0, index: true },
  computePower: { type: Number, default: 1, index: true },
  level: { type: Number, default: 0 },
  gpuLevel: { type: Number, default: 1 },
  totalTaps: { type: Number, default: 0 },
  lastTapTime: { type: Date },
  cooldownEndTime: { type: Date },
  boostCount: { type: Number, default: 0 },
  lastBoostTime: { type: Date },
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  referrals: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  referralCode: { type: String, unique: true, sparse: true, index: true },
  referralChain: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  achievements: [{
    id: String,
    completed: Boolean,
    dateCompleted: Date
  }],
  dailyQuests: [{
    id: String,
    completed: Boolean,
    progress: Number,
    dateCompleted: Date
  }],
  lastDailyClaimDate: { type: Date },
  checkInStreak: { type: Number, default: 0 },
  completedQuests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Quest' }],
  checkInStreak: { type: Number, default: 0 },
 
  notifications: { type: Boolean, default: true },
  language: { type: String, default: 'en' },
  theme: { type: String, default: 'dark' },
  soundEnabled: { type: Boolean, default: true },
  vibrationEnabled: { type: Boolean, default: true },
  isTeamMember: { type: Boolean, default: false }

  
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

userSchema.methods.canClaimDailyXP = function() {
  if (!this.lastDailyClaimDate) {
    return true;
  }
  const now = new Date();
  const lastClaim = new Date(this.lastDailyClaimDate);
  return now.getDate() !== lastClaim.getDate() || now.getMonth() !== lastClaim.getMonth() || now.getFullYear() !== lastClaim.getFullYear();
};

userSchema.methods.generateAuthToken = function() {
  return jwt.sign({ id: this.telegramId }, config.jwtSecret, { expiresIn: '7d' });
};

userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  delete obj.__v;
  return obj;
};
userSchema.methods.shouldUpgradeGPU = function() {
  return this.xp >= this.gpuLevel * 25000;
};

userSchema.methods.upgradeGPU = function() {
  if (this.shouldUpgradeGPU()) {
    this.gpuLevel += 1;
    this.computePower += 1;
    return true;
  }
  return false;
};

module.exports = mongoose.model('User', userSchema);