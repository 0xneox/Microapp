const User = require("../models/User");
const referralController = require("../controllers/referralController"); 
const Leaderboard = require("../models/Leaderboard");
const { verifyTelegramWebAppData } = require("../utils/telegramUtils");
const logger = require("../utils/logger");
const { calculateReferralReward } = require("../utils/referralUtils");
const Referral = require("../models/Referral");

// const { getCachedUser, updateCachedUser } = require('../utils/userCache');
// const { queueLeaderboardUpdate } = require("../jobs/jobQueue");
const Quest = require("../models/Quest");

exports.authenticateTelegram = async (req, res) => {
  try {
    logger.info("Received authentication request");
    const initData = req.header("X-Telegram-Init-Data");
    logger.debug("InitData:", initData);

    if (!initData) {
      logger.error("No initData provided");
      return res.status(400).json({ message: "No Telegram data provided" });
    }

    if (!verifyTelegramWebAppData(initData)) {
      logger.error("Invalid Telegram data");
      return res.status(401).json({ message: "Invalid Telegram data" });
    }

    const params = new URLSearchParams(initData);
    const userString = params.get("user");
    if (!userString) {
      logger.error("No user data found in initData");
      return res.status(400).json({ message: "No user data found" });
    }

    const userData = JSON.parse(decodeURIComponent(userString));
    logger.debug("Parsed user data:", userData);

    let user = await User.findOneAndUpdate(
      { telegramId: userData.id },
      {
        $set: {
          username: userData.username,
          firstName: userData.first_name,
          lastName: userData.last_name,
          languageCode: userData.language_code,
          photoUrl: userData.photo_url,
        },
        $setOnInsert: { telegramId: userData.id },
      },
      { new: true, upsert: true }
    );
      console.log("user", user);
    // Check if user can claim daily XP
    let dailyXPClaimed = false;
    let xpGained = 0;
    // if the user is new then claim daily xp.
    if (user.canClaimDailyXP() && user?.xp == 0) {
      xpGained = 500;
      user.xp += xpGained;
      user.lastDailyClaimDate = new Date();
      user.checkInStreak += 1;
      dailyXPClaimed = true;
      await user.save();
      logger.info(
        `Daily XP claimed for user: ${user.telegramId}, XP gained: ${xpGained}`
      );
    }

    const token = user.generateAuthToken();

    logger.info(`User authenticated successfully: ${user.telegramId}`);
    res.json({
      token,
      user: {
        id: user.telegramId,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        languageCode: user.languageCode,
        photoUrl: user.photoUrl,
        xp: user.xp,
        dailyXPClaimed,
        xpGained,
        lastDailyClaimDate: user.lastDailyClaimDate,
      },
    });
  } catch (error) {
    logger.error("Authentication error:", error);
    res
      .status(500)
      .json({ error: "Authentication failed", details: error.message });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findOne({
      telegramId: req.user.telegramId,
    }).populate("completedQuests");

    if (!user) {
      logger.warn(`User not found: ${req.user.telegramId}`);
      return res.status(404).json({ message: "User not found" });
    }

    // Fetch all quests
    const allQuests = await Quest.find({});

    // Create a set of completed quest IDs for efficient lookup
    const completedQuestIds = new Set(
      user.completedQuests.map((quest) => quest._id.toString())
    );

    // Add 'claimed' key to each quest
    const questsWithClaimedStatus = allQuests.map((quest) => ({
      ...quest.toObject(),
      claimed: completedQuestIds.has(quest._id.toString()),
    }));

    // Prepare the response object with both reward fields
    const profileData = {
      _id: user._id,
      telegramId: user.telegramId,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      xp: user.xp,
      compute: user.compute,
      computePower: user.computePower,
      totalTaps: user.totalTaps,
      referredBy: user.referredBy,
      referrals: user.referrals,
      totalReferralXP: user.totalReferralXP || 0,
      totalReferralRewards: user.totalReferralRewards || 0,
      id: user.telegramId,
      quests: questsWithClaimedStatus,
      completedQuestsCount: completedQuestIds.size,
      // Additional user stats
      stats: {
        checkInStreak: user.checkInStreak,
        lastDailyClaimDate: user.lastDailyClaimDate,
        gpuLevel: user.gpuLevel,
        level: user.level,
        boostCount: user.boostCount,
        lastBoostTime: user.lastBoostTime
      },
      // Referral specific stats
      referralStats: {
        totalReferrals: user.referrals.length,
        totalReferralXP: user.totalReferralXP || 0,
        totalReferralRewards: user.totalReferralRewards || 0,
        referralCode: user.referralCode
      }
    };

    logger.info(`Profile retrieved for user: ${user.telegramId}`);
    res.json(profileData);
  } catch (error) {
    logger.error(`Get profile error: ${error.message}`);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const updates = Object.keys(req.body);
    const allowedUpdates = ["username", "avatarUrl", "language", "theme"];
    const isValidOperation = updates.every((update) =>
      allowedUpdates.includes(update)
    );

    if (!isValidOperation) {
      logger.warn(`Invalid update attempt: ${req.user.telegramId}`);
      return res.status(400).json({ error: "Invalid updates!" });
    }

    updates.forEach((update) => (req.user[update] = req.body[update]));
    await req.user.save();

    logger.info(`Profile updated: ${req.user.telegramId}`);
    res.json(req.user);
  } catch (error) {
    logger.error(`Update profile error: ${error.message}`);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.claimDailyXP = async (req, res) => {
  try {
    const user = await User.findOne({ telegramId: req.user.telegramId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const now = new Date();
    const lastClaim = new Date(user.lastDailyClaimDate);
    const timeDiff = now - lastClaim;
    const hoursSinceLastClaim = timeDiff / (1000 * 60 * 60);

    if (hoursSinceLastClaim < 24) {
      return res.status(400).json({
        message: "Daily XP already claimed",
        nextClaimTime: new Date(lastClaim.getTime() + 24 * 60 * 60 * 1000),
      });
    }

    const xpGained = 100;
    user.xp += xpGained;
    user.lastDailyClaimDate = now;
    user.checkInStreak += 1;
    await user.save();

    // Queue leaderboard update
    // await queueLeaderboardUpdate(user.telegramId, user.xp);

    res.json({
      message: "Daily XP claimed successfully",
      xpGained,
      newTotalXp: user.xp,
      checkInStreak: user.checkInStreak,
    });
  } catch (error) {
    logger.error(`Claim daily XP error: ${error.message}`);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
exports.checkDailyXPClaimable = async (req, res) => {
  try {
    const user = await User.findOne({ telegramId: req.user.telegramId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const now = new Date();
    const lastClaim = new Date(user.lastDailyClaimDate);
    const timeDiff = now - lastClaim;
    const hoursSinceLastClaim = timeDiff / (1000 * 60 * 60);

    const isClaimable = hoursSinceLastClaim >= 24;
    const nextClaimTime = isClaimable
      ? now
      : new Date(lastClaim.getTime() + 24 * 60 * 60 * 1000);

    res.json({
      isClaimable,
      nextClaimTime,
      checkInStreak: user.checkInStreak,
    });
  } catch (error) {
    logger.error(`Check daily XP claimable error: ${error.message}`);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const distributeReferralXP = async (userId, xpGained) => {
  try {
    const user = await User.findById(userId).populate("referredBy");
    if (!user || !user.referredBy) return;

    let currentReferrer = user.referredBy;
    let currentTier = 1;
    const tierPercentages = [0.1, 0.05, 0.025]; // 10%, 5%, 2.5%

    while (currentReferrer && currentTier <= 3) {
      const referralXP = Math.floor(xpGained * tierPercentages[currentTier - 1]);
      
      // Update both XP tracking fields
      currentReferrer.xp += referralXP;
      currentReferrer.totalReferralXP = (currentReferrer.totalReferralXP || 0) + referralXP;
      currentReferrer.totalReferralRewards = (currentReferrer.totalReferralRewards || 0) + referralXP;

      // Update the referral document
      await Referral.findOneAndUpdate(
        { referrer: currentReferrer._id, referred: user._id },
        { 
          $inc: { totalRewardsDistributed: referralXP },
          $set: { lastRewardDate: new Date() }
        }
      );

      await currentReferrer.save();
      logger.info(
        `Distributed ${referralXP} XP to referrer ${currentReferrer._id} (Tier ${currentTier})`
      );

      currentReferrer = await User.findOne({ _id: currentReferrer.referredBy });
      currentTier++;
    }
  } catch (error) {
    logger.error(`Error distributing referral XP: ${error.message}`);
    // We don't rethrow as this is a background operation
  }
};



exports.tap = async (req, res) => {
  const session = await User.startSession();
  try {
    let result;
    await session.withTransaction(async () => {
      const userId = req.user.telegramId;
      const { count = 1 } = req.body;

      let user = await User.findOne({ telegramId: userId }).session(session);
      if (!user) {
        throw new Error('User not found');
      }

      const now = new Date();
      const xpBefore = user.xp;
      const xpGained = user.computePower * count;
      
      user.xp += xpGained;
      user.compute += xpGained;
      user.totalTaps += count;
      user.lastTapTime = now;

      await user.save({ session });
      
      // Call the correct function from referralController
      await referralController.processReferralReward(user._id, xpGained);

      result = {
        message: 'Tap successful',
        xpGained,
        xpBefore,
        newTotalXp: user.xp,
        totalTaps: user.totalTaps,
        computePower: user.computePower
      };
    });

    res.json(result);
  } catch (error) {
    logger.error(`Tap error: ${error.message}`);
    res.status(error.message === 'User not found' ? 404 : 500)
       .json({ message: error.message || 'Server error' });
  } finally {
    session.endSession();
  }
};
function calculateRPM(lastTapTime, currentTime) {
  const timeDiff = (currentTime - lastTapTime) / 1000; // in seconds
  return timeDiff > 0 ? Math.round(60 / timeDiff) : 0;
}

exports.boost = async (req, res) => {
  try {
    const user = await User.findOne({ telegramId: req.user.telegramId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.boostCount < 1) {
      return res.status(400).json({ message: "No boost available" });
    }

    const now = new Date();
    const boostDuration = 10 * 1000; // 10 seconds
    const tapsPerSecond = 10; // Assuming 10 taps per second during boost
    const totalBoostTaps = tapsPerSecond * (boostDuration / 1000);

    user.boostCount -= 1;
    user.lastBoostTime = now;
    user.totalTaps += totalBoostTaps;
    const xpGained = totalBoostTaps * user.computePower;
    user.xp += xpGained;
    user.compute += xpGained;

    // Reset cooldown
    user.cooldownEndTime = null;

    await user.save();

    res.json({
      message: "Boost activated",
      user: {
        xp: user.xp,
        compute: user.compute,
        totalTaps: user.totalTaps,
        boostCount: user.boostCount,
        lastBoostTime: user.lastBoostTime,
      },
    });
  } catch (error) {
    logger.error(`Boost error: ${error.message}`);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.updateUserRank = async (req, res) => {
  try {
    const { userId, newRank } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.updateLeaderboardRank(newRank);
    await user.save();

    res.json({ message: "User rank updated successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getCooldownStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      logger.warn(`User not found for cooldown status: ${req.user._id}`);
      return res.status(404).json({ message: "User not found" });
    }
    logger.info(`Cooldown status retrieved for user: ${user.telegramId}`);
    res.json({
      cooldownEndTime: user.cooldownEndTime,
      isCoolingDown: user.cooldownEndTime > Date.now(),
    });
  } catch (error) {
    logger.error(`Get cooldown status error: ${error.message}`);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getDailyPoints = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      logger.warn(`User not found for daily points: ${req.user._id}`);
      return res.status(404).json({ message: "User not found" });
    }
    logger.info(`Daily points retrieved for user: ${user.telegramId}`);
    res.json({ dailyPoints: user.dailyPoints });
  } catch (error) {
    logger.error(`Get daily points error: ${error.message}`);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.getUserStats = async (req, res) => {
  try {
    const userId = req.user.telegramId;
    const user = await User.findOne({ telegramId: userId });

    if (!user) {
      logger.warn(`User not found: ${userId}`);
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      xp: user.xp,
      compute: user.compute,
      totalTaps: user.totalTaps,
      computePower: user.computePower,
      cooldownEndTime: user.cooldownEndTime,
      lastTapTime: user.lastTapTime,
    });
  } catch (error) {
    logger.error(
      `Error fetching user stats for ${req.user.telegramId}:`,
      error
    );
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.upgradeGPU = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      logger.warn(`User not found for GPU upgrade: ${req.user._id}`);
      return res.status(404).json({ message: "User not found" });
    }

    // Implement GPU upgrade logic here
    // This is a placeholder implementation
    user.computePower += 1;
    await user.save();

    logger.info(
      `GPU upgraded for user: ${user.telegramId}, New compute power: ${user.computePower}`
    );
    res.json({
      message: "GPU upgraded successfully",
      newComputePower: user.computePower,
    });
  } catch (error) {
    logger.error(`Upgrade GPU error: ${error.message}`);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
