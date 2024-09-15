const { body, validationResult } = require('express-validator');

exports.validateUser = [
  body('username').optional().isString().trim().isLength({ min: 3, max: 30 }),
  body('avatarUrl').optional().isURL(),
  body('language').optional().isIn(['en', 'ru']),
  body('theme').optional().isIn(['light', 'dark']),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

exports.validateTelegramAuth = [
  body('id').isString().notEmpty(),
  body('first_name').optional().isString(),
  body('username').optional().isString(),
  body('photo_url').optional().isURL(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];