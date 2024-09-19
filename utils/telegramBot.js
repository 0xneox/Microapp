const TelegramBot = require('node-telegram-bot-api');
const logger = require('./logger');
const config = require('../config');
const User = require('../models/User');

const initTelegramBot = () => {
  return new Promise((resolve, reject) => {
    try {
      const bot = new TelegramBot(config.telegramBotToken, { polling: true });

      logger.info('Telegram bot initialized with long polling');

      // Welcome message
      const welcomeMessage = `Welcome to Neurolov Compute Bot! 🚀🧠

Step into the future of decentralized computing with Neurolov, where your idle processing power becomes a valuable asset. Our innovative platform allows you to contribute to cutting-edge AI and blockchain projects while earning rewards.

In this micro-app, you can:

🖥️ Tap to Compute: Activate your virtual GPU and start generating compute power with just a tap!
📈 Upgrade Your GPU: Enhance your computing capabilities and earn more rewards.
🏆 Complete Quests: Take on daily and weekly challenges to boost your XP and unlock achievements.
🌟 Climb the Leaderboard: Compete with users worldwide and showcase your computing prowess.
👥 Invite Friends: Grow the Neurolov community and earn referral bonuses.
⚙️ Customize Settings: Tailor your experience with personalized notifications and themes.

As you progress, you'll unlock new levels, increase your compute power, and earn more XP. Your contributions help power the next generation of decentralized applications and AI research.

Join us in revolutionizing the world of distributed computing. Let's compute, earn, and innovate together with Neurolov! 💻💡

Get started now and watch your virtual GPU come to life! 🚀`;

      // Bot commands
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
            // Send the welcome image
            await bot.sendPhoto(chatId, 'https://bayanbox.ir/view/4187791167840408524/Telegram-Banner.jpg', { caption: 'Welcome to Neurolov Compute Bot!' });
            
            // Send the welcome message
            await bot.sendMessage(chatId, welcomeMessage);
            
            // Update user's hasSeenWelcomeMessage flag
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
        bot.sendMessage(chatId, 'This bot allows you to access Neurolov Compute Bot. Use these commands:\n\n/start - Open the Web App\n/stats - View your current stats\n/help - Show this help message');
      });

      bot.onText(/\/stats/, async (msg) => {
        const chatId = msg.chat.id;
        const userId = msg.from.id.toString(); // Ensure userId is a string

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