-- GALAXY GROUND MASTER BLUEPRINT PART 2 MIGRATION
-- Incorporates: Messaging, Live Hub, and Opportunity/Inspiration layers.

-- =========================================================================
-- PHASE 1: GATED MESSAGING TABLES & SCHEMAS
-- =========================================================================

-- Add messaging privacy columns to profiles if not exist
alter table public.profiles add column if not exists messaging_open_to text default 'everyone'
  check (messaging_open_to in ('everyone', 'followers', 'nobody'));

alter table public.profiles add column if not exists messaging_allowed_categories text[] default
  array['Collaboration','Investment Interest','Job Opportunity','Research','Question','Other']::text[];

alter table public.profiles add column if not exists show_online_status boolean default true;
alter table public.profiles add column if not exists last_seen_at timestamptz;
alter table public.profiles add column if not exists require_complete_profile_to_message boolean default false;
alter table public.profiles add column if not exists badges text[] default array[]::text[];

-- Message threads table
create table if not exists public.message_threads (
  id uuid primary key default gen_random_uuid(),
  participant_a uuid not null references public.profiles(user_id) on delete cascade,
  participant_b uuid not null references public.profiles(user_id) on delete cascade,
  created_at timestamptz default now(),
  last_message_at timestamptz default now(),
  participant_a_unread int default 0,
  participant_b_unread int default 0,
  constraint participants_ordered check (participant_a < participant_b),
  constraint unique_participants unique (participant_a, participant_b)
);

-- Connection requests (pre-accept)
create table if not exists public.connection_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(user_id) on delete cascade,
  recipient_id uuid not null references public.profiles(user_id) on delete cascade,
  intent_category text not null check (intent_category in (
    'Collaboration', 'Investment Interest', 'Job Opportunity',
    'Research', 'Question', 'Other'
  )),
  context_message text not null check (
    char_length(context_message) >= 20 and char_length(context_message) <= 300
  ),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'blocked')),
  thread_id uuid references public.message_threads(id) on delete set null,
  created_at timestamptz default now(),
  responded_at timestamptz,
  constraint unique_sender_recipient unique(sender_id, recipient_id)
);

-- Messages table
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.message_threads(id) on delete cascade,
  sender_id uuid not null references public.profiles(user_id) on delete cascade,
  content text not null check (char_length(content) >= 1 and char_length(content) <= 1000),
  media_url text,
  media_type text check (media_type in ('image', null)),
  read_at timestamptz,
  created_at timestamptz default now()
);

-- User blocks table
create table if not exists public.user_blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid not null references public.profiles(user_id) on delete cascade,
  blocked_id uuid not null references public.profiles(user_id) on delete cascade,
  created_at timestamptz default now(),
  constraint unique_block unique(blocker_id, blocked_id)
);

-- Enable RLS
alter table public.message_threads enable row level security;
alter table public.connection_requests enable row level security;
alter table public.messages enable row level security;
alter table public.user_blocks enable row level security;

do $$
begin
  begin
    alter publication supabase_realtime add table public.messages;
  exception
    when duplicate_object then null;
    when undefined_object then null;
  end;
end $$;

-- =========================================================================
-- PHASE 2: LIVE HUB TABLES
-- =========================================================================

-- Curated non-launch live events (admin-managed)
create table if not exists public.live_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  event_type text not null check (event_type in (
    'ISS Stream', 'Conference', 'Engine Test', 'Mission Broadcast',
    'Startup Demo', 'Astronomy Event', 'Agency Announcement', 'Other'
  )),
  description text,
  start_time timestamptz not null,
  end_time timestamptz,
  embed_url text,
  external_url text,
  related_topic_slug text, -- references topics(slug) if it exists, otherwise text
  related_startup_id uuid references public.startups(id) on delete set null,
  related_launch_id uuid, -- references launches(id) if it exists
  hashtags text[],
  thumbnail_url text,
  is_complete boolean default false,
  archive_summary text,
  vod_url text,
  created_by uuid references public.profiles(user_id) on delete set null,
  created_at timestamptz default now()
);

-- Event reminders
create table if not exists public.live_event_reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  event_type text not null check (event_type in ('launch', 'live_event')),
  event_id uuid not null,
  reminder_offset_minutes int not null check (reminder_offset_minutes in (0, 10, 30)),
  sent boolean default false,
  sent_at timestamptz,
  created_at timestamptz default now(),
  constraint unique_reminder unique(user_id, event_type, event_id, reminder_offset_minutes)
);

