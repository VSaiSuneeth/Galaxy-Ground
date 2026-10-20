-- Idempotent repair: profile auto-creation, bookmarks, reaction_type on aggregate_reactions

-- Bookmarks (if an older deploy skipped this migration)
create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  post_id text not null,
  created_at timestamptz not null default now(),
  unique (user_id, post_id)
);

alter table public.bookmarks enable row level security;

drop policy if exists "Users can read own bookmarks" on public.bookmarks;
create policy "Users can read own bookmarks"
on public.bookmarks for select using (auth.uid() = user_id);

drop policy if exists "Users can create own bookmarks" on public.bookmarks;
create policy "Users can create own bookmarks"
on public.bookmarks for insert with check (auth.uid() = user_id);

drop policy if exists "Users can delete own bookmarks" on public.bookmarks;
create policy "Users can delete own bookmarks"
on public.bookmarks for delete using (auth.uid() = user_id);

-- Aggregate reaction emoji type
alter table public.aggregate_reactions
  add column if not exists reaction_type text not null default '❤️';

-- Profile + role on signup (fixes auth when trigger was never applied)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, username, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (user_id) do nothing;

  insert into public.user_roles (user_id, role)
  values (new.id, 'user')
  on conflict (user_id, role) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
