import express from 'express';
import db from '../db.js';
import { authRequired, roleRequired } from '../middleware/auth.js';

const router = express.Router();

router.get('/audit', authRequired, roleRequired('admin'), (req, res) => {
  const logs = db
    .prepare('SELECT * FROM audit_logs ORDER BY rowid DESC LIMIT 100')
    .all();
  res.json(logs);
});

router.get('/users', authRequired, roleRequired('admin'), (req, res) => {
  const users = db.prepare('SELECT id, email, role FROM users').all();
  res.json(users);
});

export default router;
