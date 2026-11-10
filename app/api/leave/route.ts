import { db } from '@/lib/db';
import { body, endpoint, HttpError, json, user, writable } from '@/lib/http';
import { leaveInput } from '@/lib/validation';
import { snapshot } from '@/lib/snapshot';
export async function GET() { return endpoint(async () => json((await snapshot(await user())).leaves)); }
export async function POST(request: Request) { return endpoint(async () => {
  const u = await user(); writable(u);
  const input = leaveInput.parse(await body(request));
  if (u.role !== 'Administrator' && input.staffId !== u.id) throw new HttpError(403, 'You can only apply for your own leave.');
  const target = await db.staff.findUnique({ where: { id: input.staffId } });
  if (!target || target.status !== 'Active' || target.role === 'Read-only Demo') throw new HttpError(400, 'Choose an active staff member.');
  const overlap = await db.leave.findFirst({ where: { staffId: input.staffId, status: { in: ['Pending', 'Approved'] }, start: { lte: input.end }, end: { gte: input.start } } });
  if (overlap) throw new HttpError(409, 'An active leave request overlaps those dates.');
  const result = await db.$transaction(async tx => {
    const leave = await tx.leave.create({ data: input });
    await tx.activity.create({ data: { staffId: target.id, name: target.name, text: 'submitted a leave request', kind: 'leave' } });
    return { id: leave.id };
  });
  return json(result, 201);
}); }
