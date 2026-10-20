# Database Drift Report - 2026-10-20

## Evidence

`supabase gen types typescript --project-id lmdswaagcdxulcczkqmu --schema public` completed successfully. The generated file proves the live database has substantially more public schema than the migration history in this copy can reproduce.

## Confirmed live objects absent from the local generated types before regeneration

The regenerated schema includes `connection_requests`, `message_threads`, `messages`, `live_events`, `live_event_reminders`, `startup_roles`, `featured_content`, `profile_badge_awards`, `vendors`, `vendor_startup_links`, `api_keys`, `api_usage_log`, `apod_cache`, `launch_status_log`, `role_views`, `get_feed_page`, profile messaging preferences, and startup ownership fields.

## Confirmed frontend/live-schema mismatches

- The frontend references `moderation_reports` and `badge_awards`; neither appeared in the regenerated live type output.
- The frontend queries fields that differ from the live schema, including `connection_requests.sender_id` and `startup_posts.related_launch_id`.
- Several UI model types no longer match live columns, including featured content, APOD cache, role types, and profile badge joins.

## Required human action

Export the live schema and migration history into a disposable branch, then reconcile it with `supabase/migrations/` before applying any new migration. Do not use this report as permission to apply destructive schema changes.

Suggested commands after authenticating the Supabase CLI:

```powershell
supabase link --project-ref lmdswaagcdxulcczkqmu
supabase db pull
supabase migration list
supabase gen types typescript --project-id lmdswaagcdxulcczkqmu --schema public > src/integrations/supabase/types.ts
```
