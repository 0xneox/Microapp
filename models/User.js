const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  telegramId: { type: String, required: true, unique: true, index: true },
  username: { type: String, required: true, index: true },
  xp: { type: Number, default: 0, index: true },
  compute: { type: Number, default: 0, index: true },
  computePower: { type: Number, default: 1, index: true },
  level: { type: Number, default: 0 },
  avatarUrl: { type: String },
  lastDailyClaimDate: { type: Date },
  totalTaps: { type: Number, default: 0 },
  lastTapTime: { type: Date, index: true },
  referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  referrals: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  referralCode: { type: String, unique: true, sparse: true, index: true },
  referralChain: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  achievements: [{
    id: String,
    completed: Boolean,
    progress: Number
  }],
  dailyQuests: [{
    id: String,
    completed: Boolean,
    progress: Number
  }],
  lastCheckIn: { type: Date },
  checkInStreak: { type: Number, default: 0 },
  cooldownEndTime: { type: Date },
  notifications: { type: Boolean, default: true },
  language: { type: String, default: 'en' },
  theme: { type: String, default: 'dark' }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

userSchema.index({ computePower: -1, compute: -1 });

userSchema.virtual('calculatedLevel').get(function() {
  return Math.floor(Math.sqrt(this.xp / 100)) + 1;
});

userSchema.methods.canClaimDailyXP = function() {
  if (!this.lastDailyClaimDate) return true;
  const now = new Date();
  const timeSinceLastClaim = now - this.lastDailyClaimDate;
  return timeSinceLastClaim >= 24 * 60 * 60 * 1000;
};

userSchema.methods.generateAuthToken = function() {
  return jwt.sign({ id: this.telegramId }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.referralChain;
  delete user.__v;
  return user;
};

module.exports = mongoose.model('User', userSchema);