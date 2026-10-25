import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs';

const PORT = 3911;
const base = `http://localhost:${PORT}`;
let server;

const api = (p, o = {}) => fetch(base + p, o).then(async (r) => ({ status: r.status, body: await r.json().catch(() => ({})) }));
const json = (token, body) => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
  body: JSON.stringify(body),
});

before(async () => {
  fs.rmSync('test.db', { force: true });
  const env = { ...process.env, PORT, JWT_SECRET: 'test', DB_PATH: 'test.db' };
  await new Promise((res) => spawn('node', ['src/seed.js'], { env }).on('close', res));
  server = spawn('node', ['src/app.js'], { env });
  await new Promise((r) => setTimeout(r, 1000));
});
after(() => { server.kill(); fs.rmSync('test.db', { force: true }); });

const login = async (email, password) => (await api('/api/auth/login', json(null, { email, password }))).body;

test('login works and bad password fails', async () => {
  assert.ok((await login('owner@vault.com', 'owner123')).token);
  assert.equal((await api('/api/auth/login', json(null, { email: 'owner@vault.com', password: 'x' }))).status, 401);
});

test('register cannot self-assign admin', async () => {
  await api('/api/auth/register', json(null, { email: 'x@y.com', password: 'p', role: 'admin' }));
  assert.equal((await login('x@y.com', 'p')).user.role, 'viewer');
});

test('admin routes require admin', async () => {
  const v = await login('viewer@vault.com', 'viewer123');
  assert.equal((await api('/api/admin/users', { headers: { Authorization: `Bearer ${v.token}` } })).status, 403);
  const a = await login('admin@vault.com', 'admin123');
  assert.equal((await api('/api/admin/audit', { headers: { Authorization: `Bearer ${a.token}` } })).status, 200);
});

test('non-owner cannot download until granted', async () => {
  const o = await login('owner@vault.com', 'owner123');
  const v = await login('viewer@vault.com', 'viewer123');
  const fd = new FormData();
  fd.append('file', new Blob(['hello'], { type: 'text/plain' }), 'a.txt');
  const up = await api('/api/documents/upload', { method: 'POST', headers: { Authorization: `Bearer ${o.token}` }, body: fd });
  assert.equal(up.status, 200);
  const dl = (t) => fetch(`${base}/api/documents/${up.body.id}/download`, { headers: { Authorization: `Bearer ${t}` } });
  assert.equal((await dl(v.token)).status, 403);
  assert.equal((await api(`/api/documents/${up.body.id}/grant`, json(o.token, { userId: v.user.id, permission: 'read' }))).status, 200);
  assert.equal((await dl(v.token)).status, 200);
  await api(`/api/documents/${up.body.id}/revoke`, json(o.token, { userId: v.user.id }));
  assert.equal((await dl(v.token)).status, 403);
});
