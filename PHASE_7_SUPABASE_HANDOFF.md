# Phase 7 Supabase Handoff

Copy this message to the AI/tool that manages the Supabase project.

---

Please complete the Phase 7 backend launch-readiness work for Galaxy Ground.

Project app expectation:

- Frontend route `/admin/readiness` now probes:
  - `public.has_role(auth.uid(), 'admin')`
  - public table health/counts
  - optional RPC `public.get_feed_page(p_limit integer, p_cursor text)`
- Existing frontend feed still has fallback query logic, but Phase 7 should introduce the RPC backend for a single fast feed endpoint.
- Existing notification UI reads from `public.notifications` and listens for realtime inserts.

## Required Work

### 1. Verify admin role foundation

Confirm these exist and work:

- enum `public.app_role` with values `admin`, `moderator`, `user`
- table `public.user_roles`
- function `public.has_role(_user_id uuid, _role app_role) returns boolean`
- RLS allowing users to read their own role
- admin policy allowing admins to manage roles

Return proof:

```sql
select public.has_role(auth.uid(), 'admin'::public.app_role);
```

Also provide the SQL needed to grant my user admin role if not already admin. Do not run role grants without confirmation.

### 2. Create/verify `public.get_feed_page`

Create or replace:

```sql
public.get_feed_page(p_limit integer default 20, p_cursor text default null)
```

Expected frontend call:

```ts
supabase.rpc("get_feed_page", { p_limit: 1, p_cursor: null })
```

Expected behavior:

- Returns a paginated unified feed.
- Includes rows from:
  - `public.posts`
  - `public.startup_posts`
  - `public.themed_posts`
- Uses stable ordering by publish/create timestamp descending.
- Supports cursor pagination.
- Never returns null pages.
- For each item, return enough fields for the existing frontend feed model:
  - `id`
  - `source` (`user`, `startup`, `themed`)
  - `target_id`
  - `content`
  - `media_url`
  - `media_type`
  - `community`
  - `hashtags`
  - `created_at`
  - `source_url`
  - `startup_id`
  - `startup_slug`
  - `startup_name`
  - `account_id`
  - `themed_handle`
  - `author`
  - `likes_count`
  - `comments_count`
  - `user_has_liked`
  - `user_has_bookmarked`
  - `reaction_type`
  - `reaction_summary`
  - `next_cursor`
- The RPC must be safe for anonymous users, returning public feed items.
- For authenticated users, include user-specific like/bookmark/reaction state.
- It must not expose private profile/auth data.

Verification:

```sql
select *
from public.get_feed_page(5, null)
limit 5;
```

Then verify through REST/RPC that the response is 200 and not empty.

### 3. Notification triggers

Verify or create notification insert triggers for:

- comment on user post
- comment on startup/themed aggregate post where a follower should be notified if appropriate
- like/reaction on user post
- aggregate reaction on startup/themed post
- new follower
- new startup/themed post for followers of that startup/themed account

Rules:

- Do not notify a user about their own action.
- Insert into `public.notifications`.
- Keep notification rows small:
  - `user_id`
  - `kind`
  - `account_type`
  - `account_id`
  - `account_name`
  - `account_handle`
  - `post_type`
  - `post_id`
  - `title`
  - `preview`
  - `image_url`
  - `link`
  - `read`
  - `created_at`
- Ensure realtime is enabled for `notifications`.

Verification:

```sql
select count(*) from public.notifications;
select * from public.notifications order by created_at desc limit 10;
```

### 4. Rate limiting / abuse protection

Add backend protection for:

- user post creation
- comments
- likes/reactions
- bookmarks

Preferred approach:

- Postgres function/policy or trigger that prevents excessive inserts per user per short window.
- Return clear errors.
- Do not block service-role ingestion functions.

Suggested limits:

- posts: max 10 per hour per user
- comments: max 60 per hour per user
- reactions: max 200 per hour per user
- bookmarks: max 200 per hour per user

Return exact SQL and verification queries.

### 5. Admin moderation foundation

Add minimal admin-safe moderation support:

- table `public.moderation_events`
- admin-readable
- admin-insertable
- can record:
  - target type
  - target id
  - action
  - reason
  - actor admin id
  - created_at

Do not delete user content automatically.

### 6. Final verification report

Return:

- Whether `get_feed_page` exists and returns rows.
- Whether notifications triggers exist.
- Whether realtime publication includes `notifications`.
- Whether rate limits exist.
- Whether admin moderation table exists.
- Any SQL that failed and why.
- Any frontend changes needed, if discovered.

Important:

- Do not delete existing user/startup/themed posts.
- Preserve IDs, ownership fields, and existing content.
- Do not weaken RLS to allow public writes.
- Do not expose service-role secrets.
