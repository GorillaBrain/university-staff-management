import { z } from 'zod';
import { db } from '@/lib/db';
import { admin, body, endpoint, json, user, writable } from '@/lib/http';
import { settingsInput } from '@/lib/validation';
export async function PATCH(request: Request) { return endpoint(async () => {
  const u = await user(); writable(u);
  const input = settingsInput.parse(await body(request)); admin(u);
  await db.$transaction([db.setting.upsert({ where: { id: 1 }, create: { id: 1, institution: input.institution, email: input.email }, update: { institution: input.institution, email: input.email } }), db.staff.update({ where: { id: u.id }, data: { notifications: input.notifications } })]);
  return json({ ok: true });
}); }
export async function POST(request: Request) { return endpoint(async () => {
  const u = await user(); writable(u);
  const input = z.object({ notifications: z.boolean() }).strict().parse(await body(request));
  await db.staff.update({ where: { id: u.id }, data: input }); return json({ ok: true });
}); }
