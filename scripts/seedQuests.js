const mongoose = require('mongoose');
const Quest = require('../models/Quest');
const TelegramQuest = require('../models/TelegramQuest');
const TwitterQuest = require('../models/TwitterQuest');
require('dotenv').config();

const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/neurolov';

mongoose.connect(dbUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

const quests = [
  {
    title: "Join Our Telegram Channel",
    description: "Join our Telegram channel to stay updated",
    xpReward: 1000,
    type: "telegram",
    platform: "telegram",
    action: "join",
    targetId: "@Neurolov9",
    requirement: 1,
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
  },
  {
    title: "Follow Us on Twitter",
    description: "Follow our Twitter account for the latest news",
    xpReward: 1000,
    type: "twitter",
    platform: "twitter",
    action: "follow",
    targetId: "neurolov",
    requirement: 1,
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
  },
  {
    title: "Join our Discord Server",
    description: "Join our Discord community",
    xpReward: 1000,
    type: "discord",
    platform: "discord",
    action: "join",
    targetId: "https://discord.gg/gyfQQxgtwD",
    requirement: 1,
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
  },
  {
    title: "Refer Friends",
    description: "Invite 3 friends to join our platform",
    xpReward: 3000,
    type: "referral",
    action: "refer",
    requirement: 3,
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
  },
  {
    title: "7-Day Login Streak",
    description: "Log in for 7 consecutive days",
    xpReward: 1500,
    type: "daily",
    action: "login",
    requirement: 7,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
  },
  {
    title: "Unlock a GPU Skin",
    description: "Unlock your first GPU skin",
    xpReward: 1000,
    type: "achievement",
    action: "unlock_skin",
    requirement: 1,
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
  },
  {
    title: "Reach CP Level",
    description: "Achieve CP Level 1",
    xpReward: 1000,
    type: "level",
    action: "reach_level",
    requirement: 1,
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
  },
  {
    title: "Top 100 Leaderboard",
    description: "Rank in the top 100 on the leaderboard",
    xpReward: 2500,
    type: "leaderboard",
    action: "rank",
    requirement: 100,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
  },
];

const seedQuests = async () => {
  try {
    await Quest.deleteMany({});
    await TelegramQuest.deleteMany({});
    await TwitterQuest.deleteMany({});

    for (let questData of quests) {
      const quest = new Quest(questData);
      await quest.save();

      if (quest.type === 'telegram') {
        await new TelegramQuest({ questId: quest._id, targetId: quest.targetId }).save();
      }
      if (quest.type === 'twitter') {
        await new TwitterQuest({ questId: quest._id, targetId: quest.targetId }).save();
      }
    }

    console.log(`${quests.length} quests have been created.`);
  } catch (error) {
    console.error('Error seeding quests:', error);
  } finally {
    mongoose.connection.close();
  }
};

seedQuests();