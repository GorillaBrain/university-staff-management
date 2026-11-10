import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

const roots = ['app', 'components', 'lib', 'proxy.ts', 'next.config.ts'];
const files = [];
function walk(file) { if (statSync(file).isDirectory()) for (const item of readdirSync(file)) walk(path.join(file, item)); else if (/\.[cm]?[jt]sx?$/.test(file)) files.push(file); }
roots.forEach(walk);
for (const file of files) {
  const text = readFileSync(file, 'utf8');
  if (/from\s+['"][^'"]*\blab\b|require\(['"][^'"]*\blab\b|USMS-FICTIONAL-LAB-SECRET|\$queryRawUnsafe|\$executeRawUnsafe/.test(text)) throw new Error(`Local audit implementation leaked into public source: ${file}`);
}
const ignore = readFileSync('.vercelignore', 'utf8');
if (!/^lab\//m.test(ignore)) throw new Error('Vercel must exclude lab/.');
console.log(`Public-source boundary passed (${files.length} source files).`);
