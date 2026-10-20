-- Grant permissions to anon and authenticated roles for tables created in Part 2 Master Blueprint
grant select, insert, update on public.connection_requests to anon, authenticated;
grant select, insert, update on public.message_threads to anon, authenticated;
grant select, insert on public.messages to anon, authenticated;
grant select, insert, delete on public.user_blocks to anon, authenticated;
grant select on public.live_events to anon, authenticated;
grant select, insert, delete on public.live_event_reminders to anon, authenticated;
grant select on public.startup_roles to anon, authenticated;
grant select on public.featured_content to anon, authenticated;
grant select on public.profile_badge_awards to anon, authenticated;
