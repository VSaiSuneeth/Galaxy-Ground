-- Galaxy Ground generated-post operations helper.
-- Run sections in Supabase SQL Editor as needed.
-- Replace YOUR_PROJECT_REF before using cron scheduling statements.

-- SECTION 1: Recent generated-post health checks
select 'startup_posts last 24h' as metric, count(*) from public.startup_posts where published_at >= now() - interval '24 hours'
union all
select 'startup_posts last 7d', count(*) from public.startup_posts where published_at >= now() - interval '7 days'
union all
select 'startup_posts last 30d', count(*) from public.startup_posts where published_at >= now() - interval '30 days'
union all
select 'themed_posts last 24h', count(*) from public.themed_posts where published_at >= now() - interval '24 hours'
union all
select 'themed_posts last 7d', count(*) from public.themed_posts where published_at >= now() - interval '7 days'
union all
select 'themed_posts last 30d', count(*) from public.themed_posts where published_at >= now() - interval '30 days';

select 'startup_posts missing hashtags' as issue, count(*) from public.startup_posts where hashtags is null or cardinality(hashtags) = 0
union all
select 'startup_posts missing image_url', count(*) from public.startup_posts where image_url is null or length(image_url) < 8
union all
select 'startup_posts short content', count(*) from public.startup_posts where length(coalesce(content, '')) < 500
union all
select 'themed_posts missing hashtags', count(*) from public.themed_posts where hashtags is null or cardinality(hashtags) = 0
union all
select 'themed_posts missing image_url', count(*) from public.themed_posts where image_url is null or length(image_url) < 8
union all
select 'themed_posts short content', count(*) from public.themed_posts where length(coalesce(content, '')) < 500;

select source_url, count(*) as duplicate_count
from public.startup_posts
where source_url is not null
group by source_url
having count(*) > 1
order by duplicate_count desc;

select source_url, count(*) as duplicate_count
from public.themed_posts
where source_url is not null
group by source_url
having count(*) > 1
order by duplicate_count desc;

select id, startup_id, title, left(content, 240) as content_preview, hashtags, image_url, published_at
from public.startup_posts
order by published_at desc nulls last
limit 20;

select id, account_id, title, left(content, 240) as content_preview, hashtags, image_url, published_at
from public.themed_posts
order by published_at desc nulls last
limit 20;

-- SECTION 2: RLS/read policy repair
alter table public.startup_posts enable row level security;
alter table public.themed_posts enable row level security;
alter table public.bookmarks enable row level security;
alter table public.aggregate_reactions enable row level security;

grant select on public.startup_posts to anon, authenticated;
grant select on public.themed_posts to anon, authenticated;
grant select, insert, delete on public.bookmarks to authenticated;
grant select on public.aggregate_reactions to anon, authenticated;
grant insert, update, delete on public.aggregate_reactions to authenticated;

drop policy if exists "Public can read startup posts" on public.startup_posts;
create policy "Public can read startup posts"
on public.startup_posts
for select
to anon, authenticated
using (true);

drop policy if exists "Public can read themed posts" on public.themed_posts;
create policy "Public can read themed posts"
on public.themed_posts
for select
to anon, authenticated
using (true);

drop policy if exists "Users can read own bookmarks" on public.bookmarks;
create policy "Users can read own bookmarks"
on public.bookmarks
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can create own bookmarks" on public.bookmarks;
create policy "Users can create own bookmarks"
on public.bookmarks
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own bookmarks" on public.bookmarks;
create policy "Users can delete own bookmarks"
on public.bookmarks
for delete
to authenticated
using (auth.uid() = user_id);

-- SECTION 3: Bookmark/reaction schema repair
create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  post_id text not null,
  post_source text not null default 'user',
  created_at timestamptz not null default now(),
  unique (user_id, post_id)
);

alter table public.bookmarks add column if not exists post_source text not null default 'user';
alter table public.bookmarks alter column post_source set default 'user';
update public.bookmarks set post_source = 'user' where post_source is null or post_source not in ('user', 'startup', 'themed');
alter table public.bookmarks drop constraint if exists bookmarks_post_source_check;
alter table public.bookmarks add constraint bookmarks_post_source_check check (post_source in ('user', 'startup', 'themed'));

alter table public.aggregate_reactions add column if not exists reaction_type text not null default 'like';
alter table public.aggregate_reactions alter column reaction_type set default 'like';
update public.aggregate_reactions set reaction_type = 'like'
where reaction_type is null or reaction_type not in ('like', 'rocket', 'telescope', 'star', '❤️', '🚀', '🔭', '⭐');
alter table public.aggregate_reactions drop constraint if exists aggregate_reactions_reaction_type_check;
alter table public.aggregate_reactions add constraint aggregate_reactions_reaction_type_check
check (reaction_type in ('like', 'rocket', 'telescope', 'star', '❤️', '🚀', '🔭', '⭐'));

-- SECTION 4: Storage repair
insert into storage.buckets (id, name, public)
values ('post-media', 'post-media', true)
on conflict (id) do update set public = true;

drop policy if exists "Post media public read" on storage.objects;
create policy "Post media public read"
on storage.objects
for select
using (bucket_id = 'post-media');

drop policy if exists "Authenticated users upload post media" on storage.objects;
create policy "Authenticated users upload post media"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'post-media');

-- SECTION 5: Duplicate protection
delete from public.startup_posts sp
using (
  select id, row_number() over (partition by source_url order by published_at desc nulls last, id desc) as rn
  from public.startup_posts
  where source_url is not null
) d
where sp.id = d.id and d.rn > 1;

delete from public.themed_posts tp
using (
  select id, row_number() over (partition by source_url order by published_at desc nulls last, id desc) as rn
  from public.themed_posts
  where source_url is not null
) d
where tp.id = d.id and d.rn > 1;

create unique index if not exists startup_posts_unique_source_url_global
on public.startup_posts(source_url)
where source_url is not null;

create unique index if not exists themed_posts_unique_source_url_global
on public.themed_posts(source_url)
where source_url is not null;

-- SECTION 6: pg_cron scheduling templates.
-- Enable extensions if your project allows them:
create extension if not exists pg_net;
create extension if not exists pg_cron;

-- Replace YOUR_PROJECT_REF with the value from https://YOUR_PROJECT_REF.supabase.co
-- Replace YOUR_SERVICE_ROLE_KEY only inside Supabase SQL Editor if you intentionally want DB cron to call functions.
-- Alternative: configure schedules in Supabase Dashboard > Edge Functions > Schedules.

-- Unschedule old duplicate jobs if they exist.
select cron.unschedule(jobid)
from cron.job
where jobname in ('fetch-startup-updates-every-6h', 'fetch-themed-posts-every-6h');

-- Startup updates every 6 hours.
-- select cron.schedule(
--   'fetch-startup-updates-every-6h',
--   '0 */6 * * *',
--   $$
--   select net.http_post(
--     url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/fetch-startup-updates',
--     headers := jsonb_build_object(
--       'Content-Type', 'application/json',
--       'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
--     ),
--     body := '{}'::jsonb
--   );
--   $$
-- );

-- Themed posts every 6 hours.
-- select cron.schedule(
--   'fetch-themed-posts-every-6h',
--   '20 */6 * * *',
--   $$
--   select net.http_post(
--     url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/fetch-themed-posts',
--     headers := jsonb_build_object(
--       'Content-Type', 'application/json',
--       'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY'
--     ),
--     body := '{}'::jsonb
--   );
--   $$
-- );

select jobid, jobname, schedule, active from cron.job order by jobname;
