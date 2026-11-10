# Team instructions: web application security audit

**Project:** University Staff Management System (USMS)  
**Tools:** OWASP ZAP, Burp Suite Community Edition and Semgrep Community Edition  
**Purpose:** Find, demonstrate and explain the local lab weaknesses, then compare them with the secure application.

This guide is for the group members carrying out the audit. Each assessor must run their assigned tool and collect their own evidence. Expected results below are guidance, not completed findings.

## 1. Divide the work

| Responsibility | Main tasks | Deliverables |
| --- | --- | --- |
| ZAP assessor | Explore authenticated pages, inspect headers and run a narrowly scoped local scan | Actual ZAP report, screenshots, coverage notes and secure retest |
| Burp assessor | Compare record access, roles and session behavior using Proxy and Repeater | Original/modified requests, responses, screenshots and secure retest |
| Semgrep assessor | Scan source, inspect matched code and compare secure source | Tool version, command, scan output, source locations and validation notes |
| Report editor / coordinator | Check setup, combine results and track remediation | Final report, evidence index, tool comparison and presentation material |

One person can hold more than one responsibility if the group is smaller. Add actual member names to your report.

Start the session-expiry test early because it needs at least 31 minutes without using that session. Complete the other checks with separate sessions while waiting.

## 2. Use the correct application

| Target | Address or location | Use |
| --- | --- | --- |
| Vulnerable local lab | `http://127.0.0.1:3002` | Main audit target; fictional records and intentional weaknesses |
| Secure local app | `http://127.0.0.1:3000` | Remediation comparison and normal function checks |
| Static lab source | `lab/vulnerable-app/overrides/` | Semgrep lab scan |
| Static secure source | `app/` and `lib/` | Semgrep comparison |
| Hosted app | `https://university-staff-management.vercel.app` | Normal demonstration; not this guide's active-scan target |

**Run attack demonstrations and active scans only against the local dummy lab.** Do not scan Vercel, Neon, GitHub or unrelated systems. Keep the lab on localhost, use fictional accounts, and do not use destructive SQL or operating-system/network payloads.

Making the GitHub source public does not make the intentionally vulnerable app available online. The local lab and secure hosted app are separate builds.

Use `127.0.0.1` consistently. Switching to `localhost` can cause cookie and Origin-header mismatches.

## 3. Download the project and start the lab

### 3.1 Install the required software

- Git and Node.js **24**.
- Docker Desktop, running with Linux containers.
- OWASP ZAP for the ZAP assessor. Follow its installation requirements; a standalone Windows installation needs Java 17 or later.
- Burp Suite **Community Edition** for the Burp assessor.
- Python and Semgrep CE, or the Docker method in Section 7, for the Semgrep assessor.

Download the tools from their official websites listed at the end of this guide. The group does not need paid Burp Scanner or paid Semgrep analysis for these exercises.

### 3.2 Clone the source

Run from a terminal:

```sh
git clone https://github.com/GorillaBrain/university-staff-management.git
cd university-staff-management
git rev-parse --short HEAD
node --version
npm ci
```

Record the commit printed by `git rev-parse`. Everyone should test the same commit. If using the supplied source ZIP, extract it and record the ZIP version/commit provided by the coordinator instead.

### 3.3 Start Docker Desktop and the lab

```sh
docker info
docker compose version
npm run audit:lab
```

The first image build may take several minutes. Check startup with:

```sh
node scripts/compose.mjs ps
node scripts/compose.mjs logs --tail 80 application
```

Open `http://127.0.0.1:3002/login` in a normal browser first. Confirm that login and the dashboard work before opening a scanner.

Record this setup check. The Docker container build/start and network-isolation smoke test was not completed on the developer's machine; the group must confirm it on its running Docker engine.

The Compose file publishes only `127.0.0.1:3002`, does not publish PostgreSQL, and places the application/database on an internal network. Save the Compose configuration and relevant `ps` output as setup evidence; do not claim these settings were verified solely because they appear in a file.

### 3.4 Use the fictional lab accounts

**Lab-only password for all accounts below: `UniversityLab123!`**

