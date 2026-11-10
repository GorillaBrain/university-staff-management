# Application delivery

- Application: https://university-staff-management.vercel.app
- Source: https://github.com/GorillaBrain/university-staff-management
- Stack: Next.js, React, TypeScript, Tailwind CSS, Prisma and PostgreSQL; Node.js 24.
- Managed secure database: separate Neon PostgreSQL resource in the Vercel Project team.

The repository is private and Vercel's additional sign-in protection remains enabled. The app also requires its own staff login. Public source visibility and removal of Vercel's extra sign-in gate require the owner's explicit approval. Do not treat the deployment as anonymously accessible.

Hosted administrator and read-only demo credentials are on the developer's machine in `.local/cloud-accounts.txt`. The administrator password must remain private. The read-only demo account may be shared with authorized visitors. Credentials are not in Git.

The group source ZIP in `outputs/` contains tracked source and documentation without private environment/credential files. Teammates can extract it, run `npm ci`, start Docker Desktop and follow `GROUP-HANDOFF.md`.

Completed development verification: production build, validation tests and 19 local HTTP integration checks. Hosted verification covers real login, seeded-record reads and rejection of a demo write. The optional GitHub Actions configuration is supplied as a template under `docs/`; it is not enabled.

The audit lab has separate source/build and database configuration. Its independent source was built and exercised locally. Container startup/network-isolation verification is pending a running Docker engine. The group's assigned assessors own ZAP, Burp and Semgrep testing and final reports/screenshots.
