import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

let cached = global.mongoose;
if (!cached) cached = global.mongoose = { conn: null, promise: null };

async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, { bufferCommands: false });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

const courseSchema = new mongoose.Schema({
  type: { type: String, required: true }, // dua, quran, hadees
  title: { type: String, required: true },
  content: { type: String, required: true },
  category: { type: String, default: '' },
}, { timestamps: true });

const Course = mongoose.models.Course || mongoose.model('Course', courseSchema);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    await connectDB();

    const { type, id } = req.query;

    // GET all items of a type
    if (req.method === 'GET' && type && !id) {
      const items = await Course.find({ type }).sort({ createdAt: -1 });
      return res.status(200).json(items);
    }

    // POST new item
    if (req.method === 'POST' && type) {
      const item = new Course({ ...req.body, type });
      await item.save();
      return res.status(201).json(item);
    }

    // PUT update item
    if (req.method === 'PUT' && id) {
      const item = await Course.findByIdAndUpdate(id, req.body, { new: true });
      return res.status(200).json(item);
    }

    // DELETE item
    if (req.method === 'DELETE' && id) {
      await Course.findByIdAndDelete(id);
      return res.status(200).json({ message: 'Deleted' });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Courses API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
