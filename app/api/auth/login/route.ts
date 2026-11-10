import { z } from 'zod';
import { createHash } from 'node:crypto';
import { db } from '@/lib/db';
import { createSession, passwordMatches, passwordHash } from '@/lib/auth';
import { body, endpoint, HttpError, json } from '@/lib/http';

// Account-based throttling is persisted in PostgreSQL and works across serverless instances.
export async function POST(request: Request) { return endpoint(async () => {
  const input = z.object({ email: z.email().max(150).transform(s => s.toLowerCase()), password: z.string().min(1).max(72) }).strict().parse(await body(request));
  const key = createHash('sha256').update(input.email).digest('hex');
  const now = new Date();
  const attempts = await db.loginAttempt.upsert({ where: { key }, create: { key, count: 1, resetAt: new Date(Date.now() + 900000) }, update: { count: { increment: 1 } } });
  if (attempts.resetAt <= now) await db.loginAttempt.update({ where: { key }, data: { count: 1, resetAt: new Date(Date.now() + 900000) } });
  else if (attempts.count > 10) throw new HttpError(429, 'Too many sign-in attempts. Try again in 15 minutes.');
  const account = await db.staff.findUnique({ where: { email: input.email } });
  const valid = account ? await passwordMatches(input.password, account.passwordHash) : await passwordMatches(input.password, await passwordHash('invalid-account-padding'));
  if (!account || !valid || account.status !== 'Active') throw new HttpError(401, 'The email or password is incorrect.');
  await createSession(account.id);
  await db.loginAttempt.deleteMany({ where: { key } });
  return json({ ok: true });
}); }
