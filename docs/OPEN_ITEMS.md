# GoodHours — Open Items

One consolidated register of every open item. It supersedes `REMEDIATION_TRACKER.md`,
`docs/functionalities-progress.md`, `OUTREACH_READINESS_CHECKLIST.md` and the checklists
listed in Appendix A for the purpose of tracking what is still open. Those files remain in
place as historical evidence and are not edited.

Consolidated 2026-09-08 from 103 tracker, checklist, QA and evidence sources inside and outside this
repository, spanning 2026-03-27 to 2026-09-08.

## How to update this file

1. **Regenerate the ground-truth block** below by running the commands printed inside it and
   pasting the results. Update its commit stamp.
2. **For any item you worked on, update only its row** — the `Verified` stamp and, if it
   changed, the `Proof` cell. Do not rewrite the statement to describe what you did.
3. **Closed items move to §12** keeping their ID, gaining an evidence pointer. They are never
   deleted and their IDs are never reused.
4. **New items** take the next unused number in their category and carry at least one `Src`.
5. **Do not create a new tracker file.** Three already exist and all three went stale. If you
   are about to write `STATUS.md` or `REMAINING.md` or a dated report that carries open items,
   add a subsection here and a row in Appendix A instead.
6. The durable overnight human/provider dependency register is `docs/qa/DEFERRED_REQUIREMENTS.md`;
   consult it before reopening already-recorded legal, school-authority, or provider-human blockers.

Before trusting any row, check how far behind this file is:

```bash
git log --oneline fef1cea..HEAD | wc -l    # commits since the last full stamp
```

An item whose `Verified` stamp is not the current HEAD is **asserted, not re-proved**.

## Verified ground truth

<!-- BEGIN GENERATED — do not hand-edit inside these markers.
     Regenerate by running the commands in the table verbatim and pasting the results. -->

Generated 2026-09-08 at `fef1cea75a47debab4538f3d99ab21557fa3ccf2` (branch `main`).

| Check | Command | Result |
|---|---|---|
| Server suite | `cd server && npm test` | 487 tests — 486 pass / 0 fail / 1 skip |
| Server build | `cd server && npm run build` | exit 0 |
| Client build | `cd client && npm run build` | pass, Vite |
| Production health | `curl -s https://goodhours.app/api/health` | `200 {"status":"ok","db":"ok"}` |
| Public policy pages | `curl -o /dev/null -w '%{http_code}' https://goodhours.app{/privacy,/terms,/faq}` | 200, 200, 200 |
| Auth boundary | `curl -o /dev/null -w '%{http_code}' https://goodhours.app/api/{opportunities,organizations}` | 200 / 401 |
| Staging host | same two paths against `https://hourly-dev.vercel.app` | 200 / 401 |
| Deployment provenance | `bash scripts/verify-production-provenance.sh` | not run this session — requires `vercel` CLI auth |
| Full local gate | `bash scripts/readiness-check.sh non-billing` | not run this session — components run individually above |

**Every contested number in this project lives here and nowhere else.** Five different
"canonical" server-suite counts appear across the historical documents (461, 464/463, 464/464,
478, 431/430). None of them are carried forward. See conflict rule R8 in Appendix D.

<!-- END GENERATED -->

## Deep-audit note — 2026-09-14 (audit evidence, not a tracker update)

Independent deep audit at `ce2758ec34452d611fca92204681e9197ee9f4f9`: see
`docs/qa/PILOT_DEEP_AUDIT_2026-09-14.md`, raw evidence in
`docs/qa/evidence/2026-09-14/`. No row below was changed by that audit.

Staleness flag: the generated block above is stamped 2026-09-08 at `fef1cea`
and is now **12 commits behind HEAD** (`fef1cea..ce2758e`). Its 487-test
figure and all §12 re-verification stamps are therefore **stale, not
re-measured here and not updated here** — the audit's fresh measurement (565
tests, 564 pass / 0 fail / 1 explained skip; dependency audits 0/0/0 across
all three graphs) lives only in the audit report and its evidence files, per
rule R8. Regenerate the block from a clean clone before trusting any number
in it.

## Local engineering release evidence — 2026-09-24

The historical 2026-09-14 audit below describes the *then-deployed* QR defect;
its findings are not current-source assertions. The candidate based on
`ce2758ec34452d611fca92204681e9197ee9f4f9` now implements a navigable
phone-camera QR handoff, signed-out return after login, second-scan replacement,
server-side America/New_York check-in window (30 minutes before start through
end, ambiguous/nonexistent DST wall times rejected), and fail-closed sensitive
access logs. Local Node 24 server suite: 585 tests, 584 passed, 0 failed,
1 skipped; server/client builds and client lint passed. Thirteen selected QR,
privacy and accessibility browser tests passed against the local preview.
Root/server/client dependency audits with dev dependencies reported zero
vulnerabilities. These are *local* engineering results, not a hosted/device,
provider-delivery, school-authorization, or compliance pass.

Authenticated hosted synthetic testing remains paused: the effective database
branch of each deployment has not been proven separate; the named Neon dev
branch is archived. Release source SHA, production/alias deployment readiness,
and served behavior must be checked after push. Physical-phone scanning,
Classroom/Canvas tenant acceptance, delivered email/alerts, backup restore,
rollback and real-student authorization remain open.

## Gate roll-up — what actually blocks what

`Gate` is the only priority signal in this document. Section order is not.

160 distinct open items, de-duplicated from ~190 recorded instances across 103 sources.

| Gate | Meaning | Count |
|---|---|---|
| `P0` | Blocks any real student data entering the system | 39 |
| `PILOT` | Blocks a supervised pilot, synthetic or real | 79 |
| `LAUNCH` | Blocks general availability, not a pilot | 30 |
| `DEFER` | Explicitly deferred until a paying school requires it | 12 |

Counts are measured from this file, not asserted. Reproduce them with:

```bash
grep -oE '^\| GH-[A-Z]+-[0-9]+' docs/OPEN_ITEMS.md | sort -u | wc -l    # total
```

**The critical path to a real-student pilot** — these are the items where nothing else can
substitute, ordered by what unblocks the most downstream work:

1. `GH-VAL-001` — a legal counterparty who can sign. Everything in §4.1 is blocked behind it.
2. `GH-VAL-004` / `GH-VAL-005` — executed school agreement and DPA.
3. `GH-VAL-003` — qualified legal review of FERPA/COPPA/Massachusetts applicability.
4. `GH-OPS-004` — managed production backups with a tested restore.
5. `GH-OPS-001` — an alert path that reaches a human when production breaks.
6. `GH-AUTH-001` — a second factor for the accounts that can export a whole school's records.
7. `GH-VAL-010` — a synthetic-data pilot completed before any real student is invited.

**Two risks sit outside the four focus themes and are easy to under-weight:** `GH-DEP-001`
(the reproducible test gate — if it is wrong, the evidence behind every other item in this
document is wrong) and §5 (core workflow end-to-end coverage). Read §5 and §6 even if you are
only working the four themes.

## Reading this document

- Section order reflects current focus, **not risk**. Risk is the `Gate` column.
- `Closes` says who can close an item: `MACHINE` (a command proves it), `HUMAN` (someone must
  do a thing and record it), `EXTERNAL` (needs a third party — Google, a school, counsel),
  `DECISION` (needs a written choice; there is no work to do until it is made).
- `Proof` is the single most important column. An item without a stated proof is not yet
  well-formed.
- `Src` codes resolve in Appendix A. `S03§C2` means source S03, its section C2.
- Contradictions between sources were resolved by the rules in Appendix D and recorded in
  Appendix B. Nothing was dropped silently — Appendix A dispositions every source read.
- This file names environment variables. It never contains their values.

---

# 1. Operations, monitoring and production evidence

*Focus theme #4.* Production is live and healthy, but nothing watches it and nothing proves it
can be recovered. This section is the largest source of `PILOT` gates.

## 1.1 Monitoring, alerting and error visibility

| ID | Open item | Gate | Closes | Proof | Verified | Src |
|---|---|---|---|---|---|---|
| GH-OPS-001 | Adopt error tracking / APM. Production failures are currently visible only in Vercel function logs, which nobody watches | PILOT | MACHINE | `rg -n 'sentry\|datadog\|opentelemetry\|newrelic' server/src client/src package.json` returns an implementation, **and** one deliberately-triggered error is received off-platform | absent 2026-09-08@fef1cea | S03§H, S07:32, S07:149, S08:71, S11:161, S11:228, S02:61, S63:18 |
| GH-OPS-002 | Configure uptime monitoring on `/api/health` with an alert that reaches a human, and prove it by taking the service down | PILOT | MACHINE | Monitor exists; one recorded test alert delivered to a phone or inbox | never | S03§H, S07:31, S07:151, S08:72, S08:144 |
| GH-OPS-003 | Alert separately on the five failure classes that fail silently today: audit-write failure, scheduler failure, backup failure, email-delivery failure, shared-rate-limit-store failure | PILOT | MACHINE | Five named alert rules, each with one recorded test firing | never | S03§H, S03§C4, S16:76 |
| GH-OPS-005 | Name a human on-call owner for the pilot window and record how to reach them | PILOT | HUMAN | Named person and contact recorded in §4.4 pilot definition | never | S03§H, S07:154, S03§J |
| GH-OPS-006 | Decide and implement a log retention period, then ship logs somewhere searchable | LAUNCH | MACHINE | Retention configured and stated; sources currently disagree (30d / 90d / 12mo) — see Appendix B row B-04 | never | S07:33, S07:153, S64:16, S59:21, S65:9 |
| GH-OPS-007 | Verify in the **deployed** environment that logs contain no secrets, tokens or student PII, and that correlation IDs are present | PILOT | MACHINE | Sampled production log lines reviewed and recorded; `S03§B1` item 10 satisfied | never | S03§B1, S03§H, S03§C4 |
| GH-OPS-008 | Treat shared-rate-limit-store health as an operations gate. The global limiter **fails open** on store failure and production warns rather than exits when the shared store is absent | PILOT | MACHINE | Store health alerting exists (`GH-OPS-003`), and a documented decision on fail-open vs fail-closed for critical endpoints | fail-open confirmed in source 2026-08-27 | S16:76, S14:66, S07:81, S31:54 |
| GH-OPS-030 | Stand up a monitored support mailbox with a stated response-time expectation, and prove a message sent to it arrives | PILOT | HUMAN | Test message sent to the published address arrives within the stated SLA and is recorded | never | S07:166, S08:74, S08:98, S08:145, S09:172, S02:60, S66:5, S66:20 |

**GH-OPS-008 — limiter fail-open**

- [ ] Decide: fail-open (availability) or fail-closed (integrity) when the durable store is unreachable
- [ ] If fail-closed for auth/critical endpoints, implement and test the closed path
- [ ] Live Upstash/Redis Lua execution remains `UNEXECUTED` per `S31:35` and `S17:76`

## 1.2 Backups, restore and disaster recovery

The only restore evidence that exists is a 2026-06-29 local `pg_dump`/`psql` round-trip on a
developer laptop (`abhay@localhost:5432`). It is not evidence about the production provider.

| ID | Open item | Gate | Closes | Proof | Verified | Src |
|---|---|---|---|---|---|---|
| GH-OPS-004 | Enable automated managed backups on the production database with a stated retention period | P0 | MACHINE | Provider console shows backups enabled with retention; recorded non-secret screenshot or CLI output | never | S03§D2, S07:30, S08:70, S11:200, S11:219, S02:62, S06:621 |
| GH-OPS-009 | Perform and record one real restore from a production backup into an isolated database, including migrations and encrypted fields | P0 | MACHINE | Restore completes; row counts and one decrypted field verified; date recorded | never (local-laptop proof only, `S19`) | S03§D2, S19:59, S19:100, S08:158, S40:53, S41:83, S46:91, S62:22 |
| GH-OPS-010 | Confirm backup encryption, data residency, and that backup access is controlled separately from application access | PILOT | EXTERNAL | Provider terms and configuration recorded in the subprocessor register | never | S03§D2, S06:621, S63:10, S64:17 |
| GH-OPS-011 | Document RTO/RPO and write disaster-recovery procedures with a named human owner for each: failed deploy, database incident, OAuth compromise, JWT secret rotation, field-encryption-key compromise, email-provider compromise, Vercel outage, database outage, student-data breach | PILOT | HUMAN | Each procedure has a named owner and a rehearsal date | never | S03§D3, S06:769, S65:11 |
| GH-OPS-012 | Back up `FIELD_ENCRYPTION_KEY` separately and securely, and record that key loss is treated as catastrophic data loss | P0 | HUMAN | Key escrow procedure recorded (names the variable, never the value); `docs/jwt-secret-rotation.md` extended to cover it | never | S03§D2, S58 |
| GH-OPS-013 | Define what deletion means for data already in backups, and how a legal hold suspends it | PILOT | HUMAN | Written policy approved by the school; matches `S64` once its blanks are filled | proposed only | S03§D3, S64:17, S06:723, S06:724, S61:50 |
| GH-OPS-031 | Add emergency disable switches for signups, integrations, reminders and uploads | LAUNCH | MACHINE | Four switches exist and each is exercised once | never | S03§D3 |

