import { db } from '@/lib/db';
import { admin, body, endpoint, HttpError, json, user } from '@/lib/http';
import { departmentInput } from '@/lib/validation';
import { snapshot } from '@/lib/snapshot';
export async function GET() { return endpoint(async () => json((await snapshot(await user())).departments)); }
export async function POST(request: Request) { return endpoint(async () => {
  const u = await user(); admin(u);
  const input = departmentInput.parse(await body(request));
  if (input.headId) throw new HttpError(400, 'Create the department, assign its staff, then choose a head.');
  return json(await db.department.create({ data: input }), 201);
}); }
