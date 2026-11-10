# University Staff Management System

A university administration application built with Next.js, React, TypeScript, Tailwind CSS, PostgreSQL and Prisma. The UI follows the supplied dashboard, attendance and leave-management examples.

## Two application targets

- **Secure application:** the repository root. Database-backed login, server-enforced permissions and staff administration. This is the only Vercel deployment target.
- **Local audit application:** static overrides in `lab/vulnerable-app/overrides/`, copied into a separate build with a separate fictional database. Never deploy this target publicly.

## Local secure setup

Install Node.js 24, then run:

```sh
npm ci
npm run db:generate
npm run db:local
```

Keep the database terminal open. On a new checkout, this starts PostgreSQL at `127.0.0.1:5433`, creates an ignored `.env.local` and writes random fictional account credentials to `.local/accounts.txt`. It does not overwrite an existing environment file.

In another terminal:

```sh
npm run db:deploy
npm run db:seed
npm run dev
```

Open **http://127.0.0.1:3000/login**. Read the generated local credentials from `.local/accounts.txt`.

Alternatively, copy `.env.example` to `.env.local`, configure an existing PostgreSQL connection and set a strong `SEED_PASSWORD`. The root `docker-compose.yml` supplies a secure local database if Docker Desktop is running. Set `POSTGRES_PASSWORD` in your shell, match it in `DATABASE_URL`, then run `docker compose up -d database`. Do not run both database options on port 5433 simultaneously.

## Accounts and permissions

| Role | Fictional email | Access |
| --- | --- | --- |
| Administrator | sarah.johnson@university.example | University staff, departments, attendance and leave review |
| IT Department Head | daniel.lee@university.example | IT records and leave review; own profile, attendance and leave |
| IT Staff Member | michael.chen@university.example | Own profile, attendance and leave |
| Optional read-only demo | demo@university.example | Fictional university records; server rejects writes |

The seed creates 30 staff: one administrator, five department heads and 24 ordinary staff; five departments; attendance history; and leave records. The optional demo is a separate visitor account excluded from staff counts. No public privileged password is supplied.

Department heads cannot approve their own leave or requests outside their department. Staff cannot change their role or another account. Password changes, logout and deactivation revoke sessions.

## Features

- Database-derived dashboard counts and activities.
- Add/edit/view/deactivate/reactivate/search/filter staff.
- Add/edit departments; assign staff through staff records; assign eligible department heads.
- Daily check-in/out, attendance history and filters.
- Submit/view/approve/reject leave; bulk manager review and history.
- Profile editing, password changes, institution settings and CSV exports.
- Responsive administrative interface with the reference sidebar/cards/tables.

The former browser-only preview and fixed preview login have been replaced with server-backed operations.

## Verification

```sh
npm test
npm run build
```

The HTTP checks require a production server at port 3001 with `APP_ORIGIN=http://127.0.0.1:3001`, then `npm run test:api`. They use the local `usms_secure` database, create/remove only their own fictional fixtures, and refuse non-local targets. Results are saved in `security-audit/evidence/verification.json`.

## Local audit lab and group work

Start Docker Desktop with Linux containers, then:

```sh
npm run audit:lab
```

Open **http://127.0.0.1:3002/login**. Lab-only accounts are in [the instructor guide](lab/instructor-guide.md). The lab uses `usms_lab`, an unprivileged application database role, an internal network and a localhost-only application port; no database port is published.

Stop with `npm run audit:stop`; the database volume is retained.

Your ZAP, Semgrep and Burp assessors should use [GROUP-HANDOFF.md](GROUP-HANDOFF.md) and the guides under `security-audit/`. Preliminary developer checks are separate from the group's final assessment. Burp testing was not completed. The Docker build/start/network smoke test remains to be run with a working Docker engine; independent lab source was built and tested using local PostgreSQL.

## GitHub and Vercel

Deploy the root using Node.js 24 and a separate managed PostgreSQL `DATABASE_URL`. Use the unpooled connection for migrations. Migrate and seed explicitly, using private randomly generated administrator credentials. Share only the optional read-only demo login.

`APP_ORIGIN` may be set to the exact deployed origin. If omitted, mutations must match the request origin, supporting preview URLs. Cookies are always Secure on Vercel, HttpOnly and SameSite. Server-side absolute/idle expiry is enforced.

Never commit `.env.local`, `.local/`, `.vercel/` or account credential files. `.vercelignore` excludes the audit lab and local state; the build boundary check rejects public imports of the audit code and unsafe raw-query calls.

## Structure

- `app/`: login, portal pages and REST endpoints.
- `components/`: administrative UI.
- `lib/`: authentication, database, authorization and validation.
- `prisma/`: schema, migration and seed.
- `lab/`: separate audit build and Docker setup.
- `security-audit/`: assessment guides, report draft and remediation mapping.
- `tests/`, `scripts/`: verification and setup; `docs/verify-workflow.example.yml`: optional CI template.

## Optional continuous integration

The workflow is provided as `docs/verify-workflow.example.yml`. To enable GitHub Actions, an authorized maintainer can copy it to `.github/workflows/verify.yml` using a sign-in with workflow permission. It is a template, not an enabled or completed CI run.
