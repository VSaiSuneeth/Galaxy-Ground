# Galaxy Ground — Project Analysis Log

**Date:** 2026-05-25 (runtime/Supabase pass)  
**Project path:** `galaxy-ground-space-hub-main(d2)/`  
**Status:** Build ✅ | Dev server ✅ | Runtime fixes applied | **Live Supabase must be verified on your machine** (`npm run diagnose`)

---

## 1. Architecture Summary

| Layer | Technology |
|-------|------------|
| Frontend | React 18 SPA, Vite 5, TypeScript, Tailwind, shadcn/ui |
| State | TanStack Query 5, React Context (`useAuth`) |
| Routing | React Router 6 — 18 page components |
| Backend | Supabase (Postgres, Auth, Storage, Realtime, Deno Edge Functions) |
| Content ingestion | `fetch-themed-posts`, `fetch-startup-updates` (cron/manual; not invoked from UI) |

**Feed model:** Merges three sources — user `posts`, AI/RSS `startup_posts`, `themed_posts` — with composite IDs (`startup_<uuid>`, `themed_<uuid>`).

**Hybrid pages:** Explore, Missions, Learning, Launch details use static/mock data (`lib/feed-data.ts`).

---

## 2. Configuration Verification

| Check | Result |
|-------|--------|
| Frontend ↔ Supabase | Direct client; no proxy API |
| Env vars | `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` required |
| Dev port | **8080** (Vite + Playwright aligned) |
| Database | Remote Supabase project `lmdswaagcdxulcczkqmu` |
| Edge functions | `verify_jwt = false` — secure via cron/secret URLs only |
| Logo asset | `src/assets/logo.png` present |
| Separate backend | None |

---

## 3. Issues Found & Fixes Applied

### Runtime / Supabase pass (2026-05-25)

| Issue | Root cause | Fix |
|-------|------------|-----|
| Signup failures / duplicate profile | `AuthPage` inserted `profiles` with `id: user.id` while DB trigger already creates profile | Removed manual insert; rely on `handle_new_user` trigger |
| “Logged in” after signup but no session | Email confirmation enabled → no session until confirm | Stop redirect; show “check your email” message |
| Auth loading stuck | `onAuthStateChange` never set `loading: false` | Set loading false on auth events |
| Wrong follower count on own profile | Used legacy `following_id` instead of `target_type/target_id` | Fixed `ProfilePage` queries |
| No visibility when DB empty / offline | Silent failures | `SupabaseHealthBanner` + `useSupabaseHealth` |
| Env name confusion | User expects `VITE_SUPABASE_ANON_KEY` | Support both anon + publishable keys in `supabase-env.ts` |
| Missing trigger on remote DB | Migrations never pushed | New migration `20260525130000_ensure_runtime_prerequisites.sql` |

**Agent environment could not resolve** `lmdswaagcdxulcczkqmu.supabase.co` (DNS/network). Run `npm run diagnose` locally for real row counts.

### Fixed in earlier session

| Issue | Root cause | Fix | Files |
|-------|------------|-----|-------|
| Bookmarks type drift | `types.ts` had `post_source`; migration does not | Removed `post_source` from generated types | `types.ts` |
| `aggregate_reactions` missing `reaction_type` in types | Migration added column; types stale | Added `reaction_type` to types | `types.ts` |
| Bookmarks used `as any` | Type mismatch workaround | Typed Supabase queries | `useBookmarks.ts` |
| Bookmarked page only showed user posts | `useBookmarkedPosts` only queried `posts` table | Reuse `fetchPostById` for all composite IDs | `useBookmarks.ts`, `usePosts.ts` |
| Silent Supabase misconfig | No env validation | Console error + empty-string fallback | `client.ts` |
| ESLint false positive on types | Encoding/parser on generated file | Ignore `types.ts` and edge functions in ESLint | `eslint.config.js` |

### Known issues (not fixed — require product/infra decisions)

