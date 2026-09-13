# Retention and deletion policy — proposed, pending approval

> Drafting note: legal applicability and operator obligations require counsel and school approval; this document records proposed controls, not certification.[1]

These are proposed targets, not current practices or deletion SLAs. School policy, legal holds, records obligations, incident preservation, and executed agreements control. The school must approve each duration. For a Massachusetts public-school pilot, the school’s records schedule must be reconciled with 603 CMR 23.06: the regulation states that a transcript may only be destroyed 60 years after graduation, transfer, or withdrawal and that a temporary record must be destroyed no later than seven years after transfer, graduation, or withdrawal, subject to the regulation’s terms.[12][17]

| Data | Proposed active retention | Proposed deletion action | Exception |
|---|---|---|---|
| Account/contact/profile | Active account + 30 days after deactivation | disable, then delete/minimize | school record, dispute, hold |
| Roster/invitation tokens | Until activation/expiry; 30 days after expiry | hash/delete token and minimize invite | security investigation |
| Hour/attendance/verification record | Pilot + school-approved academic record period | export then delete only on school instruction | official record, correction history, hold |
| Messages | Pilot + 90 days after closure | delete active copies; preserve reported evidence only as approved | safeguarding/incident hold |
| Uploaded signatures/files | Until verification and school-approved record period | delete bytes and references | record/hold |
| LMS tokens/sync data | Until revocation/termination + 30 days | revoke token, delete token/sync cache | incident evidence |
| Email delivery metadata | 90 days proposed | delete/minimize | abuse/incident |
| Access/security/audit logs | 12 months proposed | minimize identifiers when possible | school disclosure record/legal hold |
| Backups | provider-dependent; NEEDS OWNER INPUT | expire according to tested cycle | disaster recovery/legal hold |
| Billing/procurement | NEEDS OWNER INPUT | delete/minimize after accounting period | tax/payment law |

## Deletion workflow
1. Authenticate requester and identify school/account/record. 2. Determine whether school controls the record. 3. Place a hold if an incident, dispute, legal request, or safeguarding review exists. 4. Export before deletion if school requests. 5. Delete active records and provider copies according to the register. 6. Handle backups at the next tested expiration. 7. Record actor, scope, decision, date, exceptions, and verification. Never erase evidence merely because a user requests it.

## Sources

[1] https://studentprivacy.ed.gov/ferpa — U.S. Department of Education, FERPA 34 CFR Part 99
[12] https://www.doe.mass.edu/lawsregs/603cmr23.html — Massachusetts DESE, 603 CMR 23.00 Student Records
[17] https://www.doe.mass.edu/lawsregs/603cmr23.html?section=07 — Massachusetts DESE, 603 CMR 23.07 — Student Records
