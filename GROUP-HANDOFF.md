# Group project handoff

Development and assessment are separate group responsibilities. The ordinary application screens do not identify the intentional weaknesses.

| Responsibility | Starting document | Required evidence |
| --- | --- | --- |
| ZAP assessor | `security-audit/owasp-zap-guide.md` | Scope, authentication coverage, actual alerts/headers, remediation retest |
| Burp assessor | `security-audit/burp-suite-guide.md` | Original/modified requests, role comparison, expiry replay, screenshots |
| Semgrep assessor | `security-audit/semgrep-guide.md` | Version, command, source locations, findings, secure-source comparison |
| Report editor | `security-audit/vulnerability-report.md` | Verified results, assessor names/dates, limitations and sign-off |

The developer collected preliminary HTTP checks and preliminary Semgrep/ZAP results while building. These do not replace each assigned member's independent assessment. Burp testing was not completed. Do not attribute automated HTTP replay checks to Burp.

## Teammate setup

1. Clone the repository and install Node.js 24 and Docker Desktop.
2. Start Docker Desktop with Linux containers. Confirm `docker info` and `docker compose version` work.
3. From the root, run `npm ci`, then `npm run audit:lab`.
4. Open `http://127.0.0.1:3002/login` and use the lab credentials in `lab/instructor-guide.md`.
5. Run assessments only against localhost. Use the secure local app for remediation comparison, not the public deployment for active scans.
6. Redact credentials/cookies in exports and add assessor names, dates, versions and screenshots.

The independent lab source was built and exercised against separate local PostgreSQL. A Docker image startup, binding and network-isolation smoke test remains pending because the development machine's Docker engine was not running.

## Credential handoff

- Developer machine local secure accounts: `.local/accounts.txt`.
- Hosted accounts: `.local/cloud-accounts.txt`; keep the administrator password private and share only the read-only demonstration login.
- Lab fictional credentials: instructor guide.

Private credential files are ignored by Git. Teammates generate their own local secure credentials.