## 1.3 Durable storage and upload lifecycle

Uploads **are** durable — this reverses a long-standing claim. Accepted file content is stored
as `contentBytes Bytes?` in Postgres with disk only as a fallback, so nothing is lost when a
serverless instance recycles. See Appendix B row B-07.

| ID | Open item | Gate | Closes | Proof | Verified | Src |
|---|---|---|---|---|---|---|
| GH-OPS-014 | Fix or delete the orphaned-disk-file sweep. `uploadCleanup` resolves `UPLOAD_DIR` from `__dirname` to a path that cannot exist on Vercel, so the disk half of the daily cron is a production no-op | PILOT | MACHINE | Either the sweep reports a non-zero disk reclaim on a real deployment, or the disk branch is removed and a test asserts DB-only cleanup | local path-mismatch root cause fixed in working tree (`server/src/lib/uploadCleanup.ts` now uses `resolveWritableUploadDir`); remains open until real-deployment reclaim evidence or DB-only cleanup replacement | S03§D1, S07:35 |
| GH-OPS-015 | Decide on malware scanning for uploaded evidence and signatures. None exists; magic-byte MIME detection is not malware scanning | PILOT | DECISION | Written decision; if scanning, a scan runs before a file is retrievable | absent 2026-09-08@fef1cea | S03§D1, S03§C5, S01:290, S06 |
| GH-OPS-016 | Decide whether Postgres `contentBytes` is the permanent storage design or an interim one, and record quotas and streaming behaviour either way | LAUNCH | DECISION | Written decision in §10; if object storage, opaque IDs and per-object authorization | interim by default | S03§D1, S01:290, S63:17 |
| GH-OPS-017 | Verify end to end that deleting a user, and separately deleting a school, removes their uploaded files and attachment rows | P0 | MACHINE | Test exercises both paths against a real database and asserts zero residual rows and bytes | never | S03§D1, S03§E3, S06:724 |

## 1.4 Deployment, release and migration control

| ID | Open item | Gate | Closes | Proof | Verified | Src |
|---|---|---|---|---|---|---|
| GH-OPS-018 | Prove the production database schema matches the reviewed migration history. Six additive migrations were frozen as a candidate and their application was never confirmed | P0 | MACHINE | `prisma migrate status` against production reports no pending migrations; sanitized output recorded | never | S41:9, S41:79, S42:55, S40:29, S07:119 |
| GH-OPS-019 | Confirm required reviewers are actually configured on the GitHub `production` environment. `environment: production` in YAML does not prove reviewers exist | PILOT | HUMAN | GitHub settings screenshot or API output recorded | never | S42:13, S42:67 |
| GH-OPS-020 | Run the deployment-provenance check that already exists and record the result | PILOT | MACHINE | `bash scripts/verify-production-provenance.sh` exits 0, proving the live deployment serves HEAD | script exists, never run | S03§B2, S40:51, S41:76 |
| GH-OPS-021 | Test a rollback. The launch centre exposes a rollback plan with a drill date field that has never been filled | PILOT | HUMAN | One rehearsed rollback with a recorded date | never | S03§I, S03§D3, S77:486, S02:64 |
| GH-OPS-022 | Remove or flag seed and test accounts in the production database, and exclude them from every report | P0 | MACHINE | Query proves no unflagged seed account exists in production; seed script refuses to run against production | never | S07:123, S07:141, S08:73, S11:166, S11:222 |
| GH-OPS-023 | Decide whether the two hardcoded `hourly-dev` staging origins should remain permanently allowed by the production API's CORS policy | PILOT | DECISION | Written decision; if removed, `server/src/index.ts:90` no longer lists them | present in source 2026-09-08@fef1cea | S03§B3 |
| GH-OPS-024 | Decide the fate of `hourly-dev.vercel.app`. It is healthy and serving, is not the production project, and is the host every stale bug report was filed against | PILOT | DECISION | Written decision: retire, or keep as staging with its role stated | both hosts return 200/401 2026-09-08@fef1cea | S03§B1, S04:105, S18, S97, S104 |

## 1.5 Audit-logging durability, access and retention

| ID | Open item | Gate | Closes | Proof | Verified | Src |
|---|---|---|---|---|---|---|
| GH-OPS-025 | Implement retention and purge for `AuditLog` and `DataAccessLog`. Rows accumulate forever; the only scheduled cleanup job is upload cleanup | PILOT | MACHINE | A purge path exists and a test proves rows past the retention window are removed | absent 2026-09-08@fef1cea | S03§C4, S64:16, S06:723 |
| GH-OPS-026 | Restrict who can read audit and data-access logs, and record how tampering is prevented or detected | PILOT | MACHINE | Access check enforced in code and covered by a test | never | S03§C4, S06:715 |
| GH-OPS-027 | Test audit-database failure behaviour end to end and confirm the chosen semantics hold under it | PILOT | MACHINE | A test injects an audit-write failure and asserts the decided behaviour (see `GH-DEC-003`) | partial — `dataAccessLogFailClosed.test.ts` exists | S03§C4, S13:18, S01:49 |

## 1.6 Host and environment health

| ID | Open item | Gate | Closes | Proof | Verified | Src |
|---|---|---|---|---|---|---|
| GH-OPS-028 | Reclaim space on the **development host** — root filesystem was at 99% with ~560 MB free and no deletable checkout. This is the machine this repository lives on, not production | PILOT | HUMAN | `df -h /` shows headroom; recorded | 99% at 2026-08-30, not re-measured | S105 (out-of-repo only) |
| GH-OPS-029 | Prove which database branch each Vercel environment points at. It is currently unproven that Production and Preview do not share a database | P0 | HUMAN | Provider console mapping recorded per environment, naming variables only, never values | never | S91 (out-of-repo only), S03§B2 |

---

# 2. Authentication and account security

*Focus theme #5.* The primitives are sound — JWT signature verification, token-version
revocation, password-reset invalidation, RBAC, HttpOnly session cookie, field encryption
enforced in production. What is missing is a second factor, a finished cookie migration, and
behavioural proof of the isolation the code claims.

## 2.1 Session model and tokens

| ID | Open item | Gate | Closes | Proof | Verified | Src |
|---|---|---|---|---|---|---|
| GH-AUTH-001 | Add a second factor for school-admin accounts — the accounts that can export an entire school's student records. None exists anywhere | PILOT | MACHINE | `rg -n 'totp\|mfa\|otpauth\|authenticator' server/src client/src server/prisma/schema.prisma` returns an implementation, with enrolment and recovery-code tests | absent 2026-09-08@fef1cea | S03§C2, S06:571, S06:766, S65:7, S59:21 |
| GH-AUTH-002 | Offer district SAML/OIDC SSO, or record the decision not to for the pilot | LAUNCH | DECISION | Written decision in §10; districts commonly require it in security review | never | S06:571, S06:582, S06:766, S01:102 |
| GH-AUTH-003 | Provide staff provisioning/deprovisioning and emergency staff disablement. A departing teacher's access is currently removed by hand | LAUNCH | MACHINE | A documented disable path exists and is exercised once | never | S06:582, S06:766, S03§C2 |
| GH-AUTH-004 | Give a school admin a session inventory with immediate revocation | LAUNCH | MACHINE | UI or endpoint lists active sessions and revokes one; test covers it | never | S06:571 |
| GH-AUTH-005 | Require step-up authentication for the high-blast-radius actions: roster export, ownership transfer, integration configuration, PII disclosure changes, bulk messaging, account deletion, billing admin | LAUNCH | MACHINE | Each named action requires re-authentication; tests cover at least export and ownership transfer | never | S06:571, S06:729 |
| GH-AUTH-007 | Finish the HttpOnly cookie migration. The `gh_session` cookie is primary, but `client/src/lib/api.ts:40` still reads a `localStorage` token and the server still returns one for backward compatibility | PILOT | MACHINE | No bearer token in `localStorage`; server no longer emits the JSON `token` field; CSRF covered if cookies become the sole channel | partial 2026-09-08@fef1cea | S13:19, S13:47, S06:565, S01:291, S16:60 |

**GH-AUTH-007 — dual-mode auth**

- [ ] Remove the `localStorage` read in `client/src/lib/api.ts`
- [ ] Stop returning `token` in login/signup responses
- [ ] Add a CSRF test — `SameSite=lax` blocks cross-site POST, but this becomes load-bearing once the cookie is the only channel
- [ ] Blocked on `GH-DEC-002`

## 2.2 Account lifecycle, credentials and abuse resistance

| ID | Open item | Gate | Closes | Proof | Verified | Src |
|---|---|---|---|---|---|---|
| GH-AUTH-008 | Complete a real password reset end to end through a real mailbox | PILOT | HUMAN | Reset email received, link used, old sessions confirmed invalid | never | S09:120, S11:181, S07:101, S08:166 |
| GH-AUTH-009 | Test OAuth account-linking boundaries and duplicate-email account-takeover scenarios | PILOT | MACHINE | Tests cover linking an OAuth identity to an existing password account and the reverse | never | S03§C2, S03§A1 |
| GH-AUTH-010 | Review email-verification bypasses, brute-force protection and session-timeout policy in the deployed environment | PILOT | MACHINE | Each reviewed with a recorded finding or a test | never | S03§C2 |
| GH-AUTH-011 | Test suspended and deactivated users, account deletion with active sessions, and that a password reset invalidates old sessions | PILOT | MACHINE | Three tests, against a real database | partial — token-version revocation exists (`S01:139`) | S03§C2 |
| GH-AUTH-012 | Resolve admin provisioning gaps: public signup accepts only `SCHOOL_ADMIN`, there is no `ORG_ADMIN` provisioning path, school-admin accounts are created by hand, and the impersonation route behind `ENABLE_IMPERSONATION` has never been tested | PILOT | MACHINE | An org-admin provisioning path exists or is explicitly deferred; impersonation is tested or removed | never | S04:136, S08:58, S08:77, S11:202, S25:19 |
| GH-AUTH-013 | Name a security owner, schedule access reviews, and write an offboarding procedure | PILOT | HUMAN | Named owner recorded; first review dated | never | S65:6, S65:7, S59:21, S06:571 |
| GH-AUTH-014 | Stabilise the email/auth rate-limit test under full-suite load. It has failed during full-suite runs, so limiter correctness under concurrency is unproven | PILOT | MACHINE | Full suite green across three consecutive runs with the limiter test enabled | 1 skip remains in the suite 2026-09-08@fef1cea | S13:21, S13:55, S31:54 |
| GH-AUTH-015 | State a password policy. No source document records one — only ad-hoc weak-password observations | LAUNCH | DECISION | Policy written and enforced server-side with a test | no policy on record | — (gap found during consolidation) |
| GH-AUTH-016 | Rotate any credential that was ever committed to git history, and confirm the removal schedule for superseded secrets | P0 | HUMAN | Rotation recorded per variable name; no values recorded | test fixture fixed 2026-08-26 (`S15:23`); historical rotation still open | S16:79, S16:87, S14:51 |

## 2.3 Authorization and tenant isolation

The code centralises school resolution and cohort access. What is missing is the behavioural
matrix that proves it, which is what a district security questionnaire asks for.

| ID | Open item | Gate | Closes | Proof | Verified | Src |
|---|---|---|---|---|---|---|
| GH-AUTH-017 | Test every role against every sensitive route | P0 | MACHINE | A matrix test enumerating roles × routes, green | partial — role tests exist per-area | S03§C2, S03§C3, S25 |
| GH-AUTH-018 | Prove no client-provided ID crosses a tenant boundary: transcript IDs, import-batch IDs, reminder `schoolId`, integration IDs, file IDs | P0 | MACHINE | Test asserts school A cannot reach school B's records through any of those five ID types | partial — `cohortAccessSecurity.test.ts` and similar exist | S03§C3, S06 |
| GH-AUTH-019 | Eliminate the remaining legacy `cohortId` assumptions where membership-aware access is required | PILOT | MACHINE | No read path resolves school scope through primary `cohortId` alone | partial per `S55` | S03§C3, S55, S36 |
| GH-AUTH-020 | Prove deleted and suspended entities are unusable through stale routes | PILOT | MACHINE | Test uses a stale ID after deletion and asserts refusal | never | S03§C3 |
| GH-AUTH-021 | Add a strict role allowlist to the legacy organization report — raised as SOL-27-03, still open, severity low | LAUNCH | MACHINE | Allowlist present with a test | open 2026-08-27 | S16:64 |

