const twitterClient = require('./twitterClient');
const TelegramBot = require('node-telegram-bot-api');
const config = require('../config');

const bot = new TelegramBot(config.telegramBotToken, { polling: false });

const verifyTwitterQuest = async (questType, targetId, userId) => {
  try {
    const user = await twitterClient.v2.user(userId);
    switch (questType) {
      case 'follow':
        const following = await twitterClient.v2.friendship({ source_id: userId, target_id: targetId });
        return following.data.following;
      case 'retweet':
        const retweets = await twitterClient.v2.userRetweets(userId, { max_results: 100 });
        return retweets.data.some(tweet => tweet.id === targetId);
      case 'like':
        const likes = await twitterClient.v2.userLikedTweets(userId, { max_results: 100 });
        return likes.data.some(tweet => tweet.id === targetId);
      default:
        return false;
    }
  } catch (error) {
    console.error('Error verifying Twitter quest:', error);
    return false;
  }
};

const verifyTelegramQuest = async (questType, targetId, userId) => {
  try {
    switch (questType) {
      case 'join':
        const chatMember = await bot.getChatMember(targetId, userId);
        return ['member', 'administrator', 'creator'].includes(chatMember.status);
      default:
        return false;
    }
  } catch (error) {
    console.error('Error verifying Telegram quest:', error);
    return false;
  }
};

module.exports = {
  verifyTwitterQuest,
  verifyTelegramQuest
};