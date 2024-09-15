const TelegramBot = require('node-telegram-bot-api');
const logger = require('./logger');

const initTelegramBot = () => {
  const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);

  // Set webhook for Telegram bot
  const webhookUrl = `${process.env.SERVER_URL}/bot${process.env.TELEGRAM_BOT_TOKEN}`;
  bot.setWebHook(webhookUrl)
    .then(() => logger.info(`Webhook set to ${webhookUrl}`))
    .catch((error) => logger.error('Failed to set webhook:', error));

  // Bot commands
  bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Welcome to our Web App!', {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Open Web App', web_app: { url: process.env.WEB_APP_URL } }]
        ]
      }
    });
  });

  bot.onText(/\/help/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'This bot allows you to access our Web App. Use the /start command to get started.');
  });

  return bot;
};

module.exports = { initTelegramBot };