import Database from 'better-sqlite3';
const db = new Database(process.env.DB_PATH || 'trustvault.db');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, email TEXT UNIQUE, password TEXT, role TEXT
);
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY, filename TEXT, originalName TEXT, ownerId TEXT,
  mimeType TEXT, size INTEGER, createdAt TEXT
);
CREATE TABLE IF NOT EXISTS document_permissions (
  id TEXT PRIMARY KEY, documentId TEXT, userId TEXT, permission TEXT,
  grantedBy TEXT, grantedAt TEXT,
  UNIQUE(documentId, userId)
);
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY, action TEXT, documentId TEXT, actorId TEXT,
  actorEmail TEXT, targetUserId TEXT, ip TEXT, timestamp TEXT,
  prevHash TEXT, currHash TEXT
);
`);

export default db;
