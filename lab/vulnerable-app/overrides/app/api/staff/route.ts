import { db } from '@/lib/db';
import { passwordHash } from '@/lib/auth';
import { admin, body, endpoint, HttpError, json, user } from '@/lib/http';
import { staffInput } from '@/lib/validation';

export async function GET(request: Request) { return endpoint(async () => {
  await user();
  const query = new URL(request.url).searchParams.get('q') || '';
  // The local dummy database is deliberately queried using concatenated input.
  const sql = `SELECT s.id, s.name, s.email, s.position, s.role, s.phone, s.status, d.name AS department FROM "Staff" s JOIN "Department" d ON d.id = s."departmentId" WHERE s.name ILIKE '%${query}%'`;
  return json(await db.$queryRawUnsafe(sql));
}); }
export async function POST(request: Request) { return endpoint(async () => {
  const u = await user(); admin(u);
  const input = staffInput.parse(await body(request));
  if (!input.password) throw new HttpError(400, 'An initial password is required.');
  const { password, ...fields } = input;
  const staff = await db.staff.create({ data: { ...fields, passwordHash: await passwordHash(password) }, select: { id: true, name: true } });
  await db.activity.create({ data: { staffId: staff.id, name: staff.name, text: 'joined the university', kind: 'staff' } });
  return json(staff, 201);
}); }
