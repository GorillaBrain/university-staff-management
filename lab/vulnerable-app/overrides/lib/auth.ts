import { createHmac, randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import { compare, hash } from 'bcryptjs';
import { db } from './db';

// Fictional configuration used only by the isolated audit build.
export const DEV_AUTH_SECRET = 'USMS-FICTIONAL-LAB-SECRET-DO-NOT-USE-IN-PRODUCTION';
export const COOKIE = 'usms_lab_session';
export const sessionDigest = (token: string) => createHmac('sha256', DEV_AUTH_SECRET).update(token).digest('hex');
export const secureCookie = () => false;
export const sessionTtl = () => 1800;
export const idleTtl = () => 1800;
export const passwordHash = (password: string) => hash(password, 12);
export const passwordMatches = (password: string, digest: string) => compare(password, digest);

export async function currentUser() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({ where: { id: sessionDigest(token) }, include: { staff: true } });
  if (!session || session.staff.status !== 'Active') return null;
  // The record has expiresAt/lastSeenAt, but this local implementation fails to enforce them.
  return { ...session.staff, sessionId: session.id };
}
export type User = NonNullable<Awaited<ReturnType<typeof currentUser>>>;

export async function createSession(staffId: number) {
  const token = randomBytes(32).toString('hex');
  await db.session.create({ data: { id: sessionDigest(token), staffId, expiresAt: new Date(Date.now() + 1800000) } });
  (await cookies()).set(COOKIE, token, { httpOnly: true, sameSite: 'lax', secure: false, path: '/', maxAge: 172800 });
}
export async function destroySession() {
  const store = await cookies(); const token = store.get(COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { id: sessionDigest(token) } });
  store.set(COOKIE, '', { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 0 });
}
