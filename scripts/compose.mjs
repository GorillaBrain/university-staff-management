import { existsSync } from 'node:fs';
import { spawn } from 'node:child_process';

const windowsCompose = 'C:\\Program Files\\Docker\\Docker\\resources\\cli-plugins\\docker-compose.exe';
const standalone = process.platform === 'win32' && existsSync(windowsCompose);
const command = standalone ? windowsCompose : 'docker';
const args = [...(standalone ? [] : ['compose']), '-f', 'lab/docker-compose.yml', ...process.argv.slice(2)];
const child = spawn(command, args, { stdio: 'inherit', windowsHide: true });
child.on('error', () => { console.error('Docker Compose is unavailable. Install/start Docker Desktop with Linux containers.'); process.exitCode = 1; });
child.on('exit', code => { process.exitCode = code ?? 1; });
