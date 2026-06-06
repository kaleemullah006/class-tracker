const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
  weekStart: { type: String, required: true, unique: true },
  days: [{ type: String }],
  belgiumTime: { type: String, default: "11:00" },
}, { timestamps: true });

module.exports = mongoose.model('Schedule', scheduleSchema);