import pg from 'pg';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';

const url = new URL(process.env.DATABASE_URL || '');
if (url.hostname !== '127.0.0.1' || url.pathname !== '/usms_secure') throw new Error('Use the local secure database connection for setup.');
const client = new pg.Client({ connectionString: url.toString() }); await client.connect();
const result = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', ['usms_lab']);
if (!result.rowCount) await client.query('CREATE DATABASE usms_lab');
const passwordFile = '.local/lab-database-password.txt';
const labPassword = existsSync(passwordFile) ? readFileSync(passwordFile, 'utf8') : randomBytes(24).toString('hex');
if (!/^[a-f0-9]{48}$/.test(labPassword)) throw new Error('Unexpected local audit database credential format.');
if (!existsSync(passwordFile)) writeFileSync(passwordFile, labPassword, { mode: 0o600 });
const role = await client.query('SELECT 1 FROM pg_roles WHERE rolname = $1', ['usms_lab_user']);
if (!role.rowCount) await client.query(`CREATE ROLE usms_lab_user LOGIN PASSWORD '${labPassword}' NOSUPERUSER NOCREATEDB NOCREATEROLE`);
await client.query('REVOKE CONNECT ON DATABASE usms_secure FROM PUBLIC');
await client.end();
url.pathname = '/usms_lab';
const owner = new pg.Client({ connectionString: url.toString() }); await owner.connect();
await owner.query('ALTER SCHEMA public OWNER TO usms_lab_user');
const tables = await owner.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public'");
for (const { tablename } of tables.rows) await owner.query('ALTER TABLE public."' + tablename.replaceAll('"', '""') + '" OWNER TO usms_lab_user');
const sequences = await owner.query("SELECT sequencename FROM pg_sequences WHERE schemaname = 'public'");
for (const { sequencename } of sequences.rows) await owner.query('ALTER SEQUENCE public."' + sequencename.replaceAll('"', '""') + '" OWNER TO usms_lab_user');
await owner.end();
url.username = 'usms_lab_user'; url.password = labPassword;
const environment = { ...process.env, DATABASE_URL: url.toString(), SEED_PASSWORD: 'UniversityLab123!', SEED_DEMO_PASSWORD: '', APP_ORIGIN: 'http://127.0.0.1:3002', AUDIT_LAB_ONLY: '1' };
writeFileSync('.local/lab-app/.env.local', `DATABASE_URL=${JSON.stringify(environment.DATABASE_URL)}\nSEED_PASSWORD="UniversityLab123!"\nAPP_ORIGIN="http://127.0.0.1:3002"\nAUDIT_LAB_ONLY="1"\nAUTH_COOKIE_SECURE="false"\n`);
for (const args of [['node_modules/prisma/build/index.js', 'migrate', 'deploy'], ['--import', 'tsx', 'prisma/seed.ts']]) {
  const processResult = spawnSync(process.execPath, args, { env: environment, stdio: 'inherit' });
  if (processResult.status !== 0) process.exit(processResult.status || 1);
}
console.log('Separate local audit database initialized. Docker container verification remains a separate check.');
