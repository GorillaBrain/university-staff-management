import { db } from '@/lib/db';
import { body, endpoint, json, user, writable } from '@/lib/http';
import { profileInput } from '@/lib/validation';
export async function PATCH(request: Request) { return endpoint(async () => {
  const u = await user(); writable(u);
  const input = profileInput.parse(await body(request));
  await db.$transaction([db.staff.update({ where: { id: u.id }, data: input }), db.activity.create({ data: { staffId: u.id, name: input.name, text: 'updated their profile information', kind: 'profile' } })]);
  return json({ ok: true });
}); }
