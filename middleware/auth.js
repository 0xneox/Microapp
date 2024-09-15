const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) throw new Error('No token provided');

    const decoded = jwt.verify(token, config.jwtSecret);
    const user = await User.findOne({ telegramId: decoded.id }).select('-__v -password');

    if (!user) throw new Error('User not found');

    req.token = token;
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed', details: error.message });
  }
};

module.exports = auth;