const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

// Connection cache
let cachedConn = null;

async function connectDB() {
  if (cachedConn) return cachedConn;
  cachedConn = await mongoose.connect(MONGODB_URI);
  return cachedConn;
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
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  await connectDB();

  const { id } = req.query;

  // GET all sessions
  if (req.method === 'GET' && !id) {
    const sessions = await Session.find().sort({ date: -1 });
    return res.json(sessions);
  }

  // POST new session
  if (req.method === 'POST') {
    const session = new Session(req.body);
    await session.save();
    return res.json(session);
  }

  // PUT update session
  if (req.method === 'PUT' && id) {
    const session = await Session.findByIdAndUpdate(id, req.body, { new: true });
    return res.json(session);
  }

  // DELETE session
  if (req.method === 'DELETE' && id) {
    await Session.findByIdAndDelete(id);
    return res.json({ message: 'Deleted' });
  }

  res.status(405).json({ error: 'Method not allowed' });
}