| Issue | Severity | Notes |
|-------|----------|-------|
| No route guards | Medium | Most pages public; auth only for actions |
| Edge functions not scheduled from UI | Medium | Content refresh needs Supabase cron |
| Large JS bundle (~835 KB) | Medium | Code-splitting recommended |
| 86 ESLint errors | Low | Mostly `@typescript-eslint/no-explicit-any` in hooks |
| `strictNullChecks: false` | Low | Template default |
| Static pages (Explore, Learning) | Info | No backend integration |
| Playwright e2e empty | Low | Only `.gitkeep` in `e2e/` |
| `types.ts` ESLint "binary" parse | Low | Ignored in eslint config |

---

## 4. Run Commands

```bash
cd galaxy-ground-space-hub-main(d2)
npm install
cp .env.example .env   # add Supabase keys
npm run dev            # http://localhost:8080
npm run build
npm run test
npm run lint
```

---

## 5. Route Map

| Path | Page | Data |
|------|------|------|
| `/` | HomeFeed | Supabase + realtime |
| `/auth` | AuthPage | Supabase Auth |
| `/explore` | ExplorePage | Static |
| `/startups`, `/startup/:slug` | Startups | Supabase |
| `/communities`, `/community/:slug` | Communities | Supabase |
| `/missions`, `/launch/:slug` | Missions | Static |
| `/hashtag/:tag` | HashtagPage | Supabase |
| `/learning` | LearningPage | Static |
| `/profile`, `/u/:userId` | Profiles | Supabase |
| `/creator/:handle` | ThemedAccountPage | Supabase |
| `/post/:id` | PostDetailPage | Supabase |
| `/bookmarks` | BookmarksPage | Supabase |

---

## 6. Database Tables (Supabase)

`profiles`, `posts`, `comments`, `likes`, `follows`, `startups`, `startup_posts`, `themed_accounts`, `themed_posts`, `aggregate_reactions`, `aggregate_comments`, `bookmarks`, `notifications`, `user_roles`, view `post_stats`.

---

## 7. Feature & Product Suggestions

### High Priority

- **Protected routes** — redirect unauthenticated users from `/profile`, `/bookmarks` if desired
- **Schedule edge functions** — Supabase cron for RSS/AI content pipelines
- **Error boundaries** — graceful UI when Supabase is down
- **Password reset / OAuth** — only email/password today
- **SEO** — meta tags, Open Graph per route (SPA limitation)

### Medium Priority

- **Code splitting** — route-based lazy loading to shrink bundle
- **Unified bookmark UX** — already fixed for all post types; add optimistic UI
- **Admin dashboard** — manage startups, themed accounts, moderate posts
- **Real Explore/Learning** — connect to CMS or Supabase tables
- **Image optimization** — lazy load, WebP, CDN
- **Rate limiting awareness** — client-side debounce on post/like actions

### Future Enhancements

- Push notifications (web push)
- DMs / messaging
- Space event calendar API integration
- Monetization (premium communities, sponsored startups)
- Analytics (Plausible/PostHog)
- PWA offline support
- i18n
- Full Playwright e2e suite

---

## 8. Security Notes

- RLS enabled on tables (verify policies in migrations)
- Edge functions have `verify_jwt = false` — must not be exposed publicly without secret headers
- Anon key is publishable by design; never expose service role in frontend
- Ensure `.env` is gitignored

---

## 9. Files Modified (this session)

- `src/integrations/supabase/types.ts`
- `src/integrations/supabase/client.ts`
- `src/hooks/useBookmarks.ts`
- `src/hooks/usePosts.ts`
- `eslint.config.js`
- `.cursor/rules/full-stack-analysis.mdc` (new)
- `PROJECT_ANALYSIS.md` (new)

---

## 10. Future Development Quick Reference

- **Add a page:** `src/pages/` → register in `src/App.tsx`
- **Add API hook:** `src/hooks/` → use `supabase` from `@/integrations/supabase/client`
- **Schema change:** `supabase/migrations/` → regenerate `types.ts` via Supabase CLI
- **New env var:** prefix with `VITE_` for client access
