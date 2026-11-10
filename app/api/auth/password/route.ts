import { z } from 'zod';
import { db } from '@/lib/db';
import { passwordHash, passwordMatches, destroySession } from '@/lib/auth';
import { body, endpoint, HttpError, json, user, writable } from '@/lib/http';
import { password } from '@/lib/validation';
export async function POST(request: Request) { return endpoint(async () => {
  const u = await user(); writable(u);
  const input = z.object({ currentPassword: z.string().min(1).max(72), newPassword: password }).strict().parse(await body(request));
  if (!await passwordMatches(input.currentPassword, u.passwordHash)) throw new HttpError(400, 'The current password is incorrect.');
  const digest = await passwordHash(input.newPassword);
  await db.$transaction([db.staff.update({ where: { id: u.id }, data: { passwordHash: digest } }), db.session.deleteMany({ where: { staffId: u.id } })]);
  await destroySession();
  return json({ ok: true });
}); }
