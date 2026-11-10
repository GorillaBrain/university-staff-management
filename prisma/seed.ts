import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';
import { createData, today } from '../lib/data';

const db = new PrismaClient();
const seedPassword = process.env.SEED_PASSWORD;
if (!seedPassword || seedPassword.length < 12 || Buffer.byteLength(seedPassword) > 72) throw new Error('Set SEED_PASSWORD to 12–72 bytes before seeding.');
if (process.env.VERCEL && !process.env.ALLOW_PRODUCTION_SEED) throw new Error('Run a reviewed seed against the intended managed database explicitly.');
const sample = createData();
const passwordHash = await hash(seedPassword, 12);
const shiftedDate = (days: number) => { const d = new Date(today() + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + days); return d.toISOString().slice(0, 10); };
try {
  await db.department.createMany({ data: sample.departments.map(({ id, name, code }) => ({ id, name, code })), skipDuplicates: true });
  await db.staff.createMany({ data: sample.staff.map(s => ({ id: s.id, name: s.name, email: s.email, phone: s.phone, role: s.role, status: s.status, position: s.position, passwordHash, departmentId: sample.departments.find(d => d.name === s.department)!.id })), skipDuplicates: true });
  for (const d of sample.departments) await db.department.update({ where: { id: d.id }, data: { headId: sample.staff.find(s => s.name === d.head)!.id } });
  const attendance = [];
  for (let days = -14; days <= 0; days++) {
    const date = shiftedDate(days);
    if (new Date(date).getUTCDay() % 6 === 0 && days !== 0) continue;
    for (const s of sample.staff) {
      const a = sample.attendance.find(a => a.staffId === s.id)!;
      attendance.push({ staffId: s.id, date, checkIn: days === 0 && s.id === 1 ? '' : a.checkIn, checkOut: days < 0 && a.checkIn ? '05:05 PM' : '', status: days === 0 && s.id === 1 ? 'Absent' : days < 0 && a.checkIn ? 'Checked out' : a.status === 'Checked out' ? 'Present' : a.status });
    }
  }
  await db.attendance.createMany({ data: attendance, skipDuplicates: true });
  if (await db.leave.count() === 0) {
    await db.leave.createMany({ data: sample.leaves.map((l, i) => ({ id: l.id, staffId: l.staffId, start: shiftedDate(i < 6 ? 2 + i * 2 : i < 8 ? 0 : -7), end: shiftedDate(i < 6 ? 3 + i * 2 : i < 8 ? 0 : -6), type: l.type, reason: l.reason, status: l.status, ...(l.status !== 'Pending' ? { reviewerId: 1, reviewedAt: new Date() } : {}) })) });
  }
  if (await db.activity.count() === 0) await db.activity.createMany({ data: sample.activities.map((a, i) => ({ staffId: sample.staff.find(s => s.name === a.name)!.id, name: a.name, text: a.text, kind: a.kind, createdAt: new Date(Date.now() - i * 3600000) })) });
  await db.setting.upsert({ where: { id: 1 }, create: { id: 1 }, update: {} });
  await db.$executeRaw`SELECT setval(pg_get_serial_sequence('"Staff"', 'id'), GREATEST((SELECT MAX(id) FROM "Staff"), 1))`;
  if (process.env.SEED_DEMO_PASSWORD) {
    const demoPassword = process.env.SEED_DEMO_PASSWORD;
    if (demoPassword.length < 12 || Buffer.byteLength(demoPassword) > 72) throw new Error('SEED_DEMO_PASSWORD must be 12–72 bytes.');
    await db.staff.upsert({ where: { email: 'demo@university.example' }, create: { name: 'University Demo', email: 'demo@university.example', passwordHash: await hash(demoPassword, 12), role: 'Read-only Demo', position: 'Read-only Visitor', departmentId: 5 }, update: {} });
  }
  // Explicit fixture IDs need their sequences advanced before normal CRUD inserts.
  await db.$executeRaw`SELECT setval(pg_get_serial_sequence('"Staff"', 'id'), GREATEST((SELECT MAX(id) FROM "Staff"), 1))`;
  await db.$executeRaw`SELECT setval(pg_get_serial_sequence('"Department"', 'id'), GREATEST((SELECT MAX(id) FROM "Department"), 1))`;
  await db.$executeRaw`SELECT setval(pg_get_serial_sequence('"Leave"', 'id'), GREATEST((SELECT MAX(id) FROM "Leave"), 1))`;
  console.log('Seed complete: 30 fictional staff, five departments, attendance and leave records. Passwords were not printed.');
} finally { await db.$disconnect(); }
