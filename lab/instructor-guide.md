# Local audit instructor guide

Start with `npm run audit:lab` after Docker Desktop is running. The target is `http://127.0.0.1:3002`; PostgreSQL is not exposed. Both containers use the internal `audit-only` network. Public hosting and the managed secure database are outside active-testing scope.

The image copies the normal UI/CRUD source and applies `vulnerable-app/overrides/`. It omits the secure `proxy.ts`. `guard.mjs` rejects Vercel, a missing local-lab authorization value, remote database hosts, and database names other than `usms_lab`. This is a physically separate build, not a vulnerable-mode flag in the public app.

## Fictional lab accounts

All 30 lab staff use **UniversityLab123!**. This password belongs only to the dummy lab.

| Role | Email | ID | Department |
| --- | --- | --- | --- |
| Administrator | sarah.johnson@university.example | 1 | Human Resources |
| Department Head | daniel.lee@university.example | 2 | Information Technology |
| Department Head | nur.aisyah@university.example | 3 | Business & Management |
| Staff Member | michael.chen@university.example | 7 | Information Technology |
| Staff Member | emily.davis@university.example | 8 | Business & Management |

## Intentional weaknesses

| ID | Affected local source | Demonstration |
| --- | --- | --- |
| USMS-01 | `overrides/app/api/staff/[id]/route.ts` | Michael's cookie can read `/api/staff/8` because GET omits ownership/role verification |
| USMS-02 | `overrides/next.config.ts`, omitted public proxy | HTML responses lack selected security headers |
| USMS-03 | `overrides/lib/auth.ts` | Expiry/idle timestamps are stored but not enforced; cookie lifetime is 48 hours |
| USMS-04 | `overrides/app/api/staff/route.ts` | Concatenated search text reaches `$queryRawUnsafe` |
| USMS-05 | `overrides/lib/auth.ts` | Fictional hardcoded authentication key is used for local HMAC construction |

The normal UI still limits its usual views. Manual request changes expose the IDOR. Privileged mutations retain ordinary role checks; there is no hidden administrator backdoor.

The secure root application enforces role/ownership checks and session expiry, uses safe projections and validated Prisma operations, and sets nonce CSP and other headers. It does not import the lab key.

Stop with `npm run audit:stop`, which retains the volume. Preserve evidence before intentionally resetting disposable lab data. Never apply lab cleanup operations to the secure database.

The developer's expiry-boundary simulation moved one test session's timestamps into the past; it is not evidence of waiting 30 minutes. Group members should collect their own tool results. Docker image/network smoke verification remains pending; the independent source was built and tested with local PostgreSQL.
