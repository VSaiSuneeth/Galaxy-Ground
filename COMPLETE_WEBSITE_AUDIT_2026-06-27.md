# Galaxy Ground Complete Website Audit - 2026-06-27

## Executive Summary

Galaxy Ground is a Vite + React + Supabase social/content hub for space communities, startup intelligence, generated posts, launch tracking, topic exploration, learning content, bookmarks, follows, reactions, and profiles.

Current status after this audit:

- The app builds successfully.
- The Vitest suite passes.
- The Playwright runtime smoke test passes across all major public routes.
- Supabase frontend-facing tables are readable with the publishable key.
- Supabase admin tool confirmed `post-media`, bookmarks, reactions, storage policies, and RLS are production-ready.
- One real frontend runtime-risk bug was fixed in `src/hooks/usePosts.ts`: conditional hook calls were removed.
- Remaining issues are mostly content quality cleanup, missing auth/profile features, and TypeScript/lint debt.

No destructive database changes were made.

## Project Overview

Purpose:

- Provide a space-focused social platform with generated startup and themed space posts.
- Support user posting, profiles, comments, reactions, bookmarks, follows, communities/orbits, startup pages, search, launch pages, and learning pages.

Technology stack:

- Vite
- React 18
- TypeScript
- React Router
- TanStack React Query
- Supabase Auth, Postgres, Storage
- Tailwind CSS
- shadcn/Radix UI
- Playwright
- Vitest

Important local paths:

- App root: `C:\Users\saisu\OneDrive\Pictures\course\galaxy-ground-space-hub-main(2)\galaxy-ground-space-hub-main(d2)`
- Routes: `src/App.tsx`
- Supabase client: `src/integrations/supabase/client.ts`
- Supabase generated types: `src/integrations/supabase/types.ts`
- Main feed hook: `src/hooks/usePosts.ts`
- Post card: `src/components/PostCard.tsx`
- Create post: `src/components/CreatePost.tsx`
- Auth: `src/pages/AuthPage.tsx`, `src/hooks/useAuth.tsx`
- Profile: `src/pages/ProfilePage.tsx`, `src/lib/profile-utils.ts`
- Communities: `src/pages/CommunitiesPage.tsx`, `src/pages/CommunityDetailPage.tsx`, `src/hooks/useCommunities.ts`
- E2E smoke test: `e2e/runtime-smoke.spec.ts`
- Developer guide: `PROJECT_DEVELOPER_GUIDE.md`

## Implemented Routes

Configured in `src/App.tsx`:

- `/auth`
- `/`
- `/explore`
- `/startups`
- `/communities`
- `/community/:slug`
- `/missions`
- `/launch/:slug`
- `/startup/:slug`
- `/hashtag/:tag`
- `/learning`
- `/profile`
- `/u/:userId`
- `/creator/:handle`
- `/post/:id`
- `/bookmarks`
- fallback `*`

## Feature Status

| Feature | Status | Evidence | Notes |
|---|---:|---|---|
| Home feed | Working | `HomeFeed`, `usePosts`, `PostCard` | Smoke tested. |
| Infinite feed pagination | Working after fix | `usePosts.ts` | Conditional hook-order risk fixed. |
| Startup posts | Working | `startup_posts`, `usePosts`, `StartupDetailPage` | Some old/generated rows are low quality or missing media. |
| Themed posts | Working | `themed_posts`, `useThemed`, `ThemedAccountPage` | Better media coverage than startup posts. |
| User posts | Working | `posts`, `CreatePost`, `PostCard` | Media upload depends on `post-media`, confirmed by Supabase admin. |
| Comments | Implemented | `CommentsSection`, `comments`, `aggregate_comments` | Runtime smoke passes. |
| Likes/reactions | Implemented | `PostCard`, `likes`, `aggregate_reactions` | Supabase admin confirmed richer reactions. |
| Bookmarks | Implemented | `useBookmarks`, `BookmarksPage`, `bookmarks` | Backend verified by Supabase admin. |
| Follows | Implemented | `useFollow`, `follows` | Used for users/startups/themed accounts. |
| Search | Implemented | `SearchBar` | Uses profiles, startups, posts, startup_posts, themed_posts, hashtags. |
| Notifications | Implemented | `useNotifications`, `NotificationsBell` | Current row count is 0; functionality exists. |
| Auth login/signup | Implemented | `AuthPage`, `useAuth` | Password reset is not implemented. Email verification completion requires mailbox/manual test. |
| Profile edit | Implemented | `ProfilePage` | Avatar upload not implemented. |
| Communities/Orbits | Implemented | `CommunitiesPage`, `CommunityDetailPage`, `useCommunities` | Content quality depends on generated post data. |
| Community membership | Implemented | `CommunityJoinButton`, `useCommunityMembership` | Supabase table verified readable. |
| Launches/Missions | Implemented | `MissionsPage`, `LaunchDetailPage`, `useLaunches` | Remote/fallback switch exists. |
| Topics/Explore | Implemented | `ExplorePage`, `useTopics` | Remote/fallback switch exists. |
| Learning | Implemented | `LearningPage`, `useLearning` | Remote/fallback switch exists. |
| Storage media | Backend ready | Supabase admin confirmation | Public bucket and policies confirmed. |
| Admin features | Not implemented | No route/component found | No admin UI exists. |
| Messaging | Not implemented | No route/component found | Not part of current codebase. |

