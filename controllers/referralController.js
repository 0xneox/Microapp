
const User = require('../models/User');
const Referral = require('../models/Referral');
const logger = require('../utils/logger');
const { generateReferralCode, validateReferralCode, calculateReferralReward } = require('../utils/referralUtils');

// Helper function to validate and get referral chain
async function validateAndGetReferralChain(referrerId, userId, maxTier = 3, session = null) {
    const chain = [];
    const visited = new Set();
    let currentId = referrerId;
    let currentTier = 1;
  
    try {
      while (currentId && currentTier <= maxTier) {
        const currentIdStr = currentId.toString();
        
        // Enhanced circular reference check
        if (visited.has(currentIdStr)) {
          logger.warn(`Circular referral chain detected: ${currentIdStr}`);
          break;
        }
        
        // Enhanced self-referral check
        if (currentIdStr === userId.toString()) {
          logger.warn(`Self-referral attempted: ${userId}`);
          break;
        }
  
        visited.add(currentIdStr);
        
        const referrer = await User.findById(currentId)
          .select('referredBy username')
          .session(session)
          .lean();
          
        if (!referrer) {
          logger.warn(`Referrer not found in chain: ${currentId}`);
          break;
        }
  
        chain.push({ 
          userId: currentId, 
          tier: currentTier,
          username: referrer.username // Added for tracking
        });
        
        currentId = referrer.referredBy;
        currentTier++;
      }
  
      return chain;
    } catch (error) {
      logger.error(`Error in referral chain validation: ${error.message}`);
      throw error;
    }
  }
  

