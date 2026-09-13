# Legal/privacy risk memo — GoodHours LSRHS pilot draft

**Status:** internal decision aid, not legal advice, legal opinion, certification, school approval, or professional sign-off. **Pilot jurisdiction fact supplied for this package:** LSRHS, Massachusetts. The school’s legal entity, district relationship, signatory, and exact user population remain `NEEDS OWNER INPUT`.

## Highest-priority controls before real student use

1. Execute a school pilot agreement and student-data addendum naming the operator and school entities, documented instructions, direct school control, permitted fields/purposes, redisclosure limits, subprocessors, rights assistance, incident cooperation, return/deletion, audit evidence, retention/legal holds, and signatures.
2. Confirm Massachusetts applicability and operational contacts. The Massachusetts sources in `evidence/ledger.json` include M.G.L. c.71 §34H (parent access to specified public-school student records), M.G.L. c.93H (security-breach statute), and 201 CMR 17.00 (personal-information security standards). This memo does not decide which provisions apply to this operator, school, data, or incident.
3. Treat the 13+ rule as product policy plus a self-attestation control, not verified age and not a COPPA conclusion. Test all account-entry paths, including invitations/imports/LMS activation and existing accounts, before relying on it.
4. Approve a data inventory and provider register for Google Classroom, Canvas, OAuth, email, hosting/database, uploads, monitoring, billing, and backups. Source code does not establish enabled providers, regions, contracts, deletion, or support access.
5. Approve school-controlled rights, retention, correction, export, deletion, incident, safeguarding, and emergency procedures. Do not promise a universal parent-consent rule, fixed deletion period, fixed breach deadline, or automatic underage deletion without the applicable facts and implementation evidence.

## Practical legal-risk matrix

| Issue | Current evidence | Risk if unresolved | Practical control / owner |
|---|---|---|---|
| School/vendor role and direct control | Draft clauses; source cannot establish legal role | School-official/other exception may not fit actual facts | School + qualified reviewer approve role, instruction schedule, and agreement |
| Parent/eligible-student access or amendment | Procedure routes school-controlled records to school; M.G.L. c.71 §34H is cited in ledger | Operator may disclose or delete without school authority | School privacy contact decides; operator logs and executes documented instruction |
| Under-13/COPPA pathways | 13+ attestation code evidence; no verified age | COPPA or other obligations may attach based on actual knowledge/flow | Product owner tests gates; school/operator assess actual knowledge with qualified reviewer |
| Data minimization and purpose | Draft prohibits sale/ads/unrelated profiling | Overcollection or secondary use may violate contract/policy | Data inventory, field allowlist, scope review, subprocessor approval |
| Security and Massachusetts breach analysis | JWT/RBAC/logging/upload paths in source; M.G.L. c.93H/201 CMR 17 sources recorded | Unsupported security or notice promise; missed jurisdictional duties | Security owner maintains incident matrix and contacts; legal owner decides notices |
| Retention/deletion/backups | Proposed schedule only | Records, holds, backups, and school policy conflict | School approves schedule; operator proves deletion/restore behavior |
| Integrations/billing/email | Routes/config hooks exist | Unapproved data transfer, payment, or messaging | Enablement checklist and provider contract/DPA evidence per feature |

## Decisions this package intentionally does not make

- Whether FERPA, COPPA, Massachusetts law, another state law, or a particular exception applies to the final facts.
- Whether a school official, district, operator, or user has authority to sign.
- Whether any provider contract, region, backup, insurance, SLA, or security representation exists.
- Whether the current source is deployed and configured as inspected.

## Sources

Use the package-local `evidence/ledger.json` and its saved source files. All external-source claims in this memo are limited to the source descriptions above; the package does not claim a legal conclusion from them.
