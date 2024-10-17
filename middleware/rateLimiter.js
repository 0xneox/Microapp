const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 600, // Increase limit to 300 requests per minute
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Create a separate, more lenient limiter for the tap endpoint
const tapLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 600, // Allow up to 600 taps per minute
  message: 'Tapping too fast, please slow down.',
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { limiter, tapLimiter };