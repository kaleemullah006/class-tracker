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

const scheduleSchema = new mongoose.Schema({
  weekStart: { type: String, required: true, unique: true },
  days: [{ type: String }],
  belgiumTime: { type: String, default: "11:00" },
}, { timestamps: true });

const Schedule = mongoose.models.Schedule || mongoose.model('Schedule', scheduleSchema);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    await connectDB();
    const { weekStart } = req.query;

    // GET all schedules — return as object {weekStart: {days, belgiumTime}}
    if (req.method === 'GET') {
      const schedules = await Schedule.find().sort({ weekStart: -1 });
      const result = {};
      schedules.forEach(s => { result[s.weekStart] = { days: s.days, belgiumTime: s.belgiumTime }; });
      return res.status(200).json(result);
    }

    // POST - save/update schedule
    if (req.method === 'POST') {
      const { weekStart: ws, days, belgiumTime } = req.body;
      const schedule = await Schedule.findOneAndUpdate(
        { weekStart: ws },
        { weekStart: ws, days, belgiumTime },
        { upsert: true, new: true }
      );
      return res.status(200).json(schedule);
    }

    // DELETE schedule
    if (req.method === 'DELETE' && weekStart) {
      await Schedule.findOneAndDelete({ weekStart });
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Schedules API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
