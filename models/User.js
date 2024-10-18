const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const config = require('../config');

const userSchema = new mongoose.Schema({
  telegramId: { type: String, required: true, unique: true, index: true },
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
  lastTapTime: { type: Date, index: true  },
  cooldownEndTime: { type: Date, index: true },
  boostCount: { type: Number, default: 0 },
  lastBoostTime: { type: Date },
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  referrals: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  referralCode: { type: String, unique: true, sparse: true, index: true },
  referralChain: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  totalReferralXP: { type: Number, default: 0 },
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
  notifications: { type: Boolean, default: true },
  language: { type: String, default: 'en' },
  theme: { type: String, default: 'dark' },
  soundEnabled: { type: Boolean, default: true },
  vibrationEnabled: { type: Boolean, default: true },
  isTeamMember: { type: Boolean, default: false },
  
  // achievement tracking
  twitterConnected: { type: Boolean, default: false },
  telegramConnected: { type: Boolean, default: true }, // Assumed true since they're using Telegram
  discordConnected: { type: Boolean, default: false },
  loginStreak: { type: Number, default: 0 },
  hasCustomizedRig: { type: Boolean, default: false },
  fullCoinsMined: { type: Number, default: 0 },
  highestLeaderboardRank: { type: Number, default: Infinity },
  leaderboardHistory: [{ 
    rank: Number, 
    date: Date 
  }]
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Add compound index for efficient querying
userSchema.index({ telegramId: 1, lastTapTime: -1 });

// Optimize the tap method
userSchema.methods.tap = async function() {
  const now = new Date();
  if (this.cooldownEndTime && now < this.cooldownEndTime) {
    return { success: false, message: 'Cooling down' };
  }

  this.totalTaps += 1;
  const xpGained = this.computePower;
  this.xp += xpGained;
  this.compute += xpGained;
  this.lastTapTime = now;

  if (this.totalTaps % 500 === 0) {
    this.cooldownEndTime = new Date(now.getTime() + 10 * 1000);
  }

  await this.save();

  return { success: true, xpGained, newTotalXp: this.xp };
};

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

// update login streak
userSchema.methods.updateLoginStreak = function() {
  const now = new Date();
  const yesterday = new Date(now.getTime() - (24 * 60 * 60 * 1000));
  
  if (this.lastDailyClaimDate && this.lastDailyClaimDate >= yesterday) {
    this.loginStreak += 1;
  } else {
    this.loginStreak = 1;
  }
  
  this.lastDailyClaimDate = now;
  this.checkInStreak = Math.max(this.checkInStreak, this.loginStreak);
};

// update leaderboard rank
userSchema.methods.updateLeaderboardRank = function(newRank) {
  this.highestLeaderboardRank = Math.min(this.highestLeaderboardRank, newRank);
  if (!this.leaderboardHistory) this.leaderboardHistory = [];
  this.leaderboardHistory.push({ rank: newRank, date: new Date() });
  if (this.leaderboardHistory.length > 10) this.leaderboardHistory.shift(); // Keep only last 10 entries
};

userSchema.methods.addReferral = function(referredUserId) {
  if (!this.referrals.includes(referredUserId)) {
    this.referrals.push(referredUserId);
  }
};

userSchema.methods.updateReferralChain = async function() {
  if (!this.referredBy) return;

  const referralChain = [];
  let currentReferrer = await this.model('User').findById(this.referredBy);
  
  while (currentReferrer && referralChain.length < 3) {
    referralChain.push(currentReferrer._id);
    currentReferrer = await this.model('User').findById(currentReferrer.referredBy);
  }

  this.referralChain = referralChain;
};

userSchema.pre('save', async function(next) {
  if (this.isModified('referredBy')) {
    await this.updateReferralChain();
  }
  next();
});

module.exports = mongoose.model('User', userSchema);
