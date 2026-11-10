# Tool comparison

| Tool | Approach | Strongest fit | Limitation |
| --- | --- | --- | --- |
| ZAP | Dynamic passive and controlled active HTTP testing | Headers, cookie properties, authenticated coverage, injection candidates | Does not reliably infer user/department authorization rules |
| Burp Community | Manual interception and Repeater requests | IDOR, role comparison, session replay | Requires manual assessment; do not describe it as the paid automated scanner |
| Semgrep CE | Static local source patterns | Raw queries, development keys and project-specific authorization candidates | A source match is not runtime proof; no matches do not prove whole-app security |

Combine source review, observed dynamic behavior and manual business-rule comparisons. Record actual coverage, effort, evidence quality, false positives and untested areas after the group's runs. Preliminary developer output must be labeled separately.
