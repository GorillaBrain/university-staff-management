import { readFileSync, writeFileSync } from 'node:fs';
import { setTimeout } from 'node:timers/promises';

const apiKey = readFileSync('.local/zap.key', 'utf8').trim();
async function api(component, type, name, params = {}) {
  const url = new URL(`http://127.0.0.1:8090/JSON/${component}/${type}/${name}/`);
  url.search = new URLSearchParams({ apikey: apiKey, ...params });
  const response = await fetch(url);
  const result = await response.json();
  if (!response.ok || result.code) throw new Error(`${component}/${name}: ${result.message || response.status}`);
  return result;
}
async function send(base, path, cookie = '', fields) {
  const url = new URL(base);
  const data = fields ? JSON.stringify(fields) : '';
  const headers = [`${fields ? 'POST' : 'GET'} ${base}${path} HTTP/1.1`, `Host: ${url.host}`, `Origin: ${base}`, 'User-Agent: USMS-local-audit', ...(cookie ? [`Cookie: ${cookie}`] : []), ...(fields ? ['Content-Type: application/json', `Content-Length: ${Buffer.byteLength(data)}`] : []), 'Connection: close'];
  const result = await api('core', 'action', 'sendRequest', { request: headers.join('\r\n') + '\r\n\r\n' + data, followRedirects: 'false' });
  return result.sendRequest[0];
}
async function waitFor(component, name, key, params, timeout = 120000) {
  const until = Date.now() + timeout;
  while (Date.now() < until) {
    const result = await api(component, 'view', name, params);
    if (Number(result[key]) === (key === 'recordsToScan' ? 0 : 100)) return true;
    await setTimeout(1000);
  }
  return false;
}
for (const version of ['lab', 'secure']) {
  const base = version === 'lab' ? 'http://127.0.0.1:3002' : 'http://127.0.0.1:3001';
  await api('core', 'action', 'newSession', { name: '', overwrite: 'true' });
  await send(base, '/login');
  const login = await send(base, '/api/auth/login', '', { email: 'sarah.johnson@university.example', password: version === 'lab' ? 'UniversityLab123!' : process.env.SEED_PASSWORD });
  if (!login.responseHeader.includes('200')) throw new Error('ZAP login did not succeed for ' + version);
  const cookie = login.responseHeader.match(/set-cookie:\s*([^;\r\n]+)/i)?.[1];
  if (!cookie) throw new Error('No session cookie received.');
  for (const path of ['/dashboard', '/staff', '/departments', '/attendance', '/leave', '/profile', '/settings', '/api/bootstrap', '/api/staff?q=Michael', '/api/staff/7', '/api/attendance', '/api/leave']) await send(base, path, cookie);
  let activeScan = { performed: false };
  if (version === 'lab') {
    try { await api('replacer', 'action', 'removeRule', { description: 'usms-lab-session' }); } catch { /* No rule in a fresh session. */ }
    await api('replacer', 'action', 'addRule', { description: 'usms-lab-session', enabled: 'true', matchType: 'REQ_HEADER', matchRegex: 'false', matchString: 'Cookie', replacement: cookie, url: 'http://127\\.0\\.0\\.1:3002/.*' });
    try { await api('ascan', 'action', 'addScanPolicy', { scanPolicyName: 'USMS-local-SQL' }); } catch { /* Reuse the owned policy after an interrupted run. */ }
    await api('ascan', 'action', 'disableAllScanners', { scanPolicyName: 'USMS-local-SQL' });
    await api('ascan', 'action', 'enableScanners', { ids: '40018', scanPolicyName: 'USMS-local-SQL' });
    await api('ascan', 'action', 'setScannerAttackStrength', { id: '40018', attackStrength: 'LOW', scanPolicyName: 'USMS-local-SQL' });
    await api('ascan', 'action', 'setOptionMaxRuleDurationInMins', { Integer: '1' });
    await api('ascan', 'action', 'setOptionMaxScanDurationInMins', { Integer: '2' });
    const scan = await api('ascan', 'action', 'scan', { url: base + '/api/staff?q=Michael', recurse: 'false', inScopeOnly: 'false', scanPolicyName: 'USMS-local-SQL', method: 'GET' });
    console.log('ZAP local SQL scan started.');
    const completed = await waitFor('ascan', 'status', 'status', { scanId: scan.scan }, 150000);
    if (!completed) await api('ascan', 'action', 'stop', { scanId: scan.scan });
    activeScan = { performed: true, completed, ruleIds: ['40018'], target: '/api/staff?q=Michael', policy: 'LOW, maximum one minute per rule/two minutes total; no public deployment was scanned' };
    await api('replacer', 'action', 'removeRule', { description: 'usms-lab-session' });
  }
  const passiveComplete = await waitFor('pscan', 'recordsToScan', 'recordsToScan', {}, 60000);
  const result = await api('core', 'view', 'alerts', { baseurl: base, start: '0', count: '1000' });
  const report = { timestamp: new Date().toISOString(), target: base, tool: 'OWASP ZAP 2.17.0', authenticatedPages: true, passiveComplete, activeScan, alerts: result.alerts };
  let text = JSON.stringify(report, null, 2);
  for (const secret of [apiKey, cookie, cookie.split('=')[1], process.env.SEED_PASSWORD, 'UniversityLab123!']) if (secret) text = text.replaceAll(secret, '[redacted]');
  writeFileSync(`security-audit/evidence/zap-${version}.json`, text);
  console.log(`Saved actual ZAP ${version} assessment: ${report.alerts.length} alerts.`);
}
