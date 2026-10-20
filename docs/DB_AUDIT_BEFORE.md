# Database Audit Before Changes - 2026-10-20

## Status

Live Supabase queries were not executed because this working copy does not include authenticated Supabase CLI access or database credentials. No live database conclusions are claimed here.

## Required live checks

Run the following against a non-production copy first, then save the results in this document before applying migrations:

```sql
-- Permissive write policies
select tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public'
  and (with_check = 'true' or (cmd in ('UPDATE', 'DELETE', 'ALL') and qual = 'true'));

-- RLS-enabled tables without policies
select c.relname
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind = 'r'
  and c.relrowsecurity
  and not exists (
    select 1 from pg_policies p
    where p.schemaname = 'public' and p.tablename = c.relname
  );

-- SECURITY DEFINER functions without a fixed search path
select p.proname
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.prosecdef
  and (p.proconfig is null or not exists (
    select 1 from unnest(p.proconfig) c where c like 'search_path=%'
  ));

-- Admins represented by profile badges but not user_roles
select p.user_id, p.username, p.badges,
  exists (
    select 1 from public.user_roles r
    where r.user_id = p.user_id and r.role = 'admin'
  ) as has_admin_role
from public.profiles p
where 'admin' = any(coalesce(p.badges, array[]::text[]));

-- Scheduled jobs
select jobid, jobname, schedule, active from cron.job order by jobname;
```
