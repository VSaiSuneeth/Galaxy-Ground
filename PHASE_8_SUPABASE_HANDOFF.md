# Phase 8 Supabase Handoff - Gated Connect & Messaging

Please apply the Part 2 backend migration and deploy the supporting Edge Functions for the Galaxy Ground gated messaging feature.

## Files to apply

1. SQL migration:
   `supabase/migrations/20260702160000_master_blueprint_part2.sql`

2. Edge Functions:
   `supabase/functions/accept-connection/index.ts`
   `supabase/functions/block-user/index.ts`

## Required backend outcome

The frontend now expects these Phase 8 messaging capabilities:

- `profiles` has messaging/privacy fields:
  - `messaging_open_to`
  - `messaging_allowed_categories`
  - `show_online_status`
  - `last_seen_at`
  - `require_complete_profile_to_message`
  - `badges`
- New tables exist with RLS enabled:
  - `connection_requests`
  - `message_threads`
  - `messages`
  - `user_blocks`
- RPCs exist:
  - `accept_connection_rpc(p_request_id uuid)`
  - `block_user_rpc(p_blocked_id uuid)`
  - `get_thread_for_users(user_a uuid, user_b uuid)`
  - `mark_thread_read(p_thread_id uuid, p_user_id uuid)`
- `public.messages` is added to the `supabase_realtime` publication for chat insert subscriptions.
- Edge Functions are deployed with access to:
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`

## Deployment commands

```bash
supabase db push
supabase functions deploy accept-connection
supabase functions deploy block-user
```

## Validation checklist

- A user can insert a pending `connection_requests` row only when the recipient allows that request and both users are not blocked.
- The recipient can accept a request; this creates or reuses a `message_threads` row and writes the thread id back to the request.
- Only accepted thread participants can read and insert messages.
- `mark_thread_read` clears the correct participant unread counter and stamps unread messages as read.
- `block_user_rpc` creates a block row and changes connection request status to `blocked`.
- Realtime `postgres_changes` events fire for new rows in `public.messages`.

Note: this migration also includes backend foundations for the later Part 2 phases (`live_events`, `live_event_reminders`, `startup_roles`, `featured_content`, and `profile_badge_awards`). The current frontend work only starts Phase 8/Gated Messaging; the Live Hub and Opportunity UI phases remain scheduled for later.
