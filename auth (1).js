import express from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import db from '../db.js';
import { signToken } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  // Role is never taken from the client: self-registration always creates a viewer.
  const role = 'viewer';
  const hashed = await bcrypt.hash(password, 10);
  const id = uuid();
  try {
    db.prepare('INSERT INTO users VALUES (?, ?, ?, ?)').run(id, email, hashed, role);
    res.json({ ok: true });
  } catch (e) {
    res.status(400).json({ error: 'Email exists' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) return res.status(401).json({ error: 'Invalid' });
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ error: 'Invalid' });
  const token = signToken(user);
  res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
});

export default router;
