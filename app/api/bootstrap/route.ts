import { endpoint, json, user } from '@/lib/http';
import { snapshot } from '@/lib/snapshot';
export async function GET() { return endpoint(async () => json(await snapshot(await user()))); }
