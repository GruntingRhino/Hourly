# GoodHours GitHub candidate review — 2026-09-10 (pre-publication)

Pre-publication verification only. No commit, push, branch switch, reset, deployment,
production access, production data mutation, or deletion occurred in this phase.
The mission-directory denial was honored: no access, permission change, copy, or
alternate-tool access was attempted; that action remains BLOCKED and did not gate
any repository-only work below.

## 1. Candidate identity

- Repository: `/home/opc/RTB/projects/goodhours`, branch `main`
- Source HEAD: `fef1cea75a47debab4538f3d99ab21557fa3ccf2` (unchanged; verified again at end of phase)
- `origin/main`: `fef1cea75a47debab4538f3d99ab21557fa3ccf2` — HEAD and `origin/main` are identical (ahead 0, behind 0)
- `origin/dev`: `9c32bb6a84c9ac6f5e115e8e7bc250b2cdef03f2` — 18 behind `main`, 0 ahead; `dev` is a strict ancestor of `main`
- Remote freshness (live `git ls-remote`, 2026-09-10T21:44:57Z): live `refs/heads/main` =
  `fef1cea…`, live `refs/heads/dev` = `9c32bb6…` — byte-identical to the cached `origin/*`
  refs above, so no unseen remote movement exists. Cached-ref claims elsewhere are grounded
  by this live check.
