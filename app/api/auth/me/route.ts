import { endpoint, json, user } from '@/lib/http';
export async function GET() { return endpoint(async () => { const u = await user(); return json({ id: u.id, name: u.name, role: u.role, departmentId: u.departmentId }); }); }
