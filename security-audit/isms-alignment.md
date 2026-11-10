# ISMS alignment

This is an educational example of supporting an information security management system, not an ISO certification assessment.

Identify staff records and credentials as assets; define scope/owners; assess unauthorized access, expiry, query and configuration scenarios; assign treatment owners; implement fixes; retain retest evidence; review remaining risk before release/presentation.

| Control theme | Project evidence |
| --- | --- |
| Access control/least privilege | Role matrix, ownership/department tests, read-only visitor |
| Authentication information | Password hashing, session expiry/revocation, restricted credential files |
| Secure coding/configuration | Validation, Prisma operations, response headers, public-build boundary |
| Security testing | Group tool plans, finding triage, remediation comparisons |
| Environment separation | Distinct source/build targets, databases, localhost/internal network configuration |
| Continuous improvement | Redacted exports, assessor sign-off, risk/treatment tracking and retest dates |

Maintain a risk register with finding ID, asset, scenario, evidence, owner, treatment, due date, retest and accepted residual risk. A zero-alert scan is not risk acceptance.

References: [ISO/IEC 27001](https://www.iso.org/standard/27001), [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework).
