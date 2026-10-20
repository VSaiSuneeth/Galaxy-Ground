-- Optional cleanup after generated content repair succeeds.
-- Run only after verification is complete.

drop policy if exists "service_role repair startup_posts" on public.startup_posts;
drop policy if exists "service_role repair themed_posts" on public.themed_posts;

