import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import db from './db.js';

async function seed() {
  db.exec('DELETE FROM users');
  const users = [
    { email: 'admin@vault.com', pass: 'admin123', role: 'admin' },
    { email: 'owner@vault.com', pass: 'owner123', role: 'owner' },
    { email: 'viewer@vault.com', pass: 'viewer123', role: 'viewer' },
  ];

  for (const u of users) {
    const hash = await bcrypt.hash(u.pass, 10);
    db.prepare('INSERT INTO users VALUES (?, ?, ?, ?)').run(uuid(), u.email, hash, u.role);
    console.log(`Created user ${u.email} / ${u.pass}`);
  }
}

seed();