## Page-by-Page Review

### `/`

Purpose:

- Main social feed with user posts, startup posts, themed posts, create-post composer, read-more handling, reactions, comments, bookmarks, follows, and sharing.

Components and data:

- `HomeFeed`
- `CreatePost`
- `PostCard`
- `usePosts`
- `posts`, `profiles`, `post_stats`, `startup_posts`, `themed_posts`, `aggregate_reactions`, `aggregate_comments`, `bookmarks`

Status:

- Browser smoke test passed.
- Feed crash from unsafe infinite pagination was already fixed earlier.
- This audit fixed remaining React hook-order risk in `usePosts`.

Remaining issues:

- Old/generated startup content still includes missing images and short rows.
- Lint debt remains in feed-related files.

### `/auth`

Purpose:

- Sign in and sign up.

Components and data:

- `AuthPage`
- `useAuth`
- Supabase Auth
- `profiles` trigger/insert fallback expected on backend

Status:

- UI and route exist.
- Sign-in/sign-up logic exists.
- Session persistence via Supabase auth storage exists.

Remaining gaps:

- Forgot-password flow is not implemented.
- Email verification completion was not end-to-end tested because no real mailbox/session was available in this audit.
- Auth page does not include dedicated post-confirmation/new-password handling.

### `/profile`

Purpose:

- Current user profile, profile editing, user posts, create post, sign out.

Components and data:

- `ProfilePage`
- `useOwnProfile`
- `useProfileStats`
- `usePosts`
- `profiles`, `follows`, `posts`

Status:

- Route smoke test passed.
- Profile update logic exists.
- Route redirects unauthenticated users to `/auth`.

Remaining gaps:

- Avatar upload UI is not implemented.
- Preferences/settings page is not implemented.

### `/u/:userId`

Purpose:

- Public user profile.

Components and data:

- `UserProfilePage`
- `useProfile`
- `usePosts`
- `follows`

Status:

- Route exists and was previously stabilized.
- Not directly in current smoke list for dynamic user id because test needs a known user id.

Remaining gaps:

- Add an E2E fixture route using a known profile id.

### `/communities`

Purpose:

- Orbits directory.

Components and data:

- `CommunitiesPage`
- `useCommunitiesWithStats`
- `COMMUNITY_META`
- `themed_accounts`, `startups`, `themed_posts`, `startup_posts`, `follows`, `community_memberships`

Status:

- Smoke test passed.
- Counts are computed from live tables.

Remaining issues:

- Some visible community descriptions/icons appear to contain mojibake in terminal output. Browser smoke did not flag it as runtime failure, but visual copy should be reviewed in-browser.

### `/community/:slug`

Purpose:

- Community/orbit detail page with accounts/startups/posts.

Components and data:

- `CommunityDetailPage`
- `CommunityJoinButton`
- `useCommunityContent`
- `useCommunityMembership`

Status:

- Smoke tested with `/community/rocket-engineering`.
- Astrophotography content specifically needs manual visual review and backend content cleanup.

Content findings:

- Live query sample found many generated posts missing `image_url`.
- Several old startup posts are headline-only or under 500 chars.
- These should be repaired by backend/content cleanup, not by deleting data from the frontend.

### `/explore`

Purpose:

- Topic exploration and discovery.

Components and data:

- `ExplorePage`
- `useTopics`
- `topics`, `topic_facts`, `topic_timeline_events`, `topic_sections`, `topic_discoveries`

Status:

- Smoke test passed.
- Remote/fallback switch is enabled by `.env`.

### `/missions` and `/launch/:slug`

