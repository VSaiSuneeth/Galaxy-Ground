# Galaxy Ground Sprint Progress

**Version:** 2026-07-10  
**Project:** Vite + React + Supabase  
**Rule:** after each phase, implement, test, document, and only then continue.

This is the user-facing guide for what is complete, what to test, and what still depends on Supabase deployment.

## Quick Status

| Phase | Name | Status | What you can use today |
|-------|------|--------|------------------------|
| 1 | Foundation & Stability | Done | Stable auth fallback, query defaults, error boundaries |
| 2 | Feed Data Layer | Done | Safer post/feed data, reactions, bookmarks, PostCard interaction hydration |
| 3 | Auth & Onboarding | Done | Signup/login, password reset, interest onboarding, discover route |
| 4 | Explore Intelligence | Done | Topic detail pages with overview, history, discoveries, updates |
| 5 | Launchpad | Done | Launch calendar, launch details, countdown widgets |
| 6 | Learning Hub | Done | Learning catalog, detail pages, local progress tracking |
| 7 | Launch Readiness | In progress | Admin readiness page, API docs, developer access UI, support SQL prepared |

## Phase 6 - Learning Hub

### What Was Implemented

- `/learning` catalog remains the entry point for learning paths.
- `/learning/:slug` now opens a full learning path detail page.
- Each path has modules, lesson checkpoints, video/resource sections, and progress summary.
- Lesson progress is stored locally in the browser so a user can leave and return without losing progress.
- Shared learning helpers live in `src/lib/learning.ts` so the catalog, detail page, and tests use the same data model.

### Workflow

1. User opens `/learning`.
2. User selects a learning path.
3. The app opens `/learning/:slug`.
4. User marks lesson checkpoints complete.
5. The progress percent updates immediately and persists in localStorage.

### What Was Tested

- Unit tests for path lookup, progress percent, duplicate completed items, and saved progress parsing.
- Production build.
- Browser check for `/learning` and `/learning/rocket-propulsion-fundamentals`.
- Progress toggle changed the visible percent correctly.

### What You Should Verify

- Open `/learning`.
- Open a path, for example `/learning/rocket-propulsion-fundamentals`.
- Click lesson checkpoints and refresh the page.
- Confirm progress remains saved.
- Confirm mobile layout still reads cleanly.

### Supabase Need

Optional. The frontend has fallback data. Supabase course tables can replace or extend the fallback catalog when remote learning content is ready.

## Phase 7 - Launch Readiness

### What Was Implemented

- `/admin/readiness` route added for admin-only production checks.
- Readiness checks cover Supabase connection, content table counts, notifications, and `get_feed_page` RPC availability.
- `supabase/migrations/20260709000001_get_feed_page_function.sql` defines the unified feed RPC.
- `supabase/migrations/20260710000001_phase7_support_schema.sql` adds support objects for:
  - `weekly_digest_opt_in` on profiles
  - `startup_roles.tags`
  - `role_views`
  - `api_keys`
  - `api_usage_log`
  - `apod_cache`
  - `get_intel_digest`
  - `get_trending_hashtags`
- `/docs/api` documents the OrbitalStack API.
- Developer Access settings can generate, show, and revoke API keys once Edge Functions and SQL are deployed.
- Weekly Intel toggle now saves to `profiles.weekly_digest_opt_in` after the support migration is applied.
- Right sidebar includes roles at followed startups.
- Startup management route `/startup/:slug/manage` includes roles and analytics tabs.

### Workflow

1. Startup owner opens `/startup/:slug/manage`.
2. Owner can create or edit open roles.
3. Public startup page shows active roles.
4. Role cards record view events after visibility tracking.
5. Analytics tab reads `role_views`.
6. User opens settings and manages Developer Access.
7. API key is generated through the `generate-api-key` Edge Function.
8. External clients call `api-gateway` using `X-API-Key`.
9. Admin opens `/admin/readiness` to confirm the backend is production-ready.

### What Was Tested

- Production build passed after Phase 7 wiring changes.
- SQL mismatch fixed between `/admin/readiness` and `get_feed_page`.
- `startup_roles.tags` gap fixed in the new migration.
- Hashtag RPCs corrected for the real `text[]` hashtag column type.

### What You Should Verify

- Apply the new migration in Supabase.
- Deploy `generate-api-key`, `api-gateway`, and `send-weekly-digest` if not already deployed.
- Open `/docs/api`.
- Sign in and open `/settings/messaging`.
- Toggle Weekly Intel Digest and save.
- Generate an API key, copy it, then test `/functions/v1/api-gateway/v1/launches`.
- As a claimed startup owner, open `/startup/:slug/manage`, add a role, edit it, deactivate/reactivate it.
- As admin, open `/admin/readiness`.

### Supabase Need

Required. Phase 7 is not truly complete until the migrations and Edge Functions are applied to the remote project and verified against real authenticated users.

## Remaining Work

1. Apply Phase 7 support SQL to Supabase.
2. Deploy and verify Edge Functions:
   - `generate-api-key`
   - `api-gateway`
   - `send-weekly-digest`
3. Verify startup ownership permissions on `startup_roles`.
4. Verify `role_views` inserts from public startup pages.
5. Verify `get_feed_page` with anon, authenticated, and following modes.
6. Add notification triggers for follows, comments, reactions, messages, role updates, and live reminders.
7. Add admin moderation and reporting tools after core readiness is stable.

## Commands

```powershell
Set-Location -LiteralPath "C:\Users\saisu\OneDrive\Pictures\course\galaxy-ground-space-hub-main(2)\galaxy-ground-space-hub-main(d2)"
npm.cmd run test
npm.cmd run build
npm.cmd run dev -- --host=127.0.0.1 --port=8081
```