-- Enable RLS
alter table public.live_events enable row level security;
alter table public.live_event_reminders enable row level security;

-- =========================================================================
-- PHASE 3: OPPORTUNITY LAYER TABLES
-- =========================================================================

-- Open roles on startup profiles
create table if not exists public.startup_roles (
  id uuid primary key default gen_random_uuid(),
  startup_id uuid not null references public.startups(id) on delete cascade,
  title text not null,
  role_type text not null check (role_type in (
    'Full-time', 'Part-time', 'Internship', 'Contract', 'Volunteer'
  )),
  work_mode text not null check (work_mode in ('On-site', 'Remote', 'Hybrid')),
  location text,
  description text check (char_length(description) <= 200),
  apply_url text not null,
  is_active boolean default true,
  posted_at timestamptz default now(),
  expires_at timestamptz
);

-- Featured content for India in Space and other promotions
create table if not exists public.featured_content (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('india_in_space', 'spotlight', 'announcement')),
  content_type text not null check (content_type in (
    'post', 'startup_milestone', 'person_achievement', 'external_link'
  )),
  content_ref_id text,
  headline text not null,
  summary text,
  thumbnail_url text,
  link_url text,
  link_label text,
  is_active boolean default true,
  valid_from timestamptz default now(),
  valid_until timestamptz,
  sort_order int default 0,
  created_by uuid references public.profiles(user_id) on delete set null,
  created_at timestamptz default now()
);

-- Achievement badges audit trail
create table if not exists public.profile_badge_awards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  badge_type text not null check (badge_type in (
    'Space Pioneer', 'Startup Founder', 'Mission Contributor',
    'Top Educator', 'Community Builder'
  )),
  awarded_by text not null check (awarded_by in ('admin', 'auto_trigger')),
  award_reason text,
  awarded_at timestamptz default now()
);

-- Enable RLS
alter table public.startup_roles enable row level security;
alter table public.featured_content enable row level security;
alter table public.profile_badge_awards enable row level security;

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

-- Helper function to check if two users have an active block
create or replace function public.are_users_blocked(user_a uuid, user_b uuid)
returns boolean language sql security definer as $$
  select exists (
    select 1 from public.user_blocks
    where (blocker_id = user_a and blocked_id = user_b)
       or (blocker_id = user_b and blocked_id = user_a)
  );
$$;

-- Connection requests policies
create policy "Users can read their own connection requests"
  on public.connection_requests for select
  using (auth.uid() = sender_id or auth.uid() = recipient_id);

create policy "Sender can insert connection requests"
  on public.connection_requests for insert
  with check (
    auth.uid() = sender_id
    and sender_id != recipient_id
    -- rate limit: max 5 requests in last 24h
    and (
      select count(*) from public.connection_requests
      where sender_id = auth.uid()
      and created_at > now() - interval '24 hours'
    ) < 5
    -- check profile completion gate of recipient if required
    and (
      not exists (
        select 1 from public.profiles
        where user_id = recipient_id
        and require_complete_profile_to_message = true
      ) or (
        exists (
          select 1 from public.profiles
          where user_id = auth.uid()
          and bio is not null
          and avatar_url is not null
          and (select count(*) from public.posts where user_id = auth.uid()) >= 3
        )
      )
    )
    -- check recipient open-to policy
    and exists (
      select 1 from public.profiles
      where user_id = recipient_id
      and (
        messaging_open_to = 'everyone'
        or (messaging_open_to = 'followers' and exists (
          select 1 from public.follows
          where follower_id = recipient_id and target_type = 'user' and target_id = auth.uid()
        ))
      )
    )
    -- check blocked relationships
    and not public.are_users_blocked(sender_id, recipient_id)
  );

create policy "Recipient can update connection requests"
  on public.connection_requests for update
  using (auth.uid() = recipient_id)
  with check (status in ('accepted', 'declined', 'blocked'));

-- Message threads policies
create policy "Thread participants can view their threads"
  on public.message_threads for select
  using (
    (auth.uid() = participant_a or auth.uid() = participant_b)
    and not public.are_users_blocked(participant_a, participant_b)
  );

-- Messages policies
create policy "Thread participants can view messages"
  on public.messages for select
  using (
    exists (
      select 1 from public.message_threads
      where id = thread_id
      and (participant_a = auth.uid() or participant_b = auth.uid())
      and not public.are_users_blocked(participant_a, participant_b)
    )
  );