| Role | Email | Staff ID | Department |
| --- | --- | --- | --- |
| Administrator | `sarah.johnson@university.example` | 1 | Human Resources |
| IT department head | `daniel.lee@university.example` | 2 | Information Technology |
| Business department head | `nur.aisyah@university.example` | 3 | Business & Management |
| IT staff | `michael.chen@university.example` | 7 | Information Technology |
| Business staff | `emily.davis@university.example` | 8 | Business & Management |

This password is not the secure local or hosted password. Never use real university accounts or records in the exercise.

### 3.5 Start the secure local comparison

From the same project root, in a separate terminal:

```sh
npm run db:generate
npm run db:local
```

Keep the database terminal open. On a new checkout this creates `.env.local` and `.local/accounts.txt` with randomly generated secure-local credentials. If an environment file already exists, the helper does not overwrite it; confirm that it points to your local `usms_secure` database, not a managed production database.

In another terminal:

```sh
npm run db:deploy
npm run db:seed
npm run dev
```

Open `http://127.0.0.1:3000/login`. Use the password in **your machine's** `.local/accounts.txt`. Do not share that file publicly or copy `.env.local` into the report.

The secure local database uses host port 5433; the lab's Docker database is not published, so the two targets can run together. If another service already uses port 5433, resolve that local setup conflict before continuing.

## 4. Prepare evidence and record the baseline

### 4.1 Create a private evidence folder

PowerShell:

```powershell
New-Item -ItemType Directory -Force -Path .local/team-audit/zap, .local/team-audit/burp, .local/team-audit/semgrep
```

macOS/Linux:

```sh
mkdir -p .local/team-audit/zap .local/team-audit/burp .local/team-audit/semgrep
```

`.local/` is ignored by Git. Keep raw cookies, passwords, proxy histories and unredacted exports there. Share only reviewed, redacted copies for the final report.

### 4.2 Record before testing

- Assessor name, date/time and timezone.
- Source commit, operating system, tool edition/version and target address.
- Account role and record IDs used, with session values redacted.
- Whether the app is running inside Docker or through another local setup.
- A normal successful login and authorized request, before changing anything.

Use filenames such as `BURP-01-original-request.txt`, `BURP-01-modified-response.txt`, `ZAP-01-missing-csp.png` and `SEMGREP-01-source.png`.

### 4.3 Avoid proxy conflicts

ZAP and Burp often use port 8080 by default. Run one proxy at a time, or use **ZAP on 8090** and **Burp on 8080**. Use each tool's dedicated browser where possible. Do not change a personal browser's global proxy settings unnecessarily.

## 5. OWASP ZAP: dynamic testing

### 5.1 Capture a logged-in session

1. Open ZAP and create a session for this project.
2. Use its manual exploration/launch-browser feature, with the browser routed through ZAP's selected local proxy.
3. Visit `http://127.0.0.1:3002/login` and sign in as the fictional administrator.
4. In ZAP's History, find `POST /api/auth/login`. Confirm an actual successful response and a `Set-Cookie` for `usms_lab_session`.
5. Browse Dashboard, Staff Management, Departments, Attendance, Leave Applications and My Profile.
6. In the same tool browser, open `http://127.0.0.1:3002/api/auth/me`. Confirm the response identifies the intended administrator.

The JSON login fields are `email` and `password`. Mutating requests require `Content-Type: application/json` and `Origin: http://127.0.0.1:3002`. The browser normally adds the correct Origin; copied/manual login requests must retain it.

### 5.2 Set the scope

Create a context containing only this pattern and put it in scope:

```text
^http://127\.0\.0\.1:3002/.*$
```

Exclude these mutation endpoints from automated crawling/scanning:

```text
/api/auth/logout
/api/auth/password
/api/profile
/api/settings
/api/leave/review
```

Browse those normal screens manually if required. Do not automatically replay POST/PATCH/DELETE operations that create, approve, edit or deactivate records.

### 5.3 Inspect passive alerts

Select a successful HTML response, such as `/dashboard`, and inspect its headers. Look for actual absence of:

- `Content-Security-Policy`.
- `X-Frame-Options` or an equivalent CSP `frame-ancestors` policy.
- `X-Content-Type-Options`.

Allow the passive scan queue to finish. In Alerts, record the actual alert name, affected URL, risk, confidence and evidence. Capture both the alert detail and response headers.

