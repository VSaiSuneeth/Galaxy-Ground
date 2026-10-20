# Phase 6 Supabase Handoff

Copy this message to the AI/tool that manages the Supabase project.

---

Please complete the Phase 6 backend verification/repair work for Galaxy Ground Learning Hub.

Frontend expectations already in the app:

- `src/hooks/useLearning.ts` reads from:
  - `public.courses`
  - `public.course_modules`
  - `public.course_lessons`
- The query expects these fields:
  - `courses`: `id`, `slug`, `title`, `summary`, `category`, `level`, `duration_label`, `learner_count_label`, `rating`, `sort_order`
  - `course_modules`: `course_id`, `title`, `sort_order`
  - `course_lessons`: `course_id`, `title`, `sort_order`
- The frontend falls back to local catalog data if these tables are missing or empty, but Phase 6 should verify that the remote learning catalog is fully usable.
- After backend verification, I may enable `VITE_ENABLE_PHASE_B_REMOTE=true` in the frontend.

## Required Work

### 1. Verify or apply the existing Phase B learning schema

Check whether the learning schema from the repo migration already exists and is healthy.

Relevant repo SQL references:

- `supabase/migrations/20260612120000_phase_b_launch_topic_community_learning.sql`
- `supabase/phase_b_remote_repair.sql`

Required tables:

- `public.courses`
- `public.course_modules`
- `public.course_lessons`
- `public.course_enrollments`
- `public.course_progress`

Required columns at minimum:

```sql
-- courses
id uuid primary key
slug text unique not null
title text not null
summary text
category text
level text not null
duration_label text
learner_count_label text
rating numeric
is_free boolean not null default true
is_premium_ready boolean not null default false
sort_order int not null default 0
created_at timestamptz not null default now()
updated_at timestamptz not null default now()

-- course_modules
id uuid primary key
course_id uuid not null references public.courses(id) on delete cascade
title text not null
sort_order int not null default 0
created_at timestamptz not null default now()

-- course_lessons
id uuid primary key
course_id uuid not null references public.courses(id) on delete cascade
module_id uuid references public.course_modules(id) on delete set null
title text not null
video_url text
sort_order int not null default 0
created_at timestamptz not null default now()
```

If the schema is partial or out of date, repair it using the repo SQL or equivalent idempotent SQL.

### 2. Verify grants, RLS, and public-read policies

The frontend must be able to read free learning catalog data as anon or authenticated users.

Ensure:

- RLS is enabled on `courses`, `course_modules`, `course_lessons`, `course_enrollments`, and `course_progress`
- `anon` and `authenticated` have `select` on:
  - `public.courses`
  - `public.course_modules`
  - `public.course_lessons`
- Public-read policies exist for:
  - `public.courses`
  - `public.course_modules`
  - `public.course_lessons`
- Authenticated users can read/insert only their own rows in:
  - `public.course_enrollments`
  - `public.course_progress`

Verification queries:

```sql
select tablename
from pg_tables
where schemaname = 'public'
  and tablename in ('courses', 'course_modules', 'course_lessons', 'course_enrollments', 'course_progress')
order by tablename;

select policyname, tablename
from pg_policies
where schemaname = 'public'
  and tablename in ('courses', 'course_modules', 'course_lessons', 'course_enrollments', 'course_progress')
order by tablename, policyname;
```

### 3. Verify or repair seed data for the catalog

The frontend should have at least these 3 learning paths available remotely, with modules and lessons populated:

1. `rocket-propulsion-fundamentals`
2. `orbital-mechanics-101`
3. `satellite-systems`

If missing, seed them with consistent order and matching content.

Expected course-level content:

```text
rocket-propulsion-fundamentals
- title: Rocket Propulsion Fundamentals
- level: Intermediate
- duration_label: 12 hours
- learner_count_label: 8.2k
- rating: 4.8

orbital-mechanics-101
- title: Orbital Mechanics 101
- level: Beginner
- duration_label: 8 hours
- learner_count_label: 12.4k
- rating: 4.9

satellite-systems
- title: Satellite Systems
- level: Advanced
- duration_label: 20 hours
- learner_count_label: 5.1k
- rating: 4.7
```

Expected module titles:

```text
rocket-propulsion-fundamentals
- Thrust basics
- Chemical engines
- Electric propulsion
- Testing and safety

orbital-mechanics-101
- Orbit shapes
- Hohmann transfers
- Plane changes
- Mission examples

satellite-systems
- Mission requirements
- Bus subsystems
- Ground segment
- Operations
```

Expected lesson titles:

```text
rocket-propulsion-fundamentals
- Engine cycles overview
- Ion thruster explainer

orbital-mechanics-101
- Why orbits work
- Transfer orbit walkthrough

satellite-systems
- Spacecraft bus tour
- ADCS fundamentals
```

Verification queries:

```sql
select slug, title, level, duration_label, learner_count_label, rating, sort_order
from public.courses
order by sort_order, slug;

select c.slug, cm.title, cm.sort_order
from public.course_modules cm
join public.courses c on c.id = cm.course_id
order by c.sort_order, cm.sort_order, cm.title;

select c.slug, cl.title, cl.sort_order
from public.course_lessons cl
join public.courses c on c.id = cl.course_id
order by c.sort_order, cl.sort_order, cl.title;
```

### 4. Verify frontend-compatible behavior

Confirm:

- `select ... from public.courses order by sort_order` returns rows
- matching modules and lessons exist for those course IDs
- anon access works for catalog reads
- the frontend can safely switch to remote mode without 401/403/404 issues

If you find 401 or policy failures, fix them without weakening write protection for enrollments/progress.

### 5. Optional but useful verification for later phases

If `course_enrollments` and `course_progress` are already healthy, provide example SQL for:

- enrolling the current user in a course
- marking a lesson complete
- reading that user's progress

Do not insert test progress into a real user account unless explicitly confirmed first.

### 6. Final report format

Return:

- Whether each required table exists
- Whether public-read policies for catalog tables exist
- Whether the 3 seeded courses exist
- Module and lesson row counts
- Whether anon reads work
- Any SQL you applied
- Any remaining mismatch between frontend expectations and backend schema
- Whether it is safe for me to enable `VITE_ENABLE_PHASE_B_REMOTE=true`

Important constraints:

- Do not delete existing learning rows unless absolutely required and approved
- Prefer idempotent SQL
- Preserve existing IDs and relationships where possible
- Do not weaken RLS to allow public writes
