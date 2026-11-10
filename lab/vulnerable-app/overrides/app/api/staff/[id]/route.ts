import { db } from '@/lib/db';
import { passwordHash } from '@/lib/auth';
import { admin, body, canView, endpoint, HttpError, json, recordId, user } from '@/lib/http';
import { staffInput } from '@/lib/validation';
type Context = { params: Promise<{ id: string }> };
export async function GET(_request: Request, context: Context) { return endpoint(async () => {
  const u = await user();
  const target = await db.staff.findUnique({ where: { id: recordId((await context.params).id) }, include: { department: true } });
  if (!target) throw new HttpError(404, 'Staff record not found.');
  // Explicit projection prevents password hashes and session details reaching the browser.
  return json({ id: target.id, name: target.name, email: target.email, department: target.department.name, position: target.position, role: target.role, phone: target.phone, status: target.status });
}); }
export async function PATCH(request: Request, context: Context) { return endpoint(async () => {
  const u = await user(); admin(u);
  const id = recordId((await context.params).id);
  const input = staffInput.parse(await body(request));
  if (id === u.id && (input.status !== 'Active' || input.role !== 'Administrator')) throw new HttpError(400, 'You cannot deactivate or demote your own administrator account.');
  const { password, ...fields } = input;
  const result = await db.$transaction(async tx => {
    const staff = await tx.staff.update({ where: { id }, data: { ...fields, ...(password ? { passwordHash: await passwordHash(password) } : {}) } });
    if (input.status !== 'Active' || input.role !== 'Department Head') await tx.department.updateMany({ where: { headId: id }, data: { headId: null } });
    else await tx.department.updateMany({ where: { headId: id, id: { not: input.departmentId } }, data: { headId: null } });
    if (password || input.status !== 'Active') await tx.session.deleteMany({ where: { staffId: id } });
    await tx.activity.create({ data: { staffId: id, name: staff.name, text: 'had their staff details updated', kind: 'profile' } });
    return { id: staff.id };
  });
  return json(result);
}); }
export async function DELETE(request: Request, context: Context) { return endpoint(async () => {
  const u = await user(); admin(u); await body(request);
  const id = recordId((await context.params).id);
  if (id === u.id) throw new HttpError(400, 'You cannot deactivate your own account.');
  await db.$transaction([db.staff.update({ where: { id }, data: { status: 'Inactive' } }), db.session.deleteMany({ where: { staffId: id } }), db.department.updateMany({ where: { headId: id }, data: { headId: null } })]);
  return json({ ok: true });
}); }