async function processReferralReward(userId, xpAmount) {
    const session = await mongoose.startSession();
    let retries = 3;
    
    while (retries > 0) {
      try {
        await session.withTransaction(async () => {
          const referrals = await Referral.find({
            referred: userId,
            isActive: true
          })
          .populate('referrer', 'username telegramId')
          .session(session);
  
          if (!referrals.length) {
            logger.debug(`No active referrals found for user ${userId}`);
            return;
          }
  
          const updatePromises = referrals.map(async (referral) => {
            const rewardAmount = calculateReferralReward(referral.tier, xpAmount);
            
            if (rewardAmount <= 0 || !referral.referrer) {
              logger.debug(`No reward to process for referral ${referral._id}`);
              return null;
            }
  
            try {
              // Update referral stats
              referral.totalRewardsDistributed += rewardAmount;
              referral.lastRewardDate = new Date();
  
              // Update referrer stats with verification
              const referrer = await User.findById(referral.referrer._id).session(session);
              if (!referrer) {
                logger.warn(`Referrer not found: ${referral.referrer._id}`);
                return null;
              }
  
              referrer.xp += rewardAmount;
              referrer.totalReferralXP = (referrer.totalReferralXP || 0) + rewardAmount;
  
              // Add activity log
              await new Activity({
                user: referrer._id,
                type: 'referral_reward',
                details: {
                  amount: rewardAmount,
                  fromUser: userId,
                  tier: referral.tier
                }
              }).save({ session });
  
              logger.info(`Processed referral reward: ${rewardAmount} XP for user ${referrer.telegramId} (Tier ${referral.tier})`);
  
              return Promise.all([
                referral.save({ session }),
                referrer.save({ session })
              ]);
            } catch (err) {
              logger.error(`Failed to process individual referral: ${err.message}`);
              return null;
            }
          });
  
          await Promise.all(updatePromises.filter(Boolean));
        });
        
        break; // Exit retry loop if successful
      } catch (error) {
        retries--;
        if (retries === 0) {
          logger.error(`Failed to process referral rewards after all retries: ${error.message}`);
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait before retry
      }
    }
  
    session.endSession();
  }

exports.generateReferralCode = async (req, res) => {
  const session = await User.startSession();
  try {
    await session.withTransaction(async () => {
      const user = await User.findOne({ telegramId: req.user.telegramId })
        .session(session);

      if (!user) {
        throw new Error('User not found');
      }

      // Return existing code if present
      if (user.referralCode) {
        return res.json({ 
          referralCode: user.referralCode,
          referralLink: `https://t.me/neurolo_bot?start=${user.referralCode}`
        });
      }

      let referralCode;
      let isUnique = false;
      let attempts = 0;
      const MAX_ATTEMPTS = 10;

      while (!isUnique && attempts < MAX_ATTEMPTS) {
        referralCode = generateReferralCode();
        const [existingUser, existingReferral] = await Promise.all([
          User.findOne({ referralCode }).session(session),
          Referral.findOne({ code: referralCode }).session(session)
        ]);
        
        if (!existingUser && !existingReferral) {
          isUnique = true;
        }
        attempts++;
      }

      if (!isUnique) {
        throw new Error('Failed to generate unique referral code');
      }

      user.referralCode = referralCode;
      await user.save({ session });

      logger.info(`Generated referral code ${referralCode} for user ${user.telegramId}`);
      res.json({ 
        referralCode,
        referralLink: `https://t.me/neurolo_bot?start=${referralCode}`
      });
    });
  } catch (error) {
    logger.error(`Error generating referral code: ${error.message}`);
    res.status(error.message === 'User not found' ? 404 : 500)
       .json({ message: error.message || 'Failed to generate referral code' });
  } finally {
    session.endSession();
  }
};

exports.applyReferralCode = async (req, res) => {
    const session = await User.startSession();
    try {
        await session.withTransaction(async () => {
            const { referralCode } = req.body;
            
            if (!validateReferralCode(referralCode)) {
                throw new Error('Invalid referral code format');
            }

            const user = await User.findOne({ telegramId: req.user.telegramId }).session(session);
            if (!user) {
                throw new Error('User not found');
            }

            // Check if user has already been referred
            const existingReferral = await Referral.findOne({ 
                referred: user._id 
            }).session(session);

            if (existingReferral) {
                throw new Error('You have already used a referral code');
            }

            // Find referrer by referral code
            const referrer = await User.findOne({ referralCode }).session(session);
            if (!referrer) {
                throw new Error('Invalid referral code');
            }

            if (referrer._id.equals(user._id)) {
                throw new Error('Cannot use your own referral code');
            }

            // Get the referral chain
            const referralChain = await validateAndGetReferralChain(referrer._id, user._id, 3, session);
            
            // Create referral documents for each tier
            const referralPromises = referralChain.map(({ userId, tier }) => (
                new Referral({
                    referrer: userId,
                    referred: user._id,
                    code: referralCode,
                    tier,
                    dateReferred: new Date(),
                    isActive: true,
                    lastRewardDate: null,
                    totalRewardsDistributed: 0
                }).save({ session })
            ));

            // Update user's referral data
            user.referredBy = referrer._id;
            user.referralChain = referralChain.map(r => r.userId);
            
            // Update referrer's referrals array
            if (!referrer.referrals.includes(user._id)) {
                referrer.referrals.push(user._id);
            }

            // Save all changes
            await Promise.all([
                ...referralPromises,
                user.save({ session }),
                referrer.save({ session })
            ]);

            logger.info(`User ${user.telegramId} applied referral code ${referralCode}`);
            res.json({ 
                message: 'Referral code applied successfully',
                referrer: {
                    username: referrer.username,
                    tier: 1
                }
            });
        });
    } catch (error) {
        logger.error(`Error applying referral code: ${error.message}`);
        const statusCode = error.message.includes('already used') ? 400 : 
                          error.message.includes('not found') ? 404 : 500;
        res.status(statusCode).json({ message: error.message });
    } finally {
        session.endSession();
    }
};

exports.processReferralReward = async (userId, xpAmount) => {
  const session = await User.startSession();
  try {
    let success = false;
    await session.withTransaction(async () => {
      const referrals = await Referral.find({
        referred: userId,
        isActive: true
      })
      .populate('referrer')
      .session(session);

      const updatePromises = referrals.map(async (referral) => {
        try {
          const rewardAmount = calculateReferralReward(referral.tier, xpAmount);
          if (rewardAmount <= 0 || !referral.referrer) return;

          referral.totalRewardsDistributed += rewardAmount;
          referral.lastRewardDate = new Date();
          referral.referrer.xp += rewardAmount;
          referral.referrer.totalReferralXP = (referral.referrer.totalReferralXP || 0) + rewardAmount;

          return Promise.all([
            referral.save({ session }),
            referral.referrer.save({ session })
          ]);
        } catch (err) {
          logger.error(`Error processing individual referral reward: ${err.message}`);
          return null;
        }
      });

      await Promise.all(updatePromises.filter(Boolean));
      success = true;
    });

    if (success) {
      logger.info(`Successfully processed referral rewards for user ${userId}`);
    }
  } catch (error) {
    logger.error(`Error processing referral reward: ${error.message}`);
    throw error;
  } finally {
    session.endSession();
  }
};

exports.getReferralStats = async (req, res) => {
  try {
    const user = await User.findOne({ telegramId: req.user.telegramId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const [directReferrals, tierStats] = await Promise.all([
      Referral.find({
        referrer: user._id,
        tier: 1,
        isActive: true
      })
      .populate('referred', 'username telegramId lastTapTime')
      .sort('-dateReferred')
      .lean(),

      Referral.aggregate([
        {
          $match: {
            referrer: user._id,
            isActive: true
          }
        },
        {
          $group: {
            _id: '$tier',
            count: { $sum: 1 },
            totalRewards: { $sum: '$totalRewardsDistributed' }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    const stats = {
      referralCode: user.referralCode,
      referralLink: user.referralCode ? `https://t.me/neurolo_bot?start=${user.referralCode}` : null,
      totalReferrals: user.referrals.length,
      totalEarnings: user.totalReferralXP || 0,
      tierStats: tierStats.reduce((acc, tier) => ({
        ...acc,
        [`tier${tier._id}`]: {
          count: tier.count,
          earnings: tier.totalRewards
        }
      }), {}),
      directReferrals: directReferrals.map(ref => ({
        username: ref.referred.username,
        rewardsGenerated: ref.totalRewardsDistributed,
        joinedDate: ref.dateReferred,
        lastActive: ref.referred.lastTapTime
      }))
    };

    res.json(stats);
  } catch (error) {
    logger.error(`Error getting referral stats: ${error.message}`);
    res.status(500).json({ message: 'Failed to get referral stats' });
  }
};

exports.getUserReferralRewards = async (userId) => {
    try {
        const referrals = await Referral.find({
            referred: userId,
            isActive: true
        })
        .populate('referrer', 'username telegramId')
        .select('tier totalRewardsDistributed dateReferred lastRewardDate')
        .sort('tier');

        return {
            rewards: referrals.map(ref => ({
                referrer: {
                    username: ref.referrer.username,
                    telegramId: ref.referrer.telegramId
                },
                tier: ref.tier,
                totalRewards: ref.totalRewardsDistributed,
                startDate: ref.dateReferred,
                lastRewardDate: ref.lastRewardDate
            })),
            totalRewardsReceived: referrals.reduce((sum, ref) => sum + ref.totalRewardsDistributed, 0)
        };
    } catch (error) {
        logger.error(`Error fetching user referral rewards: ${error.message}`);
        throw error;
    }
};

module.exports = exports;