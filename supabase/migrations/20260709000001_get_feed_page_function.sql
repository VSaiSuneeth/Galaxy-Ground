-- get_feed_page(user_id, page_offset, page_size, mode)
--
-- Replicates the behaviour of getBoostedMergedFeed() from src/hooks/usePosts.ts
-- as a single Postgres function callable via supabase.rpc().
--
-- Returns a JSON array of feed items, each with:
--   id            text          (prefixed: "startup_<id>", "themed_<id>", or raw uuid)
--   user_id       text
--   content       text
--   media_url     text | null
--   media_type    text | null
--   community     text | null
--   hashtags      jsonb
--   created_at    timestamptz
--   author        jsonb         { user_id, username, display_name, avatar_url }
--   likes_count   int
--   comments_count int
--   source        text          ('user', 'startup', 'themed')
--   target_id     text | null
--   startup_slug  text | null
--   themed_handle text | null
--   source_url    text | null
--   startup_id    text | null
--   account_id    text | null
--   reactions     jsonb         array of { reaction_type, count }
--   user_has_liked      bool
--   user_has_bookmarked bool
--   reaction_type       text | null
--
-- Mode: 'for-you' (default), 'following', 'recent'
--
-- The 2-day boost for followed accounts (see getBoostedMergedFeed BOOST_MS)
-- is applied by adding 172800 seconds to the ordering timestamp.
--
-- Pagination is offset-based (page_offset * page_size, page_size).
--
-- Run after deploying:
--   psql < 20260709000001_get_feed_page_function.sql

create or replace function get_feed_page(
  p_user_id uuid default null,
  p_page_offset int default 0,
  p_page_size int default 20,
  p_mode text default 'for-you'
)
returns json
language plpgsql
stable
as $$
declare
  v_offset int := p_page_offset * p_page_size;
  v_limit  int := p_page_size;
  v_boost  interval := interval '2 days';
  v_followed_themed   uuid[] := '{}'::uuid[];
  v_followed_startups uuid[] := '{}'::uuid[];
  v_followed_users    uuid[] := '{}'::uuid[];
  v_result json;
  v_hashtag_filter jsonb := '[]'::jsonb;
