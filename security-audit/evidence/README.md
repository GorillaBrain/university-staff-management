# Evidence handling

Save actual tool exports here. No ZAP or Burp finding is implied by the presence of a guide or rule.

- `verification.json`: actual HTTP integration check results; not a scanner report.
- `semgrep-lab.json` / `semgrep-secure.json`: actual Semgrep output when run.
- `lab-verification.json`: controlled HTTP replay checks against the independent lab source.
- `zap-lab.json` / `zap-secure.json`: actual ZAP API exports when run.

Session tokens, raw cookies, passwords and unredacted interception histories must remain local. Inspect and redact any evidence before committing it. The generated reports are ignored by Git by default.
