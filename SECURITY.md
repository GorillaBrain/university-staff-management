# Security scope

The application under `app/`, `components/`, and `lib/` is the secure deployment target. Every API read and mutation enforces authentication and server-side role/ownership checks. The public demonstration account is read-only and only accesses fictional records.

`lab/vulnerable-app/overrides/` deliberately contains local educational weaknesses. These are documented in `lab/instructor-guide.md`, excluded by `.vercelignore` and TypeScript, and never imported by public application code. Do not deploy this target to public hosting.

Scope any active testing to your own localhost lab at `127.0.0.1:3002`. No third-party website or managed production database is an active-scanning target in this project.

Reports must distinguish confirmed runtime behavior, static candidates and unperformed tool steps. Do not commit live session tokens, credentials, unredacted interception logs or real personal information.