## 2.4 Input, upload and abuse hardening

| ID | Open item | Gate | Closes | Proof | Verified | Src |
|---|---|---|---|---|---|---|
| GH-AUTH-022 | Fuzz the CSV parsers and test malformed JSON and oversized payloads | PILOT | MACHINE | Fuzz corpus runs clean; oversized payload rejected without a 500 | partial — `inputSanitization.test.ts`, `csvImportRollback.test.ts` | S03§C5 |
| GH-AUTH-023 | Verify request-body limits and rate limits at the **deployed** API across multiple serverless instances | PILOT | MACHINE | Two-instance limiter proof against the deployment, not a local process | local cross-process proof exists (`S31`) | S03§C5, S07:81 |
| GH-AUTH-024 | Prevent CSV formula injection in exports | PILOT | MACHINE | Export of a cell beginning `=`, `+`, `-` or `@` is neutralised; test covers it | never | S03§C5 |
| GH-AUTH-025 | Confirm SSRF protection on outbound integration URLs and webhook replay/signature validation | PILOT | MACHINE | Private-network egress blocked; replay rejected | partial — `lmsOutboundSecurity.test.ts`, Stripe webhook tests exist | S03§C5, S01 |
| GH-AUTH-026 | Test path traversal, symlink and archive-decompression attacks on the upload path | PILOT | MACHINE | Each attempted and refused, with tests | partial — magic-byte MIME detection exists | S03§C5 |
| GH-AUTH-027 | Write abuse-reporting and account-suspension procedures for the pilot | PILOT | HUMAN | Procedure recorded and the school agrees to it | strike/suspension primitives exist for uploads | S03§C5, S74 |

---

# 3. Third-party integration verification

*Focus theme #6.* Basic Google sign-in is configured in production and was probed on
2026-09-07 (`openid email profile`, correct redirect URI, CSRF state enforced). Google
**Classroom** is a different OAuth client with restricted scopes and is not configured. Canvas
was proven against a self-hosted synthetic tenant, not a school.

## 3.1 Google Classroom

| ID | Open item | Gate | Closes | Proof | Verified | Src |
|---|---|---|---|---|---|---|
| GH-INT-001 | Establish what Google requires before this app may read real rosters. `classroom.rosters.readonly` is a restricted scope, which pulls in OAuth app verification and a third-party security assessment. **No source document in this project mentions this obligation** | P0 | EXTERNAL | Google Cloud console shows the app's verification status and any assessment requirement, recorded here | scope confirmed at `server/src/services/googleClassroomIntegration.ts:1444` 2026-09-08@fef1cea | S56:296, S56:311, S56:351, S57:348, S57:361 |
| GH-INT-002 | Prove one real, non-mock Google Classroom OAuth exchange plus course discovery, roster sync, repeat-sync idempotency and disconnect | P0 | EXTERNAL | An evidence directory shaped like `docs/qa/evidence/2026-09-07-canvas-integration/`: authorization-code exchange, `CONNECTED mode=OAUTH`, preview/apply counts, `DISCONNECTED` | blocked on the owner's own Google credentials 2026-09-07; unchanged 2026-09-08@fef1cea | S50:2, S49:22, S49:346, S11:199, S10:87, S63:14, S71:6, S40:52, S92 |
| GH-INT-003 | Obtain Workspace for Education admin consent for domain-wide use from the pilot school's Google administrator | P0 | EXTERNAL | Consent granted and recorded; this is the school's IT decision, not the operator's | never | S56:296, S57:361, S57:373 |
| GH-INT-004 | Configure the three Classroom variables in production, or record that Classroom is disabled for the pilot. They are validated as an all-or-nothing triple and the integration is inert without them | PILOT | HUMAN | Either all three set and `GH-INT-002` proven, or a written "Classroom disabled for pilot" in the DPA feature list | unconfigured; `server/src/lib/env.ts:194` enforces the triple | S07:66, S07:67, S03§G1 |
| GH-INT-006 | Prove Classroom sync behaviour under adverse conditions: revoked access, repeated sync, cross-school isolation, error and retry paths | PILOT | MACHINE | Each exercised against a live tenant as part of `GH-INT-002` | never | S03§G1 |
| GH-INT-007 | Reconcile the pilot's LMS posture. `PILOT_PLAN.md:57` excludes live LMS OAuth and specifies "mock mode only", but `server/src/lib/env.ts:140,190` **hard-fails production start-up when mock mode is enabled**, so mock-mode-in-production is impossible. The real options are Classroom live, or Classroom off | PILOT | DECISION | Written decision in §10, reflected in the DPA feature list | contradiction confirmed 2026-09-08@fef1cea | S08:57, S10:77, S54:38, S53:12 |

## 3.2 Canvas

| ID | Open item | Gate | Closes | Proof | Verified | Src |
|---|---|---|---|---|---|---|
| GH-INT-008 | Validate Canvas against a real school or district tenant. The 2026-09-07 evidence proves a real OAuth code exchange, but against a self-hosted synthetic Canvas | PILOT | EXTERNAL | Same evidence shape as `S47`, against a school-controlled tenant | synthetic-tenant proof 2026-09-07 | S51:26, S52:236, S53:75, S54:115, S55:104, S55:114, S63:15 |
| GH-INT-009 | Confirm the production Canvas developer key carries the scopes the current sync endpoints need | PILOT | EXTERNAL | Key scopes recorded against the endpoint list | never | S53:76 |
| GH-INT-010 | Set the production Canvas callback URL and allowed origins, and confirm mock mode is off in the deployed environment | PILOT | MACHINE | Deployed config verified; start-up guard already refuses mock in production | guard confirmed 2026-09-08@fef1cea | S07:65, S07:67, S54:29 |

## 3.3 Email delivery

Email is the single most load-bearing unverified dependency: invitations, verification,
password reset, owner approval and reminders all fail silently without it.

| ID | Open item | Gate | Closes | Proof | Verified | Src |
|---|---|---|---|---|---|---|
| GH-INT-011 | Configure a real Resend key with a verified sending domain, including SPF, DKIM and DMARC | P0 | HUMAN | Provider console shows the domain verified; variable names recorded, never values | never | S07:51, S07:96, S08:68, S11:160, S11:216 |
| GH-INT-012 | Prove one real delivery with a provider message ID **and** a mailbox receipt. A 200 from an endpoint is not evidence that mail was sent — a production bug shipped for weeks where the resend route reported success and mailed nothing | P0 | HUMAN | Provider message ID plus a screenshot or copy of the received message, for the owner-approval email specifically | unproven 2026-09-07 | S46:92, S09:118, S08:163, S49:331, S40:53 |
| GH-INT-013 | Handle bounces and complaints. There is no delivery-event webhook and no `EmailLog` or outbox model, so a failed delivery is invisible | PILOT | MACHINE | Bounce webhook received and recorded, or a decision to accept blindness for the pilot with the risk stated | absent 2026-09-08@fef1cea | S03§G2, S08:146, S08:163 |
| GH-INT-014 | Classify each email as transactional or marketing and confirm unsubscribe behaviour is correct for minors | LAUNCH | HUMAN | Written classification per template, agreed with the school | never | S03§G2, S07:99 |

## 3.4 Scheduler and cron execution

| ID | Open item | Gate | Closes | Proof | Verified | Src |
|---|---|---|---|---|---|---|
| GH-INT-015 | Prove the deployed scheduler actually invokes the reminder endpoints. No evidence exists that any scheduled run has ever executed in production | PILOT | MACHINE | One recorded successful scheduled run for both `/api/internal/reminders/run` and `/api/internal/event-reminders/run` | never | S49:199, S49:346, S49:399, S05:89, S05:307, S72:13 |
| GH-INT-016 | Resolve the cron-frequency question. `vercel.json` schedules two daily crons while `.github/workflows/event-reminders.yml` runs every 15 minutes — confirm which is authoritative and that the platform tier supports it | PILOT | HUMAN | Platform dashboard confirms the schedule runs; the redundant path is removed or documented | flagged unverified 2026-08-04 | S01:287, S03§G2 |
| GH-INT-017 | Prove scheduler authentication in production: correct secret succeeds, wrong secret 401, missing secret behaves as designed | PILOT | MACHINE | Three probes recorded against the deployment | guard present at `server/src/routes/internal.ts:53` | S03§G2, S07:54 |
| GH-INT-018 | Prove lease-based concurrency control, retry limits and failure recording under real scheduled execution | PILOT | MACHINE | Duplicate invocation is idempotent; a forced failure is recorded and retried within limits | local tests exist | S03§G2, S49:199 |

## 3.5 Payments — activation-gated

Billing is deliberately out of the first pilot. These items exist so the deferral is explicit
rather than forgotten.

| ID | Open item | Gate | Closes | Proof | Verified | Src |
|---|---|---|---|---|---|---|
| GH-INT-019 | Record in the school agreement that billing is disabled for the pilot | PILOT | HUMAN | Feature list in the executed agreement marks billing off | pilot plan already excludes it | S08:69, S71:18, S63:16, S59:23 |
| GH-INT-020 | Complete the live Stripe activation chain before charging anyone: account approval, live keys, registered webhook endpoint, live price IDs, one supervised live payment, one refund and cancellation | LAUNCH | EXTERNAL | Each step recorded; `bash scripts/readiness-check.sh billing` passes against live configuration | test-mode QA only (`S26`) | S07:59, S07:107, S09:154, S11:195, S11:221, S11:231, S10:245, S10:263 |
| GH-INT-021 | Decide what restrictions apply if a minor is the account holder when billing is enabled | LAUNCH | DECISION | Written decision; contracting boundary already drafted in the terms | never | S59:23, S69 |

## 3.6 Pilot integration finish

Consolidates the per-provider proofs above into one cutover: each integration is either
proven live for the pilot or explicitly off, with error paths exercised.

| ID | Open item | Gate | Closes | Proof | Verified | Src |
|---|---|---|---|---|---|---|
| GH-INT-022 | Complete the pilot integration cutover: Classroom live-or-off (`GH-INT-004`, `GH-INT-007`), Canvas live-or-off against the school tenant (`GH-INT-008`), email proven delivered (`GH-INT-012`), scheduler proven firing (`GH-INT-015`), disconnect/revoke/retry paths exercised, failure surfaced to the pilot owner | PILOT | HUMAN | Cutover sheet signed: per-integration live/off, evidence links, on-call contact for integration failure during the pilot | never | S08:67, S54:29, S71:6, S49:346 |

---

# 4. External validation and pilot proof

*Focus theme #7.* This is where the project is furthest from ready, and none of it is
engineering work. The legal package in `docs/legal/pilot-drafts/` is substantive and
primary-source-cited, but it declares itself unapproved draft material and carries blocking
`NEEDS OWNER INPUT` fields in every operative document.

## 4.1 Legal, privacy and contracting

| ID | Open item | Gate | Closes | Proof | Verified | Src |
|---|---|---|---|---|---|---|
| GH-VAL-001 | Establish a legal counterparty who can sign. There is no operator entity, address, or authorised signatory on record, and the release handoff states rollout requires parent acceptance — a minor cannot execute a DPA | P0 | HUMAN | Entity name, type, jurisdiction, address and signatory recorded; every operative draft's operator blanks filled | none 2026-09-08 | S59:16, S67:2, S69, S62:3, S40:5, S40:63 |
| GH-VAL-002 | Identify the school's legal entity, authorised official, signatory authority, records/privacy contact, safeguarding contact and pilot dates | P0 | EXTERNAL | Recorded in the agreement's execution block | LSRHS named as target; no representative identified | S59:17, S67:2, S62:3, S90 |
| GH-VAL-003 | Obtain qualified legal review of FERPA role, COPPA applicability and Massachusetts obligations. The decision not to seek review is currently recorded as a choice, not as clearance | P0 | EXTERNAL | Reviewer named and outcome recorded as `review obtained`; never inferred | not engaged | S60:29, S61:49, S61:53, S07:160, S09:175, S11:233, S02:68, S16:89, S06:757 |
| GH-VAL-004 | Execute the School Pilot Agreement with every bracketed field populated | P0 | EXTERNAL | Signed document; feature and provider enablement list attached | never | S59:18, S67:26, S60:32, S61:49 |
| GH-VAL-005 | Execute the student-data privacy addendum / DPA. A Massachusetts district will typically want a standard SDPC-style agreement | P0 | EXTERNAL | Signed DPA naming both entities, documented instructions, retention, deletion and incident cooperation | never | S68:25, S59:18, S06:757, S55:88, S07:165 |
| GH-VAL-006 | Verify and record the actual enabled providers and their contracts: hosting, database, email, OAuth, Classroom, Canvas, storage, monitoring, billing, backups — with regions, retention and deletion terms | P0 | EXTERNAL | Subprocessor register rows move from "not verified" to a contract reference | every row unverified | S63 (all rows), S59:19, S62:10, S06:770, S07:165, S61:46 |
| GH-VAL-007 | Obtain a cyber-liability insurance quote, or record the decision to proceed without one | PILOT | HUMAN | Quote or written decision; districts frequently ask | never | S03§E1 |
| GH-VAL-008 | Publish the approved privacy notice and terms with effective dates, and retain version evidence. The live site may still serve superseded policy text | PILOT | HUMAN | Published versions match the approved drafts; version evidence retained per `S75` | live pages return 200 but content not compared 2026-09-08 | S69, S75, S40:54, S66:5 |

