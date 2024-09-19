require('dotenv').config();

module.exports = {
  env: process.env.NODE_ENV || 'production',
  port: process.env.PORT || 3000,
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN,
  corsOrigin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['https://neuro-orpin.vercel.app'],
  serverUrl: process.env.SERVER_URL,
  webAppUrl: process.env.WEB_APP_URL,
};