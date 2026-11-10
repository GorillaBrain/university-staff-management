import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';

const db = new PrismaClient();
const origin = process.env.TEST_ORIGIN || 'http://127.0.0.1:3001';
if (!['127.0.0.1', 'localhost'].includes(new URL(origin).hostname) || !process.env.DATABASE_URL?.includes('/usms_secure')) throw new Error('Integration tests are restricted to the local secure database.');
const password = process.env.SEED_PASSWORD!;
const checks: { check: string; passed: boolean }[] = [];
const marker = 'test-' + Date.now();
let tempStaff = 0, tempDepartment = 0;
const leaveIds: number[] = [];
async function call(path: string, cookie = '', method = 'GET', fields?: unknown, customOrigin = origin) {
  const response = await fetch(origin + path, { method, headers: { ...(cookie ? { Cookie: cookie } : {}), ...(method !== 'GET' ? { Origin: customOrigin, 'Content-Type': 'application/json' } : {}) }, ...(fields === undefined ? {} : { body: JSON.stringify(fields) }), redirect: 'manual' });
  const content = await response.text(); let data: any; try { data = JSON.parse(content); } catch { data = content; }
  return { response, data };
}
async function login(email: string, pass = password) {
  const { response } = await call('/api/auth/login', '', 'POST', { email, password: pass });
  assert.equal(response.status, 200, 'Login must succeed for ' + email);
  const cookie = response.headers.get('set-cookie')!;
  assert.match(cookie, /HttpOnly/i); assert.match(cookie, /SameSite=lax/i);
  return cookie.split(';')[0];
}
function passed(check: string) { checks.push({ check, passed: true }); console.log('PASS ' + check); }
try {
  assert.equal((await call('/api/bootstrap')).response.status, 401); passed('Anonymous records require authentication');
  const page = await fetch(origin + '/login');
  assert.match(page.headers.get('content-security-policy') || '', /nonce-/); assert.equal(page.headers.get('x-frame-options'), 'DENY'); assert.equal(page.headers.get('x-content-type-options'), 'nosniff'); passed('Secure response headers and nonce CSP');
  const administrator = await login('sarah.johnson@university.example');
  const head = await login('daniel.lee@university.example');
  const staff = await login('michael.chen@university.example');
  const otherHead = await login('nur.aisyah@university.example');
  const info = await call('/api/bootstrap', administrator);
  assert.equal(info.data.staff.length, 30); assert.equal(info.data.departments.length, 5);
  assert.equal(JSON.stringify(info.data).includes('passwordHash'), false); passed('Database seed counts and safe response projection');
  assert.equal((await call('/api/staff/8', staff)).response.status, 404);
  assert.equal((await call('/api/staff/8', head)).response.status, 404);
  assert.equal((await call('/api/staff/7', head)).response.status, 200);
  assert.equal((await call('/api/bootstrap', staff)).data.staff.length, 1);
  assert.equal((await call('/api/bootstrap', head)).data.staff.every((s: any) => s.department === 'Information Technology'), true); passed('Own-record and department scope; IDOR blocked');
  assert.equal((await call('/api/profile', staff, 'PATCH', { name: 'Example', email: 'example@university.example', phone: '', role: 'Administrator' })).response.status, 400); passed('Profile mass assignment blocked');
  assert.equal((await call('/api/staff', staff, 'POST', {})).response.status, 403);
  assert.equal((await call('/api/departments', head, 'POST', {})).response.status, 403); passed('Administrative CRUD protected from staff and heads');
  assert.equal((await call('/api/settings', administrator, 'PATCH', {}, 'https://attacker.invalid')).response.status, 403); passed('Cross-origin mutation blocked');
  const injection = await call('/api/staff?q=' + encodeURIComponent("' OR TRUE--"), administrator);
  assert.equal(injection.response.status, 200); assert.equal(injection.data.length, 0); passed('Search treats SQL syntax as ordinary input');
  const department = await call('/api/departments', administrator, 'POST', { name: marker, code: marker.slice(-9), headId: null });
  assert.equal(department.response.status, 201); tempDepartment = department.data.id;
  const fixture = { name: marker, email: marker + '@university.example', departmentId: tempDepartment, position: 'Test Lecturer', role: 'Department Head', phone: '+60 3 5550 0000', status: 'Active', password };
  const created = await call('/api/staff', administrator, 'POST', fixture); assert.equal(created.response.status, 201); tempStaff = created.data.id;
  assert.equal((await call('/api/departments/' + tempDepartment, administrator, 'PATCH', { name: marker, code: marker.slice(-9), headId: tempStaff })).response.status, 200);
  assert.equal((await call('/api/staff/' + tempStaff, administrator, 'PATCH', { ...fixture, position: 'Senior Lecturer', password: undefined })).response.status, 200); passed('Staff and department create/edit/head assignment');
  const newAccount = await login(fixture.email);
  const newAccount2 = await login(fixture.email);
  assert.equal((await call('/api/attendance', newAccount, 'POST', { action: 'check-in' })).response.status, 200);
  assert.equal((await call('/api/attendance', newAccount, 'POST', { action: 'check-in' })).response.status, 409);
  assert.equal((await call('/api/attendance', newAccount, 'POST', { action: 'check-out' })).response.status, 200);
  assert.equal((await call('/api/attendance', newAccount, 'POST', { action: 'check-out' })).response.status, 409); passed('Attendance check-in/check-out and duplicate rejection');
  const start = '2027-06-15', end = '2027-06-16';
  assert.equal((await call('/api/leave', staff, 'POST', { staffId: 8, start, end, type: 'Annual leave', reason: marker })).response.status, 403);
  const leave = await call('/api/leave', staff, 'POST', { staffId: 7, start, end, type: 'Annual leave', reason: marker }); assert.equal(leave.response.status, 201); leaveIds.push(leave.data.id);
  assert.equal((await call('/api/leave/review', otherHead, 'POST', { ids: leaveIds, status: 'Approved' })).response.status, 403);
  assert.equal((await call('/api/leave/review', staff, 'POST', { ids: leaveIds, status: 'Approved' })).response.status, 403);
  assert.equal((await call('/api/leave/review', head, 'POST', { ids: leaveIds, status: 'Approved' })).response.status, 200);
  assert.equal((await call('/api/leave/review', administrator, 'POST', { ids: leaveIds, status: 'Rejected' })).response.status, 409); passed('Leave submission, department approval, cross-department denial and review locking');
  const own = await call('/api/leave', head, 'POST', { staffId: 2, start, end, type: 'Annual leave', reason: marker }); assert.equal(own.response.status, 201); leaveIds.push(own.data.id);
  assert.equal((await call('/api/leave/review', head, 'POST', { ids: [own.data.id], status: 'Approved' })).response.status, 403); passed('Managers cannot approve their own leave');
  assert.equal((await call('/api/profile', newAccount, 'PATCH', { name: marker + ' Updated', email: fixture.email, phone: '+60 3 5550 1234' })).response.status, 200);
  assert.equal((await call('/api/auth/password', newAccount, 'POST', { currentPassword: password, newPassword: 'Changed-local-test-123!' })).response.status, 200);
  assert.equal((await call('/api/auth/me', newAccount)).response.status, 401);
  assert.equal((await call('/api/auth/me', newAccount2)).response.status, 401);
  const changedAccount = await login(fixture.email, 'Changed-local-test-123!'); passed('Profile updates and password change invalidate every session');
  assert.equal((await call('/api/staff/' + tempStaff, administrator, 'DELETE', {})).response.status, 200);
  assert.equal((await call('/api/auth/me', changedAccount)).response.status, 401); passed('Deactivation immediately revokes sessions');
  const expired = await login('michael.chen@university.example'); const token = expired.split('=')[1];
  await db.session.update({ where: { id: createHash('sha256').update(token).digest('hex') }, data: { expiresAt: new Date(Date.now() - 1000) } });
  assert.equal((await call('/api/auth/me', expired)).response.status, 401); passed('Server rejects expired sessions even with a replayed cookie');
  const idle = await login('michael.chen@university.example');
  await db.session.update({ where: { id: createHash('sha256').update(idle.split('=')[1]).digest('hex') }, data: { lastSeenAt: new Date(Date.now() - 1801000) } });
  assert.equal((await call('/api/auth/me', idle)).response.status, 401); passed('Server enforces inactivity timeout');
  const demo = await login('demo@university.example', process.env.SEED_DEMO_PASSWORD!);
  assert.equal((await call('/api/bootstrap', demo)).response.status, 200);
  assert.equal((await call('/api/profile', demo, 'PATCH', { name: 'Changed', email: 'changed@university.example', phone: '' })).response.status, 403);
  assert.equal((await call('/api/attendance', demo, 'POST', { action: 'check-in' })).response.status, 403); passed('Public demonstration account is read-only');
  await call('/api/auth/logout', staff, 'POST', {}); assert.equal((await call('/api/auth/me', staff)).response.status, 401); passed('Logout revokes the server-side session');
  const invalid = marker + '@invalid.example';
  for (let i = 0; i < 10; i++) assert.equal((await call('/api/auth/login', '', 'POST', { email: invalid, password: 'wrong-password' })).response.status, 401);
  assert.equal((await call('/api/auth/login', '', 'POST', { email: invalid, password: 'wrong-password' })).response.status, 429);
  await db.loginAttempt.deleteMany({ where: { key: createHash('sha256').update(invalid).digest('hex') } }); passed('Repeated invalid logins are throttled');
} finally {
  await db.leave.deleteMany({ where: { reason: marker } });
  if (tempDepartment) await db.department.updateMany({ where: { id: tempDepartment }, data: { headId: null } });
  if (tempStaff) await db.staff.deleteMany({ where: { id: tempStaff } });
  if (tempDepartment) await db.department.deleteMany({ where: { id: tempDepartment } });
  await db.$disconnect();
  mkdirSync('security-audit/evidence', { recursive: true });
  writeFileSync('security-audit/evidence/verification.json', JSON.stringify({ timestamp: new Date().toISOString(), target: origin, tool: 'Node.js HTTP integration tests (not ZAP or Burp)', checks }, null, 2));
}
console.log(`Verified ${checks.length} integration checks.`);
