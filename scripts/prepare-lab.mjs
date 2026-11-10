import { cpSync, copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

// Materialize an independent audit source tree. The secure application never imports it.
const output = path.resolve('.local/lab-app');
mkdirSync(output, { recursive: true });
for (const name of ['app', 'components', 'lib', 'prisma', 'public']) cpSync(name, path.join(output, name), { recursive: true });
for (const name of ['package.json', 'package-lock.json', 'tsconfig.json', 'postcss.config.mjs']) copyFileSync(name, path.join(output, name));
cpSync('lab/vulnerable-app/overrides', output, { recursive: true });
copyFileSync('lab/vulnerable-app/guard.mjs', path.join(output, 'guard.mjs'));
if (!existsSync(path.join(output, 'node_modules'))) {
  const { symlinkSync } = await import('node:fs'); symlinkSync(path.resolve('node_modules'), path.join(output, 'node_modules'), 'junction');
}
console.log('Independent audit source prepared in .local/lab-app. Start only with AUDIT_LAB_ONLY=1 and the usms_lab database.');
