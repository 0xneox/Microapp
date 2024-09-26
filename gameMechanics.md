# Updated Core Game Mechanics and Progression System

## XP (Experience Points)

XP is the primary measure of a user's progress in the game.

Users gain XP through various activities:
1. Tapping 
2. Completing quests
3. Achieving milestones
4. Referrals
5. Daily check-ins

### XP Gain Rates

1. Tapping:
   - XP is tied to CP Level
   -  XP per tap = CP Level + 1
   - Eg:
     - CP Level 0: 1 XP/tap
     - CP1: 2 XP/tap
     - CP2: 3 XP/tap

3. Referrals:
   - 200 XP per new user referred
   - 10% of referred user's XP gains 

4. Daily Check-ins:
   - 100 XP per check-in/day
   - Streak Bonus (7 days): 500 XP


### CP Level Calculation

- Level 0: 0 - 24,999 XP
- Level 1: 25,000 - 49,999 XP
- Level 2: 50,000 - 74,999 XP
- Level 3: 75,000 - 99,999 XP
- Level 4: 100,000 - 124,999 XP
- ...

Formula: Level = floor(Total XP / 25000)

## Compute Power

Compute Power is a measure of the user's current strength, affected by CP Level and active boosts.

- Base Compute Power: CP Level * 10
- Temporary boosts can increase Compute Power
- Compute Power affects XP gain rate and leaderboard position

## Tapping Mechanics

- Base tap cooldown: 5 seconds
- Tap limit before cooldown: 500 taps
- Cooldown duration after hitting limit: 10 seconds
- XP gain per tap: Compute Power * 0.1 (minimum 1 XP)

## Boost System

Boosts provide temporary enhancements to user performance.

- Types of boosts:
  1. XP Multiplier (1.5x, 2x, 3x)
  2. Tap Speed (reduce cooldown by 25%, 50%, 75%)
  3. Compute Power Boost (+50, +100, +200)

- Duration: 5 minutes, 15 minutes, 30 minutes
- Cooldown between using boosts: 1 hour
- Acquisition: Complete special quests, achievements, or purchase with in-game currency

## Achievement System

Achievements provide long-term goals and rewards for users.

- Categories:
  1. XP Milestones (reach certain XP thresholds)
  2. CP Level Milestones (reach certain CP Levels)
  3. Tapping Milestones (number of taps, tap streaks)
  4. Quest Completion (number of quests, types of quests)
  5. Social (referrals, community engagement)

- Rewards:
  - XP Bonuses
  - Exclusive Cosmetics
  - Boosts
  - Titles

## Leaderboard System

Leaderboards encourage competition and engagement.

- Types:
  1. Daily XP Gained
  2. Weekly XP Gained
  3. All-Time XP
  4. Current Compute Power

- Rewards for top performers:
  - Exclusive titles
  - Cosmetic rewards
  - Boosters

## Quest System

Quests provide varied gameplay and rewards.

- Daily Quests: Refresh every 24 hours
- Weekly Quests: Refresh every 7 days
- Special Event Quests: Limited-time quests with unique rewards

- Quest Types:
  1. Tapping Quests (e.g., Tap X times, Reach X Compute Power)
  2. Social Quests (e.g., Refer a friend, Join Telegram group)
  3. Streak Quests (e.g., Log in for X consecutive days)
  4. Milestone Quests (e.g., Reach CP Level X, Gain X total XP)

## Referral System

Encourages user growth and rewards active referrers.

- Referral Rewards:
  - One-time bonus for referrer and referred user
  - Percentage of referred user's XP gains for a limited time
- Multi-level referrals:
  - 1st level: 10% of referred user's XP gains
  - 2nd level: 5% of referred user's XP gains
  - 3rd level: 2.5% of referred user's XP gains

## Currency System (Optional)



- Name: NLOV Tokens
- Earning methods:
  1. Daily rewards
  2. Quest completion
  3. Achievement rewards
  4. Leaderboard positions
- Uses:
  1. Purchase boosts
  2. Unlock cosmetic items
  3. Enter special events or competitions
