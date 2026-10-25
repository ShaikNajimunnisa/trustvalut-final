import fs from 'fs';
import path from 'path';
import express from 'express';
import multer from 'multer';
import { v4 as uuid } from 'uuid';
import db from '../db.js';
import { authRequired } from '../middleware/auth.js';
import { checkPermission } from '../middleware/checkPermission.js';
import { createAudit } from '../utils/audit.js';

fs.mkdirSync('uploads', { recursive: true });

const router = express.Router();
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 10 * 1024 * 1024 }, // max 10 MB
  fileFilter: (req, file, cb) => {
    // Accept common file types only (change as needed)
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'text/plain'];
    if (allowedTypes.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Invalid file type'), false);
  },
});

// Upload document
router.post('/upload', authRequired, upload.single('file'), (req, res) => {
  const id = uuid();
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'No file uploaded' });

  db.prepare('INSERT INTO documents VALUES (?, ?, ?, ?, ?, ?, ?)').run(
    id,
    file.filename,
    file.originalname,
    req.user.id,
    file.mimetype,
    file.size,
    new Date().toISOString()
  );

  // Owner permission
  db.prepare('INSERT INTO document_permissions VALUES (?, ?, ?, ?, ?, ?)').run(
    uuid(),
    id,
    req.user.id,
    'owner',
    req.user.id,
    new Date().toISOString()
  );

  createAudit({
    action: 'UPLOAD',
    documentId: id,
    actorId: req.user.id,
    actorEmail: req.user.email,
    ip: req.ip,
  });

  res.json({ id });
});

// List accessible documents
router.get('/', authRequired, (req, res) => {
  const docs = db
    .prepare(
      `SELECT d.* FROM documents d
       LEFT JOIN document_permissions p ON d.id = p.documentId
       WHERE d.ownerId = ? OR p.userId = ?
       GROUP BY d.id
       ORDER BY d.createdAt DESC`
    )
    .all(req.user.id, req.user.id);

  res.json(docs);
});

// Download document (secured)
router.get('/:id/download', authRequired, checkPermission('read'), (req, res) => {
  const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(req.params.id);
  if (!doc) return res.status(404).json({ error: 'Document not found' });

  createAudit({
    action: 'DOWNLOAD',
    documentId: doc.id,
    actorId: req.user.id,
    actorEmail: req.user.email,
    ip: req.ip,
  });

  res.download(path.resolve('uploads', doc.filename), doc.originalName, (err) => {
    if (err && !res.headersSent) res.status(404).json({ error: 'File missing on server' });
  });
});

// Grant permission (owner only)
router.post('/:id/grant', authRequired, checkPermission('owner'), (req, res) => {
  const { userId, permission } = req.body || {}; // 'read' or 'edit'
  if (!userId || !permission) return res.status(400).json({ error: 'Missing parameters' });
  if (!['read', 'edit'].includes(permission))
    return res.status(400).json({ error: "permission must be 'read' or 'edit'" });
  if (!db.prepare('SELECT 1 FROM users WHERE id = ?').get(userId))
    return res.status(404).json({ error: 'User not found' });
  if (!db.prepare('SELECT 1 FROM documents WHERE id = ?').get(req.params.id))
    return res.status(404).json({ error: 'Document not found' });

  db.prepare('INSERT OR REPLACE INTO document_permissions (id, documentId, userId, permission, grantedBy, grantedAt) VALUES (?, ?, ?, ?, ?, ?)').run(
    uuid(),
    req.params.id,
    userId,
    permission,
    req.user.id,
    new Date().toISOString()
  );

  createAudit({
    action: `GRANT_${permission.toUpperCase()}`,
    documentId: req.params.id,
    actorId: req.user.id,
    actorEmail: req.user.email,
    targetUserId: userId,
    ip: req.ip,
  });

  res.json({ ok: true });
});

// Revoke permission (owner only)
router.post('/:id/revoke', authRequired, checkPermission('owner'), (req, res) => {
  const { userId } = req.body || {};
  if (!userId) return res.status(400).json({ error: 'Missing userId' });

  db.prepare('DELETE FROM document_permissions WHERE documentId = ? AND userId = ?').run(
    req.params.id,
    userId
  );

  createAudit({
    action: 'REVOKE',
    documentId: req.params.id,
    actorId: req.user.id,
    actorEmail: req.user.email,
    targetUserId: userId,
    ip: req.ip,
  });

  res.json({ ok: true });
});

export default router;