Do not call an informational alert a vulnerability automatically. A missing `Secure` cookie flag on a localhost HTTP-only test is also different from an insecure cookie on a public HTTPS deployment.

### 5.4 Keep crawling authenticated

For a short, controlled local session, a temporary Replacer rule is a simple option:

| Setting | Value |
| --- | --- |
| Description | `USMS lab authenticated requests` |
| URL restriction | `^http://127\.0\.0\.1:3002/.*$` |
| Match type | Request Header; add if missing |
| Match string | `Cookie` |
| Replacement | `usms_lab_session=YOUR_CAPTURED_VALUE` |
| Match regex | Off for the header name |

Copy only the cookie name/value, not `Path`, `HttpOnly` or other Set-Cookie attributes. Keep the value out of screenshots and the published report. This rule replaces the request's Cookie header, so use a dedicated assessment session with no other required cookies.

After adding it, confirm `/api/auth/me` still returns the intended user. If your ZAP version supports context JSON authentication, you can instead flag the captured login request as the context's JSON authentication request, configure its email/password user and cookie-based session handling, then verify the user. Do not assume authentication is working just because it is configured.

Run the normal Spider against the scoped local site. If needed, use the AJAX Spider for the client-rendered screens. Also open these exact URLs in the tool browser because the ordinary UI does not call every test endpoint:

```text
http://127.0.0.1:3002/api/bootstrap
http://127.0.0.1:3002/api/staff?q=Michael
http://127.0.0.1:3002/api/staff/7
http://127.0.0.1:3002/api/attendance
http://127.0.0.1:3002/api/leave
```

Record whether the responses contain data or only a 401/error. A login-page-only crawl is not an authenticated assessment.

### 5.5 Run one controlled active test

1. Select the captured **GET** `/api/staff?q=Michael` request.
2. Start Active Scan for that request only, with recursion disabled.
3. In the scan policy, disable other active rules and enable the standard SQL Injection rule. Use low attack strength and a short limit, such as one minute per rule and two minutes for the scan.
4. Confirm the target is still `127.0.0.1:3002`, the cookie is valid and no state-changing requests are included.
5. Run the scan and inspect the actual request, input and response behind any alert.

An alert is a candidate until it is reproduced and explained. The Burp assessor's read-only boolean comparison in Section 6.5 can provide a clearer manual confirmation.

### 5.6 Export and retest

Use ZAP's report-generation feature to save an HTML report and, if available, a JSON export under `.local/team-audit/zap/`. Record tool version, scope and authenticated coverage.

For the secure comparison, use a separate context/session on port 3000 and sign in with the secure-local password. Disable the lab Cookie Replacer rule first. Repeat passive header checks and the controlled manual search comparison. Do not run an unrestricted active scan against the secure or hosted app.

Remove temporary Cookie rules after testing. Your deliverable is the actual report plus selected screenshots and a short explanation of the differences.

## 6. Burp Suite Community: manual testing

### 6.1 Set up Proxy and Repeater

1. Start a temporary Burp Community project and choose the default configuration.
2. Use **Proxy → Open browser**. Keep **Intercept off** while normally browsing, so requests do not appear to hang.
3. Sign in to the lab as `michael.chen@university.example`.
4. In that same browser, explicitly open `http://127.0.0.1:3002/api/staff/7`.
5. Find the GET request in Proxy's HTTP history, right-click it and choose **Send to Repeater**.
6. In Repeater, confirm the target is HTTP, host `127.0.0.1`, port `3002`. Send the original request and confirm it returns Michael's record.

Opening the API URL explicitly is important: the profile modal normally uses data from `/api/bootstrap`, so it may not generate `/api/staff/7` by itself.

### 6.2 USMS-01: demonstrate the profile IDOR

Name the first Repeater tab `Michael-own-record` and keep its request unchanged. Its essential fields are:

```http
GET /api/staff/7 HTTP/1.1
Host: 127.0.0.1:3002
Cookie: usms_lab_session=YOUR_CAPTURED_VALUE

```

Duplicate the tab. Name the copy `Michael-other-record` and change **only** the path:

```http
GET /api/staff/8 HTTP/1.1
Host: 127.0.0.1:3002
Cookie: usms_lab_session=YOUR_CAPTURED_VALUE

```

