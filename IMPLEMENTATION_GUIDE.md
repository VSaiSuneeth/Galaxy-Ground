# Galaxy Ground Implementation Guide

Agent-facing implementation log for the current Vite + React project.

**Last updated:** 2026-07-10  
**Current phase:** Phase 7 - Launch Readiness

## Phase Map

| Phase | Focus | Status |
|-------|-------|--------|
| 1 | Foundation, query defaults, auth timeout, error boundaries | Done |
| 2 | Feed data layer, reactions, bookmarks, PostCard N+1 cleanup | Done |
| 3 | Auth, reset password, onboarding, discover route | Done |
| 4 | Explore intelligence detail pages | Done |
| 5 | Launchpad calendar and launch detail pages | Done |
| 6 | Learning paths and progress tracking | Done |
| 7 | RPC feed, admin readiness, developer access, API gateway, notifications | In progress |

## Phase 6 Implementation

### Files

- `src/lib/learning.ts`
- `src/hooks/useLearning.ts`
- `src/pages/LearningPage.tsx`
- `src/pages/LearningDetailPage.tsx`
- `src/App.tsx`
- `src/test/learning.test.ts`

### Completed

- Shared learning catalog and detail model.
- Learning detail route: `/learning/:slug`.
- Module and lesson display.
- Local progress persistence.
- Progress helper tests.

### Tests

- `npm.cmd run test -- src/test/learning.test.ts`
- `npm.cmd run build`
- Browser check for `/learning` and `/learning/rocket-propulsion-fundamentals`.

## Phase 7 Implementation

### Files

- `src/pages/AdminReadinessPage.tsx`
- `src/lib/readiness.ts`
- `src/test/readiness.test.ts`
- `src/pages/ApiDocsPage.tsx`
- `src/pages/StartupManagePage.tsx`
- `src/components/manage/RolesTab.tsx`
- `src/components/manage/AddRolePanel.tsx`
- `src/components/manage/AnalyticsTab.tsx`
- `src/hooks/useStartupRoles.ts`
- `src/hooks/useRoleViews.ts`
- `src/components/settings/DeveloperAccess.tsx`
- `src/hooks/useIntelDashboard.ts`
- `src/components/intel/*`
- `supabase/migrations/20260709000001_get_feed_page_function.sql`
- `supabase/migrations/20260710000001_phase7_support_schema.sql`
- `supabase/functions/generate-api-key/index.ts`
- `supabase/functions/api-gateway/index.ts`
- `supabase/functions/send-weekly-digest/index.ts`

### Completed

- Admin readiness route wired at `/admin/readiness`.
- Readiness helper tests.
- Feed RPC migration added and corrected for `text[]` hashtag columns.
- Support schema migration added for roles analytics, API keys, APOD cache, Intel digest, and trending hashtags.
- Startup management page wired at `/startup/:slug/manage`.
- Role creation/edit/deactivate UI present.
- Role analytics tab reads `role_views`.
- Public role cards can track views via `useRoleViewTracking`.
- Developer Access UI present in `/settings/messaging`.
- API docs route wired at `/docs/api`.
- Weekly Intel toggle now persists to `profiles.weekly_digest_opt_in` after migration.

### Known Backend Dependencies

- `20260710000001_phase7_support_schema.sql` must be applied remotely.
- Edge Functions must be deployed:
  - `generate-api-key`
  - `api-gateway`
  - `send-weekly-digest`
- The remote project must confirm:
  - `startup_roles.tags` exists.
  - `role_views` accepts public inserts and owner/admin reads.
  - `api_keys` and `api_usage_log` exist.
  - `get_feed_page`, `get_intel_digest`, and `get_trending_hashtags` execute.
  - `weekly_digest_opt_in` exists on `profiles`.

### Tests To Run

```powershell
npm.cmd run test
npm.cmd run build
```

Browser routes to verify:

- `/`
- `/learning`
- `/learning/rocket-propulsion-fundamentals`
- `/docs/api`
- `/startups`
- `/startup/skyroot-aerospace`
- `/startup/pixxel`
- `/community/astrophotography`
- `/settings/messaging` while signed in
- `/startup/:slug/manage` while signed in as that startup owner
- `/admin/readiness` while signed in as admin

## Supabase Handoff Message

Copy this to the Supabase tool when it is available:

```text
Please apply and verify the Phase 7 support backend for Galaxy Ground.

Project: lmdswaagcdxulcczkqmu

Run these migrations in order:
1. supabase/migrations/20260709000001_get_feed_page_function.sql
2. supabase/migrations/20260710000001_phase7_support_schema.sql

Then deploy these Edge Functions:
1. generate-api-key
2. api-gateway
3. send-weekly-digest

Verify:
- public.get_feed_page(p_user_id uuid, p_page_offset int, p_page_size int, p_mode text) returns [] or feed JSON, not SQL errors.
- public.get_intel_digest(p_user_id uuid) executes for authenticated users.
- public.get_trending_hashtags(p_hours int) executes for anon and authenticated users.
- public.profiles has weekly_digest_opt_in boolean default false.
- public.startup_roles has tags text[] default '{}'.
- public.role_views exists, allows anon/authenticated INSERT, and allows startup owners/admins SELECT.
- public.api_keys and public.api_usage_log exist.
- generate-api-key creates one active key per user and stores only SHA-256 hash plus key prefix.
- api-gateway accepts X-API-Key and returns /v1/launches with rate limiting.
- send-weekly-digest can read opted-in profiles and send/log digest safely.

Do not delete user data. If any destructive change is required, stop and explain first.
Return proof with table columns, policy names, RPC test results, and one successful API gateway curl result.
```
