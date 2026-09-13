# GoodHours implementation seams — 2026-09-10

Candidate: `/home/opc/RTB/projects/goodhours`, branch `main`, source HEAD `fef1cea75a47debab4538f3d99ab21557fa3ccf2`. The implementation is an uncommitted local candidate; no push, deploy, production access, or production-data mutation occurred.

## Existing persistence reused

- `AttendanceQrToken` and `AttendanceQrRedemption` remain the existing legacy `Opportunity`/`ServiceSession` models and migrations. No duplicate model or migration was added.
- `SupervisorVerification` remains the existing beneficiary-side `BeneficiarySignup` model and migration. Its token is now hashed at rest with `hashSupervisorVerificationToken`.
- The application has four persisted account-role families used by this flow: school staff (`SCHOOL_ADMIN`, `TEACHER`), student, and beneficiary/organization operator (`BENEFICIARY_ADMIN` or legacy `ORG_ADMIN`). The external supervisor is a tokenized guest, not a fifth persisted `UserRole`.

## QR attendance vertical slice

Routes are registered through the already-mounted `sessionsRoutes` at `/api/sessions`:

- `POST /api/sessions/:id/qr-token`: `ORG_ADMIN`, `SCHOOL_ADMIN`, or `TEACHER`; verifies organization or school ownership before minting a 60–900 second HMAC token; stores only its SHA-256 hash.
- `POST /api/sessions/:id/qr-checkin`: authenticated student only; parses signature/expiry, checks token hash, revoked state, opportunity binding, session ownership and state, then atomically creates `AttendanceQrRedemption`, transitions the session to `CHECKED_IN`, and writes `CHECK_IN_QR` audit evidence. The existing unique constraint makes replay/duplicate redemption return 409.
- Client consumer: authenticated student route `/qr-checkin` (`client/src/pages/student/QrCheckin.tsx`), posting the token in the body rather than a URL path.

This slice deliberately targets the legacy schema because the existing QR tables are foreign-keyed to legacy `Opportunity` and `ServiceSession`. Extending QR to beneficiary slots would require a separate reviewed migration and is not silently inferred here.

`POST /api/sessions/:id/qr-token` (issuance) is intentionally API-only as of 2026-09-12: no staff UI surface calls it (verified: no `qr-token` reference in `client/src`), and no issuance consumer was added because exposing one is a product-flow decision (which staff surface, TTL control, display/rotation UX) that requires owner confirmation. The issuance authorization, school/opportunity binding, TTL clamp (60–900s), and hash-at-rest behavior are covered by the existing server-side issuance code and the loopback pilot redemption checks. A staff issuance button must not be added without that confirmation.

## Supervisor verification vertical slice

Routes are registered through the already-mounted `beneficiaryRoutes` at `/api/beneficiaries`:

- `POST /api/beneficiaries/signups/:signupId/supervisor-verification`: authenticated beneficiary admin or school admin; checks beneficiary ownership, school authorization domain, and active signup state; persists a hashed token and returns a verification URL. It does not bypass email verification, school ownership, or student 13+ eligibility.
- `POST /api/beneficiaries/supervisor-verification/consume`: unauthenticated but rate-limited; token is submitted in the body. Signature and expiry are verified, then the persisted record, exact supervisor email, school domain, signup binding, and hash are checked. A serializable conditional `usedAt IS NULL` update provides cross-request single-use behavior. On success it records `ATTENDED`/`checkedIn` and a beneficiary audit row. It does not grant ledger credit; the existing authorized approval route remains the ledger/approval authority.
- Client consumer: existing public `/supervisor-verify` now posts `{ token, supervisorEmail }` instead of putting the token in the request path, reducing request-log exposure.

## Configuration and verification

`ATTENDANCE_QR_SECRET` and `SUPERVISOR_VERIFICATION_SECRET` are optional in development but required in production-like runtime validation. The test process supplies synthetic-only values in memory; no secret value is stored in this document or external configuration.

The named fake-pilot test now exercises real loopback HTTP and database postconditions for waitlist, beneficiary attendance/approval/ledger, supervisor issuance/consume/replay/tamper/expiry/cross-tenant denial, QR issuance/redeem/replay/tamper/expiry/cross-student denial, reports, transcript, export, and tenant isolation. Evidence: `docs/qa/evidence/2026-09-10/synthetic-school-pilot-final.tap`.

## Retention / legal-hold seam — 2026-09-12

`server/src/lib/retentionPolicy.ts` is an intentionally non-destructive, fail-closed policy gate: pure functions only (no database access, no deletion calls), covered by `server/tests/retentionPolicy.test.ts` (LOCAL-SYNTHETIC). It answers only the advisory question "would an owner-approved policy permit purging this audit record?" and defaults to blocked (`NO_POLICY`, `POLICY_INVALID`, `NOT_OWNER_APPROVED`, `NO_RULE_FOR_TYPE`, `NOT_OLD_ENOUGH`, `LEGAL_HOLD_ACTIVE`). Retention durations are never chosen by code — every threshold is owner-provided input, validated only as a finite positive number. Even an eligible answer carries `requiresOwnerExecution: true`: no purge mechanism exists, and none must be built until DEF-LEGAL-007 (approved retention/deletion schedule + named records administrator + school approval) is resolved, which is an owner/school decision, not engineering. No legal compliance is claimed.

Durable records (2026-09-12 remediation): `RetentionPolicy` and `LegalHold` tables (`20260912173102_add_retention_policy_and_legal_hold`, pure `CREATE TABLE`, no foreign keys so holds survive any deletion) persist owner decisions without executing them. `server/src/lib/retentionStore.ts` reads the newest policy row plus active holds in one serializable snapshot and delegates to the pure gate; it performs no writes, no deletes, and a hold row with an unrecognized `recordType` is treated as covering every type (fail-closed) rather than none. Covered by `server/tests/retentionStore.integration.test.ts` (LOCAL-SYNTHETIC, disposable loopback PostgreSQL, full-history replay verified). Nothing is seeded — a fresh database answers blocked to every check — and hold release is recorded (`active=false` + `releasedAt`/`releasedBy`), never a row deletion. This is still not an implemented retention system: there is no purge caller, no execution workflow, and no approved schedule. It must not be reported as retention/legal-hold engineering completion or compliance evidence.

Known boundary: no live provider or hosted deployment proof was obtained. Local synthetic success is not Vercel, Neon, Google Classroom, Resend, scheduler, real-inbox, school-consent, or legal evidence.
