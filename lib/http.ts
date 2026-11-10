import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { currentUser, type User } from './auth';

export class HttpError extends Error { constructor(public status: number, message: string) { super(message); } }
export const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'private, no-store' } });
export async function endpoint(action: () => Promise<Response>) {
  try { return await action(); } catch (error) {
    if (error instanceof HttpError) return json({ error: error.message }, error.status);
    if (error instanceof ZodError) return json({ error: error.issues.map(i => `${i.path.join('.') || 'Input'}: ${i.message}`).join('; ') }, 400);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') return json({ error: 'That email, code or record already exists.' }, 409);
      if (error.code === 'P2025') return json({ error: 'Record not found.' }, 404);
      if (error.code === 'P2003') return json({ error: 'A related record does not exist.' }, 400);
    }
    console.error('Request failed:', error instanceof Error ? error.name : 'Unknown error');
    return json({ error: 'The request could not be completed. Please try again.' }, 500);
  }
}
export async function user() { const u = await currentUser(); if (!u) throw new HttpError(401, 'Please sign in to continue.'); return u; }
export function admin(u: User) { if (u.role !== 'Administrator') throw new HttpError(403, 'Administrator access is required.'); }
export function canView(u: User, target: { id: number; departmentId: number }) { return u.role === 'Administrator' || u.role === 'Read-only Demo' || u.id === target.id || (u.role === 'Department Head' && u.departmentId === target.departmentId); }
export function writable(u: User) { if (u.role === 'Read-only Demo') throw new HttpError(403, 'This demonstration account is read-only.'); }
export function scope(u: User) { return ['Administrator', 'Read-only Demo'].includes(u.role) ? {} : u.role === 'Department Head' ? { departmentId: u.departmentId } : { id: u.id }; }
export async function body(request: Request) {
  // JSON-only mutations plus an exact same-origin check prevent cross-site form submissions.
  const origin = request.headers.get('origin');
  const expected = process.env.APP_ORIGIN || new URL(request.url).origin;
  if (!origin || origin !== expected) throw new HttpError(403, 'The request origin is not permitted.');
  if (!request.headers.get('content-type')?.startsWith('application/json')) throw new HttpError(415, 'Send application/json.');
  if (Number(request.headers.get('content-length') || 0) > 16384) throw new HttpError(413, 'The request is too large.');
  const text = await request.text();
  if (Buffer.byteLength(text) > 16384) throw new HttpError(413, 'The request is too large.');
  try { return JSON.parse(text); } catch { throw new HttpError(400, 'Invalid JSON.'); }
}
export function recordId(value: string) { const id = Number(value); if (!Number.isSafeInteger(id) || id < 1) throw new HttpError(400, 'Invalid record identifier.'); return id; }