- Dirty tree: this follow-up phase intentionally edited candidate files (manifest repair,
  schema index fix, gate-test count, doc + README updates, shared safe-test entrypoint +
  refusal tests + pretest wiring — all uncommitted, see §3b).
  Sole writer re-confirmed (only this worker's session processes); no commit/push/reset/switch.
- Runtime: `opencode/muse-spark-1.3-contributor-free` (this worker); local Node `v22.23.2` /
  npm `10.9.8` (repo engines require Node `>=24`, CI uses 24 — all gates below passed on the
  local 22 runtime; see §9).

## 2. Content hashes of tested source and manifests (sha256)

Generated programmatically from candidate bytes — see `docs/qa/evidence/2026-09-10/candidate-hashes.json` (readback- and recompute-verified; no hand transcription).

| File | sha256 |
|---|---|
| `server/prisma/schema.prisma` | `4198d6e959b148701eee3d74e8d1d6bc253883d027047ccb58f2c05bec3a733e` |
| `server/prisma/migrations/20260910120000_add_attendance_qr_school_scope/migration.sql` | `fd2eb8b67971453dc5fbba5c05815be4b92e3a13b499062723bf6c5369790d4e` |
| `package-lock.json` | `c42622cc576bb81cbf0f41605b30bedd63febb8352b206110e558cf40cfc66d7` |
| `server/package-lock.json` | `59f066c7384566a2f97538a5ce78a023de7beb8fa84d7191c76599a7c8584e86` |
| `client/package-lock.json` | `30552c01f0bf57121df290a5fdbada6968c0d7eb46b734e9487e2a71e894373f` |
| `scripts/vercel-production-build.sh` | `01b44e3e101e7cc2852d7e702e81f0e54e46f6900a93c19bfc0a513822c5fc56` |
| `scripts/vercel-production-migration-manifest.json` | `6c38adccdfa534ce4c85cd47ac295d82fcb69583e5754a319c86f785434ab7e5` |
| `scripts/vercel-production-build-gate.test.mjs` | `1d1798f6c5e878ef3d79e4298b89d35fa45c4a127cce9fb781f42427f2dc5489` |
| `server/src/routes/sessions.ts` | `dcb477fa6c9564cb754a5c6b6f82a021e8d11bdc3f498c98c2967dbc96936360` |
| `server/src/routes/beneficiaries.ts` | `56f3865617f315a3928747aee861ae662cd8bf015c4f44683d9594e226318993` |
| `server/src/lib/supervisorVerification.ts` | `daa102b13127b623e1f4cd0fae7346192a0438ade543669e8416f49905cbd985` |
| `server/src/lib/env.ts` | `11e43ce299d487c1737280304ae91a22da5d5efa36daaf7fd0eb4a9ad6182103` |
| `server/src/lib/uploadCleanup.ts` | `1efa3c3748684430fd2f9d7a9a3fb748c76f379c7f08786e8a6f7c553e8e4309` |
| `server/src/routes/auth.ts` | `7ce05a8996d819b7f17960fda94bf88823e9c31e7ed22a992a967ee09a2f9e81` |
| `server/package.json` | `e2f6a3cd3d859195e98e5703240e38afb3e38ce928f8075789afcc3bf0ed86bb` |
| `server/scripts/ensure-safe-test-target.sh` | `809ee5ea707ab400dbc3d0f75ba5323a6789637c1c5e26489551508bda29a1e0` |
| `server/tests/cancelledBeneficiaryExport.test.ts` | `dc6d25850c8d8a2f3b802bcb03bb69660e3f6db93b49cc2e4e3c5ab05330ecaa` |
| `server/tests/supervisorVerification.test.ts` | `69a9f2ad8668fa1a67ebb0a9b31ca6fe54de02c0c0eb78bcf5277f495c77a5f9` |
| `server/tests/syntheticSchoolPilot.integration.test.ts` | `ac78a74415454c6a068f893b1cee8a554ae729335746c6353ae58626a033be3d` |
| `server/tests/cookieAuthAndUploadCleanupArchitecture.test.ts` | `caf44c8df23d5bcb8b4a23af894c1a8835034bd6e8cb43c6cdde0e8653f9c4e9` |
| `server/tests/safeTestTargetGate.test.ts` | `1661eaabc3fba4b159f8db139ac8454985ceb3b313a2f3d1d321e820252428ca` |
| `client/src/lib/api.ts` | `ca09a6dc02366cdaf6b88c5bf7dd63fbbbdd6cfe9d09c01b29960c6eb7818fc0` |
| `client/src/pages/student/QrCheckin.tsx` | `9bc00a9bd2abaa9a6d376b7ff30500a1d61fc56db88b78a5db487a5e21ca635a` |
| `client/src/pages/SupervisorVerify.tsx` | `9db028d3b054c23c80d30514cd232a81574d91ea62d41cff982f343f6dbb1a49` |
| `client/src/App.tsx` | `2aa83dfd97bbf4cb2df07d5d1e192c4212b2021fcb7e082d7b9c785d48b1d247` |
| `docs/qa/VERCEL_PRODUCTION_MIGRATION.md` | `2469fcd0c0aafff5bb0516c85cbb5f7c20d4bba62be13514d6be33be59e9d9fe` |
| `README` | `99a44a71cde743777a9604907416d9e9c54b061ea5754fbed971180cef8a7c57` |

## 3. Tested commands and exact results (main tree)

All database-backed gates used only the disposable loopback target
`127.0.0.1:5433/goodhours_test` (hostname/port/dbname verified without exposing values).
No hosted, shared, or production database was touched.

| # | Command (from indicated dir) | Result |
|---|---|---|
| 1 | `server`: Prisma validate with `.env.test` loaded | exit 0 — "The schema at prisma/schema.prisma is valid" |
| 2 | `server`: `npx prisma validate` WITHOUT env | exit 1, `P1012 Environment variable not found: DATABASE_URL` — expected harness behavior, not a defect; documents why `.env.test` loading is required |
| 3 | `server`: Prisma generate with `.env.test` loaded | exit 0, client v6.19.3 generated |
| 4 | `server`: `prisma migrate status` with `.env.test` loaded | exit 0 — "72 migrations found", "Database schema is up to date" (includes candidate migration `20260910120000`) |
| 5 | `server`: `npm run build` (`tsc`) | exit 0 |
| 6 | `client`: `npm run build` (`tsc -b && vite build`) | exit 0, built in ~10s |
| 7 | `server`: synthetic pilot `node --env-file-if-exists=.env.test --import tsx --test tests/syntheticSchoolPilot.integration.test.ts` | exit 0 — 1 test, 1 pass, 0 fail, 0 skip |
| 8 | `server`: full suite `npm test` (incl. `pretest` `ensure-test-db.sh`) | exit 0 — 491 tests, 490 pass, 0 fail, 1 skip, 0 cancelled, 0 todo |
| 9 | `server`: multi-process limiter gate `tests/durableRateLimit.test.ts` with `RATE_LIMIT_TEST_DATABASE_URL` set to the same loopback target (value passed via substitution, never printed) | exit 0 — 10 tests, 10 pass, 0 fail, 0 skip. The full-suite skip (§3 row 8) is exactly this file's `test(..., { skip: !process.env.RATE_LIMIT_TEST_DATABASE_URL })` (`durableRateLimit.test.ts:111`); the gate is reachable and green when the documented variable is set |
| 10 | repo root: `git diff --check` | exit 0 |

### 3b. Follow-up phase — config defects found and fixed (this session)

Two reproducible config defects were identified and repaired as uncommitted dirty edits
(authorization: targeted follow-up items 3–4). Application code needed no fix.

| # | Check | Result |
|---|---|---|
| F1 | Production build gate as-found: `node scripts/vercel-production-build-gate.test.mjs` | exit 1 — fails at the schema-mismatch case with `migration directory count/set mismatch` (stale manifest: 71 frozen vs 72 actual). Evidence: `docs/qa/evidence/2026-09-10/gate-baseline-20260910.log` |
| F2 | New migration SQL inspection (`20260910120000`, 5 lines: add nullable `schoolId`, add index, add `ON DELETE SET NULL` FK) | purely additive; the only destructive-keyword hit is the `ON DELETE SET NULL` referential action — no data destruction. Manifest regenerated to 72 entries with the exact committed JSON shape; every hash validated `^[0-9a-f]{64}$` by the generator |
| F3 | Fresh-bootstrap drift probe: full 72-migration replay on a NEW disposable loopback DB, then `migrate diff` live-DB vs schema datamodel | NON-EMPTY — proposed `DROP INDEX "AttendanceQrToken_schoolId_expiresAt_idx"`: the migration creates the index in SQL but the model lacked the matching `@@index`. Root cause of a latent production-gate refusal. Fixed by adding `@@index([schoolId, expiresAt])` (mirrors the migration columns/order); manifest schema hash regenerated |
| F4 | Drift re-probe after fix | exit 0, empty diff — schema and migrated DB consistent |
| F5 | Gate test after both fixes (only change: expected history count 70→72; every fail-closed assertion preserved) | exit 0 — `PRODUCTION_BUILD_GATE_TEST=PASS`. Evidence: `docs/qa/evidence/2026-09-10/gate-after-manifest-20260910.log`, `gate-after-indexfix-20260910.log` |
| F6 | Fresh candidate snapshot under scoped Node v24.21.0 (arm64 tarball in ignored `test-results/node24/`, PATH-scoped per command, no global change): root/server/client `npm ci` (root hit ENOSPC once — reclaimed only regenerable `npm cache` + superseded snapshot installs; existing DBs/containers untouched), generate, fresh 72-migration replay on a NEW loopback DB (`127.0.0.1:5434`, fresh database + rotated throwaway credentials, never printed), status, builds | all exit 0. First full-suite attempt correctly refused by the disposable-DB guard (my initial DB name lacked a test/local/disposable marker — the guard works); after creating a compliant database name and rotating credentials: full suite exit 0 — **491 tests, 491 pass, 0 fail, 0 skipped** (limiter multi-process test included), explicit synthetic pilot exit 0 — 1/1. Evidence: `fresh24-full.tap`, `fresh24-pilot.tap`, `fresh24-drift.txt` (all URL-sanitized, 0 credentials) |
| F7 | README fresh-clone instructions added and every distinct command form executed (plain `npm ci` with postinstall in snapshot server; `node --env-file=.env.test … validate` in snapshot; installs/builds/suite/migrations per F6) | `npx prisma validate` without env fails (P1012) — README documents the env-loaded form instead; client plain `npm ci` ≡ verified variant (no postinstall script in `client/package.json`) |
| F8 | Main-tree gates after the last source change (schema `@@index` + regenerated manifest): Prisma generate + full `npm test` | exit 0 / exit 0 — 491 tests, 490 pass, 0 fail, 1 skip (the documented env-gated multi-process test). Evidence: `docs/qa/evidence/2026-09-10/main-final-full.tap` |
| F9 | README paste-safety + sanitation correction: all command lines converted to self-contained subshells; inherited-`DATABASE_URL` hazard documented with `(unset DATABASE_URL; …)` and the fail-closed guards cited. All README verify commands executed sequentially in the Node24 snapshot: `node --version` (v24.21.0), env-loaded validate (exit 0), deliberate non-loopback dummy-URL refusal (exit 1, "pilot must use loopback DB" in ~5ms, zero contact indicators — `.invalid` never resolves), full suite (exit 0, 490 pass, 1 documented skip), server + client builds (exit 0). Evidence: `docs/qa/evidence/2026-09-10/refusal-proof.tap` |
| F10 | README overclaim repair (pilot guard covers one file; node --test runs files concurrently): audited all inherited DB paths — `prisma.ts` uses ambient `DATABASE_URL` at import, `ensure-test-db.sh` no-ops on inherited URLs without validating, `env.ts` remote refusal only matches neon/pooler hosts, and `DEV_DATABASE_URL` overrides in dev-like test runs. Added narrow shared pretest entrypoint `server/scripts/ensure-safe-test-target.sh` (loopback-only for all three URL vars when set; refuses any production APP_ENV/NODE_ENV/VERCEL_ENV; pure string checks, never prints values, never connects) wired into `pretest` and `test:billing`; added 7 behavioral refusal tests (`safeTestTargetGate.test.ts`: loopback pass, unset pass, non-loopback/`DEV`/limiter-URL/production-flag refusals, no-URL-print, no-contact proof). Gate matrix + 7/7 pass; main-tree full suite exit 0 (498 tests: 497 pass, 0 fail, 1 documented skip); Node24 snapshot full suite exit 0 (498/498, limiter included) + both builds exit 0. Evidence: `main-gate-full.tap`, `fresh24-gate-full.tap` |

## 4. Candidate delta review (correctness / security / seams)

Tracked modifications (12 files, +120/−16): `client/src/App.tsx`, `client/src/lib/api.ts`,
`client/src/pages/SupervisorVerify.tsx`, `server/prisma/schema.prisma`,
`server/src/lib/env.ts`, `server/src/lib/supervisorVerification.ts`,
`server/src/lib/uploadCleanup.ts`, `server/src/routes/auth.ts`,
`server/src/routes/beneficiaries.ts`, `server/src/routes/sessions.ts`,
`server/tests/cancelledBeneficiaryExport.test.ts`,
`server/tests/supervisorVerification.test.ts`.
Untracked publishable additions: `client/src/pages/student/QrCheckin.tsx`,
`server/prisma/migrations/20260910120000_add_attendance_qr_school_scope/`,
`server/tests/cookieAuthAndUploadCleanupArchitecture.test.ts`,
`server/tests/syntheticSchoolPilot.integration.test.ts`, `docs/OPEN_ITEMS.md`,
`docs/legal/`, `docs/qa/DEFERRED_REQUIREMENTS.md`,
`docs/qa/OVERNIGHT_REVIEW_2026-09-10.md`, `docs/qa/OVERNIGHT_STATUS_2026-09-10.md`,
`docs/qa/evidence/2026-09-06/`, `docs/qa/evidence/2026-09-10/`,
`docs/qa/implementation-seams.md`.

- **QR attendance slice** (`sessions.ts`, schema `schoolId`, migration, `QrCheckin.tsx`, App route):
  issuer authorization (org ownership or school match), TTL clamped 60–900s, hash-at-rest,
  opportunity/school/session-ownership/state binding, atomic check-in + redemption +
  `CHECK_IN_QR` audit, replay/duplicate → 409 via unique constraint. No new defect found.
- **Supervisor slice** (`beneficiaries.ts`, `supervisorVerification.ts`, `SupervisorVerify.tsx`):
  issuance requires beneficiary management rights + school domain + CONFIRMED signup; consume is
  unauthenticated but rate-limited, body-submitted token, exact email/domain/signup/hash binding,
  serializable single-use claim, attendance-only (no ledger credit — existing approval route
  remains the authority). Fragment (`#token=`) transport reduces log exposure. The lib refactor
  adds strict payload shape validation and separates parse from single-use consume. No new defect found.
- **Cookie-auth tightening** (`api.ts` localStorage fallback removal, `auth.ts` password-route
  JSON token removal): consistent with the server's HttpOnly-cookie-first `authenticate`
  middleware; cookie is still issued on the line above the removed echo. No dangling references.
- **Upload cleanup** (`uploadCleanup.ts` → `resolveWritableUploadDir`): matches the write path used
  by beneficiaries/billing/schoolProcurement. `GH-OPS-014` correctly remains OPEN — its stated
  closure bar (non-zero reclaim on a real deployment, or DB-only branch) is still unmet.
- **Env fail-closed** (`env.ts`): production requires both new HMAC secrets; dev-only optional.
  Tests supply synthetic in-memory values. Correct.
- **Concurrency test fix** (`cancelledBeneficiaryExport.test.ts`): accepts both valid serialized
  outcomes and checks ledger invariants unconditionally. Test-design defect closed without
  weakening invariants; full suite green three phases running plus this one.
- **SupervisorVerify fragment fallback**: query-param first, hash-fragment second. Benign.

**Defects this phase (corrected statement): two config defects were identified and fixed**
(F1–F4 above: stale production manifest; schema/index drift). No application-code defect
reproduced — the QR/supervisor/cookie/upload/env/concurrency slices in the dirty tree were
re-verified, not re-edited. The earlier "no defects" wording was wrong because the manifest
mismatch is a genuine config defect; it is now repaired and gate-proven.

## 5. Fresh-snapshot reproducibility (ignored work area, accurately labeled)

Location: `test-results/fresh-candidate-20260910-2130Z/` (verified ignored via
`git check-ignore`; `.gitignore:36:test-results/`). Method: `git archive HEAD` plus overlay of
exactly the tracked modifications and the untracked publishable paths in §4. Similarity was
checked by `diff -rq` (only expected exclusions differed: `.git/`, `security-report/`,
`test-results/`, `tests/artifacts/`, `tests/.auth/`, `uploads/`) and by `cmp` on 14 probed
files (schema, migration SQL, both new tests, QR page, seams doc, all three lockfiles,
`.nvmrc`, `.env.example`, README, tracked `.env.test`) — byte-identical on those probed files
only; the snapshot was not hashed exhaustively, so no broader identity is claimed. Excluded
(non-publishable) categories: `.git/`, `node_modules/`, `dist/`, `.vercel/`,
`test-results/`, `security-report/`, `tests/artifacts/`, `tests/.auth/`, `uploads/`,
`*.db/sqlite`, local `.env` files, `server/data/*.csv` (also `.vercelignore`d). This is a
**worktree-equivalent snapshot, not a literal fresh remote clone** (no network clone, no git
history) — labeled accordingly.

| # | Snapshot command | Result |
|---|---|---|
| S1 | `npm ci --ignore-scripts` in `snapshot/server` | exit 0 |
| S2 | `npm ci --ignore-scripts` in `snapshot/client` | exit 0 (0 vulnerabilities) |
| S3 | Prisma generate with tracked `.env.test` | exit 0 |
| S4 | `prisma migrate deploy` | exit 0 — "No pending migrations to apply" |
| S5 | `npm run build` (server `tsc`) | exit 0 |
| S6 | `npm run build` (client) | exit 0, built in ~7s |
| S7 | Targeted tests `cookieAuthAndUploadCleanupArchitecture` + `supervisorVerification` + `syntheticSchoolPilot.integration` | exit 0 — 6 tests, 6 pass, 0 fail, 0 skip |

Setup needed for a true fresh clone is now documented in `README` ("Fresh clone setup")
and every distinct command form there was executed (see F7). Intentionally skipped in snapshots: browser/E2E specs (no browsers downloaded), and any external/provider-backed tests — no secrets, no production defaults, no reset of existing disposable DBs (fixtures are uniquely named; the Node24 snapshot used its own NEW database and left the existing one untouched).

Second snapshot (Node24, current bytes incl. manifest/schema fixes):
`test-results/fresh-node24-20260910/` (ignored). Root/server/client installs, generate,
fresh 72-migration replay, status + empty drift diff, both builds, full suite 491/491 and
explicit pilot 1/1 — all exit 0 under Node v24.21.0 (see F6). Root `node_modules` (586M) was
removed after its install evidence was recorded to fit server+client installs on a full disk;
only regenerable artifacts were reclaimed.

## 6. Secret / PII audit (full-content scan, redacted)

Method: a script scanned the CONTENTS (not names/sizes) of the full publishable set —
all `git ls-files` entries plus every untracked publishable path in §4, including nested
`docs/legal/` sources, JSON transcripts, TAP/log evidence, tracked CSVs, and archived docs:
**678 files / 692,660 lines / ~201MB**, 57 binaries skipped by filename only (56 design
mockup `.png`, 1 `.DS_Store`), 0 unreadable. Values never displayed; findings recorded as
path:line + category (+ domain for emails). Raw redacted machine output:
`docs/qa/evidence/2026-09-10/content-audit.json` (compacted; individual entries kept except
the non-specific digit-run pattern, retained as counts) and triage dispositions in
`content-audit-triage.json`. The earlier "zero matches" wording is superseded by this
complete accounting:

- Credential values: **none found**. 0 private-key blocks, 0 AWS keys, 0 GitHub/Slack/Stripe-live
  keys, 0 env-style `ALL_CAPS="value"` assignments in code (all 180 generic-assign hits resolve
  to code constructs, `===` comparisons, or JSX/test expressions). The 3 `re_` hits are a
  migration-path substring (manifest entries 21/22) and a 31-char fixture fragment in a
  non-email Pro-grant test (shorter than production Resend-key format); the 2 `whsec_` hits are
  `whsec_replace*` format placeholders in the two `.env.example` files.
- `total_hours.csv` — clarified by header/provenance (no record values disclosed): the file
  is already tracked in existing remote HEAD (`git ls-tree HEAD` and `origin/main` both carry
  blob `cfd7c301…`, provenance commit `db08a09` "Add root-level data files…"). 2 columns, one
  student-name-like header, one non-placeholder-shaped data row. It is therefore PRE-EXISTING
  remote content: publishing `main` adds zero new exposure of it. The earlier "exclude from
  publication" wording is corrected — exclusion is impossible without a commit (it is tracked)
  and no deletion/sanitization is performed without owner permission. Routine hygiene candidate only.
- Exactly ONE candidate-added file contains suspected-PII patterns:
  `docs/qa/evidence/2026-09-10/server-full-final.tap` (3 personal-domain addresses at lines
  2769/2782/2825, all inside email-delivery-policy test output with fixture markers on the same
  lines — synthetic fixtures echoed by tests, not real persons). Kept publishable with this note.
- `server/src/routes/auth.ts:587,839`: operational notification-recipient addresses in source
  (`:839` approval notifications; `:587` inside the POST `/signup` verification-email block).
  Classification: operational addresses, NOT credentials, and a mailbox domain alone is not a
  personal-data finding. No mandatory owner approval is invented; recorded as routine hygiene
  the owner may review at convenience.
- Seed/spec personal-domain mailboxes (e.g. 26 in `seed-playwright.ts`): all fixture-shaped
  local parts — synthetic test data. Phone-with-context matches in code/seeds (8): all carry
  fictional markers (`555`/test/fake). Bulk digit-run hits (257,758) are a non-specific pattern
  concentrated in public school-directory CSVs (institutional numbers) and numeric IDs/hashes.
- Tracked `server/.env.test` (20 lines): dummy-only by its own header; the single prod-like hit
  is the word "production" in the warning comment. Key names only, no values read. No
  `server/.env` exists.
- `docs/legal/pilot-drafts/` (fully scanned incl. nested evidence sources) are AI-prepared
  drafts and self-label as not legal advice/approval, consistent with `DEFERRED_REQUIREMENTS.md`
  (counsel = recommended/deferred, never mandatory).
- Hygiene (local-only, NOT repo files): remote URL in local `.git/config` embeds a credential
  (redacted once, never reproduced) — sanitize + rotate; and one fresh-snapshot DB password was
  briefly visible in a failed-assertion log during this session — it was rotated immediately,
  the new value never displayed, and no TAP persisted the failure (persisted TAPs sanitized, 0 URLs).

## 7. Documentation-claim accuracy

- `OVERNIGHT_STATUS_2026-09-10.md` acceptance items 1–5 remain correctly NOT_RUN/BLOCKED (this
  phase re-confirmed the concrete causes: `vercel`, `neon`, `gcloud`, `resend` CLIs absent;
  Firefox installed but not running — a session-availability fact, not provider evidence).
  Item 6 (fake pilot incl. QR + supervisor seams) is supported by the passing integration test.
- No claim of full pilot readiness from local tests exists in the reviewed docs; readiness
  sections explicitly state GoodHours is NOT release-ready for real-student use.
- Google restricted-scope assessment and domain-wide consent are recorded as
  conditional/NEEDS-VERIFICATION (`DEF-OPS-002/009`), not as universal mandates.

## 8. Publication-risk assessment (auto-deploy / migration)

- `vercel.json` production path: `scripts/vercel-production-build.sh` runs `prisma migrate
  deploy` against the production `DATABASE_URL` **during the build** when
  `VERCEL_ENV=production` (project-ID-pinned, manifest-verified, fail-closed on mismatch).
  Whether pushing `main` triggers such a build depends on Vercel dashboard git integration
  (production branch, auto-deploy) — **not provable from source; risk cannot be ruled out**.
- **Production manifest: REPAIRED this session (was a concrete push-blocker).** Manifest now
  freezes all 72 migration dirs with validated hashes plus the current schema hash (which
  changed twice: new `schoolId` column, then the added `@@index`). The build gate passes
  (`PRODUCTION_BUILD_GATE_TEST=PASS`, all fail-closed assertions preserved) and a fresh
  full-replay DB shows zero schema drift. Consequence for publication risk: a Vercel
  production auto-build on this candidate would now PROCEED to `migrate deploy` instead of
  refusing — so the remaining question is sharper and purely dashboard-side: whether pushing
  `main` (or `dev`) triggers a production build at all. That is still unprovable from source.
  Do not push until an authorized Vercel dashboard read (production branch + auto-deploy
  settings) or explicit release authorization accepting a real production migration is in hand.
- `app-verification.yml` (push to `main`, PRs): CI only — disposable service Postgres, tests,
  builds, audits. Safe; no deploy, no production migration.
- `production-migration.yml`: manual-only (`workflow_dispatch` + exact confirmation string +
  `production` environment + host/name/secret identity checks, main-ref only). Safe by design;
  the `production`-environment required-reviewers setting itself is dashboard-side and
  unprovable from YAML (`DEF-OPS-004` — still needs an authorized GitHub settings read).
- `event-reminders.yml`, `upload-cleanup.yml`, `refresh-directory.yml`: schedule/manual only;
  pushes do not trigger them.
- Safe reconciliation (no force push, histories preserved): `origin/dev` is a strict ancestor
  of `origin/main` (0 dev-only commits), so after `main` is published, `dev` can be
  fast-forwarded to `main` (or `main` merged into `dev`) — no history rewrite in either case.
   User authorized GitHub publication, NOT production deployment: do not push until the Vercel
   auto-deploy question (§8 first bullet) is answered by an authorized dashboard read or explicit
   release authorization accepting a real production migration (the repaired manifest means a
   production build would now apply migration `20260910120000`, not refuse).

## 9. Outstanding gaps (updated)

- Vercel auto-deploy disposition (§8) — the sharpest blocker: a production build would now
  apply migration `20260910120000`.
- Hosted acceptance 1–5: still NOT_RUN/BLOCKED (tooling/session + human account/inbox causes).
- Human/operator/school decisions: all `DEFERRED_REQUIREMENTS.md` rows remain open; counsel
  stays recommended/deferred per standing boundary (do not re-request).
- `production`-environment required-reviewers confirmation from GitHub settings (`DEF-OPS-004`).
- Resend-key-like fixture fragment (`schoolBeneficiaryPolicyArchitecture.test.ts:66`) — assessed
  fixture, owner spot-check advised; recorded as residual uncertainty, not a finding.
- Routine hygiene (not blockers): `total_hours.csv` pre-existing content, `auth.ts` operational
  mailboxes — §6.

## 10. Verdict

Candidate `main@fef1cea` + the dirty set in §4 is **locally green across every executed gate**
(§§3/3b/5 all exit 0; audit in §6 complete with stated method and limits). This report does NOT
claim reviewed-complete for release: the blockers in §9 stand, so the candidate is **not
release-ready** for real-student use or a supervised live pilot. **No remote publication
occurred; none is authorized by this report** — orchestrator review and explicit release
authorization are required first (next action in `docs/qa/GITHUB_WORKER_RESULT.md`).
