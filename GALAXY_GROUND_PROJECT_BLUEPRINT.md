# Galaxy Ground Project Blueprint

This document explains Galaxy Ground end to end: what the website is, how it works for users, how the main systems connect, what is currently working, what still needs repair, and what features should be added next.

## 1. Product Vision

Galaxy Ground is a space-focused social and intelligence platform.

The website combines:

- A social feed for space updates.
- Startup profiles for space companies.
- Community pages, called Orbits, for topic-based discovery.
- Generated news/research posts from trusted space sources.
- User accounts, profiles, bookmarks, follows, likes, comments, and search.
- Launch, learning, and topic intelligence surfaces.

The goal is to make Galaxy Ground feel like a focused space-industry network where users can follow startups, creators, topics, and communities without needing to search across many news sites.

## 2. Explanation For A New Customer

Galaxy Ground helps you follow what is happening in space.

When you open the website, you see a live feed of space posts. Some posts come from real users. Some posts are generated from space news, startup announcements, research updates, and public source articles. The generated posts are rewritten into readable explanations with context, hashtags, and images.

If you are interested in a specific area, you can open a community such as Astrophotography, Rocket Engineering, Space Policy, Satellite Tech, Indian Space Program, or Astrobiology. Each community shows related posts and accounts.

If you want to follow space startups, you can open Launchpad. There you can browse companies such as Skyroot Aerospace, Pixxel, Agnikul Cosmos, Dhruva Space, GalaxEye, SatSure, and others. Each startup profile shows company details and related updates.

If you create an account, you can:

- Save posts to bookmarks.
- Follow startups, creators, users, and communities.
- Like/react to posts.
- Comment on posts.
- Open your profile.
- Search for users, startups, posts, creators, and hashtags.

The website is designed to turn scattered space information into one organized, readable, discovery-focused experience.

## 3. Current Website Structure

Main routes:

- `/`  
  Home feed with generated and user posts.

- `/explore`  
  Topic intelligence and search surface.

- `/startups`  
  Startup directory, also called Launchpad.

- `/startup/:slug`  
  Startup profile pages with startup information and posts.

- `/communities`  
  Community directory, also called Orbits.

- `/community/:slug`  
  Topic/community detail page with related accounts and posts.

- `/missions`  
  Launch calendar.

- `/launch/:slug`  
  Launch detail page.

- `/learning`  
  Learning/course-style content.

- `/profile`  
  Logged-in user profile.

- `/u/:userId`  
  Public user profile route.

- `/creator/:handle`  
  Themed/generated account profile route.

- `/post/:id`  
  Single post detail route.

- `/bookmarks`  
  Saved posts page.

- `/auth`  
  Login and account creation.

## 4. Main User Flow

### Guest User

1. Opens the website.
2. Sees the home feed and public navigation.
3. Can browse:
   - Home feed
   - Communities
   - Startup directory
   - Startup profiles
   - Search/explore
   - Launch calendar
   - Learning pages
4. Can read posts and open source links.
5. If they try to use private actions, they are asked to sign in.

### New User

1. Opens `/auth`.
2. Clicks `Create an account`.
3. Enters:
   - username
   - display name
   - email
   - password
4. Supabase Auth creates the account.
5. A database trigger should create the matching profile row.
6. If email confirmation is enabled, the user confirms email before full login.
7. After login, the user can use profile, bookmarks, follows, likes, comments, and personalized actions.

### Existing User

1. Opens `/auth`.
2. Enters email and password.
3. Supabase Auth returns a session.
4. The app stores the session through `AuthProvider`.
5. The user is redirected into the site.
6. Private features become available.

## 5. Content System

Galaxy Ground currently uses three main post types.

### User Posts

These are created by real logged-in users.

Expected features:

- Text content
- Hashtags
- Media upload
- Likes
- Comments
- Bookmarks

### Startup Posts

Stored in:

- `startup_posts`

Connected to:

- `startups`

These posts represent updates from startup/company sources.

Examples:

- Skyroot Aerospace launch updates
- Pixxel hyperspectral imaging updates
- Agnikul Cosmos propulsion updates
- Dhruva Space satellite updates

### Themed Posts

Stored in:

- `themed_posts`

Connected to:

- `themed_accounts`

These posts represent topic/community creator feeds such as:

- LunarFrames
- AstroBioCore
- ThrustLab
- CosmicVoices
- StarTrailVision

## 6. Generated Post Quality Standard

All generated startup and community posts should follow this standard:

- Not title-only.
- Not repeated title as body.
- Not filler text.
- 2-4 readable paragraphs.
- Around 120-190 words when generated.
- Proper sentence endings.
- Context and explanation, not just headline rewriting.
- 3-6 clean hashtags.
- Valid image if available.
- Fallback image if source media is missing.
- No raw JSON, HTML, code, or malformed generated output.
- No duplicate or near-duplicate spam.