create or replace function public.check_message_rate_limit(p_thread_id uuid, p_sender_id uuid)
returns boolean language plpgsql security definer as $$
declare
  v_count int;
begin
  select count(*) into v_count
  from public.messages
  where thread_id = p_thread_id
    and sender_id = p_sender_id
    and created_at > now() - interval '1 hour';
  return v_count < 50;
end;
$$;

create policy "Thread participants can insert messages"
  on public.messages for insert
  with check (
    auth.uid() = sender_id
    and exists (
      select 1 from public.message_threads
      where id = thread_id
      and (participant_a = auth.uid() or participant_b = auth.uid())
      and not public.are_users_blocked(participant_a, participant_b)
    )
    and public.check_message_rate_limit(thread_id, auth.uid())
  );

-- Blocks policies
create policy "Blocker can view blocks"
  on public.user_blocks for select
  using (auth.uid() = blocker_id);

create policy "Blocker can insert blocks"
  on public.user_blocks for insert
  with check (auth.uid() = blocker_id and blocker_id != blocked_id);

create policy "Blocker can delete blocks"
  on public.user_blocks for delete
  using (auth.uid() = blocker_id);

-- Live events policies
create policy "Anyone can read active live events"
  on public.live_events for select
  using (true);

create policy "Admins can manage live events"
  on public.live_events for all
  using (
    exists (
      select 1 from public.profiles
      where user_id = auth.uid()
      and 'admin' = any(badges)
    )
  );

-- Live event reminders policies
create policy "Users can view and manage their reminders"
  on public.live_event_reminders for all
  using (auth.uid() = user_id);

-- Startup roles policies
create policy "Anyone can view active startup roles"
  on public.startup_roles for select
  using (is_active = true);

create policy "Admins and startup owners can manage roles"
  on public.startup_roles for all
  using (
    exists (
      select 1 from public.profiles
      where user_id = auth.uid()
      and 'admin' = any(badges)
    ) or exists (
      select 1 from public.startups
      where id = startup_id
      and claimed_by_user_id = auth.uid()
    )
  );

-- Featured content policies
create policy "Anyone can view active featured content"
  on public.featured_content for select
  using (is_active = true and valid_from <= now() and (valid_until is null or valid_until > now()));

create policy "Admins can manage featured content"
  on public.featured_content for all
  using (
    exists (
      select 1 from public.profiles
      where user_id = auth.uid()
      and 'admin' = any(badges)
    )
  );

-- Profile badge awards policies
create policy "Anyone can view badges"
  on public.profile_badge_awards for select
  using (true);

create policy "Admins can award badges"
  on public.profile_badge_awards for all
  using (
    exists (
      select 1 from public.profiles
      where user_id = auth.uid()
      and 'admin' = any(badges)
    )
  );

-- =========================================================================
-- DATABASE FUNCTIONS & RPCs
-- =========================================================================

-- Get thread for two users
create or replace function public.get_thread_for_users(user_a uuid, user_b uuid)
returns uuid language sql security definer as $$
  select id from public.message_threads
  where (participant_a = least(user_a, user_b) and participant_b = greatest(user_a, user_b))
  limit 1;
$$;

-- Mark thread as read for the current user
create or replace function public.mark_thread_read(p_thread_id uuid, p_user_id uuid)
returns void language plpgsql security definer as $$
begin
  -- Mark all messages from other user as read
  update public.messages
  set read_at = now()
  where thread_id = p_thread_id
  and sender_id != p_user_id
  and read_at is null;

  -- Reset appropriate participant's unread counter
  update public.message_threads
  set
    participant_a_unread = case when participant_a = p_user_id then 0 else participant_a_unread end,
    participant_b_unread = case when participant_b = p_user_id then 0 else participant_b_unread end
  where id = p_thread_id;
end;
$$;

-- Increment unread counts when a new message is inserted
create or replace function public.handle_new_message_unread()
returns trigger language plpgsql security definer as $$
begin
  update public.message_threads
  set
    participant_a_unread = case when participant_a != new.sender_id then participant_a_unread + 1 else participant_a_unread end,
    participant_b_unread = case when participant_b != new.sender_id then participant_b_unread + 1 else participant_b_unread end,
    last_message_at = now()
  where id = new.thread_id;
  return new;
end;
$$;

create trigger trigger_on_message_insert
  after insert on public.messages
  for each row execute function public.handle_new_message_unread();

