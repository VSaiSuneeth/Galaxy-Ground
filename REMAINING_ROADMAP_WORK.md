# Galaxy Ground Remaining Roadmap Work

This file separates completed work from remaining work so future development can continue without re-auditing the whole project.

## What Is Completed Or Mostly Completed

### Frontend Phase 1

- Explore page upgraded into a topic intelligence UI.
- Learning page upgraded into a structured learning hub UI.
- Launch detail page upgraded into a mission-style page.
- Launch calendar and countdown widget exist.
- Orbits/Communities pages exist and were preserved.
- Right sidebar has trending topics, launch widget, quick follow, communities, and startup sections.

### Feed And Social Stability

- `usePosts.ts` infinite query crash was fixed earlier.
- Shared post rendering is safer.
- Bookmarks include `post_source`.
- Trending hashtag counts work from database hashtag arrays.
- Read More / Show Less exists in `PostCard.tsx`.
- Media rendering and lightbox exist.
- Follow system supports users, startups, and themed accounts.

### Generated Content Work

- `fetch-startup-updates` was updated for richer posts, validation, hashtags, images, and clearer counters.
- `fetch-themed-posts` was rebuilt with provider-safe model config, richer prompts, validation, dedupe, and image fallback.
- `contentSanitizer.ts` now includes generated-post validation helpers.
- `supabase/post_generation_ops.sql` was added for diagnostics, RLS/storage fixes, duplicate checks, and cron templates.
- Both Edge Functions were deployed successfully by the user.
- SQL audit showed no generated posts in the last 30 days because scheduled jobs were missing.

## What Still Needs Confirmation

These items may already be working after the latest SQL steps, but they need confirmation from Supabase results and website checks.

1. Confirm scheduled jobs now exist in `cron.job`.
2. Confirm manual `net.http_post` calls return `200`, not timeout/401/500.
3. Confirm function logs show successful `inserted` counts.
4. Confirm new `startup_posts` and `themed_posts` appear with current timestamps.
5. Confirm generated posts have:
   - content length above 500
   - visible hashtag line
   - populated `hashtags`
   - image URL when available
6. Confirm homepage feed displays new generated posts.
7. Confirm Trending Topics counts update after new hashtags.
8. Confirm bookmark save still works after RLS fixes.

## Remaining Backend Work

### Explore Backend

Not implemented yet:

- `topics`
- `topic_sections`
- `topic_facts`
- `topic_timeline_events`
- `topic_sources`
- `topic_updates`
- `topic_discoveries`
- scheduled topic refresh
- source trust scoring
- official source ingestion

Next task:

- Convert `ExplorePage.tsx` from local topic data to Supabase-backed topic sections with safe fallback data.

### Launchpad Backend

Not implemented yet:

- `launches`
- `launch_updates`
- `launch_sources`
- `launch_related_posts`
- `launch_entities`
- official launch schedule sync
- mission status history
- mission-to-startup matching

Next task:

- Add launch tables and update `useLaunches.ts` to read Supabase data first, then fallback to `src/lib/launches.ts`.

### Learning Backend

Not implemented yet:

- `courses`
- `course_modules`
- `course_lessons`
- `course_enrollments`
- `course_progress`
- `course_reviews`
- `instructors`
- `course_purchases`
- `certificates`

Next task:

- Add free course/learning-path tables first. Leave payments for later.

### Communities / Orbits Backend

Partially implemented only.

Missing:

- `communities`
- `community_memberships`
- `community_moderators`
- `community_reports`
- join/leave orbit flow
- member counts from real membership table
- moderation queues
- featured/pinned posts

Next task:

- Add real community tables while preserving current `/communities` and `/community/:slug` UI.

### Startup Ownership

Not implemented.

Missing:

- startup claim form
- `startup_claims`
- `startup_owners`
- approval workflow
- founder edit permissions

Next task:

- Add claim request table and frontend form on startup profile pages.

### Company Tagging

Not implemented for user posts.

Missing:

- startup/company selector in `CreatePost.tsx`
- `post_startup_tags` or similar table
- tagged company badges on `PostCard`
- feed/search filtering by tagged startup

Next task:

- Add tagging for user posts without changing generated startup posts.

### Jobs

Not implemented.

Missing:

- job board route
- `jobs`
- `job_applications`
- employer/startup posting permissions
- application status workflow

Next task:

- Do not start until startup ownership is implemented.

### Premium Intel

Not implemented.

Missing:

- premium subscriptions
- access control
- premium intel feed
- gated analytics
- payment provider

Next task:

- Defer until normal Intel/startup data is reliable.

### Advanced Analytics

Not implemented.

Missing:

- analytics events
- startup dashboards
- creator dashboards
- course analytics
- post performance tracking

Next task:

- Add simple event tracking after core content systems stabilize.

### Funding Alerts

Not implemented as a dedicated feature.

Missing:

- funding alert detection
- funding alert table
- funding notifications
- funding filters on startup profiles

Next task:

- Add source classification to generated startup posts, then classify funding posts.

### Newsletter

Not implemented.

Missing:

- newsletter subscribers
- digest generation
- email provider integration
- user preferences

Next task:

- Defer until generated content quality is stable.

### Onboarding

Partially implemented.

Exists:

- `profiles.interests`
- profile interest editing

Missing:

- onboarding route after signup
- guided interest selection
- follow suggestions after signup
- feed personalization based on interests

Next task:

- Add `/onboarding` and route new users there after signup.

## Highest Priority Next Work

1. Confirm Supabase function schedules and new generated posts.
2. Check function logs for `inserted`, `lowQuality`, `aiRewriteFailed`, and `imageGenerated`.
3. Verify homepage shows new generated posts.
4. Add launch tables and Supabase-first launch hook.
5. Add Explore topic tables and Supabase-first topic hook.
6. Add real community membership.
7. Add startup claim/ownership.
8. Add company tagging on user posts.
9. Add onboarding interests flow.
10. Add funding alert classification.

## Future Verification Commands

Local app:

```powershell
Set-Location -LiteralPath "C:\Users\saisu\OneDrive\Pictures\course\galaxy-ground-space-hub-main(2)\galaxy-ground-space-hub-main(d2)"
npm.cmd run build
npm.cmd run dev -- --host=127.0.0.1 --port=8081
```

Deploy functions:

```powershell
supabase functions deploy fetch-startup-updates
supabase functions deploy fetch-themed-posts
```

Supabase SQL helper:

```text
supabase/post_generation_ops.sql
```

## Notes For Future Codex Work

- Do not convert this app to Next.js.
- Do not create `src/app`.
- Preserve Vite + React routing in `src/App.tsx`.
- Keep changes incremental.
- Prefer Supabase-backed data with local fallback when migrating static pages.
- Do not remove existing working pages while adding backend support.