Send it. Check whether it returns Emily Davis, who is a different staff member in another department. Do not replace Michael's cookie with an administrator cookie; that would invalidate the comparison.

Collect the original and modified raw requests, actual status/body and screenshots. Explain that the same low-privilege session could retrieve an unauthorized object by changing its ID.

### 6.3 Retest access control securely

Log in to the secure local app on port 3000 using Michael's secure-local password. Generate fresh secure requests in Burp; do not reuse the lab cookie.

| Account and request | Expected secure behavior |
| --- | --- |
| Michael reads `/api/staff/7` | Authorized response |
| Michael reads `/api/staff/8` | 404; other record not exposed |
| Daniel, IT head, reads `/api/staff/7` | Authorized department response |
| Daniel reads `/api/staff/8` | 404; another department denied |

Label Repeater tabs by target and role. Record the actual result next to the expectation, even if it differs.

Optional business-rule checks: staff must not create staff or approve leave; a head must not approve their own leave or another department's request. Use only actual fictional pending requests, retain valid JSON/Origin headers, and record any intentional changes to lab records. A malformed request or missing Origin producing 400/403 is not proof of correct role authorization.

### 6.4 USMS-03: test session expiration

First record the policies being compared:

| Target | Intended/stored policy | What is tested |
| --- | --- | --- |
| Lab | Stored expiry after 30 minutes; browser cookie lasts 48 hours | The server fails to enforce stored expiry |
| Secure app, default configuration | Absolute limit of 8 hours; inactivity limit of 30 minutes | The server rejects an idle session even if its cookie remains |

Procedure:

1. Use fresh logins on each target and save each Set-Cookie response privately.
2. Send GET `/api/auth/me` with each session in separate Repeater tabs. Save the successful baseline and its time.
3. Stop using those sessions. Close their application browser tabs and disable any scanner/replacer rule using those same cookies. Repeated authenticated requests would reset the secure inactivity timer.
4. Wait at least **31 minutes after the last authenticated request**. Record the actual elapsed time.
5. Resend the unchanged Repeater requests with the old cookies.
6. Compare the lab's observed response with the secure inactivity rejection, expected to be 401.

Do not say the secure absolute lifetime is 30 minutes; its default absolute limit is eight hours. Check `.env.local` if the group deliberately changed timeout settings, and document that configuration.

A shorter test that edits database timestamps is a boundary simulation, not a measured 31-minute wait. Do not present the developer's Node replay output as your Burp evidence.

Also test logout revocation: retain a cookie in Repeater, log out through the same target's browser, and replay it. The secure app should return 401. This is a separate test from expiry.

### 6.5 USMS-04: confirm input handling with a read-only payload

Using a valid fictional lab session, generate and send this search:

```http
GET /api/staff?q=NoSuchPersonZZ HTTP/1.1
Host: 127.0.0.1:3002
Cookie: usms_lab_session=YOUR_CAPTURED_VALUE

```

Record its status and returned array length. On an unchanged seed, it should have no matching staff.

Duplicate the request and replace only the `q` value:

```http
GET /api/staff?q=NoSuchPersonZZ%27%20OR%20TRUE-- HTTP/1.1
Host: 127.0.0.1:3002
Cookie: usms_lab_session=YOUR_CAPTURED_VALUE

```

The decoded value is `NoSuchPersonZZ' OR TRUE--`. It is intended to change the local query predicate and return fictional staff rows. A fresh lab normally has 30 staff, but report the actual count if your team has added records.

Do not use UPDATE, DELETE, DROP, filesystem access, external callbacks or operating-system commands. This read-only comparison is sufficient for the demonstration.

Repeat with a fresh secure-local session on port 3000. The same text should be treated as an ordinary search string and return no matches. Save both baseline and changed request/response pairs for each target.

### 6.6 Save Community Edition evidence

Copy the raw request and response text into separate private files and take screenshots showing Repeater's target, changed path/input, status and relevant response body. Do not depend on paid scanning or project/report features.

Create redacted copies for submission, replacing only passwords/session values with `[REDACTED]`. Clearly mark those edits; keep the original private. Do not alter status codes, payloads, record identities or results to match an expectation.

## 7. Semgrep Community Edition: static analysis

Semgrep scans local source files. It does not scan the website URL, and the web server does not need to run for this step.

