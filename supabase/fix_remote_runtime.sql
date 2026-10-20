-- Run this in the Supabase SQL editor for the project used by .env.
-- It repairs the remote runtime issues seen in the browser console.

create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  post_id text not null,
  post_source text not null default 'user',
  created_at timestamptz not null default now(),
  unique (user_id, post_id)
);

alter table public.bookmarks
  add column if not exists post_source text not null default 'user';

alter table public.bookmarks
  alter column post_source set default 'user';

update public.bookmarks
set post_source = 'user'
where post_source is null
   or post_source not in ('user', 'startup', 'themed');

alter table public.bookmarks
  drop constraint if exists bookmarks_post_source_check;

alter table public.bookmarks
  add constraint bookmarks_post_source_check
  check (post_source in ('user', 'startup', 'themed'));

alter table public.bookmarks enable row level security;

grant select, insert, delete on public.bookmarks to authenticated;

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

alter table public.aggregate_reactions
  add column if not exists reaction_type text not null default 'like';

alter table public.aggregate_reactions
  alter column reaction_type set default 'like';

update public.aggregate_reactions
set reaction_type = 'like'
where reaction_type is null
   or reaction_type not in ('like', 'rocket', 'telescope', 'star', '❤️', '🚀', '🔭', '⭐');

alter table public.aggregate_reactions
  drop constraint if exists aggregate_reactions_reaction_type_check;

alter table public.aggregate_reactions
  add constraint aggregate_reactions_reaction_type_check
  check (reaction_type in ('like', 'rocket', 'telescope', 'star', '❤️', '🚀', '🔭', '⭐'));

grant select on public.aggregate_reactions to anon, authenticated;
grant insert, delete on public.aggregate_reactions to authenticated;

delete from public.startup_posts sp
using (
  select id,
         row_number() over (partition by source_url order by published_at desc nulls last, id desc) as rn
  from public.startup_posts
  where source_url is not null
) d
where sp.id = d.id
  and d.rn > 1;

delete from public.themed_posts tp
using (
  select id,
         row_number() over (partition by source_url order by published_at desc nulls last, id desc) as rn
  from public.themed_posts
  where source_url is not null
) d
where tp.id = d.id
  and d.rn > 1;

create unique index if not exists startup_posts_unique_source_url_global
on public.startup_posts(source_url)
where source_url is not null;

create unique index if not exists themed_posts_unique_source_url_global
on public.themed_posts(source_url)
where source_url is not null;

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
