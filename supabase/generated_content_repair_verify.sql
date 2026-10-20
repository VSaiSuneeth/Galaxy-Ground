-- Verify generated content repair results.

select 'startup total' as metric, count(*) from public.startup_posts
union all
select 'startup short', count(*) from public.startup_posts where length(coalesce(content, summary, '')) < 500
union all
select 'startup missing image', count(*) from public.startup_posts where image_url is null or btrim(image_url) = ''
union all
select 'startup missing hashtags', count(*) from public.startup_posts where hashtags is null or array_length(hashtags, 1) is null
union all
select 'themed total', count(*) from public.themed_posts
union all
select 'themed short', count(*) from public.themed_posts where length(coalesce(content, summary, '')) < 500
union all
select 'themed missing image', count(*) from public.themed_posts where image_url is null or btrim(image_url) = ''
union all
select 'themed missing hashtags', count(*) from public.themed_posts where hashtags is null or array_length(hashtags, 1) is null;

-- Sample proof rows.
select 'themed:Hubble' as sample, id, title, length(coalesce(content, summary, '')) as content_len, image_url, hashtags
from public.themed_posts
where title ilike '%Hubble Sees Swarm of Galaxies%';

select 'themed:Black Eye' as sample, id, title, length(coalesce(content, summary, '')) as content_len, image_url, hashtags
from public.themed_posts
where title ilike '%Black Eye Galaxy%';

select 'startup:Pixxel' as sample, id, title, length(coalesce(content, summary, '')) as content_len, image_url, hashtags
from public.startup_posts
where title ilike '%Pixxel%'
order by published_at desc
limit 10;

select 'startup:Skyroot' as sample, id, title, length(coalesce(content, summary, '')) as content_len, image_url, hashtags
from public.startup_posts
where title ilike '%Skyroot%' or content ilike '%Skyroot%'
order by published_at desc
limit 10;

-- Check repeated title/body patterns.
select 'startup repeated-title candidates' as metric, count(*)
from public.startup_posts
where lower(regexp_replace(coalesce(content, summary, ''), '[^a-z0-9 ]', '', 'g')) =
      lower(regexp_replace(coalesce(title, ''), '[^a-z0-9 ]', '', 'g'))
union all
select 'themed repeated-title candidates', count(*)
from public.themed_posts
where lower(regexp_replace(coalesce(content, summary, ''), '[^a-z0-9 ]', '', 'g')) =
      lower(regexp_replace(coalesce(title, ''), '[^a-z0-9 ]', '', 'g'));

