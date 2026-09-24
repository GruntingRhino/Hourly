# GoodHours pilot-readiness deep audit — 2026-09-14

## Verdict

**Core implementation is substantially built and the exercised local gates pass. The real-student pilot is NOT verified ready. Remaining work is not limited to legal signatures and a final QR smoke test.**

The main remaining work is a QR scan-to-check-in integration repair, completion of an approved records/offboarding execution process, hosted/device acceptance testing, provider/recovery/monitoring evidence, and school/operator decisions. This is a bounded readiness phase, not evidence that the whole application needs rebuilding. No defensible completion percentage or calendar estimate follows from the evidence.

## Scope and evidence quality

- Source: `/home/opc/RTB/projects/goodhours`, `main`, `ce2758ec34452d611fca92204681e9197ee9f4f9`. Application tree was clean at the initial check.
- Worker routing verified from OpenCode session metadata: `opencode/muse-spark-1.3-contributor-free`, session `ses_f5f121b7fffegtrCAbDFslsjko`. Parent independently inspected selected code, test artifacts, production metadata/build logs, and live QR JavaScript bundles.
- No application fixes, commits, pushes, deployments, production migrations, production data changes, real messages, provider approvals, or school decisions were made. Local tests used disposable loopback PostgreSQL. A separate local limiter database was created and populated for its explicit gate.
- **Runtime limitation:** fresh local checks ran on Node `v22.23.2`. README/.nvmrc specify Node 24 and package engines require >=24. These are real diagnostic results, not a fresh supported-Node-24 release gate. The inspected hosted build uses Node `24.x`. Rerun the final candidate gate on Node 24 before release acceptance.
- Browser execution was not completed. The parent browser tool could not find Chrome; the worker's proposed `/tmp/qrspec` writes were permission-denied. No permission bypass was used. `server/.tmp-qr-browser-synthetic.mts` is an **unexecuted temporary harness**, not browser evidence.
- The worker's first report write ended in a literal truncation marker. The parent replaced it with this complete, evidence-reconciled report. A successful worker exit alone was not accepted as completion.
- `docs/OPEN_ITEMS.md` remains the single open-items tracker. Its Sept8 ground-truth block and totals are stale; this audit is evidence, not a second canonical tracker. `fef1cea..ce2758e` contains 12 commits. Do not treat every historical row as a current defect.

## Fresh verification

Raw artifacts: `docs/qa/evidence/2026-09-14/`. Counts below are separate runs, not additive unique coverage.

| Gate | Actual result | Artifact |
|---|---|---|
| Canonical server `npm test` | 565 tests: 564 passed, 0 failed, 1 skipped | `server-full.tap` |
| Focused QR/share/cohort/session/Classroom/CSV/synthetic-pilot tests | 54 passed, 0 failed, 0 skipped | `focused-qr-session-classroom.tap` |
| Explicit distributed limiter gate | 10 passed, 0 failed, 0 skipped; separately booted processes shared one PostgreSQL bucket | `distributed-limiter-gate.tap` |
| Server `npm run build` | exit 0 | `server-build.log` |
| Client build, typecheck, lint | each exit 0 | `client-build.log`, `client-typecheck.log`, `client-lint.log` |
| Root/server/client `npm audit --include=dev --json` | each reports zero vulnerabilities | `audit-root.json`, `audit-server.json`, `audit-client.json` |
| Client RSC/advisory checks | passed | `client-verify-no-rsc.log`, `client-verify-rr-advisory.log` |
| Prisma validation | schema valid | `prisma-validate.log` |
| Test-target guard | production-mode and remote dummy target refused; clean local environment accepted | `guard-*.log` |
| Git diff whitespace check | passed | parent command output |

The ordinary suite's skip is the opt-in multi-process limiter test. Its explicit run passed; do not continue listing local distributed enforcement as wholly untested. It does not prove deployed store configuration or hosted outage behavior.

Test environments removed inherited production-mode flags and effective remote database selectors before using the dummy loopback test configuration. An initial limiter-URL construction changed the username instead of database path and failed local authentication. This was corrected before the successful explicit limiter run; it was a harness error, not a product defect. No remote database was contacted by that check.

The exercised local scenario includes roles, waitlist/cancellation promotion, attendance, approval, ledger, transcript/export and tenant-denial assertions. Coverage mixes real HTTP/database tests with unit and source-contract tests. A green source-regex test does not prove a working camera, rendered state, provider integration or complete route matrix.

## Hosted evidence independently checked

Production: `https://goodhours.app`.

