const { body, validationResult } = require('express-validator');

exports.validateUser = [

  body('username').optional().isString().trim().isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters'),
  body('avatarUrl').optional().isURL().withMessage('Invalid avatar URL'),
  body('language').optional().isIn(['en', 'ru']).withMessage('Invalid language selection'),
  body('theme').optional().isIn(['light', 'dark']).withMessage('Invalid theme selection'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

exports.validateTelegramAuth = [
  body('initData')
    .notEmpty().withMessage('Telegram init data is required')
    .custom((value) => {
      try {
        const params = new URLSearchParams(value);
        const user = JSON.parse(decodeURIComponent(params.get('user')));
        const authDate = params.get('auth_date');
        const hash = params.get('hash');

        if (!user.id || !authDate || !hash) {
          throw new Error('Invalid Telegram init data format');
        }

        return true;
      } catch (error) {
        throw new Error('Invalid Telegram init data');
      }
    }),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];