### 7.1 Choose one installation method

**Windows PowerShell with Python:**

```powershell
python -m venv .local/semgrep-venv
& ./.local/semgrep-venv/Scripts/python.exe -m pip install semgrep
$SemgrepExe = Join-Path (Get-Location) '.local/semgrep-venv/Scripts/semgrep.exe'
& $SemgrepExe --version
```

Use a Python version supported by the current Semgrep release; Python 3.12 is suitable for the project-local setup used during development. If `python` opens the Microsoft Store, install Python and reopen the terminal, or use your installed Python launcher's equivalent command.

**macOS/Linux with Python:**

```sh
python3 -m venv .local/semgrep-venv
.local/semgrep-venv/bin/python -m pip install semgrep
.local/semgrep-venv/bin/semgrep --version
```

No activation step is required when using these full executable paths.

**Docker alternative:** after starting Docker Desktop, the repository's optional Semgrep service can scan without a host Python installation:

```sh
node scripts/compose.mjs run --rm --no-deps semgrep semgrep --version
node scripts/compose.mjs run --rm --no-deps semgrep
```

The second command uses the service's default local-rule scan and prints JSON to the terminal. Save its stdout separately from Docker progress/stderr. The source mount is read-only; do not ask the container to write a report under `/src`. Use the installed host CLI below when you want the simplest file-export workflow.

### 7.2 Scan the vulnerable source and secure source

Windows PowerShell, using `$SemgrepExe` from the same terminal:

```powershell
& $SemgrepExe scan --config security-audit/semgrep.yml --metrics=off --json --output .local/team-audit/semgrep/lab.json lab/vulnerable-app/overrides
& $SemgrepExe scan --config security-audit/semgrep.yml --metrics=off --json --output .local/team-audit/semgrep/secure.json app lib
```

macOS/Linux:

```sh
.local/semgrep-venv/bin/semgrep scan --config security-audit/semgrep.yml --metrics=off --json --output .local/team-audit/semgrep/lab.json lab/vulnerable-app/overrides
.local/semgrep-venv/bin/semgrep scan --config security-audit/semgrep.yml --metrics=off --json --output .local/team-audit/semgrep/secure.json app lib
```

For a readable console view, repeat the relevant command without `--json --output ...`. Record the exact version and command. These local rules do not need a paid Semgrep account.

### 7.3 Validate each candidate

| Rule | Source to inspect | Explanation to verify |
| --- | --- | --- |
| `usms-unsafe-raw-query` | `lab/vulnerable-app/overrides/app/api/staff/route.ts` | `q` is included in SQL text passed to `$queryRawUnsafe`; connect it to the Burp/ZAP search evidence |
| `usms-staff-profile-authorization-review` | `lab/vulnerable-app/overrides/app/api/staff/[id]/route.ts` | The GET path retrieves a record without calling `canView`; connect it to the Burp IDOR comparison |
| `usms-hardcoded-development-secret` | `lab/vulnerable-app/overrides/lib/auth.ts` | A fictional literal is used in `createHmac` for lab session hashing |

The hardcoded key demonstrates poor development-secret management. Knowing it alone does **not** create a valid administrator session: the database must still contain the matching session record. Explain the actual use and conditions instead of claiming an untested account takeover.

The authorization rule is specific to this project's handler structure. It is a review heuristic, not a universal IDOR detector. Missing headers and expired-session acceptance require runtime evidence.

The supplied rules are expected to flag the three source patterns above on the reference build. Record your actual findings and source line numbers. A zero-match secure scan means only that these selected rules found no matches; it does not prove the whole app is vulnerability-free.

### 7.4 Save static-analysis evidence

Include tool version, source commit, command, scan summary/parse errors, relevant JSON entries and source screenshots. Explain why each candidate is reachable or why it is a false positive. Compare the corresponding secure implementation in `app/api/staff/` and `lib/auth.ts`.

## 8. Combine the findings and retests

Use the following as a checklist of **expected checks**. Fill in actual observations separately.

