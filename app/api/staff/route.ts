import { db } from '@/lib/db';
import { passwordHash } from '@/lib/auth';
import { admin, body, endpoint, HttpError, json, user } from '@/lib/http';
import { staffInput } from '@/lib/validation';
import { snapshot } from '@/lib/snapshot';

export async function GET(request: Request) { return endpoint(async () => {
  const data = await snapshot(await user());
  const params = new URL(request.url).searchParams;
  const q = (params.get('q') || '').slice(0, 100).toLowerCase();
  const department = params.get('department');
  return json(data.staff.filter(s => `${s.name} ${s.email}`.toLowerCase().includes(q) && (!department || s.department === department)));
}); }
export async function POST(request: Request) { return endpoint(async () => {
  const u = await user(); admin(u);
  const input = staffInput.parse(await body(request));
  if (!input.password) throw new HttpError(400, 'An initial password of at least 12 characters is required.');
  const { password, ...fields } = input;
  const staff = await db.staff.create({ data: { ...fields, passwordHash: await passwordHash(password) }, select: { id: true, name: true } });
  await db.activity.create({ data: { staffId: staff.id, name: staff.name, text: 'joined the university', kind: 'staff' } });
  return json(staff, 201);
}); }
