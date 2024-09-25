
const mongoose = require('mongoose');

const telegramQuestSchema = new mongoose.Schema({
  questId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quest', required: true },
  targetId: { type: String, required: true },
});

module.exports = mongoose.model('TelegramQuest', telegramQuestSchema);