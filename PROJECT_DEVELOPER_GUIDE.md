# Galaxy Ground Developer Guide

This guide explains the current Galaxy Ground project for a developer who knows React and Supabase but has not worked in this codebase before.

Important local project path:

```text
C:\Users\saisu\OneDrive\Pictures\course\galaxy-ground-space-hub-main(2)\galaxy-ground-space-hub-main(d2)
```

The parent folder is only a wrapper. The real Vite app lives inside `galaxy-ground-space-hub-main(d2)`.

## Current Status

Galaxy Ground is a Vite + React + Supabase space community app. It currently supports:

- User-authored posts.
- Generated startup posts.
- Generated themed account posts.
- Unified home feed.
- Startup directory and startup profiles.
- Topic/community pages called Orbits.
- Search across users, startups, creators, posts, and hashtags.
- Bookmarks.
- Likes/reactions.
- Comments.
- Notifications.
- Trending hashtags.
- Launch calendar and launch detail pages.
- Explore topic intelligence UI.
- Learning hub UI.

The project has recently been updated in these areas:

- Explore was upgraded from simple static cards to a topic intelligence page.
- Learning was upgraded into a structured free-learning hub.
- Launch detail pages were upgraded into mission-style pages with timeline and update sections.
- Generated post Edge Functions were updated for richer output, stronger validation, hashtags, image fallback, and clearer logs.
- A Supabase SQL operations helper was added at `supabase/post_generation_ops.sql`.

Important limitation:

- Explore, Learning, and Launchpad now have stronger frontend structures, but much of the live backend data model for those pages is still future work.
- Generated posting depends on deployed Edge Functions, Supabase secrets, and scheduled jobs actually running in Supabase.

## Tech Stack

- React 18
- Vite
- TypeScript
- Tailwind CSS
- shadcn/ui
- TanStack Query
- React Router
- Supabase Auth
- Supabase Postgres
- Supabase Storage
- Supabase Realtime
- Supabase Edge Functions

## Main Commands

Run locally:

```powershell
Set-Location -LiteralPath "C:\Users\saisu\OneDrive\Pictures\course\galaxy-ground-space-hub-main(2)\galaxy-ground-space-hub-main(d2)"
npm.cmd run dev -- --host=127.0.0.1 --port=8081
```

Build:

```powershell
Set-Location -LiteralPath "C:\Users\saisu\OneDrive\Pictures\course\galaxy-ground-space-hub-main(2)\galaxy-ground-space-hub-main(d2)"
npm.cmd run build
```

Deploy Edge Functions:

```powershell
Set-Location -LiteralPath "C:\Users\saisu\OneDrive\Pictures\course\galaxy-ground-space-hub-main(2)\galaxy-ground-space-hub-main(d2)"
supabase functions deploy fetch-startup-updates
supabase functions deploy fetch-themed-posts
```

## High-Level App Flow

```text
src/main.tsx
  -> src/App.tsx
  -> QueryClientProvider
  -> BrowserRouter
  -> AuthProvider
  -> AppLayout
  -> route page
  -> hooks fetch Supabase data
  -> components render UI
```

Supabase browser access starts in:

```text
src/integrations/supabase/client.ts
```

Environment variables:

```text
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
```

## Routing

Routes live in `src/App.tsx`.

Current major routes:

```text
/auth
/
/explore
/startups
/startup/:slug
/communities
/community/:slug
/missions
/launch/:slug
/hashtag/:tag
/learning
/profile
/u/:userId
/creator/:handle
/post/:id
/bookmarks
```

There are currently no full routes for:

```text
/jobs
/admin
/onboarding
/intel
/newsletter
/startup/:slug/claim
/startup/:slug/analytics
```

## Folder Structure

### Frontend

```text
src/
  components/
  components/layout/
  hooks/
  integrations/supabase/
  lib/
  pages/
  types/
```

Important frontend files:

```text
src/App.tsx
src/pages/HomeFeed.tsx
src/pages/ExplorePage.tsx
src/pages/LearningPage.tsx
src/pages/MissionsPage.tsx
src/pages/LaunchDetailPage.tsx
src/pages/StartupsPage.tsx
src/pages/StartupDetailPage.tsx
src/pages/CommunitiesPage.tsx
src/pages/CommunityDetailPage.tsx
src/components/PostCard.tsx
src/components/CreatePost.tsx
src/components/CommentsSection.tsx
src/components/layout/RightSidebar.tsx
src/components/layout/SearchBar.tsx
src/hooks/usePosts.ts
src/hooks/useBookmarks.ts
src/hooks/useTrendingHashtags.ts
src/hooks/useFollow.ts
src/hooks/useStartups.ts
src/hooks/useCommunities.ts
```

