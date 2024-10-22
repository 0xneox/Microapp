const twitterClient = require("./twitterClient");
const TelegramBot = require("node-telegram-bot-api");
const config = require("../config");

const bot = new TelegramBot("7498025356:AAHRulCA9f5wWc3Kcw2aGEm9Tl6iy6tTEtw", {
  polling: false,
});

const verifyTwitterQuest = async (questType, targetId, userId) => {
  try {
    const user = await twitterClient.v2.user(userId);
    switch (questType) {
      case "follow":
        const following = await twitterClient.v2.friendship({
          source_id: userId,
          target_id: targetId,
        });
        return following.data.following;
      case "retweet":
        const retweets = await twitterClient.v2.userRetweets(userId, {
          max_results: 100,
        });
        return retweets.data.some((tweet) => tweet.id === targetId);
      case "like":
        const likes = await twitterClient.v2.userLikedTweets(userId, {
          max_results: 100,
        });
        return likes.data.some((tweet) => tweet.id === targetId);
      default:
        return false;
    }
  } catch (error) {
    console.error("Error verifying Twitter quest:", error);
    return false;
  }
};

// const verifyTelegramQuest = async (questType, targetId, userId) => {
//   console.log("in verify telegram");
//   try {
//     switch (questType) {
//       case "join":
//         const chatMember = await bot.getChatMember(targetId, userId);
//         return ["member", "administrator", "creator"].includes(
//           chatMember.status
//         );
//       default:
//         return false;
//     }
//   } catch (error) {
//     console.error("Error verifying Telegram quest:", error);
//     return false;
//   }
// };

const verifyTelegramQuest = async (questType, targetId, userId) => {
  console.log("Verifying Telegram quest for quest type:", questType);
  try {
    switch (questType) {
      case "join":
        // Attempt to fetch the chat member's information
        const chatMember = await bot.getChatMember(-1002235929629, userId);
        // const chat = await bot.getChat(-1002235929629);
        console.log("chat", chatMember);
        // Check if the user is part of the chat
        const isMember = ["member", "administrator", "creator"].includes(
          chatMember.status
        );

        if (isMember) {
          console.log(`User ${userId} is a member of chat ${targetId}`);
        } else {
          console.log(`User ${userId} is not a member of chat ${targetId}`);
        }

        return isMember;

      default:
        console.warn(`Quest type "${questType}" is not supported.`);
        return false;
    }
  } catch (error) {
    console.error(
      `Error verifying Telegram quest for user ${userId} in chat ${targetId}:`,
      error.message
    );

    // Check if the error is due to an invalid chat or user ID
    if (error.response && error.response.statusCode === 400) {
      console.error(`Invalid chat ID or user ID: ${targetId}, ${userId}`);
    } else if (error.response && error.response.statusCode === 403) {
      console.error(
        `Bot might not have sufficient permissions in the chat ${targetId}`
      );
    }

    return false;
  }
};

module.exports = {
  verifyTwitterQuest,
  verifyTelegramQuest,
};
