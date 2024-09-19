const User = require('../models/User');

const isTeamMember = async (req, res, next) => {
  try {
    const user = await User.findOne({ telegramId: req.user.telegramId });
    if (user && user.isTeamMember) {
      next();
    } else {
      res.status(403).json({ message: 'Access denied. Team members only.' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error checking team membership', error: error.message });
  }
};

module.exports = isTeamMember;