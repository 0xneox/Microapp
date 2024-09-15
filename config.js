require('dotenv').config();

module.exports = {
  env: process.env.NODE_ENV || 'production',
  port: process.env.PORT || 3000,
  mongoUri: process.env.MONGODB_URI || 'mongodb+srv://neohex:Gokzjiz30!@cluster0.ax82voh.mongodb.net/neurolov?retryWrites=true&w=majority&appName=Cluster0',
  jwtSecret: process.env.JWT_SECRET || '12345asdfghjkl09876123dsadfsdf',
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '7220785507:AAHZxPT0YbdobIzWu-Ikmm46kbhIKSXIcss',
  corsOrigin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://neurolovui.s3-website.eu-north-1.amazonaws.com',],
  serverUrl: process.env.SERVER_URL || 'http://13.51.161.67',
  webAppUrl: process.env.WEB_APP_URL || 'http://neurolovui.s3-website.eu-north-1.amazonaws.com',
};