-- Atomically accept a connection request and create a thread (RPC equivalent of Edge function)
create or replace function public.accept_connection_rpc(p_request_id uuid)
returns uuid language plpgsql security definer as $$
declare
  v_request record;
  v_thread_id uuid;
  v_part_a uuid;
  v_part_b uuid;
  v_recipient_profile record;
begin
  -- Fetch connection request
  select * into v_request from public.connection_requests where id = p_request_id;
  if not found then
    raise exception 'Connection request not found';
  end if;

  if v_request.status != 'pending' then
    raise exception 'Connection request is not pending';
  end if;

  -- Verify current user is recipient
  if auth.uid() != v_request.recipient_id then
    raise exception 'Unauthorized to accept this request';
  end if;

  -- Determine ordered participants
  v_part_a := least(v_request.sender_id, v_request.recipient_id);
  v_part_b := greatest(v_request.sender_id, v_request.recipient_id);

  -- Insert or fetch message thread
  insert into public.message_threads (participant_a, participant_b, created_at, last_message_at)
  values (v_part_a, v_part_b, now(), now())
  on conflict (participant_a, participant_b) do update
    set last_message_at = now()
  returning id into v_thread_id;

  -- Update request status
  update public.connection_requests
  set status = 'accepted', thread_id = v_thread_id, responded_at = now()
  where id = p_request_id;

  -- Fetch recipient details
  select display_name, username into v_recipient_profile from public.profiles where user_id = v_request.recipient_id;

  -- Insert system notification for the sender with correct columns
  insert into public.notifications (
    user_id,
    kind,
    account_type,
    account_id,
    account_name,
    account_handle,
    title,
    preview,
    link,
    read,
    created_at
  )
  values (
    v_request.sender_id,
    'connection_accepted',
    'user',
    v_request.recipient_id,
    coalesce(v_recipient_profile.display_name, 'Someone'),
    v_recipient_profile.username,
    'Connection Request Accepted',
    coalesce(v_recipient_profile.display_name, 'Someone') || ' accepted your connection request.',
    '/messages/' || v_thread_id,
    false,
    now()
  );

  return v_thread_id;
end;
$$;

-- Block a user and sever connection threads (RPC equivalent of Edge function)
create or replace function public.block_user_rpc(p_blocked_id uuid)
returns void language plpgsql security definer as $$
declare
  v_blocker_id uuid;
  v_blocker_profile record;
begin
  v_blocker_id := auth.uid();
  if v_blocker_id = p_blocked_id then
    raise exception 'Cannot block yourself';
  end if;

  -- Insert user block row
  insert into public.user_blocks (blocker_id, blocked_id, created_at)
  values (v_blocker_id, p_blocked_id, now())
  on conflict do nothing;

  -- Sever connection requests
  update public.connection_requests
  set status = 'blocked', responded_at = now()
  where (sender_id = v_blocker_id and recipient_id = p_blocked_id)
     or (sender_id = p_blocked_id and recipient_id = v_blocker_id);

  -- Fetch blocker profile
  select display_name, username into v_blocker_profile from public.profiles where user_id = v_blocker_id;

  -- Create soft notification for the blocked user (to tell them they cannot message this person)
  insert into public.notifications (
    user_id,
    kind,
    account_type,
    account_id,
    account_name,
    account_handle,
    title,
    preview,
    read,
    created_at
  )
  values (
    p_blocked_id,
    'block_alert',
    'user',
    v_blocker_id,
    coalesce(v_blocker_profile.display_name, 'Someone'),
    v_blocker_profile.username,
    'Block Alert',
    'You cannot message this person.',
    false,
    now()
  );
end;
$$;

-- Get live status function for Live Hub
create or replace function public.get_live_status()
returns table (
  is_something_live boolean,
  live_event_id uuid,
  live_event_title text,
  live_event_type text,
  live_event_embed_url text,
  next_event_id uuid,
  next_event_title text,
  next_event_start timestamptz,
  minutes_until_next int
) language plpgsql security definer as $$
declare
  v_live_launch_id uuid;
  v_live_launch_title text;
  v_live_launch_embed text;

  v_live_event_id uuid;
  v_live_event_title text;
  v_live_event_embed text;
  v_live_event_type text;

  v_next_id uuid;
  v_next_title text;
  v_next_start timestamptz;
