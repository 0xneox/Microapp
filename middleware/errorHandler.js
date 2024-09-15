const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  logger.error(`${err.name}: ${err.message}\nStack: ${err.stack}`);

  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: 'Validation Error', details: err.errors });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (err.name === 'ForbiddenError') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (err.name === 'NotFoundError') {
    return res.status(404).json({ error: 'Not Found' });
  }

  // Default to 500 server error
  res.status(500).json({ error: 'Internal Server Error' });
};

module.exports = errorHandler;