# Galaxy Ground

Galaxy Ground is a Vite + React + Supabase space community app. It combines a social feed, startup profiles, communities, launch tracking, learning paths, messaging, Intel views, and developer API access.

## Current Status

| Area | Status |
|------|--------|
| Foundation and auth stability | Done |
| Feed rendering, reactions, bookmarks | Done |
| Profile, search, onboarding | Done |
| Explore intelligence | Done |
| Launchpad and launch details | Done |
| Learning Hub | Done |
| Launch Readiness | Frontend/support SQL ready; remote Supabase verification pending |

## Main Guides

- `SPRINT_PROGRESS.md` - user-facing phase status, what to test, and what is coming.
- `IMPLEMENTATION_GUIDE.md` - internal implementation log, touched files, backend handoff, and test checklist.
- `GALAXY_GROUND_PROJECT_BLUEPRINT.md` - product-level explanation of the whole website.
- `COMPLETE_WEBSITE_AUDIT_2026-06-27.md` - older audit reference.

## Key Routes

- `/` - home feed
- `/startups` - startup directory
- `/startup/:slug` - startup profile
- `/startup/:slug/manage` - claimed startup management
- `/communities` - community directory
- `/community/:slug` - community feed
- `/explore` and `/explore/:slug` - topic intelligence
- `/missions` and `/launch/:slug` - launchpad
- `/learning` and `/learning/:slug` - learning paths
- `/profile` and `/u/:userId` - profiles
- `/bookmarks` - saved posts
- `/messages` - messaging
- `/settings/messaging` - privacy, weekly digest, developer access
- `/docs/api` - OrbitalStack API docs
- `/admin/readiness` - admin production readiness checks

## Local Development

```powershell
Set-Location -LiteralPath "C:\Users\saisu\OneDrive\Pictures\course\galaxy-ground-space-hub-main(2)\galaxy-ground-space-hub-main(d2)"
npm.cmd install
npm.cmd run dev -- --host=127.0.0.1 --port=8081
```

Open:

```text
http://127.0.0.1:8081
```

## Verification Commands

```powershell
Set-Location -LiteralPath "C:\Users\saisu\OneDrive\Pictures\course\galaxy-ground-space-hub-main(2)\galaxy-ground-space-hub-main(d2)"
npm.cmd run test
npm.cmd run build
```

## Supabase Work Still Needed

Apply and verify:

- `supabase/migrations/20260709000001_get_feed_page_function.sql`
- `supabase/migrations/20260710000001_phase7_support_schema.sql`

Deploy and verify:

- `supabase/functions/generate-api-key`
- `supabase/functions/api-gateway`
- `supabase/functions/send-weekly-digest`

See `IMPLEMENTATION_GUIDE.md` for the exact copy-paste message for the Supabase AI tool.