## 4.2 Student and minor protections

| ID | Open item | Gate | Closes | Proof | Verified | Src |
|---|---|---|---|---|---|---|
| GH-VAL-009 | Behaviourally verify the 13+ gate on **every** account-entry path: password signup, Google new and existing, invitation, roster/LMS pre-provisioning and activation, direct API call, altered payload, replay, and pre-existing accounts | P0 | MACHINE | A test matrix covering all listed paths; source inventory is not sufficient | partial — password/Google/existing covered; imported and staged activation not exercised | S34:15, S59:20, S60:31, S61:48, S62:9, S70:38 |
| GH-VAL-011 | Obtain school approval of the 13+ policy, the plain-language notices, and whether any school-specific consent is required | P0 | EXTERNAL | School's written approval recorded | never | S73:8, S59:22, S70:38 |
| GH-VAL-012 | Agree a safeguarding escalation path and an inappropriate-content and harassment reporting route with the school | P0 | EXTERNAL | Named escalation contacts and a written procedure | drafted only | S74, S03§E2, S59:22 |
| GH-VAL-013 | Confirm in writing that the **school**, not an unsupervised minor, authorises student onboarding | P0 | EXTERNAL | Statement in the executed agreement | never | S03§E1 |
| GH-VAL-014 | Record the per-school PII-sharing decision. `School.ferpaBeneficiaryPiiEnabled` defaults false and controls whether student names reach beneficiary admins — the school must decide it explicitly | PILOT | EXTERNAL | Decision recorded in the DPA feature list and reflected in the school's configuration | flag confirmed at `server/prisma/schema.prisma:269` 2026-09-08@fef1cea | S03§E2, S55 |
| GH-VAL-036 | Prove FERPA operational controls live: school-directed disclosure only, minimum-necessary access, rights-request routing to the named records contact, no PII in logs, deletion propagation verified | P0 | MACHINE | Rights request exercised end to end; log sample reviewed; deletion propagation test green; ties to `GH-VAL-016`, `GH-VAL-017`, `GH-OPS-007` | never | S59:19, S61:49, S64, S66 |
| GH-VAL-037 | Prove COPPA operational controls live: under-13 blocked or gated by verifiable parental consent on every entry path, no marketing email to minors, age-gate bypass attempts refused | P0 | MACHINE | Entry-path matrix including bypass attempts green; email classification recorded; ties to `GH-VAL-009`, `GH-INT-014` | never | S59:20, S60:31, S70:38, S07:99 |

## 4.3 Data lifecycle, retention and rights requests

| ID | Open item | Gate | Closes | Proof | Verified | Src |
|---|---|---|---|---|---|---|
| GH-VAL-015 | Approve a data inventory covering every category the system holds: student identity, school membership, org contacts, attendance timestamps, hour ledger, transcripts, signatures, supervisor verification, uploaded evidence, messages, reminder records, OAuth tokens, audit logs, CSV imports, backups, security logs | P0 | EXTERNAL | Inventory approved by the school with purpose, access, retention and deletion per category | drafted only | S03§E3, S64, S59:19 |
| GH-VAL-016 | Name the school's records administrator and agree how parent and eligible-student rights requests are routed | P0 | EXTERNAL | Named contact and routing procedure recorded | drafted only | S66, S62:22, S03§E3 |
| GH-VAL-017 | Verify export, deletion and correction against a real database, including deletion propagation | P0 | MACHINE | Each workflow exercised end to end with recorded results; ties to `GH-OPS-017` | never | S03§E3, S61:50, S06:724 |
| GH-VAL-018 | Write the legal-hold procedure and confirm how it suspends scheduled deletion | PILOT | HUMAN | Procedure recorded; ties to `GH-OPS-013` | drafted only | S64, S59:19 |

## 4.4 Pilot definition, owner and stop conditions

| ID | Open item | Gate | Closes | Proof | Verified | Src |
|---|---|---|---|---|---|---|
| GH-VAL-010 | Run a synthetic-data pilot before any real student is invited. Every layer of guidance says this comes first | P0 | HUMAN | A completed synthetic run through the full journey with findings recorded | never | S03§J, S03 "Most urgent sequence" step 9, S98 |
| GH-VAL-019 | Define the pilot concretely: school, dates, student count, teachers and admins, participating organisations, service-hour policy, what counts as verified, who certifies transcripts, deadline rules | PILOT | HUMAN | `docs/qa/PILOT_PLAN.md` §2 and §9 populated; contacts currently read "TBD" | never | S08:67, S08:297, S03§J |
| GH-VAL-020 | Agree one measurable success metric and explicit stop conditions before starting | PILOT | HUMAN | Metric and stop conditions written down and agreed with the school | metrics defined in `S08` but never agreed | S02:57, S08:253, S03§J |
| GH-VAL-021 | Name the human who monitors the pilot daily and owns disputed hours and school-leaves handling | PILOT | HUMAN | Named owner recorded; ties to `GH-OPS-005` | never | S03§J, S08:143 |
| GH-VAL-022 | Produce the post-pilot report and a written go/no-go before any expansion | LAUNCH | HUMAN | Report covering the seven required sections; decision recorded | never | S08:269, S03§J |

## 4.5 Real-user and real-school validation

Nothing in this subsection has ever been done. Zero real users, zero references, zero pilot
commitments — consistent across every source layer.

| ID | Open item | Gate | Closes | Proof | Verified | Src |
|---|---|---|---|---|---|---|
| GH-VAL-023 | Have at least one real user or school admin use the product and capture their friction points | PILOT | HUMAN | Session held; friction list recorded | never | S02:53, S02:54, S02:55 |
| GH-VAL-024 | Run silent usability observation sessions with real participants: two students, a nonprofit coordinator, a school administrator | PILOT | HUMAN | Four sessions recorded | never | S09:139 |
| GH-VAL-025 | Complete the founder manual QA pass on real devices — three role journeys, six device rows, export verification in Excel and Google Sheets | PILOT | HUMAN | Checklist worked through on real hardware, not simulators | never | S09:34, S09:65, S09:86, S09:99, S09:129, S49:397, S38:30, S40:53 |
| GH-VAL-026 | Sign off the manual checklist. Its founder signature and date fields are blank and it carries an "outstanding items" field that was never filled | PILOT | HUMAN | Signed and dated | blank | S09:183, S10:298 |
| GH-VAL-027 | Work through the 68 items the Playwright suite marks MANUAL REQUIRED, at least the P1 subset | PILOT | HUMAN | P1 items recorded as passed | never | S11:176, S11:180, S11:220 |
| GH-VAL-028 | Obtain a reference: a school admin who would recommend it and at least one organisation that would use it again | LAUNCH | EXTERNAL | Post-pilot evaluation table's satisfaction rows filled | table blank | S08:253 |
| GH-VAL-029 | Resolve the pending owner-decision record sitting in the production database for a named academy. Three out-of-repo documents state it must not be approved, rejected or deleted until the owner decides, and it appears nowhere in this repository | P0 | HUMAN | Owner states the disposition in writing; the record is actioned and its terminal state recorded here | present and untouched 2026-09-07 | S92, S94 (out-of-repo only) |

## 4.6 Commercial pipeline

Status only. Pricing figures, school names and template copy stay in `RTB/2-Sales/` and
`RTB/1-Projects/` and are deliberately not reproduced in this repository.

| ID | Open item | Gate | Closes | Proof | Verified | Src |
|---|---|---|---|---|---|---|
| GH-VAL-030 | The pilot offer is defined but has never been sent to a school. The outreach log's only entries are dated 2026-05-01 and read "no emails sent yet" | LAUNCH | HUMAN | First outreach recorded in `RTB/2-Sales/outreach.md` | zero sent | S100, S101 (out-of-repo) |
| GH-VAL-031 | The funnel dashboard defines metric names — emails sent, responses, calls booked, pilot schools, students onboarded, revenue — and every value is blank | LAUNCH | HUMAN | First non-zero values recorded | all blank | S102 (out-of-repo) |
| GH-VAL-032 | A school lead list exists as an archived PDF and has never been qualified or sequenced | LAUNCH | HUMAN | Leads qualified and a sequence started; contents stay out of this repository | unqualified | S106 (out-of-repo) |
| GH-VAL-033 | The business operating doc's current-stage field is still an unfilled placeholder, and the buyer persona is undocumented in the readiness checklist | LAUNCH | HUMAN | Stage set and persona written | placeholder | S99, S02:40, S02:41 |
| GH-VAL-034 | The outreach gating rule currently reads discovery-only because it keys off a build failure that no longer exists. Re-run the gate against reality and record the new posture | PILOT | HUMAN | `OUTREACH_READINESS_CHECKLIST.md` §9 re-evaluated, or the decision recorded here instead | gate stale — see Appendix B row B-01 | S02:82, S02:87 |
| GH-VAL-035 | The outreach and demo assets do not exist: value proposition, 30-second demo, 3-minute walkthrough, onboarding doc, pilot email template, follow-up sequence, FAQ | LAUNCH | HUMAN | Each asset written | none | S02:44 |

---

# 5. Core workflow and product reliability

Not a focus theme, but read it anyway: a pilot fails on a broken journey long before it fails
on a missing DPA.

| ID | Open item | Gate | Closes | Proof | Verified | Src |
|---|---|---|---|---|---|---|
| GH-WF-001 | Cover the full journey end to end: invitation → verified account, login/logout, password reset, Google SSO, org and school onboarding, opportunity creation and approval, signup, waitlist promotion, cancellation, QR attendance, manual roster attendance, check-in/out, rejected-submission correction, supervisor verification, school approval, transcript generation and certification, CSV import/preview/rollback, student and school reports, CSV export, student and org and school deletion, reminder delivery, email verification | PILOT | MACHINE | Each journey has a passing end-to-end test or a recorded manual pass | large partial — 486-test suite plus browser suites cover much of this | S03§F, S10, S103 |
| GH-WF-002 | Test concurrency on the paths where two people act at once: check-in/out, hour correction and reset, waitlist promotion, reminder execution | PILOT | MACHINE | Concurrent-run tests with expected serialization failures | partial — real-PostgreSQL concurrency proof exists (`S32`) | S03§F, S32 |
| GH-WF-003 | Test DST transitions, timezone boundaries, boundary dates and school-year rollover | PILOT | MACHINE | Tests covering each | partial — canonical event-time tests exist | S03§F, S01:275 |
| GH-WF-004 | Test a large roster import at realistic scale | PILOT | MACHINE | Import of a full-size roster completes within an acceptable time with rollback intact | never | S03§F, S22 |
| GH-WF-005 | Test on a slow network and on a real mobile browser | PILOT | HUMAN | Recorded pass; ties to `GH-VAL-025` | never | S03§F |
| GH-WF-006 | Complete the end-to-end, database-backed transcript certification test | PILOT | MACHINE | Test certifies a transcript against a real database and asserts the immutable snapshot | flagged as needing external validation | S03§A2 |
| GH-WF-007 | Exercise account offboarding: student deletion, org deactivation, school deactivation and school shutdown | PILOT | MACHINE | Each path tested; ties to `GH-OPS-017` and `GH-VAL-017` | helper exists at `server/src/routes/auth.ts:1187` | S03§K23, S03§E3 |
| GH-WF-008 | Finish partial-failure reporting so reports return `PARTIAL` or `UNAVAILABLE` rather than misleading zeros, across every report surface | PILOT | MACHINE | Every report endpoint propagates `dataState`; test covers a forced source failure | partial — core hours/progress layer done | S01:275 §12 |

---

# 6. Dependencies, build and the reproducible test gate

**If this section is wrong, every other item's evidence is wrong.**

