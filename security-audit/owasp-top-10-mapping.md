# OWASP Top 10 mapping

Categories use **OWASP Top 10:2025**. They organize discussion and do not assign severity or guarantee detection.

| Finding | Category | Reason |
| --- | --- | --- |
| IDOR | A01:2025 Broken Access Control | Object returned without ownership/department permission |
| Missing headers | A02:2025 Security Misconfiguration | Browser hardening absent in lab configuration |
| Weak expiry | A07:2025 Authentication Failures | Session accepted beyond intended validity |
| SQL search injection | A05:2025 Injection | Request text becomes query syntax |
| Hardcoded development key | A02:2025 Security Misconfiguration; contextual A04 Cryptographic Failures | Key embedded in source; impact depends on authentication use |

References: [OWASP Top 10:2025](https://top10.owasp.org/2025/), [2025 category changes](https://top10.owasp.org/2025/0x00_2025-Introduction/).
