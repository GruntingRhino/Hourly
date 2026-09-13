# Internal information-security program and incident response (draft)

> Drafting note: legal applicability and operator obligations require counsel and school approval; this document records proposed controls, not certification.[1]

## Program commitments (proposed unless marked verified)
**Governance:** named security owner, school privacy contact, access-review owner, incident commander, and backup contacts — NEEDS OWNER INPUT.
**Access:** unique accounts, MFA for privileged access (proposed), least privilege, school/cohort authorization, quarterly reviews (proposed), rapid offboarding. Repository evidence indicates JWT/RBAC and school-scoped helpers; this is not proof of complete deployment control.
**Protection:** TLS and field encryption where configured; secrets never in source; secure uploads; dependency patching; environment separation; rate limits; secure backups and tested restore (all proposed unless separately evidenced).
**Logging:** access, exports, integration actions, auth/security events and incident actions; protect logs from unauthorized alteration and define retention.
**Vendors:** contract review, register, least-data scopes, deletion attestations.
**Training/testing:** annual staff training, phishing/access review, vulnerability scanning, tabletop and restore exercises (proposed).

## Incident levels
- **P0 critical:** active unauthorized access, broad student-data disclosure, child-safety threat, ransomware.
- **P1 high:** confirmed limited student-data compromise, lost integration token, material integrity issue.
- **P2:** suspected event without confirmed exposure, isolated service abuse.
- **P3:** nuisance/spam or policy violation with no data compromise.

## Response
1. Report to security contact and school contact; preserve evidence. 2. Triage scope, systems, people, data categories, school(s), jurisdiction(s), and whether children are affected. 3. Contain without destroying evidence: revoke tokens, disable accounts, isolate storage, rate-limit. 4. Investigate timeline and root cause. 5. Decide notifications with counsel/school; document every decision. 6. Remediate, restore safely, monitor, and produce a post-incident report.

## Notification matrix — decision aid, not legal advice
| Trigger | Decision owner | Timing |
|---|---|---|
| School contract notice | Operator + school | contract-defined; prompt internal escalation |
| FERPA/education-record disclosure | School/counsel | assess applicable FERPA exception, disclosure record, parent notice policy |
| COPPA actual knowledge/under-13 event | Operator + school/counsel | immediately restrict collection; assess FTC/state obligations |
| State breach law | counsel/operator by affected resident state | varies by state, data, harm and regulator; do not use blanket 72h |
| Massachusetts resident data | counsel/operator | analyze 201 CMR 17.00 and Mass. Gen. Laws ch.93H applicability; do not assert applicability without facts |
| Contract/insurance/law enforcement | designated owner | contract/order/law dependent |

No public notice, regulator notice, parent communication, or deletion is automatic. Record facts, legal basis, approvals, dates, and recipients.

## Sources

[1] https://studentprivacy.ed.gov/ferpa — U.S. Department of Education, FERPA 34 CFR Part 99