Current frontend safety:

- Thin generated posts are enriched at render time.
- Placeholder filler text is detected.
- Startup profile pages now use the same shared post renderer as the feed.
- Long posts use `Read more` and `Show less`.

Current database status from the latest Supabase AI report:

- Startup placeholder rows repaired from 10 to 0.
- Themed placeholder rows repaired from 10 to 0.
- Pixxel row count confirmed as 13.
- Skyroot Aerospace row count confirmed as 19.

## 7. New Post Generation Flow

The backend uses Supabase Edge Functions:

- `fetch-startup-updates`
- `fetch-themed-posts`

Expected flow:

1. Scheduled job runs.
2. Function fetches external source/RSS/news/research items.
3. Function checks for duplicates.
4. Function generates or rewrites readable post content.
5. Function validates text quality.
6. Function attaches hashtags.
7. Function attaches source media or fallback image.
8. Function inserts into `startup_posts` or `themed_posts`.
9. Website reads from Supabase and displays the post.

Expected schedule:

- The SQL template indicates every 6 hours.
- If Supabase cron/schedules are active, new posts should appear after the next scheduled run.

Expected delay after news appears:

- Usually 0-6 hours after the source feed updates.
- Longer if the source RSS/feed delays publishing.
- Longer if Edge Functions fail, API keys expire, or cron is disabled.

Important requirement:

- Future posts must be generated with the same rich format, hashtags, images, and duplicate prevention.

## 8. Frontend Architecture

Framework:

- Vite + React

Important files:

- `src/App.tsx`  
  Defines routes.

- `src/components/layout/AppLayout.tsx`  
  Main app shell.

- `src/pages/HomeFeed.tsx`  
  Home feed page.

- `src/pages/StartupsPage.tsx`  
  Startup directory.

- `src/pages/StartupDetailPage.tsx`  
  Startup profile and startup post feed.

- `src/pages/CommunitiesPage.tsx`  
  Community directory.

- `src/pages/CommunityDetailPage.tsx`  
  Community detail and related posts.

- `src/pages/AuthPage.tsx`  
  Login and signup.

- `src/pages/ProfilePage.tsx`  
  Logged-in profile.

- `src/pages/BookmarksPage.tsx`  
  Saved posts.

- `src/components/PostCard.tsx`  
  Shared post rendering for feed-style posts.

- `src/hooks/usePosts.ts`  
  Main feed query and infinite query logic.

- `src/hooks/useStartups.ts`  
  Startup directory/profile queries.

- `src/hooks/useCommunities.ts`  
  Community data and posts.

- `src/hooks/useBookmarks.ts`  
  Bookmark fetch/save/remove logic.

- `src/hooks/useAuth.tsx`  
  Auth state and session management.

- `src/lib/generated-content-presentation.ts`  
  Runtime enrichment for weak generated posts.

- `src/lib/safe-data.ts`  
  Defensive data normalization helpers.

## 9. Backend And Database Architecture

Supabase provides:

- Authentication
- Database
- Row Level Security
- Storage
- Edge Functions
- Scheduled functions or cron

Important tables:

- `profiles`
- `posts`
- `startup_posts`
- `themed_posts`
- `startups`
- `themed_accounts`
- `bookmarks`
- `likes`
- `comments`
- `aggregate_reactions`
- `aggregate_comments`
- `follows`
- `community_memberships`
- `launches`
- `topics`
- `courses`

Important storage:

- `post-media`

Important backend functions:

- `fetch-startup-updates`
- `fetch-themed-posts`

## 10. What Is Currently Working

Confirmed from recent checks:

- Home feed renders.
- Community page `/community/astrophotography` renders.
- Hubble and Black Eye Galaxy posts no longer appear as title-only in the frontend.
- `Read more` works.
- `Show less` works after expansion.
- Skyroot startup profile renders with posts.
- Pixxel startup profile renders with 13 posts.
- Search finds Skyroot and related posts.
- Public routes do not show the earlier `undefined.length` crash.
- Build passes.
- Runtime smoke test passes.
- Supabase AI reports placeholder rows repaired in database.

## 11. What Still Needs Regular Verification

These areas may be working, but should be tested manually after each major change:

- Login with real existing user.
- New account creation.
- Email confirmation flow.
- Profile after login.
- Bookmark save/remove after login.
- Follow/unfollow after login.
- Like/reaction insert after login.
- Comments after login.
- Media upload after login.
- Scheduled post generation after 6+ hours.
- Supabase Edge Function logs.
- Supabase cron status.

## 12. Current Known Risks

### Scheduled generation may stop silently

If cron jobs are disabled, functions fail, or external APIs change, new posts may stop appearing.