Purpose:

- Launch calendar/list and launch details.

Components and data:

- `MissionsPage`
- `LaunchDetailPage`
- `useLaunches`
- `launches`, `launch_updates`, `launch_sources`

Status:

- Smoke tested.
- Supabase tables readable through `supabase-js`.

### `/startups` and `/startup/:slug`

Purpose:

- Startup directory and startup profile/news feed.

Components and data:

- `StartupsPage`
- `StartupDetailPage`
- `useStartups`
- `startups`, `startup_posts`, `follows`

Status:

- `/startups` smoke tested.
- Startup detail route exists and should be tested with known slugs manually.

Remaining issues:

- Startup generated posts are the main content-quality problem.

### `/hashtag/:tag`

Purpose:

- Hashtag-specific feed.

Components and data:

- `HashtagPage`
- `usePosts`
- `useTrendingHashtags`

Status:

- Route exists.
- Trending counts are computed from unique hashtags per post in `useTrendingHashtags`.

### `/learning`

Purpose:

- Course/learning path list.

Components and data:

- `LearningPage`
- `useLearning`
- `courses`, `course_modules`, `course_lessons`

Status:

- Smoke test passed.

### `/bookmarks`

Purpose:

- Saved posts.

Components and data:

- `BookmarksPage`
- `useBookmarks`
- `useBookmarkedPosts`
- `bookmarks`

Status:

- Smoke test passed.
- Backend admin confirmed schema/RLS/policies.

### `/creator/:handle`

Purpose:

- Themed account profile and posts.

Components and data:

- `ThemedAccountPage`
- `useThemed`
- `themed_accounts`, `themed_posts`

Status:

- Route exists.
- Should be manually tested with known handles.

### `/post/:id`

Purpose:

- Deep link to a user/startup/themed post.

Components and data:

- `PostDetailPage`
- `usePostById`

Status:

- Route exists.
- Should be manually tested with real ids.

## Database Verification

Verified through `supabase-js` using the same publishable key as the frontend:

- `launches`: OK, count 5
- `launch_updates`: OK, count 0
- `launch_sources`: OK, count 0
- `topics`: OK, count 4
- `topic_facts`: OK, count 0
- `topic_timeline_events`: OK, count 0
- `topic_sections`: OK, count 0
- `topic_discoveries`: OK, count 0
- `courses`: OK, count 3
- `course_modules`: OK, count 0
- `course_lessons`: OK, count 0
- `community_memberships`: OK, count 0
- `bookmarks`: OK, count 0

`npm run diagnose` also verified:

- `profiles`: 5
- `posts`: 6
- `startup_posts`: 218
- `themed_posts`: 240
- `comments`: 2
- `likes`: 7
- `bookmarks`: 0
- `follows`: 11
- `notifications`: 0
- `aggregate_reactions`: 7
- `aggregate_comments`: 2
- `startups`: 25
- `themed_accounts`: 40
- `post_stats`: 6

Supabase admin tool confirmed:

- `post-media` bucket exists.
- `post-media` is public.
- Public SELECT policy is active.
- Authenticated INSERT is active.
- Authenticated UPDATE/DELETE own-object policies are active.
- `bookmarks.post_source` exists, is not null, defaults to `user`, and checks `user/startup/themed`.
- Bookmark RLS is owner-scoped.
- Reactions are production-ready.
- Data sanitization and deduplication are active on backend.

## Bugs Fixed In This Audit

### 1. Conditional React hook calls in `usePosts`

File:

- `src/hooks/usePosts.ts`

Root cause:

- `usePosts` conditionally called either `useInfinitePostsQuery` or `useSinglePostsQuery` depending on `filter.infinite`.
- React hooks must be called in the same order on every render.
- ESLint correctly flagged this as a `react-hooks/rules-of-hooks` error.

Solution:

- `usePosts` now calls both hooks every render.
- Only the selected query is enabled.
- It returns the infinite query result when `filter.infinite` is true, otherwise the single query result.

Why this matters:

- Prevents a future render crash if a component changes between finite and infinite mode.

### 2. Single and infinite post queries sharing cache keys

File:

- `src/hooks/usePosts.ts`

Root cause:

- The single-feed query and infinite-feed query could be mounted at the same time after the hook-order fix.
- They initially used the same computed query key for a given filter.
- TanStack Query stores normal query results and infinite-query results in different shapes, so sharing keys can surface errors such as `Cannot read properties of undefined (reading 'length')` in infinite pagination behavior.

Solution:

