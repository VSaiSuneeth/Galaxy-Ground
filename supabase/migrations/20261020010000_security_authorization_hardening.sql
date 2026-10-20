-- Rollback: drop trigger protect_profile_privileged_columns, restore the prior policies, and reset altered function configuration only after validating the prior state.
-- This migration is additive and idempotent. Validate it against a non-production database before production deployment.

create or replace function public.protect_profile_privileged_columns()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if current_user in ('authenticated', 'anon')
     and new.badges is distinct from old.badges then
    raise exception 'badges can only be changed by the system' using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_privileged_columns on public.profiles;
create trigger protect_profile_privileged_columns
before update on public.profiles
for each row execute function public.protect_profile_privileged_columns();

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
on public.profiles for update to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Admins can manage live events" on public.live_events;
create policy "Admins can manage live events"
on public.live_events for all to authenticated
using (public.has_role(auth.uid(), 'admin'::public.app_role))
with check (public.has_role(auth.uid(), 'admin'::public.app_role));

drop policy if exists "Admins and startup owners can manage roles" on public.startup_roles;
create policy "Admins and startup owners can manage roles"
on public.startup_roles for all to authenticated
using (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  or exists (select 1 from public.startups where id = startup_roles.startup_id and claimed_by_user_id = auth.uid())
)
with check (
  public.has_role(auth.uid(), 'admin'::public.app_role)
  or exists (select 1 from public.startups where id = startup_roles.startup_id and claimed_by_user_id = auth.uid())
);

drop policy if exists "Admins can manage featured content" on public.featured_content;
create policy "Admins can manage featured content"
on public.featured_content for all to authenticated
using (public.has_role(auth.uid(), 'admin'::public.app_role))
with check (public.has_role(auth.uid(), 'admin'::public.app_role));

drop policy if exists "Admins can award badges" on public.profile_badge_awards;
create policy "Admins can award badges"
on public.profile_badge_awards for all to authenticated
using (public.has_role(auth.uid(), 'admin'::public.app_role))
with check (public.has_role(auth.uid(), 'admin'::public.app_role));

drop policy if exists "Startup owners and admins can read role views" on public.role_views;
create policy "Startup owners and admins can read role views"
on public.role_views for select to authenticated
using (
  exists (
    select 1 from public.startup_roles sr
    join public.startups s on s.id = sr.startup_id
    where sr.id = role_views.role_id and s.claimed_by_user_id = auth.uid()
  ) or public.has_role(auth.uid(), 'admin'::public.app_role)
);

do $$
declare
  function_identity text;
begin
  for function_identity in
    select oid::regprocedure::text
    from pg_proc
    where pronamespace = 'public'::regnamespace and prosecdef
  loop
    execute format('alter function %s set search_path to public', function_identity);
  end loop;
end;
$$;
