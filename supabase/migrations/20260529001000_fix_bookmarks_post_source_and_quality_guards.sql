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

create index if not exists bookmarks_user_source_created_idx
on public.bookmarks(user_id, post_source, created_at desc);

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
