# Remediation and retest plan

| Finding | Secure implementation | Acceptance |
| --- | --- | --- |
| IDOR | `canView`, ownership/department scope and safe response fields | Other-user record denied; authorized record still readable |
| Missing headers | Nonce CSP plus anti-framing, MIME-sniffing, referrer/permissions headers; HSTS on Vercel | Inspect actual headers; verify UI still works |
| Session expiry | Random opaque tokens hashed in PostgreSQL, absolute/idle expiry, cookie flags and revocation | Expired, idle, logged-out and old-password-session cookies return 401 |
| Input handling | Strict Zod fields/lengths/dates, validated Prisma operations and React escaping | SQL syntax treated as text; role/identifier mass assignment rejected |
| Development secret | Lab source excluded; secure auth has no dependency on the fictional key | Boundary check and artifact inspection confirm separation |

Additional measures include same-origin JSON mutations, persisted login throttling, manager self-approval denial, conditional pending-only reviews, and server-side demo write restrictions. API checks enforce permissions independently of UI controls.

Selected developer HTTP checks and preliminary static/dynamic comparisons passed. Group assessors still own their final tool evidence and retests. Burp and Docker-engine smoke testing were not completed by the developer. This addresses the specified demonstration issues without claiming a general penetration-test certification.
