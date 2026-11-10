# Semgrep Community Edition guide

Record the tool version, source commit, assessor and date. Run:

```sh
semgrep scan --config security-audit/semgrep.yml --metrics=off --json --output semgrep-lab.json lab/vulnerable-app/overrides
semgrep scan --config security-audit/semgrep.yml --metrics=off --json --output semgrep-secure.json app lib
```

The supplied local rules work with Community Edition; no paid cross-file analysis is required.

| Rule | Candidate | Manual validation |
| --- | --- | --- |
| `usms-unsafe-raw-query` | Unsafe Prisma query calls | Trace request input into SQL and reproduce the dummy search |
| `usms-hardcoded-development-secret` | Long exported secret-style literal | Confirm actual authentication use and local-only scope |
| `usms-staff-profile-authorization-review` | This project's staff GET pattern without `canView` | Compare ownership/role requests and responses |

The authorization rule is project-specific, not a universal missing-authorization detector. Header and expiry weaknesses need runtime evidence. These three rules do not claim to detect all five issues.

Save source locations and relevant code, review reachability and false positives, and compare the secure implementation. Zero matches means only that these rules found none. Preliminary developer checks found three lab candidates and zero secure matches; the assigned assessor should independently rerun and document results.

References: [Semgrep CE](https://semgrep.dev/products/community-edition/), [rule syntax](https://semgrep.dev/docs/writing-rules/rule-syntax).