### Supabase

```text
supabase/
  functions/
  functions/_shared/
  migrations/
  fix_remote_runtime.sql
  post_generation_ops.sql
```

Important backend files:

```text
supabase/functions/fetch-startup-updates/index.ts
supabase/functions/fetch-themed-posts/index.ts
supabase/functions/_shared/contentSanitizer.ts
supabase/post_generation_ops.sql
```

## Home Feed Flow

The home feed is a unified feed of user posts, startup posts, and themed account posts.

Flow:

```text
HomeFeed.tsx
  -> usePosts.ts
  -> posts
  -> startup_posts
  -> themed_posts
  -> profiles/startups/themed_accounts
  -> PostCard.tsx
```

Feed modes:

```text
For You
Following
Recent
```

Important note:

- `usePosts.ts` has separate handling for infinite feed queries and normal queries.
- Do not share incompatible React Query cache shapes between infinite and normal queries.

## Post Rendering Flow

`PostCard.tsx` renders all three post sources:

```text
user
startup
themed
```

PostCard responsibilities:

- Render author info.
- Render source badge.
- Render content.
- Render media.
- Render hashtags.
- Render Read More / Show Less for long posts.
- Handle likes/reactions.
- Handle comments.
- Handle bookmarks.
- Link to detail pages.

User posts use:

```text
posts
likes
comments
```

Startup and themed posts use:

```text
startup_posts
themed_posts
aggregate_reactions
aggregate_comments
```

## Create Post Flow

File:

```text
src/components/CreatePost.tsx
```

Flow:

```text
User writes post
  -> optional media upload to post-media
  -> hashtags extracted
  -> insert into posts
  -> feed queries invalidated
```

Storage bucket:

```text
post-media
```

## Bookmarks Flow

Files:

```text
src/hooks/useBookmarks.ts
src/pages/BookmarksPage.tsx
src/components/PostCard.tsx
```

Table:

```text
bookmarks
```

Required fields:

```text
user_id
post_id
post_source
created_at
```

Supported `post_source` values:

```text
user
startup
themed
```

Important:

- Bookmark inserts must always include `post_source`.
- The SQL repair file and `supabase/post_generation_ops.sql` both include bookmark schema/policy repair.

## Trending Topics Flow

Files:

```text
src/hooks/useTrendingHashtags.ts
src/components/layout/RightSidebar.tsx
src/pages/HashtagPage.tsx
```

Tables/columns:

```text
posts.hashtags
startup_posts.hashtags
themed_posts.hashtags
```

Behavior:

- Counts hashtags across all three post sources.
- Deduplicates repeated hashtags inside the same post.
- Ignores invalid hashtags.
- Displays hashtag counts in the right sidebar.
- Clicking opens `/hashtag/:tag`.

## Search Flow

Files:

```text
src/components/layout/TopNav.tsx
src/components/layout/SearchBar.tsx
```

Search reads from:

```text
profiles
startups
themed_accounts
posts
startup_posts
themed_posts
hashtags
```

Search results can navigate to:

```text
/u/:userId
/startup/:slug
/creator/:handle
/post/:id
/hashtag/:tag
```

## Startup Directory Flow

Files:

```text
src/pages/StartupsPage.tsx
src/pages/StartupDetailPage.tsx
src/hooks/useStartups.ts
src/components/FollowButton.tsx
```

Tables:

```text
startups
startup_posts
follows
```

Flow:

```text
/startups
  -> useStartups()
  -> startup cards

/startup/:slug
  -> useStartup(slug)
  -> useStartupPosts(startup.id)
  -> startup profile and startup posts
```

Current status:

- Startup directory is functional.
- Startup profiles are functional.
- Startup follow is functional.
- Startup claim/ownership is not implemented yet.
- Advanced startup analytics are not implemented yet.

## Follow System

Files:

```text
src/hooks/useFollow.ts
src/components/FollowButton.tsx
```

Table:

```text
follows
```

Supported follow targets:

```text
user
startup
themed
```

Follow data influences:

- Following feed.
- For You feed boosting.
- Startup/themed notifications.
- Quick Follow widget.

