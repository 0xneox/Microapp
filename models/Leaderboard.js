

const mongoose = require('mongoose');

const leaderboardSchema = new mongoose.Schema({
  type: { type: String, enum: ['daily', 'weekly', 'all-time'], required: true },
  date: { type: Date, required: true },
  entries: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    username: String,
    score: Number
  }]
});

leaderboardSchema.index({ type: 1, date: 1 }, { unique: true });

leaderboardSchema.statics.updateEntry = async function(type, date, userId, username, score) {
  const leaderboard = await this.findOne({ type, date });
  if (!leaderboard) {
    return this.create({
      type,
      date,
      entries: [{ user: userId, username, score }]
    });
  }

  const entryIndex = leaderboard.entries.findIndex(entry => entry.user.toString() === userId.toString());
  if (entryIndex > -1) {
    leaderboard.entries[entryIndex].score = score;
  } else {
    leaderboard.entries.push({ user: userId, username, score });
  }

  leaderboard.entries.sort((a, b) => b.score - a.score);
  return leaderboard.save();
};

const Leaderboard = mongoose.model('Leaderboard', leaderboardSchema);

module.exports = Leaderboard;