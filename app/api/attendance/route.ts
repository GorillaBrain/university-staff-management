import { z } from 'zod';
import { db } from '@/lib/db';
import { body, endpoint, HttpError, json, user, writable } from '@/lib/http';
import { snapshot } from '@/lib/snapshot';
import { today } from '@/lib/data';
export async function GET(request: Request) { return endpoint(async () => {
  const data = await snapshot(await user());
  const date = new URL(request.url).searchParams.get('date');
  return json(data.attendance.filter(a => !date || a.date === date));
}); }
export async function POST(request: Request) { return endpoint(async () => {
  const u = await user(); writable(u);
  const input = z.object({ action: z.enum(['check-in', 'check-out']) }).strict().parse(await body(request));
  const date = today();
  const time = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kuala_Lumpur' });
  await db.$transaction(async tx => {
    if (input.action === 'check-in') {
      const current = await tx.attendance.findUnique({ where: { staffId_date: { staffId: u.id, date } } });
      if (current?.checkIn) throw new HttpError(409, 'You have already checked in today.');
      const approvedLeave = await tx.leave.findFirst({ where: { staffId: u.id, status: 'Approved', start: { lte: date }, end: { gte: date } } });
      if (approvedLeave) throw new HttpError(409, 'You are on approved leave today.');
      if (current) {
        const updated = await tx.attendance.updateMany({ where: { id: current.id, checkIn: '' }, data: { checkIn: time, status: 'Present' } });
        if (!updated.count) throw new HttpError(409, 'You have already checked in today.');
      } else await tx.attendance.create({ data: { staffId: u.id, date, checkIn: time, status: 'Present' } });
    } else {
      const updated = await tx.attendance.updateMany({ where: { staffId: u.id, date, checkIn: { not: '' }, checkOut: '' }, data: { checkOut: time, status: 'Checked out' } });
      if (!updated.count) throw new HttpError(409, 'Check in first, or you have already checked out.');
    }
    await tx.activity.create({ data: { staffId: u.id, name: u.name, text: input.action === 'check-in' ? 'checked in for today' : 'checked out for today', kind: 'attendance' } });
  });
  return json({ ok: true });
}); }