- Single posts now always use `["posts", "single", filter]`.
- Infinite posts now always use `["posts", "infinite", filter]`.

### 3. Thin generated posts repeating title-only content

Files:

- `src/lib/generated-content-presentation.ts`
- `src/hooks/usePosts.ts`
- `src/hooks/useCommunities.ts`
- `src/hooks/useStartups.ts`
- `src/hooks/useTrendingHashtags.ts`
- `src/pages/CommunityDetailPage.tsx`

Root cause:

- The remote database still contains generated rows that fail the project quality rules despite the backend tool reporting they were fixed.
- Live frontend-side verification found:
  - `startup_posts`: 218 total, many missing images or rich source content.
  - `themed_posts`: 240 total, with some old title-only rows in Astrophotography.

Solution:

- Restored all generated rows so startup pages, accounts, communities, and trending topics keep their data.
- Added a shared generated-content presentation helper.
- Thin or title-repeated generated rows are expanded at render time into richer paragraph-style content with fallback hashtags.
- Community detail pages now feed generated posts through the same enriched `PostCard` path, preserving Read more / Show less behavior.

Why this matters:

- Rows such as `Hubble Sees Swarm of Galaxies` no longer appear as title/title duplicates.
- Startup/account/community data is restored instead of being hidden.
- This is a frontend presentation safety layer. The database still needs a real regeneration/media repair pass.

## Automated Verification Results

Passed:

- `npm.cmd run build`
- `npm.cmd run test`
- `npm.cmd exec -- playwright test e2e/runtime-smoke.spec.ts --reporter=list`
- Mobile viewport route check at `390x844`

Playwright routes verified:

- `/`
- `/explore`
- `/missions`
- `/launch/isro-gaganyaan-g1`
- `/startups`
- `/communities`
- `/community/rocket-engineering`
- `/learning`
- `/bookmarks`
- `/profile`

Mobile routes verified:

- `/`
- `/explore`
- `/missions`
- `/launch/isro-gaganyaan-g1`
- `/startups`
- `/communities`
- `/community/astrophotography`
- `/community/rocket-engineering`
- `/learning`
- `/bookmarks`
- `/profile`

Known command result:

- `npm.cmd run lint` still fails due existing lint/type debt. The functional hook-order error was fixed; remaining lint errors are mostly `no-explicit-any`, shadcn empty-interface rules, fast-refresh warnings, and Tailwind `require()`.

## Remaining Gaps

High priority:

1. Backend content cleanup for generated posts.
2. Add password reset flow.
3. Add avatar upload.
4. Add authenticated E2E tests for signup/login/profile/bookmark/post upload.
5. Fix lint debt so CI can use `npm run lint` as a hard gate.

Medium priority:

1. Add direct E2E coverage for `/u/:userId`, `/startup/:slug`, `/creator/:handle`, `/post/:id`, `/hashtag/:tag`.
2. Add mobile viewport Playwright suite.
3. Add error boundary coverage for auth/profile flows.
4. Improve generated post media fallback for startup posts.
5. Add content moderation/admin queue for low-quality generated rows.

Low priority:

1. Split large JS bundle with route-level lazy loading.
2. Update Browserslist database.
3. Convert remaining broad `any` use to typed DTOs.
4. Improve accessibility labels on icon-only buttons.

## Technical Debt

- Many query DTOs use `any` around Supabase nested relationship results.
- shadcn UI generated files trigger lint rules for empty interfaces and fast refresh exports.
- `tailwind.config.ts` uses `require()`.
- Bundle size is over Vite's 500 kB warning threshold.
- Auth is functional but not complete: no forgot password/new password page.
- Profile is functional but not complete: no avatar upload.
- Content quality is partially dependent on backend generation jobs and historical data cleanup.

## Content Quality Findings

A live sample of 160 recent generated rows found 79 rows failing one or more quality checks:

- `content/summary` under 500 characters.
- missing hashtags.
- missing image.

Examples include old headline-only startup posts such as Pixxel/GalaxEye rows with 80-103 character bodies and no image.

Current better rows are longer, but many startup posts still lack `image_url`. Themed posts generally have better image coverage.

This should be fixed through backend cleanup/regeneration because these are database rows, not frontend rendering bugs.

Updated verification after frontend enrichment:

- `startup_posts`: restored to visible lists; thin rows receive richer fallback presentation.
- `themed_posts`: restored to visible lists; title-only Astrophotography rows receive richer fallback presentation.
- Browser check confirmed no `Hubble Sees Swarm of Galaxies` title/title duplicate and no `Black Eye Galaxy` title/title duplicate on `/community/astrophotography`.

