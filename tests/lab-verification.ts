import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';

const env = readFileSync('.local/lab-app/.env.local', 'utf8');
const databaseUrl = JSON.parse(env.match(/^DATABASE_URL=(.+)$/m)![1]);
if (new URL(databaseUrl).pathname !== '/usms_lab') throw new Error('Use the local dummy database only.');
const db = new PrismaClient({ datasourceUrl: databaseUrl });
const base = 'http://127.0.0.1:3002';
const results: Record<string, unknown> = { timestamp: new Date().toISOString(), target: base, environment: 'Independent audit source, local PostgreSQL; Docker isolation not exercised on this machine', tool: 'Node.js HTTP replay checks; not Burp Suite' };
let cookie = '';
const get = async (path: string) => { const response = await fetch(base + path, { headers: { Cookie: cookie } }); return { status: response.status, data: await response.json() }; };
try {
  const response = await fetch(base + '/api/auth/login', { method: 'POST', headers: { Origin: base, 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'michael.chen@university.example', password: 'UniversityLab123!' }) });
  assert.equal(response.status, 200); cookie = response.headers.get('set-cookie')!.split(';')[0];
  const own = await get('/api/staff/7'), other = await get('/api/staff/8');
  assert.equal(own.status, 200); assert.equal(other.status, 200); assert.equal(other.data.name, 'Emily Davis');
  results.idor = { originalRequest: 'GET /api/staff/7', modifiedRequest: 'GET /api/staff/8', cookie: '[redacted]', originalStatus: own.status, modifiedStatus: other.status, exposedFictionalRecord: other.data.name };
  const noMatch = await get('/api/staff?q=NoSuchPersonZZ');
  const injected = await get('/api/staff?q=' + encodeURIComponent("NoSuchPersonZZ' OR TRUE--"));
  assert.equal(noMatch.data.length, 0); assert.equal(injected.data.length, 30);
  results.inputHandling = { baselineRows: noMatch.data.length, modifiedInput: "NoSuchPersonZZ' OR TRUE--", modifiedRows: injected.data.length, scope: 'Fictional staff names only; no destructive payload used' };
  const id = createHmac('sha256', 'USMS-FICTIONAL-LAB-SECRET-DO-NOT-USE-IN-PRODUCTION').update(cookie.split('=')[1]).digest('hex');
  await db.session.update({ where: { id }, data: { expiresAt: new Date(Date.now() - 1000), lastSeenAt: new Date(Date.now() - 1801000) } });
  const expired = await get('/api/auth/me'); assert.equal(expired.status, 200);
  results.session = { statusWithExpiredServerRecord: expired.status, method: 'Moved only this test session’s expiry/last-seen timestamps into the past; this is an expiry-boundary replay test, not a claim that 30 minutes elapsed in real time.', cookieAttributes: response.headers.get('set-cookie')!.replace(cookie, '[redacted]') };
  const headers = await fetch(base + '/login');
  results.headers = { contentSecurityPolicy: headers.headers.get('content-security-policy'), frameOptions: headers.headers.get('x-frame-options'), contentTypeOptions: headers.headers.get('x-content-type-options') };
  assert.equal(headers.headers.get('content-security-policy'), null);
  await db.session.deleteMany({ where: { id } });
  console.log('PASS Local IDOR, unsafe input, expired-session replay and missing-header controls reproduced.');
} finally {
  await db.$disconnect();
  writeFileSync('security-audit/evidence/lab-verification.json', JSON.stringify(results, null, 2));
}
