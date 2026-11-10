import { destroySession } from '@/lib/auth';
import { body, endpoint, json } from '@/lib/http';
export async function POST(request: Request) { return endpoint(async () => { await body(request); await destroySession(); return json({ ok: true }); }); }
