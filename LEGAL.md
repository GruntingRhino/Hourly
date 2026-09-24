# GoodHours × LSRHS — legal and privacy meeting notes

**Meeting posture:** A synthetic demo and discovery conversation are appropriate. Do not import a real roster or activate real students until the school-authorized privacy and operational gates are complete. This is a decision checklist, not legal approval or a compliance certification.

## Open before a real-student pilot

- [ ] **Operator identity and authority — adult operator:** The user's dad directly confirms the actual legal operator, entity type, address, responsible privacy/security/legal contacts, and authorized signatory. Acting “in his name” does not establish his assent or signature.
- [ ] **School authority — LSRHS/district:** Identify the legal school/district counterparty, authorized signer, student-records/privacy contact, safeguarding contact, and staff permitted to approve hours or access/export records. Do not infer that a meeting attendee can sign for the district.
- [ ] **Pilot documents — both authorized parties:** Review, fill in, and execute the School Pilot Agreement and Student Data Privacy Addendum/DPA in `docs/legal/pilot-drafts/`. Existing files are unsigned drafts, not authorization. Determine the applicable FERPA basis and school control in the actual arrangement; a DPA is a pilot gate here, not a claim that every FERPA outsourcing arrangement universally requires a written contract.
- [ ] **Data instructions — school:** Approve permitted student fields, purposes, roles/access, exports and redisclosure, parent/eligible-student request routing, record correction, retention, deletion/return, legal holds, audit logs, and backups. Name the school records administrator.
- [ ] **Age and pending invitations — school and adult operator:** Approve the 13+ student policy and a procedure for an under-13 or unknown-age student, a revoked invitation, and pending roster records created before acceptance. Decide minimization, restricted access, retention/deletion, and escalation. A 13+ self-attestation is not age verification and does not itself settle COPPA applicability to pre-acceptance data.
- [ ] **Providers and feature scope — operator and school:** Confirm the actual enabled hosting/database, email, OAuth, storage/uploads, monitoring, backup, and support providers and their data terms; identify whether Canvas/Classroom, messaging, reminders, uploads, and billing are included. Obtain separate school-controlled integration authorization where needed.
- [ ] **Operations — named adults/staff:** Assign reachable security-incident, privacy-request, accessibility, and day-to-day support contacts; approve procedures that can actually be performed, including retention/deletion and incident response.
- [ ] **Accessibility verification — engineering and school:** Local fixes and selected automated tests are not a complete authenticated WCAG 2.1 AA or assistive-technology review. Verify those journeys before promising ADA conformance.

## Questions to ask the school representative

- Who can authorize a limited student-data pilot and sign the school terms?
- Who owns student records, privacy requests, incident response, and hour approvals?
- May a roster be imported **before** students accept invitations? Which fields, for how long, and under whose instructions?
- What is the approved under-13, unknown-age, and revoked-invitation procedure?
- Which integrations, providers, and data fields are permitted for this pilot?

## Decision rule

If the answers, operator assent, school authorization, executed documents, and applicable safeguards are not in place, show **invented accounts and data only**. Record an owner and follow-up date for each open item. Do not claim ADA, FERPA, or COPPA compliance or begin real-student onboarding from these notes.

**Evidence status:** The legal package at `docs/legal/pilot-drafts/OPEN_FACTS_AND_EXECUTION.md` is AI-prepared and unapproved. Professional legal review was not obtained; record it as not obtained rather than implying it occurred. These legal decisions are separate from deployment/database-isolation and technical QA gates.
