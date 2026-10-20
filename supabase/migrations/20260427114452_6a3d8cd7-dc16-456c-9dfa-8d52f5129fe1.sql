
ALTER TABLE public.startups ADD COLUMN IF NOT EXISTS verified boolean NOT NULL DEFAULT true;
ALTER TABLE public.themed_accounts ADD COLUMN IF NOT EXISTS verified boolean NOT NULL DEFAULT true;

CREATE UNIQUE INDEX IF NOT EXISTS themed_posts_unique_image
  ON public.themed_posts (image_url)
  WHERE image_url IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS themed_posts_unique_source
  ON public.themed_posts (source_url);

UPDATE public.themed_accounts
SET rss_feeds = ARRAY[
  'https://www.isro.gov.in/media_isro/rss/PressRelease.xml',
  'https://news.google.com/rss/search?q=ISRO+OR+%22Indian+Space%22+OR+Chandrayaan+OR+Gaganyaan&hl=en-IN&gl=IN&ceid=IN:en'
]
WHERE category = 'Indian Space Program';
