# Subprocessor and data-flow register

> Drafting note: legal applicability and operator obligations require counsel and school approval; this document records proposed controls, not certification.[1]

Status is deliberately split between repository indication and owner verification. A module or UI statement is not proof of a production contract, region, retention, or enabled feature.

| Flow/provider | Purpose/data | Evidence status | Required owner verification before pilot |
|---|---|---|---|
| GoodHours app/API | auth, roles, school data, hours, messages, files | verified code paths; operator/entity unknown | hosting boundary, access, logs, backups, support |
| PostgreSQL/Neon named in UI | stored platform data | UI claim only; live plan/region not verified | contract, region, encryption, backups, deletion |
| Vercel named in UI | hosting/request processing | UI claim only | project/database boundary, logs, regions, subprocessors |
| Resend named in UI/code | transactional email recipient/name/content metadata | code/UI indication | DPA, region, retention, content, deletion |
| Google OAuth | name/email authentication | code/UI indication | scopes, Google terms, account unlink/delete behavior |
| Google Classroom | school-authorized roster/course sync | code routes/services; tenant testing unverified | scopes, tenant, token storage, sync/delete, subproviders |
| Canvas | school-authorized roster/course sync | code routes/services; sandbox/testing unverified | scopes, tenant, token storage, sync/delete, subproviders |
| Stripe/billing | subscription/payment/procurement | code paths present; pilot enablement unknown | whether enabled, payment data flow, DPA, retention, school approval |
| File/upload storage | signatures, attachments, imports | multer/signature/runtime storage code; production durability unknown | byte location, malware scanning, access, deletion, backup |
| Monitoring/logging | errors, security, request metadata | not verified | provider, fields, retention, access |

No provider may be added silently. School must receive change notice and have the agreed objection/approval right.

## Sources

[1] https://studentprivacy.ed.gov/ferpa — U.S. Department of Education, FERPA 34 CFR Part 99
