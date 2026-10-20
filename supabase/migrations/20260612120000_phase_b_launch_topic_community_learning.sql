-- Phase B/C backend: launches, explore topics, community memberships, free learning paths.
-- Safe to run multiple times (idempotent guards where possible).

-- ---------------------------------------------------------------------------
-- LAUNCHPAD
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
  status text not null default 'scheduled'
    check (status in ('announced','scheduled','delayed','in_preparation','launched','completed','scrubbed','failed','archived')),
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

-- ---------------------------------------------------------------------------
-- EXPLORE / TOPICS
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- COMMUNITIES / ORBITS
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- LEARNING (free paths only — no payments)
-- ---------------------------------------------------------------------------
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
-- RLS
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

do $$ begin
  create policy "Public read launches" on public.launches for select to anon, authenticated using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Public read launch_updates" on public.launch_updates for select to anon, authenticated using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Public read launch_sources" on public.launch_sources for select to anon, authenticated using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Public read launch_related_posts" on public.launch_related_posts for select to anon, authenticated using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Public read launch_entities" on public.launch_entities for select to anon, authenticated using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Public read topics" on public.topics for select to anon, authenticated using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Public read topic_sections" on public.topic_sections for select to anon, authenticated using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Public read topic_facts" on public.topic_facts for select to anon, authenticated using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Public read topic_timeline_events" on public.topic_timeline_events for select to anon, authenticated using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Public read topic_sources" on public.topic_sources for select to anon, authenticated using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Public read topic_updates" on public.topic_updates for select to anon, authenticated using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Public read topic_discoveries" on public.topic_discoveries for select to anon, authenticated using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Public read communities" on public.communities for select to anon, authenticated using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Public read community_memberships" on public.community_memberships for select to anon, authenticated using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Users join communities" on public.community_memberships for insert to authenticated with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Users leave communities" on public.community_memberships for delete to authenticated using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Public read courses" on public.courses for select to anon, authenticated using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Public read course_modules" on public.course_modules for select to anon, authenticated using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Public read course_lessons" on public.course_lessons for select to anon, authenticated using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Users read own enrollments" on public.course_enrollments for select to authenticated using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Users enroll in courses" on public.course_enrollments for insert to authenticated with check (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Users read own progress" on public.course_progress for select to authenticated
    using (exists (select 1 from public.course_enrollments e where e.id = enrollment_id and e.user_id = auth.uid()));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Users write own progress" on public.course_progress for insert to authenticated
    with check (exists (select 1 from public.course_enrollments e where e.id = enrollment_id and e.user_id = auth.uid()));
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- SEED: launches (matches src/lib/launches.ts)
-- ---------------------------------------------------------------------------
insert into public.launches (slug, name, provider, vehicle, launch_date, location, payload, status, description)
values
  ('isro-gaganyaan-g1', 'Gaganyaan G1', 'ISRO', 'LVM3', '2026-07-15T04:30:00Z', 'Satish Dhawan Space Centre, India', 'Uncrewed orbital test flight', 'scheduled',
   'Uncrewed flight test for India''s human spaceflight program, validating systems needed before future crewed missions.'),
  ('spacex-starship-flight-test', 'Starship Flight Test', 'SpaceX', 'Starship', '2026-08-02T12:00:00Z', 'Starbase, Texas', 'Integrated vehicle test', 'announced',
   'Integrated Starship and Super Heavy test campaign focused on reusability, ascent performance, and recovery operations.'),
  ('rocket-lab-neutron-demo', 'Neutron Demo Mission', 'Rocket Lab', 'Neutron', '2026-09-10T16:00:00Z', 'Wallops Island, Virginia', 'Reusable medium-lift demonstration', 'scheduled',
   'Technology demonstration for Rocket Lab''s reusable medium-lift vehicle aimed at constellation and national security missions.'),
  ('ariane-6-commercial-rideshare', 'Ariane 6 Commercial Rideshare', 'Arianespace', 'Ariane 6', '2026-10-21T19:15:00Z', 'Guiana Space Centre, French Guiana', 'Commercial rideshare payloads', 'announced',
   'Commercial rideshare mission expanding Ariane 6 launch cadence for institutional and private small satellite customers.'),
  ('blue-origin-new-glenn-mission', 'New Glenn Customer Mission', 'Blue Origin', 'New Glenn', '2026-11-18T13:00:00Z', 'LC-36, Cape Canaveral', 'Commercial payload', 'announced',
   'Heavy-lift commercial mission targeting reusable first-stage operations and large payload delivery to orbit.')
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

-- Launch updates seed for Gaganyaan
insert into public.launch_updates (launch_id, update_type, title, summary, published_at)
select l.id, 'official', 'Mission tracking initialized', 'Galaxy Ground is monitoring the planned Gaganyaan G1 window.', now() - interval '2 days'
from public.launches l where l.slug = 'isro-gaganyaan-g1'
and not exists (select 1 from public.launch_updates u where u.launch_id = l.id and u.title = 'Mission tracking initialized');

insert into public.launch_sources (launch_id, source_name, source_type, url, trust_level)
select l.id, 'ISRO', 'agency', 'https://www.isro.gov.in/', 100
from public.launches l where l.slug = 'isro-gaganyaan-g1'
and not exists (select 1 from public.launch_sources s where s.launch_id = l.id and s.source_name = 'ISRO');

-- ---------------------------------------------------------------------------
-- SEED: topics (matches ExplorePage static cards)
-- ---------------------------------------------------------------------------
insert into public.topics (slug, title, category, subtitle, hero_image, description, freshness_label, source_class_label, hashtags)
values
  ('mars', 'Mars', 'planet', 'Planetary exploration',
   'https://images.unsplash.com/photo-1614728263952-84ea256f9679?w=900&q=80',
   'A living research target for rover science, sample-return planning, human mission design, and in-situ resource studies.',
   'Evergreen profile with mission-watch updates', 'Agency and observatory sources', array['mars','planetaryscience','rovers']),
  ('moon', 'The Moon', 'moon', 'Crewed return and lunar economy',
   'https://images.unsplash.com/photo-1522030299830-16b8d3d049fe?w=900&q=80',
   'Earth''s nearest world is becoming a testbed for landing systems, surface power, habitats, communications, and science operations.',
   'Watchlist for Artemis and commercial lunar missions', 'Official mission sources', array['moon','artemis','lunar']),
  ('iss', 'ISS', 'station', 'Orbital laboratory',
   'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=900&q=80',
   'A long-duration platform for microgravity science, commercial spaceflight operations, life-support research, and international crew missions.',
   'Operational topic with frequent crew and cargo updates', 'Agency operations sources', array['iss','microgravity','humanflight']),
  ('jupiter', 'Jupiter', 'planet', 'Gas giant system',
   'https://images.unsplash.com/photo-1630839437035-dac17da580d0?w=900&q=80',
   'A complex planetary system whose moons, magnetic field, and atmosphere reveal how giant planets shape habitability zones.',
   'Evergreen profile with mission context', 'Planetary science sources', array['jupiter','europa','planetaryscience'])
on conflict (slug) do update set
  title = excluded.title,
  subtitle = excluded.subtitle,
  hero_image = excluded.hero_image,
  description = excluded.description,
  freshness_label = excluded.freshness_label,
  source_class_label = excluded.source_class_label,
  hashtags = excluded.hashtags,
  updated_at = now();

-- Mars facts
insert into public.topic_facts (topic_id, label, value, source, sort_order)
select t.id, v.label, v.value, 'NASA', v.ord
from public.topics t
cross join (values ('Diameter','6,779 km',1),('Gravity','3.72 m/s2',2),('Moons','2',3)) as v(label, value, ord)
where t.slug = 'mars'
and not exists (select 1 from public.topic_facts f where f.topic_id = t.id and f.label = v.label);

insert into public.topic_timeline_events (topic_id, title, sort_order)
select t.id, e.title, e.ord
from public.topics t
cross join (values ('Mariner flybys',1),('Viking landers',2),('Spirit and Opportunity',3),('Curiosity and Perseverance',4)) as e(title, ord)
where t.slug = 'mars'
and not exists (select 1 from public.topic_timeline_events ev where ev.topic_id = t.id and ev.title = e.title);

insert into public.topic_sections (topic_id, section_type, title, summary, sort_order)
select t.id, 'research', 'Research Focus', item, ord
from public.topics t
cross join (values ('Habitability studies',1),('Sample caching',2),('Atmospheric loss',3),('ISRU experiments',4)) as r(item, ord)
where t.slug = 'mars'
and not exists (select 1 from public.topic_sections s where s.topic_id = t.id and s.section_type = 'research' and s.title = r.item);

insert into public.topic_discoveries (topic_id, title, sort_order)
select t.id, d.title, d.ord
from public.topics t
cross join (values ('Ancient water signatures',1),('Seasonal atmospheric cycles',2),('Subsurface ice evidence',3)) as d(title, ord)
where t.slug = 'mars'
and not exists (select 1 from public.topic_discoveries di where di.topic_id = t.id and di.title = d.title);

-- Moon facts/timeline/research/discoveries
insert into public.topic_facts (topic_id, label, value, source, sort_order)
select t.id, v.label, v.value, 'NASA', v.ord
from public.topics t
cross join (values ('Diameter','3,474 km',1),('Gravity','1.62 m/s2',2),('Distance','384,400 km',3)) as v(label, value, ord)
where t.slug = 'moon'
and not exists (select 1 from public.topic_facts f where f.topic_id = t.id and f.label = v.label);

insert into public.topic_timeline_events (topic_id, title, sort_order)
select t.id, e.title, e.ord
from public.topics t
cross join (values ('Apollo landings',1),('Lunar Reconnaissance Orbiter',2),('Artemis I',3),('Commercial lander attempts',4)) as e(title, ord)
where t.slug = 'moon'
and not exists (select 1 from public.topic_timeline_events ev where ev.topic_id = t.id and ev.title = e.title);

insert into public.topic_sections (topic_id, section_type, title, summary, sort_order)
select t.id, 'research', 'Research Focus', item, ord
from public.topics t
cross join (values ('Lunar south pole',1),('Volatiles',2),('Regolith operations',3),('Surface power',4)) as r(item, ord)
where t.slug = 'moon'
and not exists (select 1 from public.topic_sections s where s.topic_id = t.id and s.section_type = 'research' and s.title = r.item);

insert into public.topic_discoveries (topic_id, title, sort_order)
select t.id, d.title, d.ord
from public.topics t
cross join (values ('Water ice indicators',1),('Permanently shadowed regions',2),('Young volcanic terrain',3)) as d(title, ord)
where t.slug = 'moon'
and not exists (select 1 from public.topic_discoveries di where di.topic_id = t.id and di.title = d.title);

-- ISS
insert into public.topic_facts (topic_id, label, value, source, sort_order)
select t.id, v.label, v.value, 'NASA', v.ord
from public.topics t
cross join (values ('Altitude','about 408 km',1),('Speed','27,600 km/h',2),('Crew','6-7',3)) as v(label, value, ord)
where t.slug = 'iss'
and not exists (select 1 from public.topic_facts f where f.topic_id = t.id and f.label = v.label);

insert into public.topic_timeline_events (topic_id, title, sort_order)
select t.id, e.title, e.ord
from public.topics t
cross join (values ('First module launched',1),('Continuous crew presence',2),('Commercial crew',3),('Private astronaut missions',4)) as e(title, ord)
where t.slug = 'iss'
and not exists (select 1 from public.topic_timeline_events ev where ev.topic_id = t.id and ev.title = e.title);

insert into public.topic_sections (topic_id, section_type, title, summary, sort_order)
select t.id, 'research', 'Research Focus', item, ord
from public.topics t
cross join (values ('Human health',1),('Fluid physics',2),('Materials',3),('Plant growth',4)) as r(item, ord)
where t.slug = 'iss'
and not exists (select 1 from public.topic_sections s where s.topic_id = t.id and s.section_type = 'research' and s.title = r.item);

insert into public.topic_discoveries (topic_id, title, sort_order)
select t.id, d.title, d.ord
from public.topics t
cross join (values ('Microgravity adaptation data',1),('Protein crystal studies',2),('Combustion behavior',3)) as d(title, ord)
where t.slug = 'iss'
and not exists (select 1 from public.topic_discoveries di where di.topic_id = t.id and di.title = d.title);

-- Jupiter
insert into public.topic_facts (topic_id, label, value, source, sort_order)
select t.id, v.label, v.value, 'NASA', v.ord
from public.topics t
cross join (values ('Diameter','139,820 km',1),('Gravity','24.79 m/s2',2),('Moons','95+',3)) as v(label, value, ord)
where t.slug = 'jupiter'
and not exists (select 1 from public.topic_facts f where f.topic_id = t.id and f.label = v.label);

insert into public.topic_timeline_events (topic_id, title, sort_order)
select t.id, e.title, e.ord
from public.topics t
cross join (values ('Pioneer flybys',1),('Voyager flybys',2),('Galileo orbiter',3),('Juno mission',4)) as e(title, ord)
where t.slug = 'jupiter'
and not exists (select 1 from public.topic_timeline_events ev where ev.topic_id = t.id and ev.title = e.title);

insert into public.topic_sections (topic_id, section_type, title, summary, sort_order)
select t.id, 'research', 'Research Focus', item, ord
from public.topics t
cross join (values ('Magnetosphere',1),('Storm systems',2),('Europa habitability',3),('Interior structure',4)) as r(item, ord)
where t.slug = 'jupiter'
and not exists (select 1 from public.topic_sections s where s.topic_id = t.id and s.section_type = 'research' and s.title = r.item);

insert into public.topic_discoveries (topic_id, title, sort_order)
select t.id, d.title, d.ord
from public.topics t
cross join (values ('Great Red Spot evolution',1),('Auroral activity',2),('Ocean-world moon evidence',3)) as d(title, ord)
where t.slug = 'jupiter'
and not exists (select 1 from public.topic_discoveries di where di.topic_id = t.id and di.title = d.title);

-- ---------------------------------------------------------------------------
-- SEED: communities (matches src/lib/communities.ts)
-- ---------------------------------------------------------------------------
insert into public.communities (slug, name, description, icon, themed_categories, startup_category_matches, hashtag_matches)
values
  ('astrophotography', 'Astrophotography', 'Capture the cosmos. Deep-sky, planetary, and wide-field shots — gear talk, processing tips and clear skies.', '📷', array['Astrophotography'], '{}', array['astrophotography','nebula','galaxy','milkyway','moon','stars']),
  ('rocket-engineering', 'Rocket Engineering', 'Propulsion, structures, GNC and avionics. Hardware-rich discussion for builders and engineers.', '🚀', array['Rocket Engineering'], array['launch','rocket','propulsion'], array['rocket','propulsion','launch','engine','thrust','orbit']),
  ('space-policy', 'Space Policy & Law', 'Treaties, regulation, commercial frameworks and geopolitics of the new space age.', '⚖️', array['Space Policy and Law'], '{}', array['spacepolicy','spacelaw','regulation','treaty']),
  ('astrobiology', 'Astrobiology', 'Search for life beyond Earth — biosignatures, extremophiles, exoplanet atmospheres.', '🧬', array['Astrobiology'], '{}', array['astrobiology','life','extremophile','exoplanet','habitable']),
  ('mass-society', 'Mass Society', 'The cultural and societal side of space — exploration, education, and community.', '🌍', array['Mass Society'], '{}', array['space','education','community','exploration']),
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

-- ---------------------------------------------------------------------------
-- SEED: free learning paths
-- ---------------------------------------------------------------------------
insert into public.courses (slug, title, summary, category, level, duration_label, learner_count_label, rating, sort_order)
values
  ('rocket-propulsion-fundamentals', 'Rocket Propulsion Fundamentals',
   'A guided path through thrust, specific impulse, combustion chambers, electric propulsion, and mission tradeoffs.',
   'Rocket Engineering', 'Intermediate', '12 hours', '8.2k', 4.8, 1),
  ('orbital-mechanics-101', 'Orbital Mechanics 101',
   'Build intuition for Keplerian orbits, transfer windows, delta-v budgets, rendezvous, and mission planning.',
   'Orbital Mechanics', 'Beginner', '8 hours', '12.4k', 4.9, 2),
  ('satellite-systems', 'Satellite Systems',
   'Understand spacecraft subsystems from payload and power to thermal control, ADCS, communications, and operations.',
   'Satellite Systems', 'Advanced', '20 hours', '5.1k', 4.7, 3)
on conflict (slug) do update set
  title = excluded.title,
  summary = excluded.summary,
  category = excluded.category,
  level = excluded.level,
  duration_label = excluded.duration_label,
  learner_count_label = excluded.learner_count_label,
  rating = excluded.rating,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.course_modules (course_id, title, sort_order)
select c.id, m.title, m.ord
from public.courses c
cross join (values
  ('rocket-propulsion-fundamentals', 'Thrust basics', 1),
  ('rocket-propulsion-fundamentals', 'Chemical engines', 2),
  ('rocket-propulsion-fundamentals', 'Electric propulsion', 3),
  ('rocket-propulsion-fundamentals', 'Testing and safety', 4)
) as m(slug, title, ord)
where c.slug = m.slug
and not exists (select 1 from public.course_modules cm where cm.course_id = c.id and cm.title = m.title);

insert into public.course_modules (course_id, title, sort_order)
select c.id, m.title, m.ord
from public.courses c
cross join (values
  ('orbital-mechanics-101', 'Orbit shapes', 1),
  ('orbital-mechanics-101', 'Hohmann transfers', 2),
  ('orbital-mechanics-101', 'Plane changes', 3),
  ('orbital-mechanics-101', 'Mission examples', 4)
) as m(slug, title, ord)
where c.slug = m.slug
and not exists (select 1 from public.course_modules cm where cm.course_id = c.id and cm.title = m.title);
