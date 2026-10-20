-- 1. Polymorphic follows
ALTER TABLE public.follows
  ADD COLUMN IF NOT EXISTS target_type text NOT NULL DEFAULT 'user',
  ADD COLUMN IF NOT EXISTS target_id uuid;

-- Backfill existing rows: target_id = following_id, target_type = 'user'
UPDATE public.follows
SET target_id = following_id, target_type = 'user'
WHERE target_id IS NULL;

-- Make target_id NOT NULL going forward
ALTER TABLE public.follows ALTER COLUMN target_id SET NOT NULL;

-- For user follows we keep following_id populated; for startup/themed we rely on target_*
ALTER TABLE public.follows ALTER COLUMN following_id DROP NOT NULL;

-- Unique constraint replacing old one
DO $$ BEGIN
  ALTER TABLE public.follows DROP CONSTRAINT IF EXISTS follows_follower_id_following_id_key;
EXCEPTION WHEN undefined_object THEN NULL; END $$;

CREATE UNIQUE INDEX IF NOT EXISTS follows_unique_target
  ON public.follows(follower_id, target_type, target_id);

CREATE INDEX IF NOT EXISTS follows_target_idx ON public.follows(target_type, target_id);

-- 2. Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  kind text NOT NULL DEFAULT 'new_post',
  account_type text NOT NULL, -- 'user' | 'startup' | 'themed'
  account_id uuid NOT NULL,
  account_name text,
  account_handle text,
  post_type text, -- 'user' | 'startup' | 'themed'
  post_id uuid,
  title text,
  preview text,
  image_url text,
  link text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own notifications" ON public.notifications;
CREATE POLICY "Users see own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;
CREATE POLICY "Users update own notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own notifications" ON public.notifications;
CREATE POLICY "Users delete own notifications" ON public.notifications
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- service-role inserts via trigger (security definer); no public insert policy.
CREATE INDEX IF NOT EXISTS notifications_user_idx ON public.notifications(user_id, created_at DESC);

-- 3. Fan-out trigger for startup_posts
CREATE OR REPLACE FUNCTION public.notify_startup_followers()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  s_name text; s_slug text;
BEGIN
  SELECT name, slug INTO s_name, s_slug FROM public.startups WHERE id = NEW.startup_id;
  INSERT INTO public.notifications
    (user_id, kind, account_type, account_id, account_name, account_handle,
     post_type, post_id, title, preview, image_url, link)
  SELECT f.follower_id, 'new_post', 'startup', NEW.startup_id, s_name, s_slug,
         'startup', NEW.id, NEW.title,
         left(coalesce(NEW.summary, NEW.content), 180),
         NEW.image_url,
         '/startup/' || s_slug
  FROM public.follows f
  WHERE f.target_type = 'startup' AND f.target_id = NEW.startup_id;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS startup_post_notify ON public.startup_posts;
CREATE TRIGGER startup_post_notify
  AFTER INSERT ON public.startup_posts
  FOR EACH ROW EXECUTE FUNCTION public.notify_startup_followers();

-- 4. Fan-out trigger for themed_posts
CREATE OR REPLACE FUNCTION public.notify_themed_followers()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  a_name text; a_handle text;
BEGIN
  SELECT display_name, handle INTO a_name, a_handle FROM public.themed_accounts WHERE id = NEW.account_id;
  INSERT INTO public.notifications
    (user_id, kind, account_type, account_id, account_name, account_handle,
     post_type, post_id, title, preview, image_url, link)
  SELECT f.follower_id, 'new_post', 'themed', NEW.account_id, a_name, a_handle,
         'themed', NEW.id, NEW.title,
         left(coalesce(NEW.summary, NEW.content), 180),
         NEW.image_url,
         '/creator/' || a_handle
  FROM public.follows f
  WHERE f.target_type = 'themed' AND f.target_id = NEW.account_id;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS themed_post_notify ON public.themed_posts;
CREATE TRIGGER themed_post_notify
  AFTER INSERT ON public.themed_posts
  FOR EACH ROW EXECUTE FUNCTION public.notify_themed_followers();

-- 5. Fan-out for user posts
CREATE OR REPLACE FUNCTION public.notify_user_followers()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  p_name text; p_handle text;
BEGIN
  SELECT display_name, username INTO p_name, p_handle FROM public.profiles WHERE user_id = NEW.user_id;
  INSERT INTO public.notifications
    (user_id, kind, account_type, account_id, account_name, account_handle,
     post_type, post_id, title, preview, image_url, link)
  SELECT f.follower_id, 'new_post', 'user', NEW.user_id, p_name, p_handle,
         'user', NEW.id, NULL,
         left(NEW.content, 180),
         NEW.media_url,
         '/u/' || NEW.user_id
  FROM public.follows f
  WHERE f.target_type = 'user' AND f.target_id = NEW.user_id;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS user_post_notify ON public.posts;
CREATE TRIGGER user_post_notify
  AFTER INSERT ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.notify_user_followers();

-- 6. Per-category dedup helper: ensure unique source_url within same themed category.
-- Implemented as a unique index on (category_via_account, source_url) using a function index isn't practical,
-- so create a partial index on themed_posts(source_url) globally + a per-account unique already exists.
-- We enforce per-category dedup in the edge function, but add a hint index:
CREATE INDEX IF NOT EXISTS themed_posts_source_url_idx ON public.themed_posts(source_url);

-- 7. Per-startup unique source URL (avoid duplicates within a startup)
CREATE UNIQUE INDEX IF NOT EXISTS startup_posts_unique_per_startup_source
  ON public.startup_posts(startup_id, source_url);

CREATE UNIQUE INDEX IF NOT EXISTS themed_posts_unique_per_account_source
  ON public.themed_posts(account_id, source_url);