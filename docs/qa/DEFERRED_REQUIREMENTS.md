# GoodHours deferred requirements register

Purpose: durable recall of requirements that cannot be honestly closed by local engineering alone. Consult this register before reopening the same blocker. AI drafts are not attorney approval.

Status semantics
- Recommended/deferred is not the same as universally legally mandatory.
- A human/operator or school decision, signature, consent, or provider action is recorded as required for that operational act where applicable.
- Deferral blocks only the readiness scope stated in each row; it does not block unrelated local engineering or synthetic testing.

## Legal/regulatory review — recommended, not fabricated as mandatory

| ID | Deferred item | Reason not engineering | Owner/action | Trigger | Effect on readiness while deferred |
|---|---|---|---|---|---|
| DEF-LEGAL-001 | Qualified legal review of FERPA role, COPPA applicability, and Massachusetts 603 CMR 23.00 obligations (`GH-VAL-003`) | Requires licensed counsel's professional judgment; existing AI research/drafts explicitly state they are not a substitute. | If/when affordable, engage counsel; record `review obtained` or `not obtained`, never infer it. | Owner chooses review or a school/district requires proof as a contract precondition. | Recommended, not blocking local engineering or synthetic testing. Blocks a defensible real-student launch claim, executed DPA confidence, and any compliant/certified public claim. |
| DEF-LEGAL-002 | GoodHours operator legal counterparty, entity, jurisdiction, address, and authorized signatory (`GH-VAL-001`) | Code cannot create a legal entity or authorize a signatory. | Owner establishes/designates the entity and signatory and records it. | Written owner decision. | No operator agreement or DPA can be executed until resolved. |
| DEF-LEGAL-003 | Pilot school legal entity, authorized official, signatory authority, records/privacy contact, and safeguarding contact (`GH-VAL-002`) | The school must determine its own authority and contacts. | School administration identifies and records these roles. | School response to outreach/intake. | Blocks execution of a school agreement or DPA. |
| DEF-LEGAL-004 | Executed School Pilot Agreement and Student Data Privacy Addendum/DPA (`GH-VAL-004`, `GH-VAL-005`) | Both counterparties and signatories must exist and sign; drafts already exist in `docs/legal/pilot-drafts/`. | Owner and school signatories execute the drafted documents. | DEF-LEGAL-002 and DEF-LEGAL-003 resolved. | Blocks any real-student pilot; does not block synthetic/fake-pilot engineering. |
| DEF-LEGAL-005 | School approval of 13+ policy, plain-language notices, and school-specific consent requirements (`GH-VAL-011`) | Only the school can approve a student/parent policy for its population. | Designated school official reviews and approves in writing. | School review cycle. | Blocks real-student rollout only. |
| DEF-LEGAL-006 | Cyber-liability insurance quote or explicit decision to proceed without one (`GH-VAL-007`) | Insurance procurement/risk acceptance is an owner decision. | Owner obtains a quote or records the decision. | Owner action. | Recommended before a real pilot; does not block synthetic work. |
| DEF-LEGAL-007 | Approved data inventory, rights-request routing, records administrator, and retention/deletion schedule (`GH-VAL-015/016/018`) | Operational ownership and school approval are not created by code. | School names the records administrator and approves the existing drafts. | School review. | Blocks real-student data handling; export/delete/correct code can still be tested synthetically. |

Standing boundary: the user has stated hiring counsel is unavailable. Do not repeatedly request it. The existing legal package at `docs/legal/pilot-drafts/REVIEW.md` and `OPEN_FACTS_AND_EXECUTION.md` remains AI-prepared material, not attorney approval.

## Provider and operator human actions