## Communities / Orbits Flow

Files:

```text
src/lib/communities.ts
src/hooks/useCommunities.ts
src/pages/CommunitiesPage.tsx
src/pages/CommunityDetailPage.tsx
src/components/CreatePost.tsx
```

Routes:

```text
/communities
/community/:slug
```

Current implementation:

- Community metadata is mostly local/static.
- Community stats are derived from posts, startups, themed accounts, and hashtags.
- User posts can store a community/category value.
- Community detail pages show related posts/accounts/startups.

Important limitation:

- There is no real `communities` table yet.
- There is no community membership table.
- There is no join/leave community flow.
- There is no moderation queue or community admin workflow.

## Explore Flow

File:

```text
src/pages/ExplorePage.tsx
```

Current implementation:

- Explore is now a topic intelligence UI.
- It shows topic overview, facts, timeline, research focus, discoveries, source/freshness labels, and hashtag links.
- Current topic data is still local/static in the frontend.

Current limitation:

- There is no Supabase topic architecture yet.
- The page is not yet backed by live topic updates, official sources, or scheduled topic refreshes.

Future backend tables:

```text
topics
topic_sections
topic_facts
topic_timeline_events
topic_sources
topic_updates
topic_discoveries
```

## Launchpad / Missions Flow

Files:

```text
src/lib/launches.ts
src/hooks/useLaunches.ts
src/components/LaunchCountdownWidget.tsx
src/pages/MissionsPage.tsx
src/pages/LaunchDetailPage.tsx
src/components/layout/RightSidebar.tsx
```

Routes:

```text
/missions
/launch/:slug
```

Current implementation:

- Launch calendar UI exists.
- Countdown widget exists.
- Launch detail page now includes mission overview, status explanation, timeline, updates/related posts area, and backend readiness note.
- Launch data is still static in `src/lib/launches.ts`.

Current limitation:

- There is no `launches` table yet.
- There are no launch update/source tables.
- There is no automated official launch schedule sync.
- Related startup posts are not truly linked to missions yet.

Future backend tables:

```text
launches
launch_updates
launch_sources
launch_related_posts
launch_entities
```

## Learning Flow

File:

```text
src/pages/LearningPage.tsx
```

Current implementation:

- Learning is now a structured free-learning hub.
- It has categories, learning paths, modules, curated video placeholders, and future premium-course labels.
- It is frontend/static for now.

Current limitation:

- No course tables exist yet.
- No enrollments.
- No progress tracking.
- No instructors.
- No purchases.
- No certificates.

Future backend tables:

```text
courses
course_modules
course_lessons
course_enrollments
course_progress
course_reviews
instructors
course_purchases
certificates
```

## Generated Content Flow

Files:

```text
supabase/functions/fetch-startup-updates/index.ts
supabase/functions/fetch-themed-posts/index.ts
supabase/functions/_shared/contentSanitizer.ts
supabase/post_generation_ops.sql
```

Startup generator:

```text
fetch-startup-updates
```

Themed generator:

```text
fetch-themed-posts
```

Current generated post requirements:

- 2-4 readable paragraphs.
- No headline-only posts.
- No raw JSON.
- No HTML/code fragments.
- Complete sentences.
- Visible hashtag line.
- Hashtags array stored in the database.
- Source media used when valid.
- AI fallback image attempted when source image is missing.
- Duplicate and near-duplicate content rejected.
- Structured counters returned from functions.

Function response counters include:

```text
inserted
skipped
failed
duplicates
lowQuality
imageGenerated
aiRewriteFailed
```

Important Supabase secrets:

```text
OPENAI_API_KEY
AI_CHAT_COMPLETIONS_URL
OPENAI_MODEL
AI_IMAGE_GENERATIONS_URL
OPENAI_IMAGE_MODEL
FIRECRAWL_API_KEY
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
```

Important operational note:

- Edge Functions can be deployed successfully but still produce no posts if no schedules exist.
- Schedules are checked/fixed using `supabase/post_generation_ops.sql`.
- The project was found to have no generated posts in the last 30 days because scheduled jobs were missing.

## Supabase SQL Operations

Use this file for generated-post diagnostics and repair:

```text
supabase/post_generation_ops.sql
```

It includes:

- Recent generated post counts.
- Missing hashtag/image checks.
- Short content checks.
- Duplicate source URL checks.
- RLS policy repair.
- Bookmark schema repair.
- Aggregate reaction repair.
- `post-media` storage bucket repair.
- Duplicate protection indexes.
- pg_cron scheduling templates.

## Notifications Flow

Files:

```text
src/hooks/useNotifications.ts
src/components/NotificationsBell.tsx
```

Table:

```text
notifications
```

Current implementation:

- Notification bell exists.
- Unread count exists.
- Realtime refresh is used.
- New followed-account posts can create notifications.

Current limitation:

- Notifications are not yet complete for every interaction type.
- Comment replies, community events, funding alerts, and learning alerts are future work.

## Media Flow

Frontend media files:

```text
src/components/CreatePost.tsx
src/components/PostCard.tsx
src/components/MediaLightbox.tsx
```

Storage:

```text
post-media
```

Generated content can use:

- Source image URL if valid.
- Generated image URL.
- Uploaded generated image in `post-media` if provider returns base64.

## Feature Completion Snapshot

Fully or mostly implemented:

- Core feed.
- User posts.
- Startup directory.
- Startup profiles.
- Startup/themed post rendering.
- Search.
- Bookmarks.
- Trending hashtags.
- Follow users/startups/themed accounts.
- Basic notifications.
- Read More / Show Less.
- Media rendering.

Partially implemented:

- Explore topic intelligence.
- Launchpad / mission pages.
- Learning hub.
- Communities / Orbits.
- Personalized feed.
- Command Center/right sidebar.
- Generated content scheduling/operations.

Not implemented yet:

- Claim startup profile.
- Founder ownership workflow.
- Real community membership.
- Community moderation.
- Job board.
- Job applications.
- Premium Intel.
- Advanced analytics.
- Funding alerts.
- Newsletter.
- Full onboarding.
- Expert verification workflow.
- Paid learning marketplace.

## Roadmap Guidance

Phase 1 frontend improvements:

- Explore: UI upgraded, backend still missing.
- Launchpad: UI upgraded, backend still missing.
- Learning: UI upgraded, backend still missing.
- Orbits: existing page preserved; only light improvements should be added.

Phase 2 backend expansion:

- Add topic data model.
- Add launch data model.
- Add learning/course data model.
- Add mission/startup relationship data.
- Add real community tables.

Phase 3 monetization and creator systems:

- Paid courses.
- Instructor onboarding.
- Course purchases.
- Certificates.
- Creator analytics.
- Premium Intel.

## Developer Rules

When changing feed behavior:

- Start with `src/hooks/usePosts.ts`.
- Check `PostCard.tsx`.
- Keep normal and infinite query cache shapes separate.

When changing generated content:

- Start with `supabase/functions/fetch-startup-updates/index.ts`.
- Then check `supabase/functions/fetch-themed-posts/index.ts`.
- Then check `supabase/functions/_shared/contentSanitizer.ts`.
- Validate before insert.
- Reject bad content instead of publishing it.

When changing bookmarks:

- Always include `post_source`.
- Check `src/hooks/useBookmarks.ts`.
- Check `bookmarks` RLS.

When changing routes:

- Update `src/App.tsx`.
- Confirm sidebar links in `LeftSidebar.tsx`.
- Confirm route page exists in `src/pages/`.

When changing Supabase schema:

- Prefer additive migrations.
- Do not break existing frontend queries.
- Regenerate/check TypeScript types when possible.
- Verify RLS for anon/authenticated behavior.

## Local Verification Checklist

Run:

```powershell
npm.cmd run build
npm.cmd run dev -- --host=127.0.0.1 --port=8081
```

Check:

```text
/
/explore
/learning
/missions
/launch/isro-gaganyaan-g1
/startups
/communities
/bookmarks
/profile
```

Browser console should not show:

- React render crashes.
- `Cannot read properties of undefined`.
- Bookmark `400` caused by missing `post_source`.
- Bookmark `403` caused by bad RLS.
- Reaction constraint errors.

## Production/Supabase Verification Checklist

In Supabase:

- Confirm both Edge Functions are deployed.
- Confirm Edge Function secrets exist.
- Confirm `post-media` bucket exists and is public-read.
- Confirm cron schedules exist.
- Manually invoke both generators.
- Check function logs.
- Check `startup_posts` and `themed_posts` latest rows.
- Confirm new posts have content length above 500, hashtags, and image URLs when possible.

Useful SQL:

```text
supabase/post_generation_ops.sql
```