- Vercel deployment `dpl_4znJsKTzQQQm379GWQ7Z6yWcaCtt`, URL `https://goodhours-rcqzm7hgq-gruntingrhinos-projects.vercel.app`, target `production`, state `READY`, source `cli`, Node `24.x`.
- Fresh `/api/health`: HTTP 200, `status: ok`, `db: ok`.
- Fresh unauthenticated `/api/auth/me` and reminder-run requests: HTTP 401.
- Latest deployment's Sept13 build logs: `PRODUCTION_REVIEWED_HISTORY_MATCH=verified count=74`, `PRODUCTION_SCHEMA_SOURCE_HASH=verified`, no pending migrations, unreferenced legacy `UserRole` enum, `PRODUCTION_SCHEMA_MATCH=verified`, build completed.
- Staging `https://hourly-dev.vercel.app` also returned healthy 200 and protected-route 401. This does **not** establish production/preview database separation.
- Existing provenance script fails because this CLI deployment lacks `meta.gitCommitSha`/`meta.githubCommitSha`. `GOODHOURS_RELEASE_COMMIT_SHA` is present as an environment-variable name, but the read-only API does not expose its value. This is a **provenance-evidence gap, not proof of stale deployment**. Prior session reported `ce2758e` deployed; this audit independently verifies the deployment ID, schema-build proof and served QR behavior, not the full source SHA from platform metadata.

Detailed sanitized observations: `parent-hosted-legal-observations.json` and `parent-qr-source-observations.json`.

## Confirmed remaining functional work

### A. QR phone-camera handoff — pilot-blocking for the promised scan workflow

`client/src/pages/PublicAttendanceQr.tsx:21` calls `QRCode.toDataURL(token)`. Lines 50–51 promise “Scan to check in” using the phone camera. However, `client/src/pages/student/QrCheckin.tsx:7–17` requires both `sessionId` and token; its interface is manual paste. The QR carries the opaque signed token, **not a navigable check-in URL**.

This is confirmed in current live bundles, not just historical source:

- `/assets/PublicAttendanceQr-BZHfLmdG.js`: SHA-256 `99c52f1c134f35ad7f86794875de4465770c2b57e61189481f7c2e1a70ad2888`.
- `/assets/QrCheckin-CBW5dU7-.js`: SHA-256 `de3444ec8aec3afed4dc7ef7e04e75bcca59899529d1328f0be6adcf034b976e`.

Required: a narrow end-to-end handoff that preserves student authentication and server-derived session/tenant authorization. Do not expose a roster or use the public capability as an application login. Test logged-out and signed-in scans, wrong student/school, replay and expiry, then verify attendance in the database. This audit did not improvise that new session-resolution workflow.

Related QR acceptance gaps:

- Public display validates once but does not remove/replace the QR when it expires while the page stays open. Server expiry still rejects redemption; this is a UI-state gap, not an expiry bypass.
- QR routes cover legacy `Opportunity`/`ServiceSession`; beneficiary slots use a separate attendance path (`server/src/routes/sessions.ts:22–23`). Confirm the actual pilot event model is supported before claiming all attendance workflows work.
- Codes expire within 60–900 seconds and no early-revocation route exists. The current UI explicitly discloses expiry-only behavior. This is a documented limitation requiring an operational decision, **not a newly discovered authorization exploit or an automatic requirement to build revocation**. Replacement does not itself invalidate older unexpired codes.
- Invalid share API returns 404. Its headers lack the successful route's no-store/noindex settings because `attendanceQr.ts:14–24` returns before those headers at lines 27–29. The observed invalid-response cache header is not proof of an edge override or a successful-token leak. Consider consistent capability-route headers; test valid responses separately.

### B. Records lifecycle/offboarding — policy AND execution work

`server/src/lib/retentionStore.ts:1–25,106–125` explicitly performs advisory reads only. It has no purge execution or policy/hold-management workflow. `deleteSchoolData` is defined in `server/src/routes/auth.ts` but has no invocation. Personal deletion and student anonymization are not complete school offboarding.

Required before accepting real records: approve the data-category schedule, holds, school instructions and authorized records owner; then implement or document a **tested controlled manual procedure** for export/return, deletion/anonymization, provider copies, backup handling, exceptions and execution records. Verify it on synthetic data. Automatic purge and a self-service school-delete button are not uniquely required, but an executable, authorized, evidenced process is.

Do not patch this by inventing retention periods or enabling destructive deletion. Public policy commitments must match the approved operational process. For example, `Privacy.tsx:329–330` commits to school-directed return/destruction, while lines 476–478 broadly describe student-record removal; reconcile those with the actual anonymization/retention behavior before publication approval.

## Other pre-pilot acceptance work

### C. Hosted synthetic rehearsal + device/browser acceptance

Run a clearly labeled synthetic school journey on the exact intended deployment: staff/student onboarding and Google/password paths, student-only 13+ gating, ownership approval as a separate condition, invites/imports, actual pilot attendance model, QR/supervisor verification, approval/correction, consistent dashboard/export/transcript totals, upload permissions, offboarding and error recovery.

