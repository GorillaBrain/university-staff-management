import { randomBytes } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!url || !new URL(url).hostname.endsWith('.neon.tech')) throw new Error('Load the intended Neon production environment before running this script.');
const filename = '.local/cloud-seed.json';
const credentials = existsSync(filename) ? JSON.parse(readFileSync(filename, 'utf8')) : { password: randomBytes(24).toString('base64url'), demoPassword: randomBytes(18).toString('base64url') };
if (!existsSync(filename)) writeFileSync(filename, JSON.stringify(credentials), { mode: 0o600 });
const env = { ...process.env, DATABASE_URL: url, SEED_PASSWORD: credentials.password, SEED_DEMO_PASSWORD: credentials.demoPassword, ALLOW_PRODUCTION_SEED: '1' };
for (const args of [['node_modules/prisma/build/index.js', 'migrate', 'deploy'], ['--import', 'tsx', 'prisma/seed.ts']]) {
  const result = spawnSync(process.execPath, args, { env, stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status || 1);
}
writeFileSync('.local/cloud-accounts.txt', `SECURE HOSTED APPLICATION — FICTIONAL DATA\nPrivate administrator account: sarah.johnson@university.example\nPrivate seed password: ${credentials.password}\nDo not share administrator credentials publicly.\n\nPublic read-only demonstration account: demo@university.example\nPublic demo password: ${credentials.demoPassword}\n`, { mode: 0o600 });
console.log('Managed database migrated and seeded. Credentials saved in ignored .local/cloud-accounts.txt; no privileged password was printed.');
