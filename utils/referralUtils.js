const crypto = require('crypto');

// Generate a unique referral code
const generateReferralCode = () => {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
};

// Validate a referral code
const validateReferralCode = (code) => {
  return typeof code === 'string' && code.length === 8 && /^[0-9A-F]{8}$/i.test(code);
};

module.exports = {
  generateReferralCode,
  validateReferralCode
};

