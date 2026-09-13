# GoodHours overnight status — 2026-09-10

Candidate identity
- Repository: `/home/opc/RTB/projects/goodhours`
- Branch: `main`; source HEAD: `fef1cea75a47debab4538f3d99ab21557fa3ccf2`
- Dirty tree was preserved. No commit, push, branch switch/reset, deployment, production access, production data mutation, or deletion occurred.
- Runtime: parent Hermes session is `openai-codex / gpt-5.6-luna`; initial read-only audit was executed by Claude Code and returned actual Claude model metadata (`claude-opus-5`, first-party). No Astra or unspecified fallback was used.

Evidence classes
- LOCAL-SYNTHETIC: source, Prisma validation/generation, loopback HTTP, disposable/labeled test DB, and local builds.
- LIVE-PREVIEW: none obtained.
- SOURCE-ONLY: repository configuration and route/schema inspection; not dashboard/runtime proof.
- HUMAN-DEPENDENT: provider authentication/consent, test accounts/inbox, school/operator decisions and signatures.

Acceptance ledger

| # | Acceptance item | Result | Evidence / command / classification |
|---|---|---|---|
| 1 | Vercel hourly-dev source, Preview target, exact build command, env scopes, deployment provenance | NOT_RUN | No browser/dashboard session or Vercel CLI auth. Local `vercel*.json` is SOURCE-ONLY and cannot prove effective dashboard command, Preview scope, URL, deployment ID, branch, or SHA. Classification: tooling/session and provider-auth dependency, not code failure. |
| 2 | Neon Hourly dev branch identity and separate reviewed migration deploy | NOT_RUN | No non-production hosted DB target was proven and no remote DB was accessed. The reviewed additive migration was applied only to the loopback `.env.test` PostgreSQL target; this is LOCAL-SYNTHETIC evidence, not Neon evidence. Classification: hosted safety/provider-auth dependency. |
| 3 | Google Classroom Preview OAuth lifecycle | BLOCKED | No designated test account/consent was used. `GOOGLE_CLASSROOM_ENABLE_MOCK` was not enabled by the local test. Computer-use doctor passed, but `list_windows` returned 0 and Firefox was not running; capture returned `window discovery returned no windows`. Classification: separate desktop-session/tooling blocker plus human account/consent dependency; not a code defect. |
| 4 | Resend Preview sender and inbox delivery proof | BLOCKED | No inbox-routable GoodHours test alias was designated and no message was sent. Same absent Firefox session prevented provider UI validation. Log-only output was not counted as delivery. Classification: tooling/session plus human test-inbox dependency. |
| 5 | Deployed reminder endpoint auth/lease/idempotency/retry and one test delivery | NOT_RUN | No deployed endpoint or secret was accessed; no recipient contacted. Local scheduler code/tests are not hosted evidence. Classification: provider-auth/session dependency. |
| 6 | Fake school pilot with role, waitlist, attendance, approval, ledger, transcript/export, and isolation | PASS (LOCAL-SYNTHETIC) | `node --env-file-if-exists=.env.test --import tsx --test tests/syntheticSchoolPilot.integration.test.ts` exit 0, 1 test, 1 pass, 0 fail, 0 skip. Loopback/labeled disposable DB was asserted. Real HTTP/DB checks include four persisted role families plus tokenized guest supervisor, signup/waitlist/cancel promotion, beneficiary attendance/approval/ledger, QR and supervisor routes with issuer/ownership/opportunity binding, expiry/tamper/replay/cross-tenant checks, supervisor `usedAt` and attendance postconditions, report/transcript/export and tenant denial. Evidence: `docs/qa/evidence/2026-09-10/synthetic-school-pilot-final.tap`. This is not a live school pilot. Classification: local engineering pass. |

Local synthetic verification
- Prisma validate + generate: exit 0 with `.env.test` loaded without printing values.
- Server TypeScript build: `cd server && npm run build` exit 0.
- Client build: `cd client && npm run build` exit 0; Vite produced `QrCheckin` and updated `SupervisorVerify` assets.
- Final full server suite after the last source change: `cd server && npm test` exit 0; 491 tests, 490 pass, 0 fail, 1 skip. The skip is the existing multi-process rate-limit test.
- `git diff --check`: exit 0.
- New implementation seam: `docs/qa/implementation-seams.md`.

Observed failures and classifications
- First pilot issuance failed because `.env.test` lacked the two new secrets: test-harness configuration issue. The test now sets synthetic-only in-process secrets and the route remains fail-closed in production.
- First supervisor implementation rejected valid links because payload ID differed from generated Prisma ID: application defect, fixed by persisting the signed ID explicitly.
- Hosted acceptance remains unverified because no browser window/provider auth is available, not because provider behavior was tested and failed.

## Execution addendum — final local candidate verification

- Live identity rechecked: `main@fef1cea75a47debab4538f3d99ab21557fa3ccf2`; 24 status entries were present and preserved. No commit, push, reset, branch switch, deploy, production access, or deletion occurred.
- Reviewed additive migration `server/prisma/migrations/20260910120000_add_attendance_qr_school_scope/migration.sql` was applied only to the loopback `.env.test` PostgreSQL target with `npx prisma migrate deploy`; Prisma reported all migrations successfully applied. No hosted or production target was used.
- Focused pilot: exit 0, 1 test, 1 pass, 0 fail, 0 skip. Evidence: `docs/qa/evidence/2026-09-10/synthetic-school-pilot-final.tap`.
- Server build: exit 0. Client build: exit 0. Evidence: `docs/qa/evidence/2026-09-10/server-build-final.log` and `client-build-final.log`.
- Final full server suite: exit 0, 491 tests, 490 pass, 0 fail, 1 skipped, 0 cancelled, 0 todo. Evidence: `docs/qa/evidence/2026-09-10/server-full-final.tap`.
- `git diff --check`: exit 0.
- Computer-use diagnosis: `hermes computer-use doctor` exit 0; X11, screen capture, AT-SPI, and active MCP session healthy. `computer_use list_apps` found Firefox not running and no windows; no browser/provider action was attempted and no credentials/cookies were touched. This is a desktop-session availability issue, not evidence of provider failure.
- Claude final-review attempts were executed with actual Claude metadata and read-only restrictions. The broad runs reached their bounded turn limit without a returned verdict; this is recorded as an incomplete reviewer artifact rather than a fabricated approval. Evidence: `docs/qa/evidence/2026-09-10/claude-final-review.json`, `claude-final-review-v2.json`, and `claude-final-review-diff.json`.

Readiness
GoodHours is not release-ready for real-student use or a supervised live school pilot. The requested local QR and tokenized guest-supervisor slices are implemented and tested, but hosted deployment/database/provider delivery and human operator/school acts remain unverified. `docs/qa/DEFERRED_REQUIREMENTS.md` is the durable recall register; it treats counsel review as recommended/deferred rather than a universal legal mandate, and separately records actual signatory, consent, agreement, policy, and operational-owner decisions. AI drafts are not attorney approval.
