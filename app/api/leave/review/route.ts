import { db } from '@/lib/db';
import { body, endpoint, HttpError, json, user, writable } from '@/lib/http';
import { reviewInput } from '@/lib/validation';
export async function POST(request: Request) { return endpoint(async () => {
  const u = await user(); writable(u);
  if (!['Administrator', 'Department Head'].includes(u.role)) throw new HttpError(403, 'Leave approval requires a manager.');
  const input = reviewInput.parse(await body(request));
  const ids = [...new Set(input.ids)];
  await db.$transaction(async tx => {
    const records = await tx.leave.findMany({ where: { id: { in: ids } }, include: { staff: true } });
    if (records.length !== ids.length) throw new HttpError(404, 'A request could not be found.');
    if (records.some(l => l.staffId === u.id || (u.role === 'Department Head' && l.staff.departmentId !== u.departmentId))) throw new HttpError(403, 'You cannot review your own leave or requests outside your department.');
    if (records.some(l => l.status !== 'Pending')) throw new HttpError(409, 'Only pending requests can be reviewed.');
    const updated = await tx.leave.updateMany({ where: { id: { in: ids }, status: 'Pending' }, data: { status: input.status, reviewerId: u.id, reviewedAt: new Date() } });
    if (updated.count !== ids.length) throw new HttpError(409, 'A request was already reviewed. Refresh and try again.');
    await tx.activity.createMany({ data: records.map(l => ({ staffId: l.staffId, name: u.name, text: `${input.status.toLowerCase()} a leave request for ${l.staff.name}`, kind: 'leave' })) });
  });
  return json({ ok: true });
}); }