begin
  -- 1. Gather follows for the requesting user
  if p_user_id is not null then
    select
      coalesce(array_agg(r.target_id) filter (where r.target_type = 'themed'),  '{}'::uuid[]),
      coalesce(array_agg(r.target_id) filter (where r.target_type = 'startup'), '{}'::uuid[]),
      coalesce(array_agg(r.target_id) filter (where r.target_type = 'user'),    '{}'::uuid[])
    into v_followed_themed, v_followed_startups, v_followed_users
    from follows r
    where r.follower_id = p_user_id;
  end if;

  -- 2. Build and return the unified feed as JSON
  with
  -- User posts from the `posts` table
  user_posts as (
    select
      p.id::text                                                                   as id,
      p.user_id::text                                                              as user_id,
      coalesce(p.content, '')::text                                                as content,
      p.media_url::text                                                            as media_url,
      p.media_type::text                                                           as media_type,
      p.community::text                                                            as community,
      to_jsonb(coalesce(p.hashtags, '{}'::text[]))                                 as hashtags,
      p.created_at                                                                 as created_at,
      jsonb_build_object(
        'user_id',    prof.user_id::text,
        'username',   prof.username,
        'display_name', prof.display_name,
        'avatar_url', prof.avatar_url
      )::jsonb                                                                     as author,
      coalesce(ps.likes_count, 0)::int                                             as likes_count,
      coalesce(ps.comments_count, 0)::int                                          as comments_count,
      'user'::text                                                                 as source,
      null::text                                                                   as target_id,
      null::text                                                                   as startup_slug,
      null::text                                                                   as themed_handle,
      null::text                                                                   as source_url,
      null::text                                                                   as startup_id,
      null::text                                                                   as account_id,
      '[]'::jsonb                                                                  as reactions,
      -- Follow boost signal
      case when p_user_id is not null and p.user_id = any(v_followed_users) then v_boost else interval '0' end as boost
    from posts p
    left join profiles prof on prof.user_id = p.user_id
    left join post_stats ps on ps.post_id = p.id
  ),
  -- Startup posts
  startup_posts as (
    select
      ('startup_' || sp.id)::text                                                  as id,
      ('startup_' || sp.startup_id)::text                                          as user_id,
      coalesce(sp.content, '')::text                                                as content,
      sp.image_url::text                                                           as media_url,
      case when sp.image_url is not null then 'image'::text else null end          as media_type,
      null::text                                                                   as community,
      to_jsonb(coalesce(sp.hashtags, '{}'::text[]))                                as hashtags,
      sp.published_at                                                              as created_at,
      jsonb_build_object(
        'user_id',    ('startup_' || sp.startup_id)::text,
        'username',   s.slug,
        'display_name', s.name,
        'avatar_url', s.logo_url
      )::jsonb                                                                     as author,
      coalesce(rx.cnt, 0)::int                                                     as likes_count,
      coalesce(cm.cnt, 0)::int                                                     as comments_count,
      'startup'::text                                                              as source,
      sp.id::text                                                                  as target_id,
      s.slug::text                                                                 as startup_slug,
      null::text                                                                   as themed_handle,
      sp.source_url::text                                                          as source_url,
      sp.startup_id::text                                                          as startup_id,
      null::text                                                                   as account_id,
      coalesce(rx_summary.json, '[]'::jsonb)::jsonb                                as reactions,
      case when p_user_id is not null and sp.startup_id = any(v_followed_startups) then v_boost else interval '0' end as boost
    from startup_posts sp
    left join startups s on s.id = sp.startup_id
    left join lateral (
      select count(*)::int as cnt
      from aggregate_reactions ar
      where ar.target_type = 'startup' and ar.target_id = sp.id
    ) rx on true
    left join lateral (
      select count(*)::int as cnt
      from aggregate_comments ac
      where ac.target_type = 'startup' and ac.target_id = sp.id
    ) cm on true
    left join lateral (
      select jsonb_agg(
        jsonb_build_object('reaction_type', ar2.reaction_type, 'count', ar2.c)
        order by ar2.c desc
      ) as json
      from (
        select reaction_type, count(*)::int as c
        from aggregate_reactions ar2
        where ar2.target_type = 'startup' and ar2.target_id = sp.id
        group by reaction_type
      ) ar2
    ) rx_summary on true
  ),
  -- Themed posts
  themed_posts as (
    select
      ('themed_' || tp.id)::text                                                   as id,
      ('themed_' || tp.account_id)::text                                           as user_id,
      coalesce(tp.content, '')::text                                                as content,
      tp.image_url::text                                                           as media_url,
      case when tp.image_url is not null then 'image'::text else null end          as media_type,
      null::text                                                                   as community,
      to_jsonb(coalesce(tp.hashtags, '{}'::text[]))                                as hashtags,
      tp.published_at                                                              as created_at,
      jsonb_build_object(
        'user_id',    ('themed_' || tp.account_id)::text,
        'username',   ta.handle,
        'display_name', ta.display_name,
        'avatar_url', ta.avatar_url
      )::jsonb                                                                     as author,
      coalesce(rx.cnt, 0)::int                                                     as likes_count,
      coalesce(cm.cnt, 0)::int                                                     as comments_count,
      'themed'::text                                                               as source,
      tp.id::text                                                                  as target_id,
      null::text                                                                   as startup_slug,
      ta.handle::text                                                              as themed_handle,
      tp.source_url::text                                                          as source_url,
      null::text                                                                   as startup_id,
      tp.account_id::text                                                          as account_id,
      coalesce(rx_summary.json, '[]'::jsonb)::jsonb                                as reactions,
      case when p_user_id is not null and tp.account_id = any(v_followed_themed) then v_boost else interval '0' end as boost
    from themed_posts tp
    left join themed_accounts ta on ta.id = tp.account_id
    left join lateral (
      select count(*)::int as cnt
      from aggregate_reactions ar
      where ar.target_type = 'themed' and ar.target_id = tp.id
    ) rx on true
    left join lateral (
      select count(*)::int as cnt
      from aggregate_comments ac
      where ac.target_type = 'themed' and ac.target_id = tp.id
    ) cm on true
    left join lateral (
      select jsonb_agg(
        jsonb_build_object('reaction_type', ar2.reaction_type, 'count', ar2.c)
        order by ar2.c desc
      ) as json
      from (
        select reaction_type, count(*)::int as c
        from aggregate_reactions ar2
        where ar2.target_type = 'themed' and ar2.target_id = tp.id
        group by reaction_type
      ) ar2
    ) rx_summary on true
  ),
  -- Merge all sources
  merged as (
    select * from user_posts
    union all
    select * from startup_posts
    union all
    select * from themed_posts
  ),
  -- Apply mode filter
  filtered as (
    select * from merged m
    where
      case
        when p_mode = 'following' then
          case
            when m.source = 'user' and m.user_id ~ '^[0-9a-f-]{36}$' then m.user_id::uuid = any(v_followed_users)
            when m.source = 'startup' and m.startup_id ~ '^[0-9a-f-]{36}$' then m.startup_id::uuid = any(v_followed_startups)
            when m.source = 'themed' and m.account_id ~ '^[0-9a-f-]{36}$' then m.account_id::uuid = any(v_followed_themed)
            else false
          end
        else true
      end
  ),
  -- Sort: for-you boosts follow recency, following filters + sorts by date, recent sorts by date
  sorted as (
    select *
    from filtered
    order by
      case
        when p_mode = 'recent'    then extract(epoch from created_at)
        when p_mode = 'following' then extract(epoch from created_at)
        else extract(epoch from (created_at + boost))
      end desc
  ),
  -- Paginate
  paginated as (
    select *
    from sorted
    offset v_offset
    limit v_limit
  )
  select jsonb_agg(
    jsonb_build_object(
      'id',               p.id,
      'user_id',          p.user_id,
      'content',          p.content,
      'media_url',        p.media_url,
      'media_type',       p.media_type,
      'community',        p.community,
      'hashtags',         p.hashtags,
      'created_at',       p.created_at,
      'author',           p.author,
      'likes_count',      p.likes_count,
      'comments_count',   p.comments_count,
      'source',           p.source,
      'target_id',        p.target_id,
      'startup_slug',     p.startup_slug,
      'themed_handle',    p.themed_handle,
      'source_url',       p.source_url,
      'startup_id',       p.startup_id,
      'account_id',       p.account_id,
      'reaction_summary', p.reactions
    )
    order by
      case
        when p_mode = 'recent'    then extract(epoch from p.created_at)
        when p_mode = 'following' then extract(epoch from p.created_at)
        else extract(epoch from (p.created_at + p.boost))
      end desc
  ) into v_result
  from paginated p;

  -- Return empty array instead of null
  if v_result is null then
    v_result := '[]'::json;
  end if;

  return v_result;
end;
$$;
