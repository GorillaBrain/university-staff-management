# Audit scope

Authorized lab: `http://127.0.0.1:3002`, `usms_lab`, fictional accounts only. Secure comparison: the root app run locally on port 3000 or production-build test instance on 3001. Static scope: `lab/vulnerable-app/overrides/`, compared with `app/` and `lib/`.

Do not actively scan GitHub, Vercel, Neon or any third-party system. Do not use real personal information. The public demo supports ordinary read-only browsing.

Assess object-level access control, response headers, session expiration, search input handling and development-secret management. Record tool/version, assessor/date, target commit, role, exact steps, original/modified requests, observed status/body, risk and retest. Redact passwords and session tokens before sharing evidence.

No denial-of-service, operating-system commands, data destruction, broad network probing, real credential guessing or external callbacks. Use only controlled read-only boolean SQL input against the dummy endpoint.

Scanner reports are candidates until validated. No alerts does not prove no vulnerability. ZAP, Burp and Semgrep group members own their final runs/screenshots; preliminary developer output must be labeled separately.
