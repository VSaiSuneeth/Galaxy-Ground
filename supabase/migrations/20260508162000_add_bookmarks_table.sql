create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  post_id text not null,
  created_at timestamptz not null default now(),
  unique (user_id, post_id)
);

alter table public.bookmarks enable row level security;

create policy "Users can read own bookmarks"
on public.bookmarks
for select
using (auth.uid() = user_id);

create policy "Users can create own bookmarks"
on public.bookmarks
for insert
with check (auth.uid() = user_id);

create policy "Users can delete own bookmarks"
on public.bookmarks
for delete
using (auth.uid() = user_id);

create index if not exists bookmarks_user_id_created_at_idx on public.bookmarks(user_id, created_at desc);
create index if not exists bookmarks_post_id_idx on public.bookmarks(post_id);
