import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;
let cached = global.mongoose;
if (!cached) cached = global.mongoose = { conn: null, promise: null };

async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) cached.promise = mongoose.connect(MONGODB_URI, { bufferCommands: false });
  cached.conn = await cached.promise;
  return cached.conn;
}

const completedDaySchema = new mongoose.Schema({
  weekStart: { type: String, required: true },
  day: { type: String, required: true },
  sessionId: { type: String, default: null },
}, { timestamps: true });

completedDaySchema.index({ weekStart: 1, day: 1 }, { unique: true });
const CompletedDay = mongoose.models.CompletedDay || mongoose.model('CompletedDay', completedDaySchema);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    await connectDB();
    const { weekStart, day } = req.query;

    // GET all — return as object { "weekStart__day": sessionId }
    if (req.method === 'GET') {
      const all = await CompletedDay.find();
      const result = {};
      all.forEach(c => { result[`${c.weekStart}__${c.day}`] = c.sessionId; });
      return res.status(200).json(result);
    }

    // POST - mark completed
    if (req.method === 'POST') {
      const { weekStart: ws, day: d, sessionId } = req.body;
      const completed = await CompletedDay.findOneAndUpdate(
        { weekStart: ws, day: d },
        { weekStart: ws, day: d, sessionId },
        { upsert: true, new: true }
      );
      return res.status(200).json(completed);
    }

    // DELETE - unmark
    if (req.method === 'DELETE' && weekStart && day) {
      await CompletedDay.findOneAndDelete({ weekStart, day });
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('CompletedDays API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
