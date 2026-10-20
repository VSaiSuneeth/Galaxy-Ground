
DROP VIEW IF EXISTS public.post_stats;
CREATE VIEW public.post_stats
WITH (security_invoker = true) AS
SELECT
  p.id AS post_id,
  COALESCE((SELECT COUNT(*) FROM public.likes l WHERE l.post_id = p.id), 0) AS likes_count,
  COALESCE((SELECT COUNT(*) FROM public.comments c WHERE c.post_id = p.id), 0) AS comments_count
FROM public.posts p;