Fix:

- Add a dashboard/admin check for last successful function run.
- Add failure logs and alerts.
- Add a visible “last generated” health metric.

### Database quality can drift again

Another tool or bad generation prompt can insert filler content.

Fix:

- Add DB-side validation.
- Reject placeholder strings.
- Reject content under a minimum quality threshold.
- Validate hashtags and media before insert.

### Some generated posts may still sound generic

Runtime fallback prevents ugly posts, but real stored content should be repaired at the source.

Fix:

- Improve Edge Function prompts.
- Add post-generation validation before insert.
- Store validation status and rejection reason.

### Auth-gated flows need real-session testing

Guest browser checks cannot fully verify profile/bookmark/follow actions.

Fix:

- Create a test account.
- Add Playwright authenticated test storage state.
- Test profile, bookmarks, follow, like, and comments automatically.

## 13. Things To Fix For Working Parts

These are improvements to areas that already work but need hardening.

1. Add automated authenticated tests.
2. Add post-generation health dashboard.
3. Add stronger media fallback validation.
4. Add duplicate-image detection.
5. Add canonical hashtag normalization.
6. Improve startup profile post layout consistency.
7. Add loading skeletons for startup/community pages.
8. Add empty-state explanations where no data exists.
9. Add retry/error UI for Supabase query failures.
10. Add mobile checks for long post cards.

## 14. Things To Fix For Not Fully Working Or Risky Parts

These areas are not complete enough for a strong production base.

1. Post generation validation should happen before database insert.
2. Duplicate prevention should be enforced in backend logic, not only frontend.
3. Cron scheduling should be confirmed and monitored.
4. Edge Function logs should be structured and easy to audit.
5. Bookmark errors should be tracked with clear user-facing messages.
6. RLS policies should be documented table by table.
7. Storage upload limits and file validation should be enforced.
8. User onboarding interests should drive personalized feed.
9. Notifications should be fully connected to real events.
10. Admin/moderation tools are needed for communities and generated content.

## 15. Features To Add Next

Highest priority:

1. Authenticated test account and automated test suite.
2. Admin content-quality dashboard.
3. Scheduled generation monitoring.
4. Full post creation with image/video upload.
5. Better personalized feed based on follows and interests.
6. Notification center connected to likes, comments, follows, and mentions.
7. Community membership and moderation tools.
8. Startup follow feed integration.
9. Claim startup profile workflow.
10. Founder/verified badge workflow.

Medium priority:

1. Job board.
2. Job posting system.
3. Job applications.
4. Startup analytics.
5. Funding alerts.
6. Newsletter system.
7. Launch widgets.
8. Trending startups.
9. Intel feed.
10. Command center.

Long-term:

1. Premium intelligence features.
2. Advanced startup analytics.
3. Investor/company dashboards.
4. Source credibility scoring.
5. AI-generated media pipeline with storage upload.
6. Entity linking between posts, startups, launches, and topics.

## 16. Strong Base Plan

To make Galaxy Ground easier to build without repeatedly fixing regressions, follow this order.

### Step 1: Stabilize

- Keep current frontend fixes.
- Verify all public routes.
- Verify all logged-in routes with a test account.
- Confirm database placeholder rows remain zero.
- Confirm cron jobs are active.

### Step 2: Protect

- Add validation before generated post insert.
- Add duplicate detection before insert.
- Add DB constraints where safe.
- Add monitoring for function failures.
- Add authenticated Playwright tests.

### Step 3: Improve

- Improve post cards and startup/community pages.
- Add admin tools for content repair.
- Add better media fallback.
- Add personalized feed logic.

### Step 4: Expand

- Add claim startup profiles.
- Add community membership/moderation.
- Add notifications.
- Add job board.
- Add premium intel features.

## 17. Definition Of Done For MVP

Galaxy Ground MVP is ready when:

- A new user can create an account.
- Existing user can log in.
- Profile works without crash.
- Home feed loads.
- Startup pages load.
- Community pages load.
- Search works.
- Bookmarks work.
- Likes/reactions work.
- Comments work.
- Generated posts appear daily.
- Generated posts are rich, relevant, image-backed, and hashtagged.
- Duplicate generated posts are blocked.
- Broken media is avoided or replaced.
- Major routes pass automated smoke tests.
- Authenticated flows pass automated tests.
- Supabase RLS and storage policies are documented and verified.

## 18. Current Simple Answer

For the recently reported issues, the answer is yes: the visible website is now behaving correctly for the checked public routes, Pixxel/Skyroot startup pages, community posts, and generated post presentation.

For the full product, the answer is not “100% finished.” The base is now much stronger, but the next serious step is to add automated authenticated testing and backend generation monitoring so the same problems do not return silently.
