import { db } from '@/lib/db';
import { admin, body, endpoint, HttpError, json, recordId, user } from '@/lib/http';
import { departmentInput } from '@/lib/validation';
type Context = { params: Promise<{ id: string }> };
export async function PATCH(request: Request, context: Context) { return endpoint(async () => {
  const u = await user(); admin(u);
  const id = recordId((await context.params).id);
  const input = departmentInput.parse(await body(request));
  if (input.headId) {
    const head = await db.staff.findUnique({ where: { id: input.headId } });
    if (!head || head.departmentId !== id || head.status !== 'Active' || head.role !== 'Department Head') throw new HttpError(400, 'Choose an active Department Head assigned to this department.');
  }
  return json(await db.department.update({ where: { id }, data: input }));
}); }
