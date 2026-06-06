require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const Session = require('./models/Session');
const Content = require('./models/Content');
const Schedule = require('./models/Schedule');
const CompletedDay = require('./models/CompletedDay');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// MongoDB connect
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB Connected!'))
  .catch(err => console.log('❌ Error:', err));

// ═══════════════════════════════════════════
//  SESSION ROUTES
// ═══════════════════════════════════════════

app.get('/api/sessions', async (req, res) => {
  try {
    const sessions = await Session.find().sort({ date: -1 });
    res.json(sessions);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/sessions', async (req, res) => {
  try {
    const session = new Session(req.body);
    await session.save();
    res.json(session);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/sessions/:id', async (req, res) => {
  try {
    const session = await Session.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(session);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/sessions/:id', async (req, res) => {
  try {
    await Session.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ═══════════════════════════════════════════
//  COURSES ROUTES
// ═══════════════════════════════════════════

app.get('/api/courses/:type', async (req, res) => {
  try {
    const { type } = req.params;
    if (!['dua', 'quran', 'hadees'].includes(type)) return res.status(400).json({ error: 'Invalid type' });
    const items = await Content.find({ type }).sort({ createdAt: -1 });
    res.json(items);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/courses/:type', async (req, res) => {
  try {
    const { type } = req.params;
    if (!['dua', 'quran', 'hadees'].includes(type)) return res.status(400).json({ error: 'Invalid type' });
    const { title, content, category } = req.body;
    if (!title || !content) return res.status(400).json({ error: 'title aur content zaroori hain' });
    const item = new Content({ type, title, content, category: category || '' });
    await item.save();
    res.status(201).json(item);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/courses/:type/:id', async (req, res) => {
  try {
    const item = await Content.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) return res.status(404).json({ error: 'Item nahi mila' });
    res.json(item);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/courses/:type/:id', async (req, res) => {
  try {
    await Content.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ═══════════════════════════════════════════
//  SCHEDULE ROUTES
// ═══════════════════════════════════════════

// GET all schedules — return as object keyed by weekStart
app.get('/api/schedules', async (req, res) => {
  try {
    const schedules = await Schedule.find().sort({ weekStart: -1 });
    // Return as object keyed by weekStart (frontend expects this format)
    const result = {};
    schedules.forEach(s => {
      result[s.weekStart] = { 
        days: s.days, 
        belgiumTime: s.belgiumTime, 
        savedAt: s.updatedAt || s.createdAt 
      };
    });
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST - save/update schedule
app.post('/api/schedules', async (req, res) => {
  try {
    const { weekStart, days, belgiumTime } = req.body;
    const schedule = await Schedule.findOneAndUpdate(
      { weekStart },
      { weekStart, days, belgiumTime },
      { upsert: true, new: true }
    );
    res.json(schedule);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE schedule
app.delete('/api/schedules/:weekStart', async (req, res) => {
  try {
    await Schedule.findOneAndDelete({ weekStart: req.params.weekStart });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ═══════════════════════════════════════════
//  COMPLETED DAYS ROUTES  
// ═══════════════════════════════════════════

// GET all completed days — FIXED: matches frontend /api/completeddays
app.get('/api/completeddays', async (req, res) => {
  try {
    const completed = await CompletedDay.find();
    const result = {};
    completed.forEach(c => { result[c.key] = c.sessionId; });
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST - mark day completed — FIXED: matches frontend body format
app.post('/api/completeddays', async (req, res) => {
  try {
    const { weekStart, day, sessionId } = req.body;
    const key = `${weekStart}__${day}`;
    const completed = await CompletedDay.findOneAndUpdate(
      { key },
      { key, sessionId, weekStart, day },
      { upsert: true, new: true }
    );
    res.json(completed);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE - unmark completed day — FIXED: matches frontend route params
app.delete('/api/completeddays/:weekStart/:day', async (req, res) => {
  try {
    const key = `${req.params.weekStart}__${req.params.day}`;
    await CompletedDay.findOneAndDelete({ key });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));