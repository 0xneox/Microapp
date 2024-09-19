const crypto = require('crypto');

const generateReferralCode = () => {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
};

const validateReferralCode = (code) => {
  return typeof code === 'string' && code.length === 8 && /^[0-9A-F]{8}$/i.test(code);
};

const calculateReferralReward = (level, xp) => {
  const percentages = [0.1, 0.05, 0.025];
  return Math.floor(xp * (percentages[level - 1] || 0));
};

module.exports = {
  generateReferralCode,
  validateReferralCode,
  calculateReferralReward
};