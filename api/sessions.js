import mongoose from 'mongoose';
 
const MONGODB_URI = process.env.MONGODB_URI;
 
if (!MONGODB_URI) {
  throw new Error('MONGODB_URI environment variable not set');
}
 
// Cache connection
let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}
 
async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    }).then(m => m);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
 
const sessionSchema = new mongoose.Schema({
  date: { type: String, required: true },
  start: { type: String, default: '' },
  end: { type: String, default: '' },
  duration: { type: Number, default: null },
  notes: { type: String, default: '' },
  paid: { type: Boolean, default: false },
}, { timestamps: true });
 
const Session = mongoose.models.Session || mongoose.model('Session', sessionSchema);
 
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
 
  if (req.method === 'OPTIONS') return res.status(200).end();
 
  try {
    await connectDB();
 
    const { id } = req.query;
 
    if (req.method === 'GET' && !id) {
      const sessions = await Session.find().sort({ date: -1 });
      return res.status(200).json(sessions);
    }
 
    if (req.method === 'POST') {
      const session = new Session(req.body);
      await session.save();
      return res.status(201).json(session);
    }
 
    if (req.method === 'PUT' && id) {
      const session = await Session.findByIdAndUpdate(id, req.body, { new: true });
      return res.status(200).json(session);
    }
 
    if (req.method === 'DELETE' && id) {
      await Session.findByIdAndDelete(id);
      return res.status(200).json({ message: 'Deleted' });
    }
 
    return res.status(405).json({ error: 'Method not allowed' });
 
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
 