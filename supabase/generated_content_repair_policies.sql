-- Temporary admin-only policies for generated content repair.
-- Run in Supabase SQL Editor as project owner/admin.
-- Do NOT grant UPDATE to anon or authenticated users for these tables.

alter table public.startup_posts enable row level security;
alter table public.themed_posts enable row level security;

drop policy if exists "service_role repair startup_posts" on public.startup_posts;
create policy "service_role repair startup_posts"
on public.startup_posts
for update
to service_role
using (true)
with check (true);

drop policy if exists "service_role repair themed_posts" on public.themed_posts;
create policy "service_role repair themed_posts"
on public.themed_posts
for update
to service_role
using (true)
with check (true);

