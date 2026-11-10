import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import path from 'node:path';

mkdirSync('.local/zap-home', { recursive: true });
if (!existsSync('.local/zap.key')) writeFileSync('.local/zap.key', randomBytes(24).toString('hex'), { mode: 0o600 });
writeFileSync('.local/zap.properties', 'api.key=' + readFileSync('.local/zap.key', 'utf8') + '\napi.addrs.addr.name=127.0.0.1\napi.addrs.addr.regex=false\n');
const child = spawn('java', ['-Xmx512m', '-jar', path.resolve('.local/tools/ZAP_2.17.0/zap-2.17.0.jar'), '-daemon', '-host', '127.0.0.1', '-port', '8090', '-dir', path.resolve('.local/zap-home'), '-configfile', path.resolve('.local/zap.properties'), '-silent'], { stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true });
const key = readFileSync('.local/zap.key', 'utf8').trim();
for (const stream of [child.stdout, child.stderr]) stream.on('data', chunk => process.stdout.write(chunk.toString().replaceAll(key, '[redacted]')));
child.on('exit', code => process.exit(code || 0));
process.on('SIGINT', () => child.kill()); process.on('SIGTERM', () => child.kill());
