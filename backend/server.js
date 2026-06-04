require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const Session = require('./models/Session');
const Content = require('./models/Content');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ── Static files (PDF serve karne ke liye) ──
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

// ── Multer PDF upload setup ──
const pdfStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, 'noorani-qaida.pdf'),
});
const uploadPdf = multer({
  storage: pdfStorage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Sirf PDF allowed hai'));
  },
  limits: { fileSize: 20 * 1024 * 1024 },
});

// ── MongoDB connect ──
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected!'))
  .catch(err => console.log('❌ Error:', err));

// ═══════════════════════════════════════════
//  SESSION ROUTES (pehle se exist karte hain)
// ═══════════════════════════════════════════

app.get('/api/sessions', async (req, res) => {
  try {
    const sessions = await Session.find().sort({ date: -1 });
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/sessions', async (req, res) => {
  try {
    const session = new Session(req.body);
    await session.save();
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/sessions/:id', async (req, res) => {
  try {
    const session = await Session.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/sessions/:id', async (req, res) => {
  try {
    await Session.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════
//  COURSES ROUTES (naye — Content ke liye)
// ═══════════════════════════════════════════

// GET — sab items by type (dua / quran / hadees)
app.get('/api/courses/:type', async (req, res) => {
  try {
    const { type } = req.params;
    if (!['dua', 'quran', 'hadees'].includes(type)) {
      return res.status(400).json({ error: 'Invalid type. Use: dua, quran, hadees' });
    }
    const items = await Content.find({ type }).sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST — naya item add karo
app.post('/api/courses/:type', async (req, res) => {
  try {
    const { type } = req.params;
    if (!['dua', 'quran', 'hadees'].includes(type)) {
      return res.status(400).json({ error: 'Invalid type' });
    }
    const { title, content, category } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: 'title aur content zaroori hain' });
    }
    const item = new Content({ type, title, content, category: category || '' });
    await item.save();
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT — item edit karo
app.put('/api/courses/:type/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, category } = req.body;
    const item = await Content.findByIdAndUpdate(
      id,
      { title, content, category, updatedAt: new Date() },
      { new: true }
    );
    if (!item) return res.status(404).json({ error: 'Item nahi mila' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE — item delete karo
app.delete('/api/courses/:type/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Content.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PDF Routes ──

// PDF upload (Noorani Qaida)
app.post('/api/pdf/upload', uploadPdf.single('pdf'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Koi file upload nahi hui' });
  res.json({ success: true, url: '/uploads/noorani-qaida.pdf' });
});

// PDF check — exist karta hai?
app.get('/api/pdf/check', (req, res) => {
  const pdfPath = path.join(uploadsDir, 'noorani-qaida.pdf');
  res.json({ exists: fs.existsSync(pdfPath) });
});

// ── Start Server ──
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
