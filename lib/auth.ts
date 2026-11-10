import { createHash, randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { compare, hash } from 'bcryptjs';
import { db } from './db';

export const COOKIE = 'usms_session';
export const sessionDigest = (token: string) => createHash('sha256').update(token).digest('hex');
export const secureCookie = () => Boolean(process.env.VERCEL) || process.env.AUTH_COOKIE_SECURE === 'true';
export const sessionTtl = () => Math.min(28800, Math.max(60, Number(process.env.SESSION_TTL_SECONDS) || 28800));
export const idleTtl = () => Math.min(1800, Math.max(60, Number(process.env.SESSION_IDLE_SECONDS) || 1800));
export const passwordHash = (password: string) => hash(password, 12);
export const passwordMatches = (password: string, digest: string) => compare(password, digest);

export async function currentUser() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  const session = await db.session.findUnique({ where: { id: sessionDigest(token) }, include: { staff: true } });
  if (!session) return null;
  const now = new Date();
  if (session.expiresAt <= now || now.getTime() - session.lastSeenAt.getTime() > idleTtl() * 1000 || session.staff.status !== 'Active') {
    await db.session.deleteMany({ where: { id: session.id } });
    return null;
  }
  // Updating once per minute reduces writes while retaining server-enforced idle expiry.
  if (now.getTime() - session.lastSeenAt.getTime() >= 60000) await db.session.updateMany({ where: { id: session.id }, data: { lastSeenAt: now } });
  return { ...session.staff, sessionId: session.id };
}
export type User = NonNullable<Awaited<ReturnType<typeof currentUser>>>;

export async function createSession(staffId: number) {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + sessionTtl() * 1000);
  await db.session.create({ data: { id: sessionDigest(token), staffId, expiresAt } });
  (await cookies()).set(COOKIE, token, { httpOnly: true, secure: secureCookie(), sameSite: 'lax', path: '/', maxAge: sessionTtl(), expires: expiresAt });
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { id: sessionDigest(token) } });
  store.set(COOKIE, '', { httpOnly: true, secure: secureCookie(), sameSite: 'lax', path: '/', maxAge: 0 });
}
