# Supabase Production Setup & Debugging

Project ref: **lmdswaagcdxulcczkqmu**  
Dashboard: https://supabase.com/dashboard/project/lmdswaagcdxulcczkqmu

## 1. Environment variables

In `.env` (client-side):

```env
VITE_SUPABASE_URL=https://lmdswaagcdxulcczkqmu.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
# Legacy alias also supported:
# VITE_SUPABASE_ANON_KEY=eyJ...
```

Get keys from **Settings → API Keys** (publishable) or **Legacy API Keys** (anon JWT).

## 2. Apply all migrations

From this folder:

```bash
npx supabase login
npx supabase link --project-ref lmdswaagcdxulcczkqmu
npx supabase db push
```

Or paste SQL from `supabase/migrations/*.sql` into the SQL Editor (in order).

## 3. Verify database (SQL Editor)

```sql
select 'profiles' as t, count(*) from profiles
union all select 'posts', count(*) from posts
union all select 'startup_posts', count(*) from startup_posts
union all select 'themed_posts', count(*) from themed_posts
union all select 'startups', count(*) from startups
union all select 'themed_accounts', count(*) from themed_accounts
union all select 'comments', count(*) from comments
union all select 'likes', count(*) from likes
union all select 'bookmarks', count(*) from bookmarks
union all select 'follows', count(*) from follows
union all select 'notifications', count(*) from notifications
union all select 'aggregate_reactions', count(*) from aggregate_reactions;
```

**Expected after migrations:** `startups` ~25 rows (seeded). `startup_posts` / `themed_posts` may be 0 until edge functions run.

## 4. Auth checklist

| Setting | Recommendation |
|---------|----------------|
| Email confirmations | **Off** for local dev, or handle “check email” UX |
| Site URL | `http://localhost:8080` |
| Redirect URLs | `http://localhost:8080/**` |

Verify trigger:

```sql
select tgname from pg_trigger where tgname = 'on_auth_user_created';
```

## 5. Storage

Bucket `post-media` must exist (public). Created in migration `20260421082820_...`.

## 6. Run diagnostics locally

```bash
npm run diagnose
```

Opens row counts and signup probe against your live project (requires network).

## 7. In-app health banner

When the feed is empty or Supabase fails, a banner appears at the top of the main layout with counts and hints.

## Common root causes

| Symptom | Cause |
|---------|--------|
| Empty feed, no errors | Migrations not applied; no user posts; edge functions not run |
| Login works but no profile | `handle_new_user` trigger missing — run `20260525130000_ensure_runtime_prerequisites.sql` |
| Signup error / duplicate | Old app inserted into `profiles` manually — fixed in frontend |
| All requests fail | Wrong URL/key, paused project, or DNS/network |
| 401 on writes | Not signed in or email not confirmed |
| RLS errors | Policies missing — re-run migrations |