| ID | Open item | Gate | Closes | Proof | Verified | Src |
|---|---|---|---|---|---|---|
| GH-DEP-001 | Guarantee one documented test command that loads a safe environment, runs against an isolated database, and is the same command CI runs | P0 | MACHINE | `bash scripts/readiness-check.sh non-billing` succeeds from a clean clone with no manual environment setup, and CI invokes it | script exists; suite green 2026-09-08@fef1cea but with a required `server/.env.test` | S03§B5, S91 |
| GH-DEP-002 | Settle the root dependency-audit result. Two 2026-09-05 documents each declare the other stale — one reports 10 vulnerabilities (1 high, 9 moderate), the other reports 0 | PILOT | MACHINE | `npm audit --include=dev --json` re-run at HEAD in all three graphs, result pasted into the generated block | not re-measured this session — see Appendix B row B-02 | S45:6, S38:19, S17:95, S28:59, S29 |
| GH-DEP-003 | Recheck the React Router advisory exception. Its own recheck-by date was 2026-08-31 and has passed | PILOT | MACHINE | Exception re-evaluated and its date advanced or the exception removed | expired | S27:27, S01:333 |
| GH-DEP-005 | Run workflow linting. `actionlint` was unavailable locally and the check was recorded as blocked | LAUNCH | MACHINE | `actionlint` runs clean over `.github/workflows/` | blocked | S30:32 |
| GH-DEP-006 | Establish supply-chain hygiene: an SBOM, continuous secret scanning, vulnerability remediation SLAs, protected branches with required review, and an independent penetration test before broad distribution | LAUNCH | HUMAN | Each established or explicitly deferred with a written risk decision | not established | S06:615, S03§I, S03§K27 |

---

# 7. Data model, migrations and database operations

| ID | Open item | Gate | Closes | Proof | Verified | Src |
|---|---|---|---|---|---|---|
| GH-DB-001 | Apply all migrations from zero on an isolated PostgreSQL, and separately apply them to a copy of an existing database | P0 | MACHINE | Both runs recorded; `prisma migrate status` clean afterwards | shadow-replay diff was empty at the 2026-09-06 candidate | S03§B4, S40:41 |
| GH-DB-002 | Confirm no migration silently deletes student records | P0 | MACHINE | Scan across the full migration history, not just the six candidate directories | six candidates scanned clean 2026-09-06 | S03§B4, S40:33 |
| GH-DB-003 | Confirm connection pooling is safe for serverless, with sane timeout and retry behaviour | PILOT | MACHINE | Recorded configuration and a load probe | never | S03§B4 |
| GH-DB-004 | Confirm a failed transaction leaves no partial attendance, transcript, import or reminder state | P0 | MACHINE | Injected-failure tests across all four | partial — injected ledger-failure rollback proven | S03§B4, S40:38 |
| GH-DB-005 | Confirm indexes and unique constraints exist for tenant-sensitive records | PILOT | MACHINE | Schema review recorded | partial — index migration landed 2026-08 | S03§B4, S01:275 §17 |
| GH-DB-006 | Reconcile the migration count. Sources record 63 and 70 migrations on disk within twelve days | PILOT | MACHINE | Count re-measured and stated once, in the generated block | not re-measured — see Appendix B row B-08 | S49:392, S46:82, S43:16 |

---

# 8. Accessibility, browser support and performance

| ID | Open item | Gate | Closes | Proof | Verified | Src |
|---|---|---|---|---|---|---|
| GH-AX-001 | Supplement automated axe scans with manual VoiceOver and NVDA testing | LAUNCH | HUMAN | Recorded manual pass over the core journeys | axe: 0 critical / 0 serious across six routes | S06:697, S21 |
| GH-AX-002 | Publish a VPAT or Accessibility Conformance Report | LAUNCH | HUMAN | Published document | not demonstrated | S06:760 |
| GH-AX-003 | Test on real Safari iOS and Android Chrome | PILOT | HUMAN | Recorded pass; ties to `GH-VAL-025` | Chromium desktop only | S11:197, S11:234 |
| GH-AX-004 | Run a load and concurrency test at expected pilot scale | LAUNCH | MACHINE | Recorded run at 50 concurrent students | never | S03 "before broad distribution", S22 |
| GH-AX-005 | State the ADA conformance target (WCAG 2.1 AA), fix known barriers (keyboard, focus, contrast, reduced-motion, form labels), and publish an accessibility statement with a contact route | LAUNCH | HUMAN | Conformance target recorded; statement page live; axe plus manual pass re-run after fixes | never | S06:697, S06:760, S21 |

---

# 9. Repository, documentation and process hygiene

| ID | Open item | Gate | Closes | Proof | Verified | Src |
|---|---|---|---|---|---|---|
| GH-REPO-001 | `README` directs readers to `tests/qa-results.md` as "latest QA notes". That file is 6158 lines of 34 stacked machine runs ending 2026-07-12 | LAUNCH | HUMAN | README points here instead | stale | S82, S81 |
| GH-REPO-002 | `CLAUDE.md` describes SQLite for development and an architecture that has since been superseded by the school/cohort/beneficiary model | LAUNCH | HUMAN | Rewritten to match the current stack | stale | S84 |
| GH-REPO-003 | `school.md` and `student.md` are empty stubs with blank Overview and Notes sections dating to 2026-05-01 | LAUNCH | HUMAN | Filled or deleted | empty | S83 |
| GH-REPO-004 | `instructions.md` holds ten UI change requests with no status field — nobody can tell which are done | LAUNCH | HUMAN | Each request marked done, dropped, or promoted to an item here | unknown | S80 |
| GH-REPO-006 | Reconcile or retire the stale readiness documentation this file supersedes, so nobody works from a superseded list | PILOT | HUMAN | Appendix A dispositions are reflected in the files themselves, if the owner wants headers added | this file is step one; sources deliberately untouched | S03§K30, S02, S01 |
| GH-REPO-007 | Turn on branch protection, required review and required CI before merge | LAUNCH | HUMAN | Repository settings recorded | never | S03§I |

---

# 10. Open decisions awaiting a named human

Rows shown in `backticks` are cross-references to items defined in earlier sections; only the
`GH-DEC-*` rows are defined here.

These are not tasks. No work can start until someone decides, and they will otherwise sit in a
task list forever making the project look stalled. Each needs a name and a date.

| ID | Decision | Gate | Owner | Recorded? |
|---|---|---|---|---|
| GH-DEC-001 | Are 7-day JWTs acceptable for minors' data, or must student sessions be shorter? Unblocks `GH-AUTH-006` | P0 | unassigned | no |
| GH-DEC-002 | Do bearer tokens in `localStorage` stay, or does the app go cookie-only with CSRF protection? Unblocks `GH-AUTH-007` | P0 | unassigned | no |
| GH-DEC-003 | Must critical audit writes be fail-closed with a durable retry or outbox, accepting the availability cost? Unblocks `GH-OPS-027` | P0 | unassigned | no |
| `GH-INT-007` | Classroom live for the pilot, or Classroom off? Mock-in-production is impossible | PILOT | unassigned | no |
| `GH-OPS-008` | Rate limiter fail-open or fail-closed when the shared store is unreachable? | PILOT | unassigned | no |
| `GH-OPS-015` | Malware scanning on uploads: required for the pilot, or accepted risk? | PILOT | unassigned | no |
| `GH-OPS-016` | Is Postgres `contentBytes` the permanent storage design or interim? | LAUNCH | unassigned | no |
| `GH-OPS-023` | Do the hardcoded staging origins stay in the production CORS allowlist? | PILOT | unassigned | no |
| `GH-OPS-024` | Retire `hourly-dev`, or keep it as staging with a stated role? | PILOT | unassigned | no |
| `GH-AUTH-002` | District SAML/OIDC SSO for the pilot, or deferred? | LAUNCH | unassigned | no |
| `GH-AUTH-015` | What is the password policy? | LAUNCH | unassigned | no |
| `GH-INT-021` | What billing restrictions apply if the account holder is a minor? | LAUNCH | unassigned | no |

---

# 11. Explicitly deferred — not first-pilot blockers

Recorded so they are not rediscovered later as "new" work. All carry gate `DEFER`.

| ID | Deferred item | Condition to revisit |
|---|---|---|
| GH-DEFER-001 | Canvas LTI | A paying school specifically requires it |
| GH-DEFER-002 | Microsoft SSO | After Google authentication is stable and a tenant is defined |
| GH-DEFER-003 | Clever / ClassLink | Whichever an actual district prospect requires |
| GH-DEFER-004 | Kiosk attendance mode | — |
| GH-DEFER-005 | Offline mode | — |
| GH-DEFER-006 | Native mobile app | — |
| GH-DEFER-007 | Aspen integration | — |
| GH-DEFER-008 | Full unrestricted rules engine | — |
| GH-DEFER-009 | Advanced waivers and document workflows | — |
| GH-DEFER-010 | Reflection essays | — |
| GH-DEFER-011 | Mandatory organization adoption | — |
| GH-DEFER-012 | Continuous location tracking and GPS geofencing | Deliberately never — recorded as a minor-safety position |

---

# 12. Closed and re-verified

## 12.1 Closed this session, with proof

Each of these was recorded as open or broken somewhere in the corpus and was **re-run today**
at `fef1cea`. Conflict rules R1 and R7 apply.

| Was recorded as | Recorded by | Re-verified 2026-09-08@fef1cea | Disposition |
|---|---|---|---|
| "Server TypeScript build is failing" | S02:82 (undated), S91 | `cd server && npm run build` → exit 0 | CLOSED — the claim gated the whole outreach decision rule; see `GH-VAL-034` |
| "Dependency vulnerabilities still need review" as a blocker | S02:83 | superseded as a *blocker*; the actual count is still contested — carried forward as `GH-DEP-002` | CLOSED as a blocker, reopened as a measurement item |
| Staging API returns 500 `FUNCTION_INVOCATION_FAILED` on `/api/health` | S03§B1, S98, S104 | `hourly-dev.vercel.app/api/health` → 200; `goodhours.app/api/health` → 200 `{"status":"ok","db":"ok"}` | CLOSED |
| BUG-0825-1 CRITICAL — widespread 500s on Opportunity/Organization/Signup endpoints | S04:105, S18 | `/api/opportunities` → 200 and `/api/organizations` → 401 on **both** hosts | CLOSED (R7 — environment-scoped) |
| BUG-0825-2 HIGH — signup returns 500, persists no user row | S04:112 | dependent on BUG-0825-1's schema drift, which no longer reproduces | CLOSED, pending one positive signup probe |
| BUG-0825-3 HIGH — seeded SCHOOL_ADMIN login returns 500 | S04:118 | same root cause; no 500s observed | CLOSED, pending one authenticated login probe |
| BUG-0825-4 HIGH — staging deployment stale, newer routes 404 | S04:123 | production serves current routes | CLOSED |
| BUG-0825-5 MEDIUM — student CSV export 503 | S04:129 | same root cause | CLOSED, pending one authenticated export probe |
| "HTTPS missing" / "production PostgreSQL not provisioned" | S11:159, S11:217 | live over HTTPS with `db: ok` | CLOSED |
| "Serverless disk uploads must be replaced with durable object storage" | S98, S03§D1, S01:290 | accepted content is stored as `contentBytes Bytes?` in Postgres with disk as fallback; download paths read the DB first | CLOSED as a durability risk. The *disk sweep* is separately broken — `GH-OPS-014` |
| Five mutually exclusive canonical test counts | S45, S38, S39, S40, S46, S49 | one measurement: 486 pass / 0 fail / 1 skip of 487 | CLOSED — R8; the single skip is `GH-DEP-004` |
| `/__test-email` registered on public deployments (was SEC-008) | S01:143 | `curl https://goodhours.app/api/__test-email` → 404 `{"error":"Not found"}` 2026-09-08 (bare path returns SPA fallback HTML, not an API route) | CLOSED |
| NaN pagination 500s (was SEC-009) | S01:125 | `curl '.../api/opportunities?page=abc'` → 200 with default list; invalid `limit` coerced, invalid `status` → 400 (`server/src/routes/opportunities.ts:41-44`) — no 500 path | CLOSED as a crash risk; strict-400 for garbage params folded into `GH-AUTH-022` |
| SOL-03 committed test encryption key in tracked fixture | S15:23 | `server/.env.test` carries no `FIELD_ENCRYPTION_KEY` (key names verified 2026-09-08); residual historical rotation is `GH-AUTH-016` | CLOSED |
| Stale ownership-lock note in working tree (`GH-REPO-005`) | S85 | PID 815326 not running, no controller processes; untracked note file deleted 2026-09-08 | CLOSED |
| Student short sessions (`GH-AUTH-006`, was SOL-27-02) | S16:57 | `signUserToken` issues STUDENT 24h / staff 7d (`server/src/middleware/auth.ts:148`); asserted in `server/tests/oauthSecurity.test.ts:40`; suite green 2026-09-08 clean-env | CLOSED — implementation is the decision; `GH-DEC-001` left for owner ratification |
| OAuth state single-use + browser-bound (`GH-INT-005`, was SOL-02/SOL-27-01) | S14:41, S15:27, S16:47 | atomic claim in `server/src/lib/oauthState.ts:35-44`, wired into `canvasIntegration.ts` + `googleClassroomIntegration.ts`; replay + wrong-browser refusals in `server/tests/oauthSecurity.test.ts:7-31`; suite green 2026-09-08 clean-env | CLOSED |
| The one skipped test (`GH-DEP-004`) | S39, S38:16 | `durableRateLimit.test.ts:111` skips without `RATE_LIMIT_TEST_DATABASE_URL`; clean suite 486 pass / 0 fail / 1 skip of 487 | CLOSED — skip named and justified |
| JWT revocation via `User.tokenVersion` (was SEC-007) | S01:139 | `tv` enforced in `server/src/middleware/auth.ts:97`, embedded at sign-in; `resetTokenConcurrency.integration.test.ts:22` asserts resets revoke sessions once; suite green 2026-09-08 clean-env | CLOSED |
| SOL-01 cross-school milestones IDOR | S15:11, S16:40 | `studentMilestonesScope.integration.test.ts:71,73` asserts cross-school and out-of-cohort 403; suite green 2026-09-08 clean-env | CLOSED |
| Audit-log writes fail-closed (was F1) | S01:49 | `server/src/lib/dataAccessLog.ts` throws instead of swallowing; `dataAccessLogFailClosed.test.ts` green in suite 2026-09-08 clean-env | CLOSED |
| SECURITY_AUDIT FINDING-004 (dev email inbox) | S01:118 | route registered only when `!isPubliclyDeployed()` (`server/src/routes/auth.ts:343`); prod probe `GET /api/auth/__test-email?inbox=test` → 404 2026-09-08 | CLOSED |
| SECURITY_AUDIT FINDING-005 (NaN OFFSET 500) | S01:118 | page/limit 400-validated before interpolation (`server/src/routes/beneficiaries.ts:548-554`) | CLOSED |
| Prisma CLI/client drift (was F5) | S01:300 | `server/package.json` + root agree: `@prisma/client ^6.19.2`, `prisma ^6.19.3` — no drift 2026-09-08 | CLOSED |

