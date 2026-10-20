-- Galaxy Ground Phase B remote repair.
-- Purpose:
-- - Fix browser 401s on launches/topics/courses caused by missing grants/RLS policies.
-- - Fix browser 404 on community_memberships when the simplified Supabase script did not create it.
-- - Add missing Phase B columns/tables without deleting existing data.
--
-- Run this in Supabase SQL Editor for project lmdswaagcdxulcczkqmu.

-- ---------------------------------------------------------------------------
-- 1. Core Phase B tables. These are safe if they already exist.
-- ---------------------------------------------------------------------------

create table if not exists public.launches (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  provider text not null,
  mission_type text,
  launch_date timestamptz not null,
  launch_window_start timestamptz,
  launch_window_end timestamptz,
  location text,
  vehicle text,
  payload text,
  status text not null default 'scheduled',
  description text,
  image_url text,
  livestream_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.launch_updates (
  id uuid primary key default gen_random_uuid(),
  launch_id uuid not null references public.launches(id) on delete cascade,
  update_type text not null default 'news',
  title text not null,
  summary text,
  source_url text,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.launch_sources (
  id uuid primary key default gen_random_uuid(),
  launch_id uuid not null references public.launches(id) on delete cascade,
  source_name text not null,
  source_type text not null default 'agency',
  url text,
  trust_level int not null default 100,
  created_at timestamptz not null default now()
);

create table if not exists public.launch_related_posts (
  id uuid primary key default gen_random_uuid(),
  launch_id uuid not null references public.launches(id) on delete cascade,
  post_id text not null,
  post_source text not null check (post_source in ('user','startup','themed')),
  relevance_score numeric default 1,
  created_at timestamptz not null default now(),
  unique (launch_id, post_id, post_source)
);

create table if not exists public.launch_entities (
  id uuid primary key default gen_random_uuid(),
  launch_id uuid not null references public.launches(id) on delete cascade,
  entity_type text not null,
  entity_id text not null,
  relationship_type text not null default 'related',
  created_at timestamptz not null default now()
);

create table if not exists public.topics (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  category text,
  subtitle text,
  hero_image text,
  description text,
  canonical_summary text,
  hashtags text[] not null default '{}',
  freshness_label text,
  source_class_label text,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.topic_sections (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topics(id) on delete cascade,
  section_type text not null,
  title text not null,
  summary text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.topic_facts (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topics(id) on delete cascade,
  label text not null,
  value text not null,
  source text,
  confidence int default 100,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.topic_timeline_events (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topics(id) on delete cascade,
  event_date date,
  title text not null,
  description text,
  event_type text default 'milestone',
  source_url text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.topic_sources (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topics(id) on delete cascade,
  source_type text not null default 'agency',
  source_name text not null,
  url text,
  trust_level int not null default 100,
  created_at timestamptz not null default now()
);

create table if not exists public.topic_updates (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topics(id) on delete cascade,
  title text not null,
  summary text,
  source_url text,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.topic_discoveries (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topics(id) on delete cascade,
  discovery_type text,
  title text not null,
  summary text,
  source_url text,
  published_at timestamptz,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.communities (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  icon text default '🛰️',
  themed_categories text[] not null default '{}',
  startup_category_matches text[] not null default '{}',
  hashtag_matches text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.community_memberships (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  unique (community_id, user_id)
);

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  summary text,
  category text,
  level text not null default 'Beginner',
  duration_label text,
  learner_count_label text,
  rating numeric default 4.8,
  is_free boolean not null default true,
  is_premium_ready boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.course_modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.course_lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  module_id uuid references public.course_modules(id) on delete set null,
  title text not null,
  video_url text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.course_enrollments (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  enrolled_at timestamptz not null default now(),
  unique (course_id, user_id)
);

create table if not exists public.course_progress (
  id uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.course_enrollments(id) on delete cascade,
  lesson_id uuid not null references public.course_lessons(id) on delete cascade,
  completed_at timestamptz not null default now(),
  unique (enrollment_id, lesson_id)
);

-- ---------------------------------------------------------------------------
-- 2. Repair simplified tables created by earlier partial SQL.
-- ---------------------------------------------------------------------------

alter table public.courses add column if not exists is_free boolean not null default true;
alter table public.courses add column if not exists is_premium_ready boolean not null default false;
alter table public.courses add column if not exists sort_order int not null default 0;
alter table public.courses add column if not exists updated_at timestamptz not null default now();

alter table public.launches add column if not exists livestream_url text;
alter table public.launches add column if not exists image_url text;
alter table public.launches add column if not exists updated_at timestamptz not null default now();

alter table public.topics add column if not exists canonical_summary text;
alter table public.topics add column if not exists hashtags text[] not null default '{}';
alter table public.topics add column if not exists updated_at timestamptz not null default now();

-- ---------------------------------------------------------------------------
-- 3. RLS, grants, and policies. This is the important 401/404 browser fix.
-- ---------------------------------------------------------------------------

alter table public.launches enable row level security;
alter table public.launch_updates enable row level security;
alter table public.launch_sources enable row level security;
alter table public.launch_related_posts enable row level security;
alter table public.launch_entities enable row level security;
alter table public.topics enable row level security;
alter table public.topic_sections enable row level security;
alter table public.topic_facts enable row level security;
alter table public.topic_timeline_events enable row level security;
alter table public.topic_sources enable row level security;
alter table public.topic_updates enable row level security;
alter table public.topic_discoveries enable row level security;
alter table public.communities enable row level security;
alter table public.community_memberships enable row level security;
alter table public.courses enable row level security;
alter table public.course_modules enable row level security;
alter table public.course_lessons enable row level security;
alter table public.course_enrollments enable row level security;
alter table public.course_progress enable row level security;

grant usage on schema public to anon, authenticated;

grant select on public.launches to anon, authenticated;
grant select on public.launch_updates to anon, authenticated;
grant select on public.launch_sources to anon, authenticated;
grant select on public.launch_related_posts to anon, authenticated;
grant select on public.launch_entities to anon, authenticated;
grant select on public.topics to anon, authenticated;
grant select on public.topic_sections to anon, authenticated;
grant select on public.topic_facts to anon, authenticated;
grant select on public.topic_timeline_events to anon, authenticated;
grant select on public.topic_sources to anon, authenticated;
grant select on public.topic_updates to anon, authenticated;
grant select on public.topic_discoveries to anon, authenticated;
grant select on public.communities to anon, authenticated;
grant select on public.community_memberships to anon, authenticated;
grant select, insert, delete on public.community_memberships to authenticated;
grant select on public.courses to anon, authenticated;
grant select on public.course_modules to anon, authenticated;
grant select on public.course_lessons to anon, authenticated;
grant select, insert on public.course_enrollments to authenticated;
grant select, insert on public.course_progress to authenticated;

drop policy if exists "Public read launches" on public.launches;
create policy "Public read launches" on public.launches for select to anon, authenticated using (true);

drop policy if exists "Public read launch_updates" on public.launch_updates;
create policy "Public read launch_updates" on public.launch_updates for select to anon, authenticated using (true);

drop policy if exists "Public read launch_sources" on public.launch_sources;
create policy "Public read launch_sources" on public.launch_sources for select to anon, authenticated using (true);

drop policy if exists "Public read launch_related_posts" on public.launch_related_posts;
create policy "Public read launch_related_posts" on public.launch_related_posts for select to anon, authenticated using (true);

drop policy if exists "Public read launch_entities" on public.launch_entities;
create policy "Public read launch_entities" on public.launch_entities for select to anon, authenticated using (true);

drop policy if exists "Public read topics" on public.topics;
create policy "Public read topics" on public.topics for select to anon, authenticated using (true);

drop policy if exists "Public read topic_sections" on public.topic_sections;
create policy "Public read topic_sections" on public.topic_sections for select to anon, authenticated using (true);

drop policy if exists "Public read topic_facts" on public.topic_facts;
create policy "Public read topic_facts" on public.topic_facts for select to anon, authenticated using (true);

drop policy if exists "Public read topic_timeline_events" on public.topic_timeline_events;
create policy "Public read topic_timeline_events" on public.topic_timeline_events for select to anon, authenticated using (true);

drop policy if exists "Public read topic_sources" on public.topic_sources;
create policy "Public read topic_sources" on public.topic_sources for select to anon, authenticated using (true);

drop policy if exists "Public read topic_updates" on public.topic_updates;
create policy "Public read topic_updates" on public.topic_updates for select to anon, authenticated using (true);

drop policy if exists "Public read topic_discoveries" on public.topic_discoveries;
create policy "Public read topic_discoveries" on public.topic_discoveries for select to anon, authenticated using (true);

drop policy if exists "Public read communities" on public.communities;
create policy "Public read communities" on public.communities for select to anon, authenticated using (true);

drop policy if exists "Public read community_memberships" on public.community_memberships;
create policy "Public read community_memberships" on public.community_memberships for select to anon, authenticated using (true);

drop policy if exists "Users join communities" on public.community_memberships;
create policy "Users join communities" on public.community_memberships for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Users leave communities" on public.community_memberships;
create policy "Users leave communities" on public.community_memberships for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "Public read courses" on public.courses;
create policy "Public read courses" on public.courses for select to anon, authenticated using (true);

drop policy if exists "Public read course_modules" on public.course_modules;
create policy "Public read course_modules" on public.course_modules for select to anon, authenticated using (true);

drop policy if exists "Public read course_lessons" on public.course_lessons;
create policy "Public read course_lessons" on public.course_lessons for select to anon, authenticated using (true);

drop policy if exists "Users read own enrollments" on public.course_enrollments;
create policy "Users read own enrollments" on public.course_enrollments for select to authenticated using (auth.uid() = user_id);

drop policy if exists "Users enroll in courses" on public.course_enrollments;
create policy "Users enroll in courses" on public.course_enrollments for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "Users read own progress" on public.course_progress;
create policy "Users read own progress" on public.course_progress for select to authenticated
using (exists (select 1 from public.course_enrollments e where e.id = enrollment_id and e.user_id = auth.uid()));

drop policy if exists "Users write own progress" on public.course_progress;
create policy "Users write own progress" on public.course_progress for insert to authenticated
with check (exists (select 1 from public.course_enrollments e where e.id = enrollment_id and e.user_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- 4. Minimal seeds expected by the frontend. Existing rows are preserved.
-- ---------------------------------------------------------------------------

insert into public.launches (slug, name, provider, vehicle, launch_date, location, payload, status, description)
values
  ('isro-gaganyaan-g1', 'Gaganyaan G1', 'ISRO', 'LVM3', '2026-07-15T04:30:00Z', 'Satish Dhawan Space Centre, India', 'Uncrewed orbital test flight', 'scheduled', 'Uncrewed flight test for India''s human spaceflight program, validating systems needed before future crewed missions.'),
  ('spacex-starship-flight-test', 'Starship Flight Test', 'SpaceX', 'Starship', '2026-08-02T12:00:00Z', 'Starbase, Texas', 'Integrated vehicle test', 'announced', 'Integrated Starship and Super Heavy test campaign focused on reusability, ascent performance, and recovery operations.'),
  ('rocket-lab-neutron-demo', 'Neutron Demo Mission', 'Rocket Lab', 'Neutron', '2026-09-10T16:00:00Z', 'Wallops Island, Virginia', 'Reusable medium-lift demonstration', 'scheduled', 'Technology demonstration for Rocket Lab''s reusable medium-lift vehicle aimed at constellation and national security missions.'),
  ('ariane-6-commercial-rideshare', 'Ariane 6 Commercial Rideshare', 'Arianespace', 'Ariane 6', '2026-10-21T19:15:00Z', 'Guiana Space Centre, French Guiana', 'Commercial rideshare payloads', 'announced', 'Commercial rideshare mission expanding Ariane 6 launch cadence for institutional and private small satellite customers.'),
  ('blue-origin-new-glenn-mission', 'New Glenn Customer Mission', 'Blue Origin', 'New Glenn', '2026-11-18T13:00:00Z', 'LC-36, Cape Canaveral', 'Commercial payload', 'announced', 'Heavy-lift commercial mission targeting reusable first-stage operations and large payload delivery to orbit.')
on conflict (slug) do update set
  name = excluded.name,
  provider = excluded.provider,
  vehicle = excluded.vehicle,
  launch_date = excluded.launch_date,
  location = excluded.location,
  payload = excluded.payload,
  status = excluded.status,
  description = excluded.description,
  updated_at = now();

insert into public.topics (slug, title, category, subtitle, hero_image, description, freshness_label, source_class_label, hashtags)
values
  ('mars', 'Mars', 'planet', 'Planetary exploration', 'https://images.unsplash.com/photo-1614728263952-84ea256f9679?w=900&q=80', 'A living research target for rover science, sample-return planning, human mission design, and in-situ resource studies.', 'Evergreen profile with mission-watch updates', 'Agency and observatory sources', array['mars','planetaryscience','rovers']),
  ('moon', 'The Moon', 'moon', 'Crewed return and lunar economy', 'https://images.unsplash.com/photo-1522030299830-16b8d3d049fe?w=900&q=80', 'Earth''s nearest world is becoming a testbed for landing systems, surface power, habitats, communications, and science operations.', 'Watchlist for Artemis and commercial lunar missions', 'Official mission sources', array['moon','artemis','lunar']),
  ('iss', 'ISS', 'station', 'Orbital laboratory', 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=900&q=80', 'A long-duration platform for microgravity science, commercial spaceflight operations, life-support research, and international crew missions.', 'Operational topic with frequent crew and cargo updates', 'Agency operations sources', array['iss','microgravity','humanflight']),
  ('jupiter', 'Jupiter', 'planet', 'Gas giant system', 'https://images.unsplash.com/photo-1630839437035-dac17da580d0?w=900&q=80', 'A complex planetary system whose moons, magnetic field, and atmosphere reveal how giant planets shape habitability zones.', 'Evergreen profile with mission context', 'Planetary science sources', array['jupiter','europa','planetaryscience'])
on conflict (slug) do update set
  title = excluded.title,
  subtitle = excluded.subtitle,
  hero_image = excluded.hero_image,
  description = excluded.description,
  freshness_label = excluded.freshness_label,
  source_class_label = excluded.source_class_label,
  hashtags = excluded.hashtags,
  updated_at = now();

insert into public.communities (slug, name, description, icon, themed_categories, startup_category_matches, hashtag_matches)
values
  ('astrophotography', 'Astrophotography', 'Capture the cosmos. Deep-sky, planetary, and wide-field shots - gear talk, processing tips and clear skies.', '📷', array['Astrophotography'], '{}', array['astrophotography','nebula','galaxy','milkyway','moon','stars']),
  ('rocket-engineering', 'Rocket Engineering', 'Propulsion, structures, GNC and avionics. Hardware-rich discussion for builders and engineers.', '🚀', array['Rocket Engineering'], array['launch','rocket','propulsion'], array['rocket','propulsion','launch','engine','thrust','orbit']),
  ('space-policy', 'Space Policy & Law', 'Treaties, regulation, commercial frameworks and geopolitics of the new space age.', '⚖️', array['Space Policy and Law'], '{}', array['spacepolicy','spacelaw','regulation','treaty']),
  ('astrobiology', 'Astrobiology', 'Search for life beyond Earth - biosignatures, extremophiles, exoplanet atmospheres.', '🧬', array['Astrobiology'], '{}', array['astrobiology','life','extremophile','exoplanet','habitable']),
  ('mass-society', 'Mass Society', 'The cultural and societal side of space - exploration, education, and community.', '🌍', array['Mass Society'], '{}', array['space','education','community','exploration']),
  ('satellite-tech', 'Satellite Tech', 'CubeSats, mega-constellations, remote sensing, and smallsat engineering.', '🛰️', array['Satellite Tech'], array['satellite','earth observation','geospatial','smallsat'], array['satellite','earthobservation','communication','orbit']),
  ('indian-space-program', 'Indian Space Program', 'ISRO, Skyroot, Agnikul, and the growing Indian private space ecosystem.', '🇮🇳', array['Indian Space Program'], '{}', array['isro','india','chandrayaan','gaganyaan','pslv','gslv']),
  ('deep-space-exploration', 'Deep Space Exploration', 'Interplanetary missions, deep-space probes, and the future of space travel.', '🌌', array['Deep Space Exploration'], '{}', array['deepspace','probe','interstellar','voyager','jupiter','saturn'])
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  icon = excluded.icon,
  themed_categories = excluded.themed_categories,
  startup_category_matches = excluded.startup_category_matches,
  hashtag_matches = excluded.hashtag_matches,
  updated_at = now();

insert into public.courses (slug, title, summary, category, level, duration_label, learner_count_label, rating, sort_order, is_free)
values
  ('rocket-propulsion-fundamentals', 'Rocket Propulsion Fundamentals', 'A guided path through thrust, specific impulse, combustion chambers, electric propulsion, and mission tradeoffs.', 'Rocket Engineering', 'Intermediate', '12 hours', '8.2k', 4.8, 1, true),
  ('orbital-mechanics-101', 'Orbital Mechanics 101', 'Build intuition for Keplerian orbits, transfer windows, delta-v budgets, rendezvous, and mission planning.', 'Orbital Mechanics', 'Beginner', '8 hours', '12.4k', 4.9, 2, true),
  ('satellite-systems', 'Satellite Systems', 'Understand spacecraft subsystems from payload and power to thermal control, ADCS, communications, and operations.', 'Satellite Systems', 'Advanced', '20 hours', '5.1k', 4.7, 3, true)
on conflict (slug) do update set
  title = excluded.title,
  summary = excluded.summary,
  category = excluded.category,
  level = excluded.level,
  duration_label = excluded.duration_label,
  learner_count_label = excluded.learner_count_label,
  rating = excluded.rating,
  sort_order = excluded.sort_order,
  is_free = excluded.is_free,
  updated_at = now();

-- ---------------------------------------------------------------------------
-- 5. Verification.
-- ---------------------------------------------------------------------------

select 'launches' as table_name, count(*) from public.launches
union all select 'topics', count(*) from public.topics
union all select 'communities', count(*) from public.communities
union all select 'community_memberships', count(*) from public.community_memberships
union all select 'courses', count(*) from public.courses
union all select 'course_modules', count(*) from public.course_modules
union all select 'course_lessons', count(*) from public.course_lessons;