| Finding | Main evidence owner | Expected local-lab behavior | Secure comparison |
| --- | --- | --- | --- |
| USMS-01: IDOR | Burp, supported by Semgrep | Michael can request another staff ID | Unauthorized object denied |
| USMS-02: headers | ZAP | Selected response-hardening headers absent | Headers present and UI remains functional |
| USMS-03: expiry | Burp | Stored expiry not enforced | Idle/expired session rejected server-side |
| USMS-04: input handling | Burp/ZAP plus Semgrep | Boolean search text changes returned rows | Input treated as literal search text |
| USMS-05: fictional key | Semgrep | Key literal used by lab authentication code | Secure code has no dependency on it |

For every finding, include:

1. ID, title, assessor and date.
2. Target commit, endpoint/source and account role.
3. Preconditions and a legitimate baseline.
4. Exact changed input or request and observed status/body.
5. Numbered screenshots and exported evidence filenames.
6. Impact, with the fictional/local scope stated.
7. Root cause and recommended remediation.
8. Secure retest steps, actual results and remaining limitations.

Describe severity using the tested impact and likelihood. Do not invent CVSS scores, scanner results or elapsed-time evidence. Keep informational alerts separate from confirmed vulnerabilities.

Use `security-audit/vulnerability-report.md`, `remediation-report.md`, `tool-comparison.md`, `owasp-top-10-mapping.md` and `isms-alignment.md` as supporting report material. Add your group's own names, observations and evidence; do not submit expected outcomes as if they were measured.

## 9. Troubleshooting

| Problem | Check |
| --- | --- |
| Docker daemon/pipe error | Start Docker Desktop with Linux containers and wait until `docker info` succeeds |
| Lab URL does not open | Run `node scripts/compose.mjs ps` and `logs --tail 80 application`; wait for migrations/seed/startup |
| Port 3002 already in use | Stop the previous instance you own; do not kill an unrelated service or change only one side of the port/Origin configuration |
| ZAP/Burp browser hangs | Check proxy port conflict and whether Burp Intercept is holding a request |
| 401 during a supposed authenticated scan | Recheck `/api/auth/me`, target port, correct cookie name and whether the session was logged out |
| 403 from a copied POST/PATCH | Retain the exact target Origin and JSON content type; distinguish CSRF/input errors from role denial |
| Login starts returning 429 | Login throttling allows ten attempts per 15-minute account window; stop retries and wait rather than repeatedly guessing |
| Secure login rejects the lab password | Read the generated secure-local `.local/accounts.txt`; lab and secure passwords differ |
| Expected staff request is missing from history | Open the exact `/api/staff/7` URL in the tool browser while logged in |
| Secure idle cookie still works after waiting | Check the last actual authenticated request, other open tabs/scanners and configured inactivity limit |
| Semgrep has no findings | Confirm project root, lab override path, local rule path, parsed-file count and any scan errors |
| Semgrep reports appear empty or malformed | Use `--output` with a host CLI; keep progress/stderr separate from JSON stdout |

Do not record a setup failure as a vulnerability. Record the problem and resolve coverage before drawing conclusions.

## 10. Finish and hand over

- Remove temporary ZAP Cookie rules and stop tool activity.
- Save private originals and create redacted submission copies.
- Stop the lab using `npm run audit:stop`. This retains the database volume.
- Do not remove the lab volume until the group agrees its evidence and records are no longer needed.
- Give the editor the evidence index, commands/versions, findings, retests and limitations.
- Confirm each assessor has reviewed their section and the final report identifies any unfinished tests.

## 11. Official tool references

- [ZAP authentication and contexts](https://www.zaproxy.org/docs/desktop/start/features/authentication/).
- [ZAP JSON authentication configuration](https://www.zaproxy.org/docs/desktop/ui/dialogs/session/context-auth/).
- [ZAP Replacer](https://www.zaproxy.org/docs/desktop/addons/replacer/).
- [ZAP report generation](https://www.zaproxy.org/docs/desktop/addons/report-generation/).
- [Burp Community getting started](https://portswigger.net/burp/documentation/desktop/getting-started).
- [Burp Repeater walkthrough](https://portswigger.net/burp/documentation/desktop/getting-started/reissuing-http-requests).
- [Semgrep Community Edition](https://semgrep.dev/products/community-edition/).
- [Semgrep local rule syntax](https://semgrep.dev/docs/writing-rules/rule-syntax).

Menu labels may vary by installed version. Record that version and use the official documentation if a control has moved.