The Supabase tool reported `startup_posts = 229` and `themed_posts = 132`, but the frontend project currently reads `startup_posts = 218` and `themed_posts = 240` from `https://lmdswaagcdxulcczkqmu.supabase.co`. This mismatch should be investigated by the Supabase/admin tool.

## Message For Supabase AI Tool

Copy/paste this if backend content cleanup is requested:

```txt
Please run a content-quality cleanup and regeneration pass for Galaxy Ground.

Do not delete user-created `posts`.

Target generated content only:
- public.startup_posts
- public.themed_posts

Quality rules:
1. Flag rows where COALESCE(content, summary, '') length is under 500 chars.
2. Flag rows with empty or null hashtags.
3. Flag rows with null/empty image_url.
4. Flag likely headline-only rows where content closely equals title/source headline.
5. Flag duplicate or near-duplicate rows by source_url, normalized title, and normalized content.

For each flagged generated row:
- Prefer regenerate content in the rich paragraph style already required.
- Preserve original source_url, startup/account ownership, and published_at unless clearly invalid.
- Generate 3-6 clean hashtags.
- Attach source media when available.
- If source media is unavailable, generate/upload an AI fallback image to `post-media`.
- Do not delete rows unless they are confirmed duplicate spam.

Recommended verification SQL:

select 'startup short' as metric, count(*)
from public.startup_posts
where length(coalesce(content, summary, '')) < 500
union all
select 'startup missing hashtags', count(*)
from public.startup_posts
where hashtags is null or array_length(hashtags, 1) is null
union all
select 'startup missing image', count(*)
from public.startup_posts
where image_url is null or btrim(image_url) = ''
union all
select 'themed short', count(*)
from public.themed_posts
where length(coalesce(content, summary, '')) < 500
union all
select 'themed missing hashtags', count(*)
from public.themed_posts
where hashtags is null or array_length(hashtags, 1) is null
union all
select 'themed missing image', count(*)
from public.themed_posts
where image_url is null or btrim(image_url) = '';

Also verify duplicate groups:

select source_url, count(*)
from public.startup_posts
where source_url is not null
group by source_url
having count(*) > 1;

select source_url, count(*)
from public.themed_posts
where source_url is not null
group by source_url
having count(*) > 1;

After cleanup, return counts for:
- last 24h generated rows
- last 7d generated rows
- short rows
- missing hashtags
- missing image_url
- duplicate source_url groups
```

## Recommended Manual Website Checks

Run:

```powershell
Set-Location -LiteralPath "C:\Users\saisu\OneDrive\Pictures\course\galaxy-ground-space-hub-main(2)\galaxy-ground-space-hub-main(d2)"
npm.cmd run dev -- --host=127.0.0.1 --port=8081
```

Open:

```txt
http://127.0.0.1:8081
```

Check:

1. Home feed loads with no console crashes.
2. Trending hashtags show counts and open hashtag pages.
3. Sign in with a real account.
4. Open profile.
5. Edit display name/bio/interests.
6. Create a text post.
7. Create a media post.
8. Like, comment, save, and share a post.
9. Open bookmarks.
10. Open communities, especially Astrophotography and Rocket Engineering.
11. Open a startup detail page.
12. Open a creator page.
13. Open missions and a launch detail page.
14. Test on mobile viewport.
15. Confirm DevTools has no `Cannot read properties of undefined`, no 401/403/404 loops, and no React page crash.

## Future Roadmap

High impact / low-medium effort:

- Content cleanup/regeneration for generated posts.
- Password reset flow.
- Avatar upload.
- Authenticated Playwright tests.
- Lint cleanup for functional code.

High impact / higher effort:

- Admin moderation queue for generated posts.
- Full generated-content QA pipeline with status fields.
- Route-level code splitting.
- User settings/preferences page.

Medium impact:

- Mobile-specific UI polish pass.
- Accessibility pass.
- Better empty states and skeleton states.
- More precise Supabase generated types for nested relationship queries.

Low impact:

- Browserslist update.
- Visual copy polish.
- Reduce bundle warning.

## Final Assessment

The website is currently stable under automated build, unit test, Supabase client checks, and browser runtime smoke testing.

The biggest remaining concern is not frontend runtime stability. It is generated-content quality in the database, especially older startup rows and missing images. That should be handled through a Supabase/admin content cleanup/regeneration pass.