Include assigned-teacher vs out-of-cohort vs cross-school denial; student vs other-student denial; disabled/revoked sessions; public QR bearer isolation; and the rendered minted/expired/reissued state. Run physical-phone scan, mobile layout, copy/download/print and keyboard/accessibility checks. Previous public desktop/mobile axe results are useful historical evidence, not a complete authenticated-role or minted-QR audit.

The prior live QR attempt verified login and invalid-share isolation but had no eligible synthetic attendance sessions, so it did not establish a valid scan/redemption journey. Create/use an authorized labeled fixture for the real test rather than count invalid-link handling as success.

### D. Provider acceptance

- Classroom: verify the reconnect fix through actual OAuth, nonempty synthetic course/roster sync, repeat-sync idempotency, revocation/disconnect and persisted outcomes. Consent and a reset sync timestamp are not a successful import.
- Canvas: **do not reset progress to “never tested.”** `docs/qa/evidence/2026-09-07-canvas-integration/README.md` and its raw OAuth log record a real sandbox authorization-code exchange, course read, preview/apply and disconnect. School-controlled tenant configuration/permissions are a separate readiness gate.
- Resend and reminders: verify sender configuration, a labeled message's provider delivery event/receipt, scheduled invocation, duplicate prevention/retry and failure visibility. HTTP 401 for unauthorized callers proves protection, not scheduled execution or delivery.
- Keep Classroom and Canvas in the pilot acceptance scope; do not silently drop functionality to obtain a green verdict.

### E. Recovery, operations and privileged access

No current proof was obtained for a managed backup restore including encrypted-field usability, rollback rehearsal, delivered alert, named on-call owner or tested support mailbox. Those remain open evidence gates, not claims that the providers lack the capabilities.

Minimum completion: prove backup retention/access and key recovery, restore into an isolated target, validate the restored application/data, document acceptable loss/recovery times, rehearse rollback, and send a test failure alert to the named person. Confirm production/preview separation and deployed rate-limit configuration/failure behavior.

No native MFA implementation was found in the bounded source search. Establish and verify appropriate privileged-account protection. A managed identity provider with enforced MFA may satisfy the chosen pilot control; custom TOTP implementation is not inherently mandatory. Record any residual-risk decision rather than silently dropping the control.

CSRF and compatibility: source uses HttpOnly/Secure/SameSite=Lax cookies, exact-origin CORS configuration and legacy bearer/JSON token compatibility. There is no demonstrated CSRF exploit in this audit. Verify cross-origin state-changing requests and same-site assumptions behaviorally; do not equate absence of a CSRF-token library with a proved vulnerability or demand removal of compatibility without caller analysis. Broader tenant/age-entry matrices likewise remain coverage work, not evidence of a newly reproduced bypass.

### F. School/operator and legal execution

Substantive AI-prepared drafts exist in `docs/legal/pilot-drafts/`. They are not signed or approved acts. Use `OPEN_FACTS_AND_EXECUTION.md` as the completion sheet and `docs/qa/DEFERRED_REQUIREMENTS.md` for human dependencies.

Finish operator and school legal identities and authorized signatories; executed pilot agreement/DPA; approved records inventory, retention/holds, notices and applicable consent path; provider/subprocessor facts; records/privacy/safeguarding/incident contacts; pilot dates, cohorts, organizations and supervision; service-hours/certification rules; support owner, success metrics and stop conditions; final public-policy version/publication approval.

Professional legal review remains **not obtained**. The user declined it; this audit does not turn hiring counsel into a universal statutory prerequisite and does not describe AI research as legal approval or certification. Actual school authorization, signatures and applicable consent cannot be fabricated or replaced by tests.

## Priority and scope control

1. Repair the QR handoff and test its actual event model; complete the Node-24 and hosted synthetic/device gates.
2. Close provider, backup/restore, rollback and alert-delivery evidence.
3. Resolve records-policy decisions and test a controlled lifecycle/offboarding execution path.
4. Complete school/operator execution and final pilot go/no-go.

Policy decisions and recovery preparation can proceed in parallel with technical acceptance. Broad GA enhancements—district SAML, native mobile/offline modes, extensive automation, custom MFA where managed MFA suffices, or a comprehensive new operations platform—should not automatically inflate the first-pilot scope. Document minimum controls and evidence instead.

## Local execution environment and artifacts

The development root filesystem was at 100% reported usage with roughly 239–250 MB available during checks. This threatens further installs/browser tests and audit reliability; it is not evidence that production storage is full. No unrelated files were deleted to recover space.

Files added/changed by the audit: this report; a dated pointer/staleness note in `docs/OPEN_ITEMS.md`; sanitized evidence under `docs/qa/evidence/2026-09-14/`; and the unexecuted temporary browser harness noted above. No application-source remediation or deployment occurred. Therefore the QR/lifecycle findings remain open; passing tests do not close them.
