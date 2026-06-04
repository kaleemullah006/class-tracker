const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
  type: { 
    type: String, 
    required: true, 
    enum: ['dua', 'quran', 'hadees'] 
  },
  title: { type: String, required: true },
  content: { type: String, required: true },
  category: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Content', contentSchema);
