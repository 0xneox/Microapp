const TelegramBot = require('node-telegram-bot-api');
const logger = require('./logger');
const config = require('../config');
const User = require('../models/User');

const initTelegramBot = () => {
  return new Promise((resolve, reject) => {
    try {
      const bot = new TelegramBot(config.telegramBotToken, { polling: true });

      logger.info('Telegram bot initialized with long polling');

      // Shortened welcome message
      const welcomeMessage = `Welcome to Neurolov Compute Bot! 🚀🧠

Contribute to AI and blockchain projects while earning rewards:

🖥️ Tap to Compute
📈 Upgrade GPU
🏆 Complete Quests
🌟 Climb Leaderboard
👥 Invite Friends
⚙️ Customize Settings

Start now and revolutionize distributed computing with Neurolov! 💻💡`;

      // Bot commands
      const commands = [
        { command: 'start', description: 'Start the bot and open Web App' },
        { command: 'help', description: 'Show help message' },
        { command: 'stats', description: 'View your current stats' },
        { command: 'compute', description: 'Start computing' },
        { command: 'upgrade', description: 'Upgrade your GPU' },
        { command: 'quests', description: 'View available quests' },
        { command: 'leaderboard', description: 'Check the leaderboard' },
        { command: 'invite', description: 'Get your referral link' },
        { command: 'settings', description: 'Adjust your settings' }
      ];

      bot.setMyCommands(commands);

      bot.onText(/\/start/, async (msg) => {
        const chatId = msg.chat.id;
        const userId = msg.from.id.toString();
      
        try {
          logger.info(`Start command received from user: ${userId}`);
          let user = await User.findOne({ telegramId: userId });
          if (!user) {
            user = new User({
              telegramId: userId,
              username: msg.from.username || `user${userId}`,
            });
            await user.save();
            logger.info(`New user created: ${user.username}`);
          }
      
          const token = user.generateAuthToken();
      
          if (!user.hasSeenWelcomeMessage) {
            await bot.sendPhoto(chatId, 'https://i.ibb.co/PYWbpxz/photo-2024-10-11-16-18-3.jpg', { caption: 'Welcome to Neurolov Compute Bot!' });
            await bot.sendMessage(chatId, welcomeMessage);
            user.hasSeenWelcomeMessage = true;
            await user.save();
          }
      
          const webAppUrl = `${config.webAppUrl}?token=${token}`;
      
          await bot.sendMessage(chatId, 'Start Computing Now:', {
            reply_markup: {
              inline_keyboard: [
                [{ text: 'Earn Now', web_app: { url: webAppUrl } }]
              ]
            }
          });
        } catch (error) {
          logger.error(`Error in /start command for user ${userId}:`, error);
          bot.sendMessage(chatId, 'An error occurred. Please try again later.');
        }
      });

      bot.onText(/\/help/, (msg) => {
        const chatId = msg.chat.id;
        const helpMessage = commands.map(cmd => `/${cmd.command} - ${cmd.description}`).join('\n');
        bot.sendMessage(chatId, `Available commands:\n\n${helpMessage}`);
      });

      bot.onText(/\/stats/, async (msg) => {
        const chatId = msg.chat.id;
        const userId = msg.from.id.toString();

        try {
          const user = await User.findOne({ telegramId: userId });
          if (user) {
            const stats = `Your current stats:
🔢 XP: ${user.xp}
💻 Compute: ${user.compute}
⚡ Compute Power: ${user.computePower}
🔝 Level: ${user.level}
👥 Referrals: ${user.referrals.length}`;
            bot.sendMessage(chatId, stats);
          } else {
            bot.sendMessage(chatId, 'User not found. Please use /start to set up your account.');
          }
        } catch (error) {
          logger.error('Error in /stats command:', error);
          bot.sendMessage(chatId, 'An error occurred while fetching your stats. Please try again later.');
        }
      });

      // Add handlers for other commands
      bot.onText(/\/compute/, (msg) => {
        bot.sendMessage(msg.chat.id, "Open the Web App to start computing!");
      });

      bot.onText(/\/upgrade/, (msg) => {
        bot.sendMessage(msg.chat.id, "Upgrade your GPU in the Web App to increase your compute power!");
      });

      bot.onText(/\/quests/, (msg) => {
        bot.sendMessage(msg.chat.id, "Check available quests in the Web App to earn more rewards!");
      });

      bot.onText(/\/leaderboard/, (msg) => {
        bot.sendMessage(msg.chat.id, "View the leaderboard in the Web App to see your ranking!");
      });

      bot.onText(/\/invite/, (msg) => {
        bot.sendMessage(msg.chat.id, "Get your referral link from the Web App to invite friends and earn bonuses!");
      });

      bot.onText(/\/settings/, (msg) => {
        bot.sendMessage(msg.chat.id, "Adjust your settings in the Web App for a personalized experience!");
      });

      bot.on('error', (error) => {
        logger.error('Telegram bot error:', error);
      });

      resolve(bot);
    } catch (error) {
      logger.error('Failed to initialize Telegram bot:', error);
      reject(error);
    }
  });
};

module.exports = { initTelegramBot };