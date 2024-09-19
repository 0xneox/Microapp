const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');
const config = require('../config');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) throw new Error('No token provided');

    const decoded = jwt.verify(token, config.jwtSecret);
    const user = await User.findOne({ telegramId: decoded.id });

    if (!user) throw new Error('User not found');

    req.token = token;
    req.user = user;
    next();
  } catch (error) {
    logger.error(`Authentication error: ${error.message}`);
    res.status(401).json({ error: 'Authentication failed', details: error.message });
  }
};

module.exports = auth;