| ID | Deferred item | Reason not engineering | Owner/action | Trigger | Effect on readiness while deferred |
|---|---|---|---|---|---|
| DEF-OPS-001 | Google Workspace/admin consent and least-privilege access decision for Classroom Preview (`GH-INT-003`) | The school's Google administrator must decide and, where the selected OAuth/delegation path requires it, grant consent; this run did not establish that domain-wide access is universal for designated test accounts. | School Google administrator records the least-privilege consent path for the designated test/pilot tenant, including whether domain-wide delegation is needed. | Classroom Preview OAuth is attempted or the school chooses a domain-wide deployment. | Blocks only the corresponding live Classroom flow until the applicable consent path is recorded; does not block source work or local synthetic testing. |
| DEF-OPS-002 | Determine Google's current verification/assessment requirements for `classroom.rosters.readonly` (`GH-INT-001`) | The scope is present in source, but this run did not obtain an authoritative Google Cloud Console result. The earlier tracker wording was categorical without source evidence. | Owner checks the current OAuth consent-screen/verification requirements in Google Cloud and records the exact result; do not infer a security assessment is universally required. | Moving beyond designated test accounts, or Google explicitly requests verification/assessment. | Blocks real/non-test-account Classroom rosters until the applicable Google requirements are verified and satisfied; does not block source work or fake-pilot tests. |
| DEF-OPS-009 | Google Cloud project/test-user and Workspace admin consent decision for the designated Classroom Preview accounts | Admin consent or domain-wide delegation may be required by the school's configuration and requested access pattern, but it is not established that it is always required for every designated test-account flow. | School Google administrator confirms the least-privilege consent path for the named test accounts and records whether domain-wide delegation is used. | Classroom Preview OAuth is attempted with designated accounts. | Blocks the corresponding live Classroom flow only; does not block local engineering. |
| DEF-OPS-003 | Named human on-call owner and reachable contact for the pilot (`GH-OPS-005`) | A person must accept and perform the role. | Owner names the person and records contact details. | Owner decision. | Blocks a supervised pilot, not local engineering. |
| DEF-OPS-004 | GitHub production-environment required-reviewers setting confirmed from platform settings (`GH-OPS-019`) | YAML/source inspection cannot prove the platform setting. | Authorized GitHub administrator confirms and records it. | Authenticated GitHub settings read. | Blocks confidence in the migration-gating safety net. |
| DEF-OPS-005 | Support mailbox and human-reachable monitoring/alerting (`GH-OPS-001/002/003/030`) | Tool selection, configuration, and a human watcher are operational decisions; paid activation is out of scope here. | Owner selects/configures a service and names the watcher. | Owner decision and live delivery proof. | Blocks pilot-grade operational visibility. |
| DEF-OPS-006 | Pending owner-decision record for the named academy in the production database (`GH-VAL-029`) | Existing instructions say it must not be approved, rejected, or deleted without the owner. | Owner states disposition in writing. | Owner decision. | No engineering action may touch it; this row prevents repeated rediscovery or unsafe mutation. |
| DEF-OPS-007 | Fail-open vs fail-closed decision for shared rate-limit storage (`GH-OPS-008`) | Availability/integrity tradeoff requires a recorded product-risk decision. | Owner/engineering lead decides and records it; then implementation follows. | Decision recorded. | Decision gate; current implementation behavior must not be silently reclassified. |
| DEF-OPS-008 | Any new external service beyond explicitly authorized Vercel hourly-dev, Neon Hourly dev, Google Classroom Preview, Resend Preview, GoodHours Preview scheduler, and fake pilot | User requires service-specific approval. | User approves the named service while awake. | Explicit approval. | Blocked while asleep; do not work around with an unapproved provider. |

## Explicit non-requirements

- A synthetic 13+ attestation is only a fixture, never a human legal attestation.
- Green local tests, `/api/health`, or a READY deployment prove only their direct checks; none proves compliance, certification, or release readiness.
- Live Stripe activation is deliberately deferred and outside this mission's spend/scope.

Sources: `docs/OPEN_ITEMS.md`, `docs/legal/pilot-drafts/OPEN_FACTS_AND_EXECUTION.md`, and `docs/legal/pilot-drafts/REVIEW.md`.
