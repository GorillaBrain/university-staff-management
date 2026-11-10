import EmbeddedPostgres from 'embedded-postgres';
import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const local = path.join(root, '.local');
mkdirSync(local, { recursive: true });
const credentialFile = path.join(local, 'postgres.json');
const credentials = existsSync(credentialFile) ? JSON.parse(readFileSync(credentialFile, 'utf8')) : { user: 'usms', password: randomBytes(24).toString('hex'), port: 5433 };
if (!existsSync(credentialFile)) writeFileSync(credentialFile, JSON.stringify(credentials), { mode: 0o600 });
const pg = new EmbeddedPostgres({ databaseDir: path.join(local, 'postgres'), ...credentials, persistent: true, authMethod: 'scram-sha-256', postgresFlags: ['-h', '127.0.0.1'], onLog: () => {}, onError: message => { if (/fatal|error/i.test(String(message))) console.error(String(message)); } });
if (!existsSync(path.join(local, 'postgres', 'PG_VERSION'))) await pg.initialise();
await pg.start();
const client = pg.getPgClient(); await client.connect();
const found = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", ['usms_secure']);
await client.end();
if (!found.rowCount) await pg.createDatabase('usms_secure');
if (!existsSync('.env.local')) {
  const password = randomBytes(18).toString('base64url');
  const demo = randomBytes(18).toString('base64url');
  writeFileSync('.env.local', `DATABASE_URL="postgresql://${credentials.user}:${credentials.password}@127.0.0.1:${credentials.port}/usms_secure?schema=public"\nAPP_ORIGIN="http://127.0.0.1:3000"\nAUTH_COOKIE_SECURE="false"\nSEED_PASSWORD="${password}"\nSEED_DEMO_PASSWORD="${demo}"\n`, { mode: 0o600 });
  writeFileSync(path.join(local, 'accounts.txt'), `LOCAL FICTIONAL ACCOUNTS ONLY\nAdministrator: sarah.johnson@university.example\nDepartment head (IT): daniel.lee@university.example\nStaff (IT): michael.chen@university.example\nStaff (Business): emily.davis@university.example\nAll 30 staff use the generated local seed password: ${password}\nRead-only demo: demo@university.example\nDemo password: ${demo}\n`, { mode: 0o600 });
}
console.log('PostgreSQL ready on 127.0.0.1:5433. Local credentials are in .local/accounts.txt (ignored by Git).');
async function stop() { await pg.stop(); process.exit(0); }
process.on('SIGINT', stop); process.on('SIGTERM', stop);
setInterval(() => {}, 60000);
