# OWASP ZAP assessment guide

## Setup and coverage

1. Start the lab and confirm `http://127.0.0.1:3002`.
2. Use ZAP's browser or a dedicated proxy-configured browser.
3. Scope a context to `http://127\.0\.0\.1:3002/.*`; exclude logout and password changes.
4. Sign in with a fictional account and browse dashboard, staff, departments, attendance, leave and profile.
5. Confirm authenticated `/api/auth/me` and explicitly exercise `/api/bootstrap`, `/api/staff?q=Michael`, `/api/staff/7`, `/api/attendance` and `/api/leave`. An unauthenticated login-page crawl is insufficient.

## Passive checks

Inspect HTML for missing CSP, anti-framing and MIME-sniffing headers. Inspect Set-Cookie attributes. Save actual alerts with URL, confidence and evidence. Cookie lifetime alone does not prove that the server accepts an expired session.

## Authenticated crawling

Configure JSON authentication using `POST /api/auth/login`, same-origin Origin header and the fictional email/password. Retain `usms_lab_session` via cookie session management. Alternatively, use a temporary Replacer Cookie request-header rule restricted to the exact local lab origin. Verify the role with `/api/auth/me` and remove temporary rules afterward.

## Controlled active testing

Start with GET `/api/staff?q=Michael` and the SQL injection rule, low strength and a short duration. Test only the authorized local dummy lab. Do not automatically scan logout, password changes or create/delete operations. Preserve evidence before a reset.

## Retest and export

Repeat header and input checks against the secure local app. Ask the Burp assessor to verify business authorization and expiry behavior manually. Export real results, scope, version and authentication coverage; redact credentials/cookies. Preliminary developer ZAP output is not the group's independent result.

References: [ZAP workflow/API](https://www.zaproxy.org/docs/api/), [baseline scanning](https://www.zaproxy.org/docs/docker/baseline-scan/).
