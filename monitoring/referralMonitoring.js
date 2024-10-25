
const logger = require('../utils/logger');

class ReferralMonitor {
  static async checkReferralIntegrity() {
    try {
      // Check for orphaned referrals
      const orphanedReferrals = await Referral.find({
        $or: [
          { referrer: { $exists: false } },
          { referred: { $exists: false } }
        ]
      });

      if (orphanedReferrals.length > 0) {
        logger.error(`Found ${orphanedReferrals.length} orphaned referrals`);
        // Alert administrators
      }

      // Check for circular references
      const circularRefs = await Referral.aggregate([
        {
          $graphLookup: {
            from: "referrals",
            startWith: "$referrer",
            connectFromField: "referrer",
            connectToField: "referred",
            as: "chain"
          }
        },
        {
          $match: {
            "chain.referred": "$referrer"
          }
        }
      ]);

      if (circularRefs.length > 0) {
        logger.error(`Found ${circularRefs.length} circular referral chains`);
        // Alert administrators
      }

      // Check for inconsistent reward distributions
      const inconsistentRewards = await Referral.aggregate([
        {
          $match: {
            totalRewardsDistributed: { $gt: 0 },
            lastRewardDate: { $exists: false }
          }
        }
      ]);

      if (inconsistentRewards.length > 0) {
        logger.error(`Found ${inconsistentRewards.length} inconsistent reward records`);
        // Alert administrators
      }
    } catch (error) {
      logger.error('Error in referral integrity check:', error);
    }
  }
}

module.exports = ReferralMonitor;
