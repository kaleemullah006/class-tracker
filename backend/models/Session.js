const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  date: { type: String, required: true },
  start: { type: String, default: '' },
  end: { type: String, default: '' },
  duration: { type: Number, default: null },
  notes: { type: String, default: '' },
  paid: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Session', sessionSchema);
