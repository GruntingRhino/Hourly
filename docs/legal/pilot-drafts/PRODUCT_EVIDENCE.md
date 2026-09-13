# GoodHours product evidence snapshot — 2026-09-05

**Evidence class:** read-only source inspection of the sibling checkout at `/home/opc/RTB/projects/goodhours`, on branch `terra/fix-sol-findings-20260826`, with a pre-existing dirty worktree. This is not deployment/provider/contract evidence. Line references are to that inspected checkout and must be rechecked at integration.

## Verified source evidence

| Capability/control | Source evidence | What it proves | What it does not prove |
|---|---|---|---|
| 13+ attestation | `server/src/routes/auth.ts:367,393-394,524-525,704-708`; `server/src/middleware/auth.ts:84,114-117`; `server/src/routes/googleAuth.ts:143,695-696` | Server schemas reject missing/false literal `eligible13Plus`; attestation relation is selected and session evaluation distinguishes `AGE_ELIGIBILITY_REQUIRED`; password/Google/existing-user paths write an attestation. | Every invitation/import/activation path is behaviorally verified; age is verified; legal applicability is resolved. |
| School authority/ownership | `server/src/lib/schoolActivation.ts:31,55`; `server/src/routes/schools.ts:232-235`; `server/src/routes/auth.ts:1136` | Source contains ownership evidence/approval logic and a separate school-data deletion helper. | The school identity, authorized signatory, approval, deployment config, or closure authorization. |
| School-scoped access/audit | `server/src/lib/cohortAccess.ts:70,113-124`; `server/src/lib/dataAccessLog.ts:25,38-47`; `server/src/routes/auth.ts:1101-1121,1168,1216-1221` | Central access/school-resolution and deletion/audit-log paths exist in source. | Complete route coverage, production configuration, immutability, or retention duration. |
| Classroom/Canvas and billing | `server/src/index.ts:26,29,129-130,167,174`; `server/src/lib/env.ts:27-30`; `server/src/lib/billingConfig.ts:1-10` | Routes/configuration hooks exist. | Real tenant authorization, enabled scopes, tokens, provider terms, payment handling, or pilot enablement. |
| Messaging/reminders/email | `server/src/index.ts:18,33-35,140-141,183,254-256`; `server/src/services/email.ts` | Message routes, reminder schedulers, event reminders, and email service are wired in source. | Delivery, recipient minimization, monitoring, vendor retention, or successful cron execution. |
| Uploads/attachments | `server/src/index.ts:34,136`; `server/src/lib/runtimeStorage.ts:5-8`; `server/src/lib/uploadCleanup.ts:5-10,34-40,72-91`; `server/src/routes/beneficiaries.ts:10,38,48,79` | Upload route/storage/cleanup paths exist; source serves uploaded evidence through resource-scoped routes. | Malware scanning, durable production storage, backup/restore, deletion propagation, or provider contract. |
| Full pilot feature surface | `server/src/index.ts` route imports/mounts; current UI/source inventory; existing integration annex | Product source includes service-hour tracking, reports/exports, messaging, imports, uploads, reminders, LMS hooks, and billing hooks. | That all features are approved or enabled; the agreement must explicitly mark feature/provider activation. |

## Evidence boundaries

- UI copy, module presence, environment variable names, and route mounts are leads only; they do not establish a contract, region, retention, backup, security certification, or live operation.
- The source checkout contains unrelated pre-existing changes; this package did not edit it, run migrations, access production, read secrets, contact LSRHS, publish notices, or sign/execute any agreement.
- The current package therefore uses **verified source fact**, **proposed commitment**, **NEEDS OWNER INPUT**, and **qualified legal question** labels instead of compliance or approval claims.