## 12.2 Claimed resolved, not re-verified — the re-verification queue

Per the standing rule, a claim is not closed just because a document says so. These are the
short, executable list of things that are *probably* fine. Run the command, then move the row
to §12.1 or open an item.

| Claim | Claimed by | Command that settles it |
|---|---|---|
| The Canvas database was **not** irrecoverably inconsistent; no `db:drop` was needed | S92 refuting S95 | already superseded by `S47`; no action |
| The opportunity-detail axe scan no longer passes vacuously | S48:7 | `npm test -- accessibility` and confirm `rulesEvaluated` is non-zero |
| School procurement billing surfaces are now exercised | S48:54 | `npm test -- schoolProcurement` |
| Production migration mechanism exists and runs at build time | S43:5 | `GH-OPS-018` — `prisma migrate status` against production is the real proof |

---

# Appendix A — Source coverage and disposition

Every source read during consolidation, including those that yielded no open items — a
zero-yield row is the evidence that the file was read. Repo-relative paths are inside this
checkout; absolute paths are outside it.

**Dispositions:** `SUPERSEDED` — its open items live here now; do not update it again.
`CURRENT` — still authoritative for its own narrow domain; referenced, not replaced.
`HISTORICAL` — a dated evidence record; never re-derive status from it.
`EXTERNAL` — outside the repo; mirrored here because it is otherwise invisible from inside.
`EXCLUDED` — see Appendix C.

