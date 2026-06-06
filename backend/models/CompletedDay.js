const mongoose = require('mongoose');

const completedDaySchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true }, // weekStart__day
  sessionId: { type: String, default: null },
}, { timestamps: true });

module.exports = mongoose.model('CompletedDay', completedDaySchema);