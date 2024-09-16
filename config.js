require('dotenv').config();

module.exports = {
  env: process.env.NODE_ENV || 'production',
  port: process.env.PORT || 3000,
  mongoUri: process.env.MONGODB_URI || 'mongodb+srv://neohex:Gokzjiz30!@cluster0.ax82voh.mongodb.net/neurolov?retryWrites=true&w=majority&appName=Cluster0',
  jwtSecret: process.env.JWT_SECRET || '12345asdfghjkl09876123dsadfsdf',
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '7498025356:AAF50Vd2lYx3YqopGg_3VMM0kxg_x_Ptro0',
  corsOrigin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['https://neuro-orpin.vercel.app'],
  serverUrl: process.env.SERVER_URL || 'http://16.16.234.176', 
  webAppUrl: process.env.WEB_APP_URL || 'https://neuro-orpin.vercel.app',
};
