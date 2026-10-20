
-- Themed accounts (curated personas)
CREATE TABLE public.themed_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  handle TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  category TEXT NOT NULL,
  focus TEXT,
  style TEXT,
  vibe TEXT,
  voice TEXT,
  bio TEXT,
  avatar_url TEXT,
  rss_feeds TEXT[] DEFAULT '{}'::text[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.themed_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Themed accounts viewable by everyone" ON public.themed_accounts FOR SELECT USING (true);
CREATE POLICY "Admins manage themed accounts" ON public.themed_accounts FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER themed_accounts_updated BEFORE UPDATE ON public.themed_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Themed posts (AI-rewritten from real RSS)
CREATE TABLE public.themed_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.themed_accounts(id) ON DELETE CASCADE,
  title TEXT,
  content TEXT NOT NULL,
  summary TEXT,
  source_url TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'rss',
  image_url TEXT,
  hashtags TEXT[] DEFAULT '{}'::text[],
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  views_count INT NOT NULL DEFAULT 0,
  likes_count INT NOT NULL DEFAULT 0,
  comments_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (account_id, source_url)
);
CREATE INDEX idx_themed_posts_published ON public.themed_posts (published_at DESC);
CREATE INDEX idx_themed_posts_account ON public.themed_posts (account_id, published_at DESC);
CREATE INDEX idx_themed_posts_hashtags ON public.themed_posts USING GIN (hashtags);
ALTER TABLE public.themed_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Themed posts viewable by everyone" ON public.themed_posts FOR SELECT USING (true);
CREATE POLICY "Admins manage themed posts" ON public.themed_posts FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Hashtag index on startup_posts for fast lookup
CREATE INDEX IF NOT EXISTS idx_startup_posts_hashtags ON public.startup_posts USING GIN (hashtags);
CREATE INDEX IF NOT EXISTS idx_posts_hashtags ON public.posts USING GIN (hashtags);

-- Unified reactions for aggregated (startup/themed) posts
CREATE TABLE public.aggregate_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type TEXT NOT NULL CHECK (target_type IN ('startup','themed')),
  target_id UUID NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (target_type, target_id, user_id)
);
CREATE INDEX idx_agg_reactions_target ON public.aggregate_reactions (target_type, target_id);
ALTER TABLE public.aggregate_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reactions readable by all" ON public.aggregate_reactions FOR SELECT USING (true);
CREATE POLICY "Users like as themselves" ON public.aggregate_reactions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users unlike own" ON public.aggregate_reactions FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Unified comments for aggregated (startup/themed) posts
CREATE TABLE public.aggregate_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type TEXT NOT NULL CHECK (target_type IN ('startup','themed')),
  target_id UUID NOT NULL,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_agg_comments_target ON public.aggregate_comments (target_type, target_id, created_at DESC);
ALTER TABLE public.aggregate_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Comments readable by all" ON public.aggregate_comments FOR SELECT USING (true);
CREATE POLICY "Users create own comments" ON public.aggregate_comments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own comments" ON public.aggregate_comments FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Search indexes (trigram)
CREATE INDEX IF NOT EXISTS idx_profiles_username_trgm ON public.profiles USING GIN (username gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_profiles_display_trgm ON public.profiles USING GIN (display_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_startups_name_trgm ON public.startups USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_themed_handle_trgm ON public.themed_accounts USING GIN (handle gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_themed_display_trgm ON public.themed_accounts USING GIN (display_name gin_trgm_ops);