| Code | Path | Modified | Disposition | Items absorbed |
|---|---|---|---|---|
| S01 | `REMEDIATION_TRACKER.md` | 2026-08-25 (hdr 08-04) | SUPERSEDED | GH-OPS-008, GH-OPS-015, GH-OPS-016, GH-AUTH-002, GH-AUTH-007, GH-WF-003, GH-WF-008, GH-DB-005, GH-INT-016, GH-DEP-003, GH-REPO-006; plus 8 §12.2 rows |
| S02 | `OUTREACH_READINESS_CHECKLIST.md` | 2026-08-05 | SUPERSEDED | GH-OPS-001, GH-OPS-021, GH-OPS-030, GH-VAL-003, GH-VAL-023, GH-VAL-033, GH-VAL-034, GH-VAL-035; 2 §12.1 rows |
| S03 | `/home/opc/.hermes/profiles/rtb/project-system/goodhours-readiness-checklist.md` | 2026-08-24 | EXTERNAL, SUPERSEDED | the taxonomy and ~60% of every item in §1–§9, §11 in full |
| S04 | `BUGS.md` | 2026-08-25 | HISTORICAL | GH-AUTH-012; BUG-0825-1..5 → §12.1 |
| S05 | `REQUIRED.md` | 2026-08-05 | HISTORICAL | GH-INT-015 |
| S06 | `security_findings.md` | 2026-08-25 (audit 08-02) | HISTORICAL | GH-OPS-004, GH-OPS-011, GH-OPS-013, GH-OPS-025, GH-OPS-026, GH-AUTH-001..005, GH-AUTH-013, GH-VAL-003, GH-VAL-005, GH-VAL-006, GH-AX-001, GH-AX-002, GH-DEP-006 |
| S07 | `docs/qa/PRODUCTION_CHECKLIST.md` | 2026-08-05 (hdr 06-29) | SUPERSEDED | GH-OPS-001..006, GH-OPS-018, GH-OPS-022, GH-OPS-030, GH-AUTH-006, GH-AUTH-008, GH-AUTH-023, GH-INT-004, GH-INT-010, GH-INT-011, GH-INT-014, GH-INT-017, GH-INT-020, GH-VAL-003, GH-VAL-005, GH-VAL-006 |
| S08 | `docs/qa/PILOT_PLAN.md` | 2026-08-05 (hdr 06-29) | CURRENT (operational runbook) | GH-OPS-002..005, GH-OPS-009, GH-OPS-022, GH-OPS-030, GH-AUTH-008, GH-AUTH-012, GH-INT-007, GH-INT-011..013, GH-INT-019, GH-VAL-019..022, GH-VAL-028 |
| S09 | `docs/qa/MANUAL_FOUNDER_CHECKLIST.md` | 2026-08-05 (hdr 06-29) | CURRENT (unexecuted) | GH-OPS-030, GH-AUTH-008, GH-INT-012, GH-INT-020, GH-VAL-003, GH-VAL-024..026 |
| S10 | `docs/qa/TEST_PLAN.md` | 2026-08-05 (hdr 06-29) | SUPERSEDED | GH-INT-002, GH-INT-011, GH-INT-020, GH-VAL-026, GH-WF-001 |
| S11 | `docs/qa/FINAL_RELEASE_REPORT.md` | 2026-08-05 (hdr 06-29) | HISTORICAL | GH-OPS-001, GH-OPS-004, GH-OPS-009, GH-OPS-018, GH-OPS-022, GH-AUTH-006, GH-AUTH-008, GH-AUTH-012, GH-INT-002, GH-INT-011, GH-INT-020, GH-VAL-003, GH-VAL-027, GH-AX-003; 2 §12.1 rows |
| S12 | `docs/qa/SECURITY_AUDIT.md` | 2026-08-05 (hdr 06-29) | HISTORICAL | GH-OPS-001, GH-AUTH-001; FINDING-004/005 → §12.2 |
| S13 | `docs/qa/SECURITY_AUDIT_2026-08-25.md` | 2026-08-25 | HISTORICAL | GH-AUTH-006, GH-AUTH-007, GH-AUTH-014, GH-OPS-027 |
| S14 | `.autonomous-security/SOL_SECURITY_AUDIT_2026-08-26.md` | 2026-08-26 | HISTORICAL | GH-OPS-008, GH-AUTH-006, GH-AUTH-016, GH-INT-005 |
| S15 | `.autonomous-security/SOL_REMEDIATION_2026-08-26.md` | 2026-08-26 | HISTORICAL | GH-INT-005; SOL-01 and SOL-03 → §12.2 |
| S16 | `docs/qa/SECURITY_AUDIT_2026-08-27_SOL.md` | 2026-08-27 | HISTORICAL | GH-OPS-008, GH-AUTH-006, GH-AUTH-007, GH-AUTH-016, GH-AUTH-021, GH-INT-005, GH-VAL-003 |
| S17 | `docs/qa/SECURITY_AUDIT_2026-09-05.md` | 2026-09-05 | HISTORICAL | GH-OPS-008, GH-DEP-002 |
| S18 | `docs/qa/E2E_STAGING_2026-08-25.md` | 2026-08-25 | HISTORICAL | GH-OPS-024; the five bugs → §12.1 |
| S19 | `docs/qa/BACKUP_RESTORE_REPORT.md` | 2026-08-05 (hdr 06-29) | HISTORICAL | GH-OPS-009, GH-OPS-010 |
| S20 | `docs/qa/DATA_INTEGRITY_REPORT.md` | 2026-08-05 | HISTORICAL | none — reconciled into S01 in 2026-08 |
| S21 | `docs/qa/ACCESSIBILITY_REPORT.md` | 2026-08-05 | HISTORICAL | GH-AX-001 |
| S22 | `docs/qa/PERFORMANCE_REPORT.md` | 2026-08-05 | HISTORICAL | GH-WF-004, GH-AX-004 |
| S23 | `docs/qa/EDGE_CASE_REPORT.md` | 2026-08-05 | HISTORICAL | none — reconciled into S01 |
| S24 | `docs/qa/REPOSITORY_AUDIT.md` | 2026-08-05 | HISTORICAL | none — inventory only |
| S25 | `docs/qa/ROLE_PERMISSION_MATRIX.md` | 2026-08-05 | CURRENT (reference) | GH-AUTH-012, GH-AUTH-017 |
| S26 | `docs/qa/STRIPE_TEST_REPORT.md` | 2026-08-05 | HISTORICAL | GH-INT-020 |
| S27 | `docs/qa/DEPENDENCY_ADVISORY_EXCEPTIONS.md` | 2026-09-05 | CURRENT (expired) | GH-DEP-003 |
| S28 | `docs/qa/DEPENDENCY_FINAL_REMEDIATION_2026-09-05.md` | 2026-09-05 | HISTORICAL | GH-DEP-002 |
| S29 | `docs/qa/ROOT_ADVISORY_RESOLUTION_GOAL_2026-09-05.md` | 2026-09-05 | HISTORICAL | GH-DEP-002 |
| S30 | `docs/qa/CI_VERIFICATION_2026-09-05.md` | 2026-09-05 | HISTORICAL | GH-DEP-005 |
| S31 | `docs/qa/SHARED_LIMITER_VERIFICATION_2026-09-05.md` | 2026-09-05 | HISTORICAL | GH-OPS-008, GH-AUTH-014, GH-AUTH-023 |
| S32 | `docs/qa/CONCURRENCY_LIFECYCLE_VERIFICATION_2026-09-05.md` | 2026-09-05 | HISTORICAL | GH-WF-002 |
| S33 | `docs/qa/BROWSER_ONBOARDING_VERIFICATION_2026-09-05.md` | 2026-09-05 | HISTORICAL | GH-INT-002 |
| S34 | `docs/qa/AGE_ELIGIBILITY_2026-09-05.md` | 2026-09-05 | HISTORICAL | GH-VAL-009 |
| S35 | `docs/qa/AGE_REVIEW_DISPOSITION_2026-09-05.md` | 2026-09-05 | HISTORICAL | GH-INT-002; the uncorrected stale GET copy is folded into GH-REPO-006 |
| S36 | `docs/qa/TEACHER_COHORT_REMEDIATION_2026-09-05.md` | 2026-09-05 | HISTORICAL | GH-AUTH-019 |
| S37 | `docs/qa/RELEASE_INTEGRATION_2026-09-05.md` | 2026-09-06 | HISTORICAL (self-labelled superseded) | GH-OPS-001, GH-INT-002, GH-VAL-025 |
| S38 | `docs/qa/FINAL_INDEPENDENT_SECURITY_REVIEW_2026-09-05.md` | 2026-09-06 | HISTORICAL | GH-OPS-009, GH-INT-002, GH-VAL-003, GH-VAL-025, GH-DEP-002, GH-DEP-004 |
| S39 | `docs/qa/ACCEPTANCE_2026-09-06.md` | 2026-09-06 | HISTORICAL | GH-DEP-004, GH-INT-002 |
| S40 | `docs/qa/RELEASE_CANDIDATE_2026-09-06.md` | 2026-09-06 | HISTORICAL | GH-OPS-009, GH-OPS-018, GH-OPS-020, GH-INT-002, GH-INT-012, GH-VAL-001, GH-VAL-008, GH-VAL-025, GH-DB-001, GH-DB-002, GH-DB-004 |
| S41 | `docs/qa/SOFTWARE_RELEASE_2026-09-06.md` | 2026-09-06 | HISTORICAL | GH-OPS-018, GH-OPS-020; its "no safe migration mechanism" claim → Appendix B row B-03 |
| S42 | `docs/qa/PRODUCTION_MIGRATION_RUNBOOK.md` | 2026-09-06 | CURRENT (runbook) | GH-OPS-018, GH-OPS-019 |
| S43 | `docs/qa/VERCEL_PRODUCTION_MIGRATION.md` | 2026-09-06 | CURRENT (runbook) | GH-DB-006; §12.2 migration-mechanism row |
| S44 | `docs/qa/MIGRATION_RECONCILIATION_2026-08-26.md` | 2026-08-26 | HISTORICAL | none — superseded by S42/S43 |
| S45 | `docs/qa/evidence/2026-09-05/FINAL_CLOSURE_SUMMARY.md` | 2026-09-05 | HISTORICAL | GH-DEP-002, GH-VAL-003 |
| S46 | `docs/qa/evidence/2026-09-07/SUMMARY.md` | 2026-09-07 | HISTORICAL | GH-OPS-009, GH-INT-012, GH-VAL-003, GH-AUTH-014, GH-DB-006 |
| S47 | `docs/qa/evidence/2026-09-07-canvas-integration/README.md` | 2026-09-07 | HISTORICAL | GH-INT-008 |
| S48 | `docs/qa/evidence/2026-09-07-test-gap-closure/README.md` | 2026-09-07 | HISTORICAL | two §12.2 rows |
| S49 | `docs/functionalities-progress.md` | 2026-08-26 | SUPERSEDED | GH-OPS-006, GH-INT-002, GH-INT-011, GH-INT-015, GH-INT-018, GH-AUTH-002, GH-VAL-025, GH-DB-006 |
| S50 | `functionalites.md` | 2026-08-25 | SUPERSEDED | GH-INT-002, GH-AUTH-002 |
| S51 | `integration_failures.md` | 2026-08-05 (hdr 05-10) | HISTORICAL | GH-INT-008 |
| S52 | `qa_results.md` | 2026-08-05 (hdr 05-10) | HISTORICAL | GH-INT-008 |
| S53 | `docs/canvas-production-readiness.md` | 2026-08-05 (hdr 05-11) | CURRENT (narrow) | GH-INT-007, GH-INT-008, GH-INT-009 |
| S54 | `docs/canvas-operations-runbook.md` | 2026-08-05 (hdr 05-11) | CURRENT (runbook) | GH-INT-007, GH-INT-008, GH-INT-010 |
| S55 | `docs/student-privacy-compliance.md` | 2026-08-05 (hdr 05-10) | HISTORICAL | GH-OPS-025, GH-AUTH-019, GH-INT-008, GH-VAL-005, GH-VAL-014 |
| S56 | `docs/lms-integration-plan.md` | 2026-08-05 (hdr 05-09) | CURRENT (only record of Google verification duties) | GH-INT-001, GH-INT-003 |
| S57 | `docs/integrations-feasibility.md` | 2026-08-05 (hdr 05-09) | CURRENT (same) | GH-INT-001, GH-INT-003 |
| S58 | `docs/jwt-secret-rotation.md` | 2026-08-05 | CURRENT (runbook) | GH-OPS-012 |
| S59 | `docs/legal/pilot-drafts/OPEN_FACTS_AND_EXECUTION.md` | 2026-09-05 | CURRENT (blocking sheet) | GH-OPS-004, GH-OPS-006, GH-OPS-013, GH-AUTH-001, GH-AUTH-013, GH-VAL-001..006, GH-VAL-009, GH-VAL-011, GH-VAL-015, GH-VAL-018, GH-INT-019, GH-INT-021 |
| S60 | `docs/legal/pilot-drafts/REVIEW.md` | 2026-09-05 | CURRENT | GH-VAL-003, GH-VAL-004, GH-VAL-009 |
| S61 | `docs/legal/pilot-drafts/PACKAGE_ACCEPTANCE.md` | 2026-09-05 | CURRENT | GH-OPS-013, GH-VAL-003..006, GH-VAL-009, GH-VAL-017 |
| S62 | `docs/legal/pilot-drafts/legal-risk-memo.md` | 2026-09-05 | CURRENT | GH-OPS-009, GH-VAL-001, GH-VAL-002, GH-VAL-006, GH-VAL-009, GH-VAL-016 |
| S63 | `docs/legal/pilot-drafts/subprocessor-data-flow-register.md` | 2026-09-05 | CURRENT | GH-OPS-001, GH-OPS-010, GH-OPS-016, GH-INT-002, GH-INT-008, GH-INT-019, GH-VAL-006 |
| S64 | `docs/legal/pilot-drafts/retention-deletion-policy.md` | 2026-09-05 | CURRENT (proposed) | GH-OPS-006, GH-OPS-010, GH-OPS-013, GH-OPS-025, GH-VAL-015, GH-VAL-018 |
| S65 | `docs/legal/pilot-drafts/security-and-incident-response.md` | 2026-09-05 | CURRENT (proposed) | GH-OPS-003, GH-OPS-006, GH-OPS-011, GH-AUTH-001, GH-AUTH-013 |
| S66 | `docs/legal/pilot-drafts/rights-request-procedure.md` | 2026-09-05 | CURRENT | GH-OPS-030, GH-VAL-008, GH-VAL-016 |
| S67 | `docs/legal/pilot-drafts/school-pilot-agreement.md` | 2026-09-05 | CURRENT (fillable) | GH-VAL-001, GH-VAL-002, GH-VAL-004 |
| S68 | `docs/legal/pilot-drafts/student-data-privacy-addendum.md` | 2026-09-05 | CURRENT (fillable) | GH-VAL-005 |
| S69 | `docs/legal/pilot-drafts/privacy-notice.md`, `terms-of-service.md` | 2026-09-05 | CURRENT (fillable) | GH-VAL-001, GH-VAL-008, GH-INT-021 |
| S70 | `docs/legal/pilot-drafts/eligibility-13-plus-spec.md` | 2026-09-05 | CURRENT | GH-VAL-009, GH-VAL-011 |
| S71 | `docs/legal/pilot-drafts/integration-annex.md` | 2026-09-05 | CURRENT | GH-INT-002, GH-INT-019 |
| S72 | `docs/legal/pilot-drafts/PRODUCT_EVIDENCE.md` | 2026-09-05 | CURRENT | GH-INT-015; its evidence-boundary rule informs the `Proof` column |
| S73 | `docs/legal/pilot-drafts/plain-language-notices-and-authorization.md` | 2026-09-05 | CURRENT | GH-VAL-011 |
| S74 | `docs/legal/pilot-drafts/safeguarding-acceptable-use.md` | 2026-09-05 | CURRENT | GH-AUTH-027, GH-VAL-012 |
| S75 | `docs/legal/pilot-drafts/evidence-and-versioning.md` | 2026-09-05 | CURRENT | GH-VAL-008 |
| S76 | `docs/legal/pilot-drafts/README.md` | 2026-09-05 | CURRENT (index) | GH-VAL-001 |
| S77 | `CONTEXT.md` | 2026-08-05 | HISTORICAL (narrative) | GH-OPS-021 |
| S78 | `spec.md` | 2026-08-05 | HISTORICAL (spec) | none |
| S79 | `rules.md` | 2026-08-05 | CURRENT (FERPA reference) | none — informs §4 |
| S80 | `instructions.md` | 2026-08-05 | HISTORICAL | GH-REPO-004 |
| S81 | `tests/qa-results.md` | 2026-08-05 | EXCLUDED | none — see Appendix C |
| S82 | `README`, `client/README.md` | 2026-08-05 | HISTORICAL | GH-REPO-001 |
| S83 | `school.md`, `student.md` | 2026-08-25 | HISTORICAL (empty) | GH-REPO-003 |
| S84 | `CLAUDE.md`, `AGENTS.md` | 2026-08-05 | HISTORICAL | GH-REPO-002 |
| S85 | `.goodhours-ownership-note.md` | 2026-09-07 | HISTORICAL (stale lock) | GH-REPO-005 |
| S86 | `tech_stack.md` | 2026-08-05 | HISTORICAL (reference) | none |
| S90 | `/home/opc/.hermes/profiles/rtb/project-system/goodhours-user-status.md` | 2026-08-28 | EXTERNAL, SUPERSEDED | GH-VAL-002; rows 8–11 of its board remain true and map to §4.1 |
| S91 | `/home/opc/.hermes/profiles/rtb/project-system/goodhours-quality.md` | 2026-08-28 | EXTERNAL, SUPERSEDED | GH-OPS-029, GH-DEP-001; its build-FAIL claim → §12.1 |
| S92 | `/home/opc/goodhours-claude-completion/AUTONOMOUS-FINAL.md` | 2026-09-07 | EXTERNAL, SUPERSEDED | GH-INT-002, GH-INT-012, GH-VAL-029; the proof standard for email delivery |
| S93 | `/home/opc/goodhours-claude-completion/AUTONOMOUS-STATUS.md` | 2026-09-07 | EXTERNAL, HISTORICAL | none — self-labelled superseded by S92 |
| S94 | `/home/opc/goodhours-claude-completion/SUPERVISOR-STATUS.md` | 2026-09-07 | EXTERNAL, HISTORICAL | GH-VAL-029; budget ledger EXCLUDED |
| S95 | `/home/opc/goodhours-claude-completion/CANVAS-FINAL.md` | 2026-09-07 | EXTERNAL, HISTORICAL (refuted) | none — see §12.2 |
| S96 | `/home/opc/goodhours-claude-completion/REVIEW-FIXES.md` | 2026-09-07 | EXTERNAL, HISTORICAL | none — mirrored in `docs/qa/evidence/2026-09-07-review-fixes/` |
| S97 | `/home/opc/goodhours-claude-completion/BRIEF.md`, `RESUME-MISSION.md`, `FINAL.md`, `STATUS.md`, `CONTINUE.md` | 2026-09-07 | EXTERNAL, HISTORICAL | GH-OPS-024 (production project identity) |
| S98 | `/home/opc/RTB/1-Projects/goodhours.md` | 2026-08-24 | EXTERNAL, SUPERSEDED | GH-VAL-010; its staging-500 and disk-storage blockers → §12.1 |
| S99 | `/home/opc/RTB/1-Projects/main_project.md` | 2026-08-05 | EXTERNAL, CURRENT | GH-VAL-033 |
| S100 | `/home/opc/RTB/2-Sales/outreach.md` | 2026-08-05 | EXTERNAL, CURRENT | GH-VAL-030 |
| S101 | `/home/opc/RTB/2-Sales/pilot.md` | 2026-08-05 | EXTERNAL, CURRENT | GH-VAL-030 |
| S102 | `/home/opc/RTB/3-Metrics/dashboard.md` | 2026-08-05 | EXTERNAL, CURRENT (funnel only) | GH-VAL-031 |
| S103 | `/home/opc/RTB/Inbox/Archive/To-do list for GoodHours before publish.md` | 2026-08-05 | EXTERNAL, HISTORICAL | GH-WF-001 |
| S104 | `/home/opc/goodhours-staging-fix-REMAINING.md` | 2026-08-25 | EXTERNAL, HISTORICAL | none — target host superseded; → §12.1 |
| S105 | `/home/opc/cleanup-blocker-report-2026-08-30.md` | 2026-08-30 | EXTERNAL, CURRENT | GH-OPS-028 |
| S106 | `/home/opc/RTB/Inbox/Archive/goodhours_school_leads*.pdf` | 2026-08-05 | EXTERNAL, CURRENT | GH-VAL-032 — contents deliberately not reproduced here |

---

# Appendix B — Contradiction ledger

Every contradiction found between sources, how it was resolved, and under which rule. Nothing
was dropped silently — if you remember a document saying otherwise, it is in this table.

