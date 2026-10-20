# Galaxy Ground Stabilization Report - 2026-10-20

## Scope and evidence

This report records only work completed in the supplied directory. The directory has no `.git` metadata, so no branch or commit evidence is available. No migration, Edge Function, cron configuration, or change was deployed to the live Supabase project.

| Finding | Status | Evidence / change |
| --- | --- | --- |
| F1 Secrets in examples and scripts | Fixed locally; rotation needed | `.env.example` now uses placeholders, unused NVIDIA configuration was removed, live-mutation scripts require environment variables and explicit opt-in, and `npm run secrets:check` passes. |
| F2 Profile badge privilege escalation | Migration ready; unverified live | `20261020010000_security_authorization_hardening.sql` adds an invoker guard trigger and a profile `WITH CHECK` policy. |
| F3 Conflicting admin systems | Migration ready; unverified live | The new migration rewrites known badge-array admin policies to `has_role`. |
| F4 Open internal functions | Fixed locally; deployment/test needed | `_shared/auth.ts` protects the five internal functions with cron-secret or admin-JWT authorization; wildcard CORS was removed for them. |
| F5 Repo/live database drift | Confirmed; needs human | `DB_DRIFT_REPORT.md` records regenerated-type evidence and requires a CLI schema pull. |
| F6 Invalid migration filename | Not yet fixed | Renaming requires matching live migration history before it is safe. |
| F7 SECURITY DEFINER search paths | Migration ready; unverified live | The new migration applies a fixed `public` search path to existing public SECURITY DEFINER functions. |
| F8 Job reliability and observability | Partly fixed | Missing launch/topic/digest provider configuration now returns honest `503 not_configured`; `sync_jobs` persistence and live reminders remain incomplete. |
| F9 Fallback-data honesty | Not yet fixed | Requires a focused UI pass and production flag verification. |
| F10 Server-side learning progress | Not yet fixed | Requires a schema-confirmed implementation and sign-in migration test. |
| F11 API gateway rate-limit race | Not yet fixed | Requires an atomic database function or transaction-backed redesign. |
| F12 Hard-coded test credentials | Fixed locally | Legacy mutation scripts now require injected credentials and `E2E_ALLOW_MUTATIONS=true`. |
| F13 Dependency conflict | Fixed locally | Corrected Radix package metadata and compatible `date-fns@^3.6.0`; `npm install` and `npm ci` pass. |
| F14 Repo hygiene | Partly fixed | Test artifacts are ignored; broader document consolidation and tracked-artifact cleanup remain. |
| F15 RLS/performance live audit | Needs human/live test project | No live policy, index, or RLS suite result is claimed. |

## New migration to review and apply

1. `20261020010000_security_authorization_hardening.sql`: profile badge guard, admin-policy alignment, and function search paths. Rollback note is at the top of the migration. Apply only after a backup and an RLS test run against a non-production database.

## Environment variables added or documented

`E2E_ALLOW_MUTATIONS`, `E2E_USER_A_EMAIL`, `E2E_USER_A_PASSWORD`, `E2E_USER_B_EMAIL`, `E2E_USER_B_PASSWORD`, `E2E_USER_C_EMAIL`, `E2E_USER_C_PASSWORD`, `E2E_ADMIN_EMAIL`, `E2E_ADMIN_PASSWORD`, `CRON_SECRET`, `SITE_ORIGIN`, `OPENAI_API_KEY`, `FIRECRAWL_API_KEY`, `RESEND_API_KEY`, `EMAIL_FROM_ADDRESS`, `NASA_API_KEY`, `LAUNCHES_API_URL`, `LAUNCHES_API_KEY`, `TOPICS_API_URL`, `TOPICS_API_KEY`.

## Test results

| Check | Before | After |
| --- | --- | --- |
| `npm install` | Failed: peer dependency conflict | Passed |
| `npm ci` | Not runnable | Passed |
| `npm run build` | Passed | Passed |
| `npm test` | 7 files, 15 tests passed | 7 files, 15 tests passed |
| `npm run secrets:check` | Not present | Passed |
| `npx tsc --noEmit -p tsconfig.app.json` | Failed from stale local types | Still blocked by real frontend/live-schema mismatches exposed by regenerated types |
| `npm run lint` | Failed | Still blocked by existing type-safety lint backlog |

## Human-only actions still pending

1. Rotate exposed OpenRouter, NVIDIA, and any other keys found in provider dashboards.
2. Set and store the Edge Function secrets, including `CRON_SECRET`, in Supabase/Vault.
3. Back up production, reconcile schema drift, test the migration on a database copy, then deploy it.
4. Configure SMTP, cron jobs, monitoring, and alerts.
5. Run RLS, Edge Function authorization, and authenticated browser tests against dedicated accounts.

## Known deployment blockers

- The live schema and local migrations are not reproducible from this repository copy.
- Strict TypeScript identifies real UI assumptions that do not match the regenerated live schema.
- No live RLS or Edge Function invocation verification has been performed.
- No git repository was supplied, so the requested phase branches and commits cannot be created.
