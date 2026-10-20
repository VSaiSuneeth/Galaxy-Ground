-- Phase 7 support schema for startup roles, Intel, API access, and readiness checks.
-- Additive only: does not delete or rewrite user content.

alter table public.profiles
  add column if not exists weekly_digest_opt_in boolean not null default false;

alter table public.startup_roles
  add column if not exists tags text[] not null default array[]::text[];

create table if not exists public.role_views (
  id uuid primary key default gen_random_uuid(),
  role_id uuid not null references public.startup_roles(id) on delete cascade,
  user_id uuid references public.profiles(user_id) on delete set null,
  session_id text not null,
  viewer_badges text[] not null default array[]::text[],
  viewed_at timestamptz not null default now()
);

create index if not exists idx_role_views_role_viewed_at
  on public.role_views(role_id, viewed_at desc);

create index if not exists idx_role_views_session_id
  on public.role_views(session_id);

alter table public.role_views enable row level security;

drop policy if exists "Anyone can insert role views" on public.role_views;
create policy "Anyone can insert role views"
  on public.role_views for insert
  with check (true);

drop policy if exists "Startup owners and admins can read role views" on public.role_views;
create policy "Startup owners and admins can read role views"
  on public.role_views for select
  using (
    exists (
      select 1
      from public.startup_roles sr
      join public.startups s on s.id = sr.startup_id
      where sr.id = role_views.role_id
        and s.claimed_by_user_id = auth.uid()
    )
    or exists (
      select 1
      from public.profiles p
      where p.user_id = auth.uid()
        and 'admin' = any(coalesce(p.badges, array[]::text[]))
    )
  );

create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  key_hash text not null unique,
  key_prefix text not null,
  tier text not null default 'free' check (tier in ('free', 'pro', 'admin')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);

create unique index if not exists idx_api_keys_one_active_per_user
  on public.api_keys(user_id)
  where is_active = true;

alter table public.api_keys enable row level security;

drop policy if exists "Users can read own api keys" on public.api_keys;
create policy "Users can read own api keys"
  on public.api_keys for select
  using (auth.uid() = user_id);

drop policy if exists "Users can revoke own api keys" on public.api_keys;
create policy "Users can revoke own api keys"
  on public.api_keys for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.api_usage_log (
  id uuid primary key default gen_random_uuid(),
  api_key_hash text not null,
  endpoint text not null,
  method text not null,
  status_code int not null,
  response_time_ms int,
  created_at timestamptz not null default now()
);

create index if not exists idx_api_usage_log_key_created
  on public.api_usage_log(api_key_hash, created_at desc);

alter table public.api_usage_log enable row level security;

drop policy if exists "Users can read own api usage" on public.api_usage_log;
create policy "Users can read own api usage"
  on public.api_usage_log for select
  using (
    exists (
      select 1
      from public.api_keys ak
      where ak.key_hash = api_usage_log.api_key_hash
        and ak.user_id = auth.uid()
    )
  );

create table if not exists public.apod_cache (
  id int primary key default 1 check (id = 1),
  title text not null default 'Astronomy Picture of the Day',
  explanation text not null default 'Space weather and astronomy highlights will appear here after the APOD sync is configured.',
  url text not null default '',
  thumbnail_url text,
  date date not null default current_date,
  cached_at timestamptz not null default now()
);

alter table public.apod_cache enable row level security;

drop policy if exists "Anyone can read APOD cache" on public.apod_cache;
create policy "Anyone can read APOD cache"
  on public.apod_cache for select
  using (true);

insert into public.apod_cache (id)
values (1)
on conflict (id) do nothing;

create or replace function public.get_intel_digest(p_user_id uuid)
returns table (
  entity_type text,
  entity_id text,
  entity_name text,
  entity_image text,
  change_description text,
  priority_score int,
  url text
)
language sql
stable
security definer
as $$
  with followed_startups as (
    select target_id::uuid as startup_id
    from public.follows
    where follower_id = p_user_id
      and target_type = 'startup'
  ),
  latest_posts as (
    select
      'startup'::text as entity_type,
      s.id::text as entity_id,
      s.name::text as entity_name,
      s.logo_url::text as entity_image,
      coalesce(sp.title, left(sp.content, 120))::text as change_description,
      80::int as priority_score,
      ('/startup/' || s.slug)::text as url,
      sp.published_at as sort_at
    from public.startup_posts sp
    join public.startups s on s.id = sp.startup_id
    join followed_startups fs on fs.startup_id = s.id
    order by sp.published_at desc
    limit 10
  ),
  latest_roles as (
    select
      'role'::text as entity_type,
      sr.id::text as entity_id,
      s.name::text as entity_name,
      s.logo_url::text as entity_image,
      ('Open role: ' || sr.title || ' (' || sr.role_type || ')')::text as change_description,
      70::int as priority_score,
      ('/startup/' || s.slug || '#open-roles')::text as url,
      sr.posted_at as sort_at
    from public.startup_roles sr
    join public.startups s on s.id = sr.startup_id
    join followed_startups fs on fs.startup_id = s.id
    where sr.is_active = true
      and (sr.expires_at is null or sr.expires_at > now())
    order by sr.posted_at desc
    limit 10
  )
  select entity_type, entity_id, entity_name, entity_image, change_description, priority_score, url
  from (
    select * from latest_posts
    union all
    select * from latest_roles
  ) x
  order by priority_score desc, sort_at desc
  limit 10;
$$;

create or replace function public.get_trending_hashtags(p_hours int default 24)
returns table (
  hashtag text,
  count int,
  velocity_pct int
)
language sql
stable
security definer
as $$
  with tags as (
    select lower(trim(value)) as tag
    from public.posts p, unnest(coalesce(p.hashtags, '{}'::text[])) value
    where p.created_at >= now() - make_interval(hours => greatest(1, p_hours))
    union all
    select lower(trim(value)) as tag
    from public.startup_posts sp, unnest(coalesce(sp.hashtags, '{}'::text[])) value
    where sp.published_at >= now() - make_interval(hours => greatest(1, p_hours))
    union all
    select lower(trim(value)) as tag
    from public.themed_posts tp, unnest(coalesce(tp.hashtags, '{}'::text[])) value
    where tp.published_at >= now() - make_interval(hours => greatest(1, p_hours))
  )
  select tag as hashtag, count(*)::int as count, 0::int as velocity_pct
  from tags
  where tag ~ '^[a-z0-9][a-z0-9_]{1,40}$'
  group by tag
  order by count(*) desc, tag asc
  limit 12;
$$;

grant select on public.role_views to authenticated;
grant insert on public.role_views to anon, authenticated;
grant select, update on public.api_keys to authenticated;
grant select on public.api_usage_log to authenticated;
grant select on public.apod_cache to anon, authenticated;
grant execute on function public.get_intel_digest(uuid) to authenticated;
grant execute on function public.get_trending_hashtags(int) to anon, authenticated;
