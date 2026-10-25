import db from '../db.js';
import crypto from 'crypto';
import { v4 as uuid } from 'uuid';

export function createAudit({
  action,
  documentId,
  actorId,
  actorEmail,
  targetUserId,
  ip,
}) {
  const last = db
    .prepare('SELECT currHash FROM audit_logs ORDER BY rowid DESC LIMIT 1')
    .get();
  const prevHash = last?.currHash || 'GENESIS';
  const timestamp = new Date().toISOString();
  const data = `${action}|${documentId}|${actorId}|${targetUserId || ''}|${timestamp}|${prevHash}`;
  const currHash = crypto.createHash('sha256').update(data).digest('hex');

  db.prepare(
    `INSERT INTO audit_logs 
    (id, action, documentId, actorId, actorEmail, targetUserId, ip, timestamp, prevHash, currHash)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    uuid(),
    action,
    documentId,
    actorId,
    actorEmail,
    targetUserId || null,
    ip,
    timestamp,
    prevHash,
    currHash
  );
}
