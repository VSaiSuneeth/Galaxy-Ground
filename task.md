# Part 2 Phase 1 Task Tracker

## Phase 1 - Gated Connect & Messaging Foundation

Status: Complete locally, pending Supabase migration/function deployment.

### Implemented

- [x] Supabase migration for messaging tables, RLS, RPCs, unread counters, blocks, and realtime message inserts.
- [x] Edge Functions for accepting connection requests and blocking users.
- [x] Messaging hooks for requests, threads, messages, read status, privacy settings, unread counts, and realtime subscriptions.
- [x] Connect button and intent-based request modal on user profiles.
- [x] `/messages` inbox with Requests, Conversations, and Sent areas.
- [x] `/messages/:threadId` chat view with send, read, report, and block actions.
- [x] `/settings/messaging` privacy settings page.
- [x] Messages navigation links and unread badges in the sidebar/top nav.
- [x] Supabase handoff message documented in `PHASE_8_SUPABASE_HANDOFF.md`.

### Tested

- [x] Production build passed.
- [x] Vitest suite passed.
- [x] Headless browser smoke test for `/messages` passed.
- [x] Headless browser smoke test for `/settings/messaging` passed auth redirect.
- [x] Reviewed route wiring and fixed accepted-thread navigation.
- [x] Reviewed Edge Function auth context and fixed user JWT forwarding to auth-sensitive RPCs.

### Not Started

- [ ] Phase 2 - Mission Control Live Hub UI.
- [ ] Phase 3 - Opportunity & Inspiration Layer UI.

These are scheduled later because Phase 1 establishes the secure messaging foundation first. The later phases depend on their own UI flows and separate verification passes.
