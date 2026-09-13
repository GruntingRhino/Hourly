# 13+ eligibility specification — implementation handoff

## Policy
No GoodHours pilot account may be activated for a person under 13. Do not collect full DOB or identity documents by default. A checkbox is an affirmative eligibility attestation, not verified age. No pre-checked control, no silent bypass, and no coaching users to evade the gate.

## Required server-side state
Create an immutable `EligibilityAttestation` (or equivalent) bound to the user/account and onboarding event: `eligible13Plus=true`, notice version, terms version, UI flow, actor/user id, school/org id, timestamp, IP/device metadata only if approved/minimized, method (`signup|oauth|invitation|roster_activation|existing_user`), and supersession/revocation status. Enforce server-side on every activation/session path; never trust client-only state. Store no DOB unless owner-approved.

## Account-entry paths
1. **Password signup:** show plain-language notice and unchecked “I confirm I am 13 or older” plus Terms/Privacy version. POST rejects missing/false attestation; transaction must not create active account.
2. **Google new account:** OAuth callback creates no active user until the same attestation page is completed; Google age signals are not assumed. Existing Google login cannot bypass an absent attestation.
3. **Invitation acceptance:** invitation landing page requires attestation before activation; token expiry/replay remains separate.
4. **Roster import/pre-provisioning:** school may stage a non-login pending record only if approved and minimized; no usable credentials/session/data exposure until the student completes attestation. School must not use import as a way to evade 13+.
5. **Existing accounts:** users without an attestation enter a fail-closed re-onboarding gate at next sensitive access. Preserve school-controlled records; do not erase automatically. Give a read-only/export/request path as approved and route unresolved cases to school/operator.
6. **Underage/unknown report:** freeze new collection and nonessential access, preserve records under school direction, notify designated school/operator privacy contact, assess whether actual knowledge triggers legal steps, correct or remove data only on documented instruction.

## Behavioral test matrix
| Case | Expected |
| password signup false/missing | 400/validation; no active account |
| password signup true | account pending/active only after persisted attestation |
| OAuth callback without attestation | no active session/data access; redirect to gate |
| invitation accept without attestation | no activation; token not consumed irreversibly unless safe retry design |
| roster pre-provision | pending/minimized only; no login/session |
| existing user no attestation | fail-closed gate; school records preserved |
| altered client payload | server rejects; DB has no active bypass |
| underage report | freeze/escalate; no coaching message; retention decision logged |
| duplicate/replay attestation | idempotent, bound to same user/notice; audit event |
| school admin authorized exception attempt | rejected; no role-based bypass |

## Precise code touchpoints for next worker (do not treat as completed)
Inspect and implement across `server/src/routes/auth.ts`, `server/src/routes/googleAuth.ts`, `server/src/routes/invitations.ts`, roster/import routes under `server/src/routes/schools.ts`/`cohorts.ts`, auth middleware/session issuance, Prisma schema/migration, and client `Signup`/OAuth callback/invitation onboarding pages. Search all account-creation, token exchange, activation, seed/import, and JWT issuance paths. Add server integration tests for every matrix row, including direct API calls and replay. Add client tests only as supplemental evidence.


> Citation sources are maintained in the package-local ledger at `evidence/ledger.json`; this draft uses only official sources retrieved on 2026-09-05.


## Legal/policy boundary
This is a product-policy and implementation handoff, not verified-age proof or a conclusion that COPPA applies or does not apply. The policy is **13+**: no under-13 account may be activated, and there is no parent/school exception in this policy. The product must not claim that a checkbox proves age. COPPA materials state that the rule was amended April 22, 2025 and that children’s information should be retained only as long as necessary for its purpose; applicability and compliance obligations require counsel's fact-specific analysis.[2][3][4]

## Failure and remediation procedure
If an account reports under 13 or the school reports an underage user: stop activation and new collection, preserve only the minimum incident record, notify the school contact, identify integrations and invitations, suspend access, and delete or return data under the approved retention/legal-hold decision. Do not delete an existing record solely because eligibility evidence is absent; distinguish missing attestation, conflicting report, and verified underage finding. Log the decision owner, evidence, date, scope, and reactivation prohibition.

## Sources

[2] https://www.ftc.gov/legal-library/browse/rules/childrens-online-privacy-protection-rule-coppa — FTC, COPPA Rule
[3] https://www.ftc.gov/business-guidance/resources/complying-coppa-frequently-asked-questions — FTC, COPPA FAQ
[4] https://www.federalregister.gov/documents/2025/04/22/2025-05904/childrens-online-privacy-protection-rule — Federal Register, COPPA Rule amendment notice