begin
  -- 1. Check for live launches
  -- Check if launches table exists
  if exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'launches') then
    execute '
      select id, name, livestream_url
      from public.launches
      where launch_date between now() - interval ''15 minutes'' and now() + interval ''2 hours''
        and status = ''scheduled''
      order by launch_date asc limit 1
    ' into v_live_launch_id, v_live_launch_title, v_live_launch_embed;
  end if;

  -- 2. Check for active curated live events
  select id, title, embed_url, event_type::text
  into v_live_event_id, v_live_event_title, v_live_event_embed, v_live_event_type
  from public.live_events
  where start_time <= now() and (end_time is null or end_time > now()) and not is_complete
  order by start_time asc limit 1;

  -- 3. Determine next event (curated or launch)
  -- Find curated next event
  select id, title, start_time into v_next_id, v_next_title, v_next_start
  from public.live_events
  where start_time > now() and not is_complete
  order by start_time asc limit 1;

  -- Compare with next launch if launches table exists
  if exists (select 1 from pg_tables where schemaname = 'public' and tablename = 'launches') then
    declare
      v_launch_id uuid;
      v_launch_title text;
      v_launch_start timestamptz;
    begin
      execute '
        select id, name, launch_date
        from public.launches
        where launch_date > now() and status in (''scheduled'', ''announced'')
        order by launch_date asc limit 1
      ' into v_launch_id, v_launch_title, v_launch_start;

      if v_launch_start is not null and (v_next_start is null or v_launch_start < v_next_start) then
        v_next_id := v_launch_id;
        v_next_title := v_launch_title;
        v_next_start := v_launch_start;
      end if;
    end;
  end if;

  -- Output results
  is_something_live := (v_live_launch_id is not null) or (v_live_event_id is not null);
  live_event_id := coalesce(v_live_launch_id, v_live_event_id);
  live_event_title := coalesce(v_live_launch_title, v_live_event_title);
  live_event_type := coalesce('launch', v_live_event_type);
  live_event_embed_url := coalesce(v_live_launch_embed, v_live_event_embed);
  next_event_id := v_next_id;
  next_event_title := v_next_title;
  next_event_start := v_next_start;
  minutes_until_next := extract(epoch from v_next_start - now())::int / 60;
  
  return next;
end;
$$;

-- =========================================================================
-- PHASE 3: AUTOMATED ACHIEVEMENT BADGE TRIGGERS
-- =========================================================================

-- Trigger to award Startup Founder badge on claim approval
create or replace function public.handle_startup_claim_badge()
returns trigger language plpgsql security definer as $$
begin
  if new.claimed_by_user_id is not null and (old.claimed_by_user_id is null or new.claimed_by_user_id != old.claimed_by_user_id) then
    -- Award badge row
    insert into public.profile_badge_awards (user_id, badge_type, awarded_by, award_reason)
    values (new.claimed_by_user_id, 'Startup Founder', 'auto_trigger', 'Claimed ownership of startup profile: ' || new.name)
    on conflict do nothing;

    -- Update denormalized array on profiles
    update public.profiles
    set badges = array_append(coalesce(badges, array[]::text[]), 'Startup Founder')
    where user_id = new.claimed_by_user_id
    and not ('Startup Founder' = any(coalesce(badges, array[]::text[])));
  end if;
  return new;
end;
$$;

create trigger trigger_startup_claim_badge
  after update on public.startups
  for each row execute function public.handle_startup_claim_badge();

-- Trigger for followers (Top Educator badge at 1000 followers)
create or replace function public.handle_followers_badge_trigger()
returns trigger language plpgsql security definer as $$
declare
  v_follower_count int;
  v_target_id uuid;
begin
  v_target_id := new.target_id::uuid;
  
  -- Calculate followers
  select count(*) into v_follower_count
  from public.follows
  where target_id = v_target_id::text
  and target_type = 'user';

  if v_follower_count >= 1000 then
    insert into public.profile_badge_awards (user_id, badge_type, awarded_by, award_reason)
    values (v_target_id, 'Top Educator', 'auto_trigger', 'Reached 1,000 platform followers.')
    on conflict do nothing;

    update public.profiles
    set badges = array_append(coalesce(badges, array[]::text[]), 'Top Educator')
    where user_id = v_target_id
    and not ('Top Educator' = any(coalesce(badges, array[]::text[])));
  end if;
  return new;
end;
$$;

create trigger trigger_followers_badge
  after insert on public.follows
  for each row
  when (new.target_type = 'user')
  execute function public.handle_followers_badge_trigger();

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
