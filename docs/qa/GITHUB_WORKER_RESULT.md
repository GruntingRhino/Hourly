# GitHub worker result — 2026-09-10 pre-publication verification (continue-to-publish round)

Full evidence: `docs/qa/GITHUB_CANDIDATE_REVIEW.md` (§3b F1–F10).
Machine-readable hashes: `docs/qa/evidence/2026-09-10/candidate-hashes.json` (27 files,
regenerated after the entrypoint change; readback- and recompute-verified).
Full content audit: `content-audit.json` + `content-audit-triage.json` (678 files / 692,660 lines).
No commit, push, branch switch, reset, deployment, production access, data deletion, or
history rewrite occurred. The denied mission directory was never touched. Sole worker
re-confirmed at close (only this worker's session processes).

## Candidate (final tested identity)

- `/home/opc/RTB/projects/goodhours`, `main@fef1cea75a47debab4538f3d99ab21557fa3ccf2`
- Live remote check 2026-09-10T21:44:57Z: `refs/heads/main` = `fef1cea…`,
  `refs/heads/dev` = `9c32bb6…`, identical to cached refs; no unseen remote movement.
  `dev` is a strict ancestor of `main` → fast-forwardable, no force push.
- Dirty set: repaired production manifest, schema `@@index` fix, gate-test count sync,
  `VERCEL_PRODUCTION_MIGRATION.md` count, README clone/safety instructions, shared safe-test
  entrypoint + refusal tests + `pretest`/`test:billing` wiring, review + result, evidence files.
  Final main-tree full suite after the last change: exit 0, 498 tests (incl. 7 new refusal
  tests), 497 pass, 0 fail, 1 documented env-gated skip.

## This round: Vercel auto-deploy resolution attempted FIRST — publication STOPPED

Availability inspection (all read-only, no bypass): `hermes computer-use doctor` exit 0
(cua-driver healthy, MCP session active, X11/VNC reachable, screen capture functional);
VNC listens on 5901; `DISPLAY=:1`. BUT the `computer_use` MCP toolset is not granted to this
worker (the `hermes computer-use` CLI only manages the driver binary) and no alternate
driver/desktop operation is permitted; **no Firefox process is running**, so no designated
logged-in session exists to reuse; starting a login (credentials/2FA/consent) is a blocked
affected action; reading cookies/tokens/profiles is explicitly forbidden; production
project/domain access is not authorized; vendor CLIs (`vercel`/`neon`/`gcloud`/`resend`)
confirmed absent (recorded as a CLI gap, not as browser-unavailable proof — the session
check above is the actual availability finding). Hourly-dev settings inspection would still
require the unavailable browser session. **Production auto-deploy/migration risk is therefore
NOT affirmatively ruled out → no staging, no commit, no push (general continue is not an
override).** Precise scope blocker recorded; independent local work continued below.

## This round: README safety overclaim repaired (F10)

- Overclaim confirmed by audit: the pilot guard covers one file while node --test runs files
  concurrently; `prisma.ts` uses ambient `DATABASE_URL` at import; `ensure-test-db.sh` no-ops
  on inherited URLs without validating; `env.ts` remote refusal matches only neon/pooler
  hosts; `DEV_DATABASE_URL` overrides in dev-like test runs. New narrow shared entrypoint
  `server/scripts/ensure-safe-test-target.sh` (loopback-only for all three URL vars when set;
  refuses any production mode flag; string checks only, never prints values, never connects),
  wired into `pretest` and `test:billing` so it runs before any child test process.
- 7 behavioral refusal tests (`safeTestTargetGate.test.ts`) pass 7/7, including no-contact and
  no-URL-print proofs with synthetic `.invalid` targets.
- README converted to paste-safe subshells with `(unset DATABASE_URL; …)` sanitation and the
  pretest-gate documentation; every README verify command re-executed sequentially in the
  Node24 snapshot (validate/suite/builds exit 0; deliberate non-loopback refusal exit 1).
- Evidence: `main-gate-full.tap` (498: 497 pass, 1 documented skip), `fresh24-gate-full.tap`
  (498/498 under Node24, limiter included), both builds exit 0 in both trees.

## Prior rounds (unchanged, summarized)

- Refusal proof via pilot guard: non-loopback dummy target → exit 1, "pilot must use loopback
  DB", zero contact indicators (`refusal-proof.tap`, 0 URLs present).
- CSV clarification (schema/header/provenance only, no record values): `total_hours.csv`
  is already tracked in remote HEAD (`origin/main` blob `cfd7c301…`, since `db08a09`) —
  pre-existing content, zero new exposure from publication. Not a blocker; no deletion
  performed without permission. Exactly ONE candidate-added file holds suspected-PII
  patterns: `server-full-final.tap` (3 fixture-shaped addresses in email-policy test output).
- Mailbox classification corrected: `auth.ts:587,839` are operational notification-recipient
  addresses — not credentials, and a mailbox domain alone is not a personal-data finding.
  Recorded as routine hygiene, with no invented mandatory approval.

## Exact remaining blockers

1. **Vercel auto-deploy on `main`/`dev` push — publication STOPPED.** Attempted first via
   approved paths only: driver healthy but the `computer_use` toolset is not granted to this
   worker, no Firefox session exists, login/2FA is a blocked action, and production access is
   not authorized. Risk NOT affirmatively ruled out; a production build would now APPLY
   migration `20260910120000`. Needs an authorized dashboard read or explicit release
   authorization accepting a real production migration. No staging/commit/push performed.
   Desktop follow-up: Firefox launched on `:1` (PID 312846) and normal-CLI navigation to
   `https://vercel.com/dashboard` shows a "Vercel — Mozilla Firefox" window title — title
   only, NOT login/dashboard verification. Visual inspection is BLOCKED_TOOL_ACCESS (no
   capture tool in this worker's list); config-directory read and mission-directory access
   both denied (recorded, not retried). See `docs/qa/DESKTOP_SESSION_CHECK.md`.
2. **Hosted acceptance 1–5:** NOT_RUN/BLOCKED (no provider CLIs; no browser session available
   to this worker; no test accounts/inbox). All `DEFERRED_REQUIREMENTS.md` rows open;
   `DEF-OPS-004` needs a GitHub settings read.
3. **Local hygiene (routine, not blocking):** credential in local `.git/config` remote URL
   (redacted; rotate + credential helper). One snapshot DB password briefly visible in a local
   failure log — rotated immediately, never persisted; persisted TAPs sanitized.

## Verdict

Locally green across every executed gate; reporting is complete with stated methods and
limits. **NOT claimed reviewed-complete for release — blockers 1–2 stand — and NOT
release-ready.** No publication performed.

## Next exact action (orchestrator)

1. Review `docs/qa/GITHUB_CANDIDATE_REVIEW.md` (§§3b/6/8/9/10).
2. With explicit written authorization only: resolve blocker 1 (dashboard read or
   migration-accepting release approval), then commit, push `main`, fast-forward `dev`,
   then hosted acceptance 1–5.