| # | Contested claim | Asserted by | Resolution | Rule | Recorded at |
|---|---|---|---|---|---|
| B-01 | "Server TypeScript build is failing" | S02:82 (undated), S91 (2026-08-28) | False. `tsc` exits 0. The claim also gated the outreach decision rule to discovery-only, so it had a real cost | R1, R5 | §12.1, `GH-VAL-034` |
| B-02 | Root dependency audit is clean / has 10 open vulnerabilities | S38:19 says 0 and calls the 10 stale; S17:95 says the clean claim was the stale one; S45:6 says "do not call root audit clean" | Both stale. Reverted to unmeasured with the settling command | R9 | `GH-DEP-002` |
| B-03 | "No safe existing Vercel/GitHub migration mechanism was found" | S41:78 (2026-09-06, 03:50) | Contradicted by S43 (same day, 19:45) documenting the shipped build-time `migrate deploy` with a hash-verified manifest. Later document wins | R6 | `GH-OPS-018`, §12.2 |
| B-04 | Log retention should be ≥30 days / ≥90 days / 12 months | S07:33, S07:153, S64:16 | No approved period exists. Item states the decision, not a number | R5 | `GH-OPS-006` |
| B-05 | Canonical server-suite count | 461 (S45), 464/463 (S38), 464/464 (S39, S40), 478 (S46), 431/430 (S49) | All five discarded. One measurement stands: 486 pass / 0 fail / 1 skip of 487 | R1, R8 | Generated block, §12.1 |
| B-06 | Focused-test count 17/17 versus 7/7 | S40:38 versus S39:19 and S38:17 | Not carried forward; counts are re-measured or omitted | R8 | Generated block |
| B-07 | Uploads use ephemeral serverless disk and must move to object storage | S98, S03§D1, S01:290 | Accepted content is durable in Postgres `contentBytes`. The claim was true when written and is now false. The disk *sweep* is separately broken | R1 | §12.1, `GH-OPS-014` |
| B-08 | 63 versus 70 migrations on disk | S49:392 versus S46:82 and S43:16 | Not carried forward; re-measure | R8 | `GH-DB-006` |
| B-09 | Staging is "NOT LAUNCH-READY" with widespread 500s | S18:5, S04:105 | Environment-scoped to `hourly-dev` and no longer reproducing on either host | R1, R7 | §12.1 |
| B-10 | `/api/health` returns 500 `FUNCTION_INVOCATION_FAILED` | S03§B1, S98, S104 | Both hosts return 200; production reports `db: ok` | R1 | §12.1 |
| B-11 | The Canvas database is irrecoverably inconsistent and needs a destructive `db:drop` | S95 (2026-09-07, 04:00) | Refuted the same day by S92 and S47 — a stale preloader, fixed without data loss | R3 | §12.2 |
| B-12 | Canvas is validated only against a mock provider | S51:26, S52:236, S53:75 | Partly superseded: S47 proves a real OAuth exchange, but against a self-hosted synthetic tenant. "Real school tenant" and production key scopes remain open | R3 | `GH-INT-008`, `GH-INT-009` |
| B-13 | LMS integrations run in mock mode during the pilot | S08:57, S10:77 | Impossible. `server/src/lib/env.ts:140,190` hard-fail production start-up when mock mode is on | R1 | `GH-INT-007` |
| B-14 | The pilot's gate is "founder review" | S08:5 | Superseded — the release handoff requires parent acceptance, which is a different and stricter gate | R4 | `GH-VAL-001` |
| B-15 | Release status: CONDITIONAL PASS → FAIL/HOLD → NO-GO → engineering PASS, rollout NO-GO | S11:208, S06:783, S45:10, S40:5 | An escalation chain, not a contradiction. The current disposition is the last one and is recorded as such | R3 | Gate roll-up |
| B-16 | An "approval blocked until `ownershipEvidenceVerifiedAt`" copy is stale and should be corrected separately | S35:13 | No later document records the correction | R5 | folded into `GH-REPO-006` |
| B-17 | `REMEDIATION_TRACKER.md` is "the current source of truth" | S01:6 | True when written on 2026-08-04; 34 days and ~30 documents behind by 2026-09-08 | R3 | Appendix A, `SUPERSEDED` |

---

# Appendix C — Exclusions and why

Exclusion means "not a source of open items". Nothing is excluded without appearing here.

**Machine history, not trackers**

- `tests/qa-results.md` — 6158 lines, 34 machine-appended runs newest-first, ending 2026-07-12. Its ~108 unchecked boxes are per-run scaffolding repeated across runs, not distinct items. Read and confirmed to be stacked generated reports. `README` points to it as "latest QA notes", which is `GH-REPO-001`.
- `docs/qa/evidence/**` non-Markdown artifacts — TAP files, axe output, probe transcripts, `candidate-manifest.json`. These are cited from `Proof` cells; they are evidence, never a source of items.
- `security-report/index.html`, `test-results/.last-run.json` — generated output, gitignored or transient.

**Agent orchestration, not product state**

- `/home/opc/goodhours-claude-completion/*.jsonl`, `*-tap.txt`, `controller-state.json`, `subscription_controller.py`, `run-tests.mjs`, `setup8.sh` — worker telemetry.
- The cost ledger in S94 (budget consumed, reset schedule) and the watchdog cron `82a30f61bb35` whose recent runs are marked FAILED. These are machine housekeeping; the user scoped them out.

**Unrelated projects**

- Knee-MRI, SOL scoring audits, and the other `/home/opc/*.md` audit files — verified by grep to contain no GoodHours content.
- `/home/opc/RTB/3-Metrics/dashboard.md` is **partially** excluded: its GoodHours funnel is absorbed as `GH-VAL-031`; its unrelated trading-metrics block (win rate, Sharpe, equity curve) is excluded explicitly so a future reader does not think it was missed.

**Already dispositioned**

- `BUGS.md` entries marked FIXED or NOT A BUG. The five OPEN entries are not excluded — they are closed with evidence in §12.1.
- Skeleton section A `[x]` rows — completed or intentionally decided. Its `[ ]` and `[!]` rows are absorbed; its `[→]` rows are §11.

**Deliberately not reproduced**

- Pricing figures, the pilot offer's commercial terms, school and contact names from the lead list, and outreach template copy. `docs/` is version-controlled and these would persist in every clone. Their **status** is tracked in §4.6; their content stays in `RTB/2-Sales/` and `RTB/1-Projects/`.
- Secret values of any kind. This file names variables only.

---

# Appendix D — Field definitions, ID scheme and conflict rules

## ID scheme

`GH-<CAT>-<nnn>`. IDs are stable, never reused, never renumbered. Grep-unique across the whole
machine, so a future session note can reference `GH-AUTH-007` and be found.

| Category | Meaning | Section |
|---|---|---|
| `OPS` | Operations, monitoring, backups, storage, deployment, audit retention | §1 |
| `AUTH` | Authentication, sessions, authorization, input hardening | §2 |
| `INT` | Third-party integrations, email, scheduler, payments | §3 |
| `VAL` | External validation, legal, pilot, commercial | §4 |
| `WF` | Core workflow and product reliability | §5 |
| `DEP` | Dependencies, build, test gate | §6 |
| `DB` | Data model, migrations, database operations | §7 |
| `AX` | Accessibility, browser support, performance | §8 |
| `REPO` | Repository and documentation hygiene | §9 |
| `DEC` | Pure decisions with no work until made | §10 |
| `DEFER` | Explicitly deferred | §11 |

## Field definitions

- **Gate** — `P0` blocks any real student data entering the system; `PILOT` blocks a supervised pilot; `LAUNCH` blocks general availability but not a pilot; `DEFER` is revisited only on a stated condition. This is the only priority signal in the document.
- **Closes** — `MACHINE` a command proves it; `HUMAN` someone must act and record it; `EXTERNAL` a third party must act (Google, a school, counsel, a provider); `DECISION` a written choice, with no work possible until it is made.
- **Proof** — the command, URL or artifact that settles the item. An item without a stated proof is not yet well-formed. A `200` from an endpoint is never proof that a side effect (an email, a write) occurred; this standard comes from S92 and was adopted after a production bug where a resend route reported success and mailed nothing.
- **Verified** — `<date>@<commit>`, or `never`, or a short phrase plus a date. Freshness is per-row, so one stale row does not poison the file.
- **Src** — source codes from Appendix A, optionally with a section (`S03§C2`) or line (`S07:149`) suffix.

## Conflict rules

Applied top-down; the first rule that discriminates wins.

- **R1** — Re-verification beats everything. A check re-run at the current HEAD supersedes any prior claim regardless of source or confidence.
- **R2** — Commit-anchored evidence beats dated evidence, and stays valid while `git diff --quiet <sha>..HEAD -- <paths>` holds. This is the repository's own existing pattern; `scripts/readiness-check.sh` uses exactly this construction for its billing gate.
- **R3** — Between two dated claims with artifacts, the newer wins.
- **R4** — Newer narrative beats older narrative, but a narrative claim never beats an artifact of any date.
- **R5** — An undated checklist item is never a status. It may open an item; it may never close one or mark something broken.
- **R6** — Same-day ties break by file modification time, then by position in that day's commit sequence.
- **R7** — Environment scoping. "Broken" is valid only against the host it was observed on, and only while that host is still the relevant one.
- **R8** — Counts are never carried forward. Every number is re-measured and stamped, or it is not stated.
- **R9** — Mutual staleness accusations resolve to "both stale": the item reverts to unmeasured with the settling command in `Proof`.

## De-duplication rule

Two records are the same item if and only if the same evidence would close both, the `Closes`
type matches, and neither can be true while the other is false. On merge: the statement is
written fresh, `Gate` takes the strictest value any source assigned, scope takes the broadest,
`Proof` takes the strongest standard any source demanded, and `Src` is the union of every
pointer. A source's extra assertion is never dropped — it becomes a sub-checkbox in the detail
block, or its own item.

The four largest merges were backups (15 source files), Google Classroom real-tenant validation
(12), school authorization (12) and email delivery (11).

## Coverage cross-check against the source taxonomy

All 30 requirements in S03 section K map to a live item:

| K# | Requirement | Item |
|---|---|---|
| 1 | Fix broken deployed API | §12.1 |
| 2 | Verify deployment commit and environment | GH-OPS-020 |
| 3 | Add and test staging CORS origin | GH-OPS-023 |
| 4 | Isolated staging and production databases | GH-OPS-029 |
| 5 | Fresh and upgrade migration tests | GH-DB-001 |
| 6 | Tested encrypted backups and restores | GH-OPS-004, GH-OPS-009, GH-OPS-010 |
| 7 | Resolve high/critical dependency findings | GH-DEP-002 |
| 8 | Reproducible test command | GH-DEP-001 |
| 9 | Move JWT out of localStorage or accept the risk | GH-AUTH-007, GH-DEC-002 |
| 10 | Critical audit logging durable and fail-closed | GH-DEC-003, GH-OPS-027 |
| 11 | Private durable storage replacing serverless disk | GH-OPS-016, §12.1 |
| 12 | Retention and deletion per data category | GH-OPS-025, GH-VAL-015 |
| 13 | Deletion and export against real database workflows | GH-VAL-017, GH-OPS-017 |
| 14 | FERPA/COPPA/state-law roles via qualified counsel | GH-VAL-003 |
| 15 | School contract and DPA executed | GH-VAL-004, GH-VAL-005 |
| 16 | Breach-notification and incident procedures | GH-OPS-011 |
| 17 | Email sender authentication and bounce handling | GH-INT-011, GH-INT-013 |
| 18 | Real monitoring and alerting | GH-OPS-001, GH-OPS-002, GH-OPS-003 |
| 19 | Rate limits across serverless instances | GH-AUTH-023 |
| 20 | Concurrency and race testing | GH-WF-002 |
| 21 | Browser, mobile and accessibility testing | GH-AX-001, GH-AX-003, GH-VAL-025 |
| 22 | Deployment and migration rollback procedures | GH-OPS-021, GH-OPS-018 |
| 23 | Account offboarding and school shutdown | GH-WF-007 |
| 24 | Synthetic-data pilot before real data | GH-VAL-010 |
| 25 | Human pilot monitor and owner | GH-VAL-021, GH-OPS-005 |
| 26 | Explicit pilot stop conditions | GH-VAL-020 |
| 27 | Independent security review and penetration test | GH-DEP-006 |
| 28 | Third-party subprocessor and data-flow review | GH-VAL-006 |
| 29 | Deployed environment runs the final reviewed code | GH-OPS-020 |
| 30 | Remove or reconcile stale readiness documentation | GH-REPO-006 |

## Known limitation of this document

A hand-maintained register with no enforcement is the same class of artifact as the three that
went stale before it. Per-item stamps and the fenced generated block make decay visible and
make automation cheap to add, but they do not prevent it. The intended follow-up — **out of
scope for this consolidation** — is a `scripts/refresh-open-items.sh` that rewrites the
generated region from `scripts/readiness-check.sh` and `scripts/verify-production-provenance.sh`
output, plus a step in `.github/workflows/app-verification.yml` that fails when the generated
block's commit stamp falls too far behind HEAD.
