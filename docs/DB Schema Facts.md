# DB Schema Facts

**Project:** `lmdswaagcdxulcczkqmu`  
**Snapshot:** 2026-10-20  
**Source:** live Supabase catalog inspection; row data was not exported.

Notation: `NOT NULL` indicates a required value; `NULL` indicates nullable. Defaults and check constraints are included when present. Unique keys are catalog constraints; indexes that are not constraints are not listed as unique keys.

## Requested table schemas

### `connection_requests`

| Column | Type | Nullability | Default / check |
|---|---|---|---|
| `id` | `uuid` | NOT NULL | default `gen_random_uuid()` |
| `requester_id` | `uuid` | NOT NULL | — |
| `recipient_id` | `uuid` | NOT NULL | — |
| `intent_category` | `text` | NOT NULL | check `intent_category = ANY (ARRAY['Collaboration'::text, 'Investment Interest'::text, 'Job Opportunity'::text, 'Research'::text, 'Question'::text, 'Other'::text])` |
| `context_message` | `text` | NOT NULL | check `char_length(context_message) >= 20 AND char_length(context_message) <= 300` |
| `status` | `text` | NOT NULL | default `'pending'::text`; check `status = ANY (ARRAY['pending'::text, 'accepted'::text, 'declined'::text, 'blocked'::text])` |
| `thread_id` | `uuid` | NULL | — |
| `created_at` | `timestamp with time zone` | NULL | default `now()` |
| `responded_at` | `timestamp with time zone` | NULL | — |

**Primary / unique keys**
- Primary key: `PRIMARY KEY (id)` (`connection_requests_pkey`)
- Unique: `UNIQUE (requester_id, recipient_id)` (`unique_sender_recipient`)

**Foreign keys**
- `connection_requests_thread_id_fkey`: `thread_id` → `public.message_threads` (`id`)
- `connection_requests_sender_id_fkey`: `requester_id` → `public.profiles` (`user_id`)
- `connection_requests_recipient_id_fkey`: `recipient_id` → `public.profiles` (`user_id`)

### `message_threads`

| Column | Type | Nullability | Default / check |
|---|---|---|---|
| `id` | `uuid` | NOT NULL | default `gen_random_uuid()` |
| `participant_a` | `uuid` | NOT NULL | — |
| `participant_b` | `uuid` | NOT NULL | — |
| `created_at` | `timestamp with time zone` | NULL | default `now()` |
| `last_message_at` | `timestamp with time zone` | NULL | default `now()` |
| `participant_a_unread` | `integer` | NULL | default `0` |
| `participant_b_unread` | `integer` | NULL | default `0` |

**Primary / unique keys**
- Primary key: `PRIMARY KEY (id)` (`message_threads_pkey`)
- Unique: `UNIQUE (participant_a, participant_b)` (`unique_participants`)

**Foreign keys**
- `connection_requests_thread_id_fkey`: `thread_id` → `public.message_threads` (`id`)
- `messages_thread_id_fkey`: `thread_id` → `public.message_threads` (`id`)
- `message_threads_participant_b_fkey`: `participant_b` → `public.profiles` (`user_id`)
- `message_threads_participant_a_fkey`: `participant_a` → `public.profiles` (`user_id`)

### `messages`

| Column | Type | Nullability | Default / check |
|---|---|---|---|
| `id` | `uuid` | NOT NULL | default `gen_random_uuid()` |
| `thread_id` | `uuid` | NOT NULL | — |
| `sender_id` | `uuid` | NOT NULL | — |
| `content` | `text` | NOT NULL | check `char_length(content) >= 1 AND char_length(content) <= 1000` |
| `media_url` | `text` | NULL | — |
| `media_type` | `text` | NULL | check `media_type = ANY (ARRAY['image'::text, NULL::text])` |
| `read_at` | `timestamp with time zone` | NULL | — |
| `created_at` | `timestamp with time zone` | NULL | default `now()` |

**Primary / unique keys**
- Primary key: `PRIMARY KEY (id)` (`messages_pkey`)

**Foreign keys**
- `messages_thread_id_fkey`: `thread_id` → `public.message_threads` (`id`)
- `messages_sender_id_fkey`: `sender_id` → `public.profiles` (`user_id`)

### `user_blocks`

| Column | Type | Nullability | Default / check |
|---|---|---|---|
| `id` | `uuid` | NOT NULL | default `gen_random_uuid()` |
| `blocker_id` | `uuid` | NOT NULL | — |
| `blocked_id` | `uuid` | NOT NULL | — |
| `created_at` | `timestamp with time zone` | NULL | default `now()` |

**Primary / unique keys**
- Primary key: `PRIMARY KEY (id)` (`user_blocks_pkey`)
- Unique: `UNIQUE (blocker_id, blocked_id)` (`unique_block`)

**Foreign keys**
- `user_blocks_blocker_id_fkey`: `blocker_id` → `public.profiles` (`user_id`)
- `user_blocks_blocked_id_fkey`: `blocked_id` → `public.profiles` (`user_id`)

### `startup_posts`

| Column | Type | Nullability | Default / check |
|---|---|---|---|
| `id` | `uuid` | NOT NULL | default `gen_random_uuid()` |
| `startup_id` | `uuid` | NOT NULL | — |
| `title` | `text` | NULL | — |
| `content` | `text` | NOT NULL | — |
| `summary` | `text` | NULL | — |
| `source_url` | `text` | NOT NULL | — |
| `source_type` | `text` | NOT NULL | default `'website'::text` |
| `image_url` | `text` | NULL | — |
| `hashtags` | `ARRAY` | NULL | default `'{}'::text[]` |
| `published_at` | `timestamp with time zone` | NOT NULL | default `now()` |
| `views_count` | `integer` | NOT NULL | default `0` |
| `likes_count` | `integer` | NOT NULL | default `0` |
| `created_at` | `timestamp with time zone` | NOT NULL | default `now()` |

**Primary / unique keys**
- Primary key: `PRIMARY KEY (id)` (`startup_posts_pkey`)
- Unique: `UNIQUE (startup_id, source_url)` (`startup_posts_startup_id_source_url_key`)

**Foreign keys**
- `startup_posts_startup_id_fkey`: `startup_id` → `public.startups` (`id`)

### `startups`

| Column | Type | Nullability | Default / check |
|---|---|---|---|
| `id` | `uuid` | NOT NULL | default `gen_random_uuid()` |
| `slug` | `text` | NOT NULL | — |
| `name` | `text` | NOT NULL | — |
| `category` | `text` | NOT NULL | — |
| `description` | `text` | NULL | — |
| `website` | `text` | NULL | — |
| `logo_url` | `text` | NULL | — |
| `hq` | `text` | NULL | — |
| `founded` | `text` | NULL | — |
| `rss_feeds` | `ARRAY` | NULL | default `'{}'::text[]` |
| `twitter_handle` | `text` | NULL | — |
| `created_at` | `timestamp with time zone` | NOT NULL | default `now()` |
| `updated_at` | `timestamp with time zone` | NOT NULL | default `now()` |
| `verified` | `boolean` | NOT NULL | default `true` |
| `claimed_by_user_id` | `uuid` | NULL | — |

**Primary / unique keys**
- Primary key: `PRIMARY KEY (id)` (`startups_pkey`)
- Unique: `UNIQUE (slug)` (`startups_slug_key`)

**Foreign keys**
- `startup_posts_startup_id_fkey`: `startup_id` → `public.startups` (`id`)
- `live_events_related_startup_id_fkey`: `related_startup_id` → `public.startups` (`id`)
- `startup_roles_startup_id_fkey`: `startup_id` → `public.startups` (`id`)
- `followers_following_startup_id_fkey`: `following_startup_id` → `public.startups` (`id`)
- `vendor_startup_links_startup_id_fkey`: `startup_id` → `public.startups` (`id`)
- `startups_claimed_by_user_id_fkey`: `claimed_by_user_id` → `auth.users` (`id`)

### `startup_roles`

| Column | Type | Nullability | Default / check |
|---|---|---|---|
| `id` | `uuid` | NOT NULL | default `gen_random_uuid()` |
| `startup_id` | `uuid` | NOT NULL | — |
| `title` | `text` | NOT NULL | — |
| `role_type` | `text` | NOT NULL | check `role_type = ANY (ARRAY['Full-time'::text, 'Part-time'::text, 'Internship'::text, 'Contract'::text, 'Volunteer'::text])` |
| `work_mode` | `text` | NOT NULL | check `work_mode = ANY (ARRAY['On-site'::text, 'Remote'::text, 'Hybrid'::text])` |
| `location` | `text` | NULL | — |
| `description` | `text` | NULL | check `char_length(description) <= 200` |
| `apply_url` | `text` | NOT NULL | — |
| `is_active` | `boolean` | NULL | default `true` |
| `posted_at` | `timestamp with time zone` | NULL | default `now()` |
| `expires_at` | `timestamp with time zone` | NULL | — |
| `tags` | `ARRAY` | NOT NULL | default `ARRAY[]::text[]` |

**Primary / unique keys**
- Primary key: `PRIMARY KEY (id)` (`startup_roles_pkey`)

**Foreign keys**
- `role_views_role_id_fkey`: `role_id` → `public.startup_roles` (`id`)
- `startup_roles_startup_id_fkey`: `startup_id` → `public.startups` (`id`)

### `featured_content`

| Column | Type | Nullability | Default / check |
|---|---|---|---|
| `id` | `uuid` | NOT NULL | default `gen_random_uuid()` |
| `category` | `text` | NOT NULL | check `category = ANY (ARRAY['india_in_space'::text, 'spotlight'::text, 'announcement'::text])` |
| `content_type` | `text` | NOT NULL | check `content_type = ANY (ARRAY['post'::text, 'startup_milestone'::text, 'person_achievement'::text, 'external_link'::text])` |
| `content_ref_id` | `text` | NULL | — |
| `headline` | `text` | NOT NULL | — |
| `summary` | `text` | NULL | — |
| `thumbnail_url` | `text` | NULL | — |
| `link_url` | `text` | NULL | — |
| `link_label` | `text` | NULL | — |
| `is_active` | `boolean` | NULL | default `true` |
| `valid_from` | `timestamp with time zone` | NULL | default `now()` |
| `valid_until` | `timestamp with time zone` | NULL | — |
| `sort_order` | `integer` | NULL | default `0` |
| `created_by` | `uuid` | NULL | — |
| `created_at` | `timestamp with time zone` | NULL | default `now()` |

**Primary / unique keys**
- Primary key: `PRIMARY KEY (id)` (`featured_content_pkey`)

**Foreign keys**
- `featured_content_created_by_fkey`: `created_by` → `public.profiles` (`user_id`)

### `apod_cache`

| Column | Type | Nullability | Default / check |
|---|---|---|---|
| `id` | `integer` | NOT NULL | default `1`; check `id = 1` |
| `date` | `date` | NOT NULL | — |
| `title` | `text` | NOT NULL | — |
| `explanation` | `text` | NULL | — |
| `url` | `text` | NOT NULL | — |
| `thumbnail_url` | `text` | NULL | — |
| `media_type` | `text` | NULL | — |
| `updated_at` | `timestamp with time zone` | NULL | default `now()` |

**Primary / unique keys**
- Primary key: `PRIMARY KEY (id)` (`apod_cache_pkey`)

### `profile_badge_awards`

| Column | Type | Nullability | Default / check |
|---|---|---|---|
| `id` | `uuid` | NOT NULL | default `gen_random_uuid()` |
| `user_id` | `uuid` | NOT NULL | — |
| `badge_type` | `text` | NOT NULL | check `badge_type = ANY (ARRAY['Space Pioneer'::text, 'Startup Founder'::text, 'Mission Contributor'::text, 'Top Educator'::text, 'Community Builder'::text])` |
| `awarded_by` | `text` | NOT NULL | check `awarded_by = ANY (ARRAY['admin'::text, 'auto_trigger'::text])` |
| `award_reason` | `text` | NULL | — |
| `awarded_at` | `timestamp with time zone` | NULL | default `now()` |
| `badge_id` | `text` | NULL | — |

**Primary / unique keys**
- Primary key: `PRIMARY KEY (id)` (`profile_badge_awards_pkey`)

**Foreign keys**
- `profile_badge_awards_user_id_fkey`: `user_id` → `public.profiles` (`user_id`)
- `profile_badge_awards_badge_id_fkey`: `badge_id` → `public.badges` (`id`)

### `profiles`

| Column | Type | Nullability | Default / check |
|---|---|---|---|
| `id` | `uuid` | NOT NULL | default `gen_random_uuid()` |
| `user_id` | `uuid` | NOT NULL | — |
| `username` | `text` | NULL | — |
| `display_name` | `text` | NULL | — |
| `avatar_url` | `text` | NULL | — |
| `bio` | `text` | NULL | — |
| `location` | `text` | NULL | — |
| `website` | `text` | NULL | — |
| `interests` | `ARRAY` | NULL | default `'{}'::text[]` |
| `created_at` | `timestamp with time zone` | NOT NULL | default `now()` |
| `updated_at` | `timestamp with time zone` | NOT NULL | default `now()` |
| `messaging_open_to` | `text` | NULL | default `'everyone'::text`; check `messaging_open_to = ANY (ARRAY['everyone'::text, 'followers'::text, 'nobody'::text])` |
| `messaging_allowed_categories` | `ARRAY` | NULL | default `ARRAY['Collaboration'::text, 'Investment Interest'::text, 'Job Opportunity'::text, 'Research'::text, 'Question'::text, 'Other'::text]` |
| `show_online_status` | `boolean` | NULL | default `true` |
| `last_seen_at` | `timestamp with time zone` | NULL | — |
| `require_complete_profile_to_message` | `boolean` | NULL | default `false` |
| `badges` | `ARRAY` | NULL | default `ARRAY[]::text[]` |
| `weekly_digest_opt_in` | `boolean` | NOT NULL | default `false` |

**Primary / unique keys**
- Primary key: `PRIMARY KEY (id)` (`profiles_pkey`)
- Unique: `UNIQUE (user_id)` (`profiles_user_id_key`)
- Unique: `UNIQUE (username)` (`profiles_username_key`)

**Foreign keys**
- `api_keys_user_id_fkey`: `user_id` → `public.profiles` (`user_id`)
- `message_threads_participant_a_fkey`: `participant_a` → `public.profiles` (`user_id`)
- `message_threads_participant_b_fkey`: `participant_b` → `public.profiles` (`user_id`)
- `vendors_created_by_fkey`: `created_by` → `public.profiles` (`user_id`)
- `role_views_user_id_fkey`: `user_id` → `public.profiles` (`user_id`)
- `profile_badge_awards_user_id_fkey`: `user_id` → `public.profiles` (`user_id`)
- `featured_content_created_by_fkey`: `created_by` → `public.profiles` (`user_id`)
- `live_event_reminders_user_id_fkey`: `user_id` → `public.profiles` (`user_id`)
- `live_events_created_by_fkey`: `created_by` → `public.profiles` (`user_id`)
- `user_blocks_blocked_id_fkey`: `blocked_id` → `public.profiles` (`user_id`)
- `user_blocks_blocker_id_fkey`: `blocker_id` → `public.profiles` (`user_id`)
- `messages_sender_id_fkey`: `sender_id` → `public.profiles` (`user_id`)
- `connection_requests_recipient_id_fkey`: `recipient_id` → `public.profiles` (`user_id`)
- `connection_requests_sender_id_fkey`: `requester_id` → `public.profiles` (`user_id`)

### `course_progress`

| Column | Type | Nullability | Default / check |
|---|---|---|---|
| `id` | `uuid` | NOT NULL | default `gen_random_uuid()` |
| `user_id` | `uuid` | NOT NULL | — |
| `course_id` | `uuid` | NOT NULL | — |
| `lesson_id` | `uuid` | NOT NULL | — |
| `completed_at` | `timestamp with time zone` | NOT NULL | default `now()` |

**Primary / unique keys**
- Primary key: `PRIMARY KEY (id)` (`course_progress_pkey`)
- Unique: `UNIQUE (user_id, lesson_id)` (`course_progress_user_id_lesson_id_key`)

**Foreign keys**
- `course_progress_lesson_id_fkey`: `lesson_id` → `public.course_lessons` (`id`)
- `course_progress_user_id_fkey`: `user_id` → `auth.users` (`id`)
- `course_progress_course_id_fkey`: `course_id` → `public.courses` (`id`)

### `course_enrollments`

| Column | Type | Nullability | Default / check |
|---|---|---|---|
| `id` | `uuid` | NOT NULL | default `gen_random_uuid()` |
| `user_id` | `uuid` | NOT NULL | — |
| `course_id` | `uuid` | NOT NULL | — |
| `enrolled_at` | `timestamp with time zone` | NOT NULL | default `now()` |

**Primary / unique keys**
- Primary key: `PRIMARY KEY (id)` (`course_enrollments_pkey`)
- Unique: `UNIQUE (user_id, course_id)` (`course_enrollments_user_id_course_id_key`)

**Foreign keys**
- `course_enrollments_course_id_fkey`: `course_id` → `public.courses` (`id`)
- `course_enrollments_user_id_fkey`: `user_id` → `auth.users` (`id`)

### `live_events`

| Column | Type | Nullability | Default / check |
|---|---|---|---|
| `id` | `uuid` | NOT NULL | default `gen_random_uuid()` |
| `title` | `text` | NOT NULL | — |
| `event_type` | `text` | NOT NULL | check `event_type = ANY (ARRAY['ISS Stream'::text, 'Conference'::text, 'Engine Test'::text, 'Mission Broadcast'::text, 'Startup Demo'::text, 'Astronomy Event'::text, 'Agency Announcement'::text, 'Other'::text])` |
| `description` | `text` | NULL | — |
| `start_time` | `timestamp with time zone` | NOT NULL | — |
| `end_time` | `timestamp with time zone` | NULL | — |
| `embed_url` | `text` | NULL | — |
| `external_url` | `text` | NULL | — |
| `related_topic_slug` | `text` | NULL | — |
| `related_startup_id` | `uuid` | NULL | — |
| `related_launch_id` | `uuid` | NULL | — |
| `hashtags` | `ARRAY` | NULL | — |
| `thumbnail_url` | `text` | NULL | — |
| `is_complete` | `boolean` | NULL | default `false` |
| `archive_summary` | `text` | NULL | — |
| `vod_url` | `text` | NULL | — |
| `created_by` | `uuid` | NULL | — |
| `created_at` | `timestamp with time zone` | NULL | default `now()` |

**Primary / unique keys**
- Primary key: `PRIMARY KEY (id)` (`live_events_pkey`)

**Foreign keys**
- `live_events_created_by_fkey`: `created_by` → `public.profiles` (`user_id`)
- `live_events_related_startup_id_fkey`: `related_startup_id` → `public.startups` (`id`)

### `live_event_reminders`

| Column | Type | Nullability | Default / check |
|---|---|---|---|
| `id` | `uuid` | NOT NULL | default `gen_random_uuid()` |
| `user_id` | `uuid` | NOT NULL | — |
| `event_type` | `text` | NOT NULL | check `event_type = ANY (ARRAY['launch'::text, 'live_event'::text])` |
| `event_id` | `uuid` | NOT NULL | — |
| `reminder_offset_minutes` | `integer` | NOT NULL | check `reminder_offset_minutes = ANY (ARRAY[0, 10, 30])` |
| `sent` | `boolean` | NULL | default `false` |
| `sent_at` | `timestamp with time zone` | NULL | — |
| `created_at` | `timestamp with time zone` | NULL | default `now()` |

**Primary / unique keys**
- Primary key: `PRIMARY KEY (id)` (`live_event_reminders_pkey`)
- Unique: `UNIQUE (user_id, event_type, event_id, reminder_offset_minutes)` (`unique_reminder`)

**Foreign keys**
- `live_event_reminders_user_id_fkey`: `user_id` → `public.profiles` (`user_id`)

### `vendors`

| Column | Type | Nullability | Default / check |
|---|---|---|---|
| `id` | `uuid` | NOT NULL | default `gen_random_uuid()` |
| `slug` | `text` | NOT NULL | — |
| `legal_name` | `text` | NOT NULL | — |
| `trade_name` | `text` | NULL | — |
| `category_tags` | `ARRAY` | NOT NULL | — |
| `services_summary` | `text` | NOT NULL | check `char_length(services_summary) >= 50 AND char_length(services_summary) <= 500` |
| `website_url` | `text` | NOT NULL | — |
| `contact_email` | `text` | NULL | — |
| `geographic_coverage` | `text` | NULL | — |
| `known_clients` | `text` | NULL | — |
| `certifications` | `ARRAY` | NULL | — |
| `is_verified` | `boolean` | NULL | default `false` |
| `is_active` | `boolean` | NULL | default `true` |
| `last_verified_at` | `date` | NULL | — |
| `created_by` | `uuid` | NULL | — |
| `created_at` | `timestamp with time zone` | NULL | default `now()` |
| `updated_at` | `timestamp with time zone` | NULL | default `now()` |

**Primary / unique keys**
- Primary key: `PRIMARY KEY (id)` (`vendors_pkey`)
- Unique: `UNIQUE (slug)` (`vendors_slug_key`)

**Foreign keys**
- `vendors_created_by_fkey`: `created_by` → `public.profiles` (`user_id`)
- `vendor_startup_links_vendor_id_fkey`: `vendor_id` → `public.vendors` (`id`)

### `role_views`

| Column | Type | Nullability | Default / check |
|---|---|---|---|
| `id` | `uuid` | NOT NULL | default `gen_random_uuid()` |
| `role_id` | `uuid` | NOT NULL | — |
| `user_id` | `uuid` | NULL | — |
| `session_id` | `text` | NULL | — |
| `viewer_badges` | `ARRAY` | NULL | — |
| `created_at` | `timestamp with time zone` | NULL | default `now()` |

**Primary / unique keys**
- Primary key: `PRIMARY KEY (id)` (`role_views_pkey`)

**Foreign keys**
- `role_views_role_id_fkey`: `role_id` → `public.startup_roles` (`id`)
- `role_views_user_id_fkey`: `user_id` → `public.profiles` (`user_id`)

### `launches`

| Column | Type | Nullability | Default / check |
|---|---|---|---|
| `id` | `uuid` | NOT NULL | default `gen_random_uuid()` |
| `slug` | `text` | NOT NULL | — |
| `name` | `text` | NOT NULL | — |
| `provider` | `text` | NOT NULL | — |
| `mission_type` | `text` | NULL | — |
| `launch_date` | `timestamp with time zone` | NOT NULL | — |
| `launch_window_start` | `timestamp with time zone` | NULL | — |
| `launch_window_end` | `timestamp with time zone` | NULL | — |
| `location` | `text` | NULL | — |
| `vehicle` | `text` | NULL | — |
| `payload` | `text` | NULL | — |
| `status` | `text` | NOT NULL | default `'scheduled'::text`; check `status = ANY (ARRAY['announced'::text, 'scheduled'::text, 'delayed'::text, 'in_preparation'::text, 'launched'::text, 'completed'::text, 'scrubbed'::text, 'failed'::text, 'archived'::text])` |
| `description` | `text` | NULL | — |
| `image_url` | `text` | NULL | — |
| `livestream_url` | `text` | NULL | — |
| `created_at` | `timestamp with time zone` | NOT NULL | default `now()` |
| `updated_at` | `timestamp with time zone` | NOT NULL | default `now()` |

**Primary / unique keys**
- Primary key: `PRIMARY KEY (id)` (`launches_pkey`)
- Unique: `UNIQUE (slug)` (`launches_slug_key`)

**Foreign keys**
- `launch_sources_launch_id_fkey`: `launch_id` → `public.launches` (`id`)
- `launch_updates_launch_id_fkey`: `launch_id` → `public.launches` (`id`)
- `launch_status_log_launch_id_fkey`: `launch_id` → `public.launches` (`id`)
- `posts_launch_id_fkey`: `launch_id` → `public.launches` (`id`)

### `api_keys`

| Column | Type | Nullability | Default / check |
|---|---|---|---|
| `id` | `uuid` | NOT NULL | default `gen_random_uuid()` |
| `user_id` | `uuid` | NOT NULL | — |
| `key_hash` | `text` | NOT NULL | — |
| `key_prefix` | `text` | NOT NULL | — |
| `tier` | `text` | NOT NULL | default `'free'::text`; check `tier = ANY (ARRAY['free'::text, 'pro'::text, 'enterprise'::text])` |
| `is_active` | `boolean` | NULL | default `true` |
| `created_at` | `timestamp with time zone` | NULL | default `now()` |
| `last_used_at` | `timestamp with time zone` | NULL | — |

**Primary / unique keys**
- Primary key: `PRIMARY KEY (id)` (`api_keys_pkey`)
- Unique: `UNIQUE (key_hash)` (`api_keys_key_hash_key`)
- Unique: `UNIQUE (user_id)` (`api_keys_user_id_key`)

**Foreign keys**
- `api_keys_user_id_fkey`: `user_id` → `public.profiles` (`user_id`)
- `api_usage_log_api_key_hash_fkey`: `api_key_hash` → `public.api_keys` (`key_hash`)

### `api_usage_log`

| Column | Type | Nullability | Default / check |
|---|---|---|---|
| `id` | `bigint` | NOT NULL | default `nextval('api_usage_log_id_seq'::regclass)` |
| `api_key_hash` | `text` | NOT NULL | — |
| `endpoint` | `text` | NOT NULL | — |
| `method` | `text` | NOT NULL | default `'GET'::text` |
| `status_code` | `integer` | NULL | — |
| `response_time_ms` | `integer` | NULL | — |
| `created_at` | `timestamp with time zone` | NULL | default `now()` |

**Primary / unique keys**
- Primary key: `PRIMARY KEY (id)` (`api_usage_log_pkey`)

**Foreign keys**
- `api_usage_log_api_key_hash_fkey`: `api_key_hash` → `public.api_keys` (`key_hash`)

### `moderation_reports`

| Column | Type | Nullability | Default / check |
|---|---|---|---|
| `id` | `uuid` | NOT NULL | default `gen_random_uuid()` |
| `reporter_id` | `uuid` | NOT NULL | — |
| `target_type` | `text` | NOT NULL | check `target_type = ANY (ARRAY['post'::text, 'startup_post'::text, 'themed_post'::text, 'comment'::text, 'message'::text, 'thread'::text, 'user'::text])` |
| `target_id` | `text` | NOT NULL | — |
| `reason` | `text` | NOT NULL | — |
| `details` | `text` | NULL | — |
| `status` | `text` | NOT NULL | default `'open'::text`; check `status = ANY (ARRAY['open'::text, 'reviewing'::text, 'resolved'::text, 'dismissed'::text])` |
| `reviewed_by` | `uuid` | NULL | — |
| `created_at` | `timestamp with time zone` | NOT NULL | default `now()` |
| `reviewed_at` | `timestamp with time zone` | NULL | — |

**Primary / unique keys**
- Primary key: `PRIMARY KEY (id)` (`moderation_reports_pkey`)

**Foreign keys**
- `moderation_reports_reporter_id_fkey`: `reporter_id` → `auth.users` (`id`)
- `moderation_reports_reviewed_by_fkey`: `reviewed_by` → `auth.users` (`id`)

### `sync_jobs`

| Column | Type | Nullability | Default / check |
|---|---|---|---|
| `id` | `uuid` | NOT NULL | default `gen_random_uuid()` |
| `job_name` | `text` | NOT NULL | — |
| `last_run_at` | `timestamp with time zone` | NULL | — |
| `last_status` | `text` | NULL | — |
| `items_processed` | `integer` | NULL | default `0` |
| `error_message` | `text` | NULL | — |
| `created_at` | `timestamp with time zone` | NULL | default `now()` |
| `updated_at` | `timestamp with time zone` | NULL | default `now()` |
| `last_success_at` | `timestamp with time zone` | NULL | — |
| `last_error` | `text` | NULL | — |
| `status` | `text` | NULL | — |

**Primary / unique keys**
- Primary key: `PRIMARY KEY (id)` (`sync_jobs_pkey`)
- Unique: `UNIQUE (job_name)` (`sync_jobs_job_name_key`)

### `notifications`

| Column | Type | Nullability | Default / check |
|---|---|---|---|
| `id` | `uuid` | NOT NULL | default `gen_random_uuid()` |
| `user_id` | `uuid` | NOT NULL | — |
| `kind` | `text` | NOT NULL | default `'new_post'::text` |
| `account_type` | `text` | NOT NULL | — |
| `account_id` | `uuid` | NOT NULL | — |
| `account_name` | `text` | NULL | — |
| `account_handle` | `text` | NULL | — |
| `post_type` | `text` | NULL | — |
| `post_id` | `uuid` | NULL | — |
| `title` | `text` | NULL | — |
| `preview` | `text` | NULL | — |
| `image_url` | `text` | NULL | — |
| `link` | `text` | NULL | — |
| `read` | `boolean` | NOT NULL | default `false` |
| `created_at` | `timestamp with time zone` | NOT NULL | default `now()` |

**Primary / unique keys**
- Primary key: `PRIMARY KEY (id)` (`notifications_pkey`)

### `follows`

| Column | Type | Nullability | Default / check |
|---|---|---|---|
| `id` | `uuid` | NOT NULL | default `gen_random_uuid()` |
| `follower_id` | `uuid` | NOT NULL | — |
| `following_id` | `uuid` | NULL | — |
| `created_at` | `timestamp with time zone` | NOT NULL | default `now()` |
| `target_type` | `text` | NOT NULL | default `'user'::text` |
| `target_id` | `uuid` | NOT NULL | — |

**Primary / unique keys**
- Primary key: `PRIMARY KEY (id)` (`follows_pkey`)

### `followers`

| Column | Type | Nullability | Default / check |
|---|---|---|---|
| `id` | `uuid` | NOT NULL | default `gen_random_uuid()` |
| `follower_id` | `uuid` | NOT NULL | — |
| `following_startup_id` | `uuid` | NOT NULL | — |
| `created_at` | `timestamp with time zone` | NOT NULL | default `timezone('utc'::text, now())` |

**Primary / unique keys**
- Primary key: `PRIMARY KEY (id)` (`followers_pkey`)
- Unique: `UNIQUE (follower_id, following_startup_id)` (`followers_follower_id_following_startup_id_key`)

**Foreign keys**
- `followers_follower_id_fkey`: `follower_id` → `auth.users` (`id`)
- `followers_following_startup_id_fkey`: `following_startup_id` → `public.startups` (`id`)

### `bookmarks`

| Column | Type | Nullability | Default / check |
|---|---|---|---|
| `id` | `uuid` | NOT NULL | default `gen_random_uuid()` |
| `user_id` | `uuid` | NOT NULL | — |
| `post_id` | `text` | NOT NULL | — |
| `post_source` | `text` | NOT NULL | default `'user'::text`; check `post_source = ANY (ARRAY['user'::text, 'startup'::text, 'themed'::text])` |
| `created_at` | `timestamp with time zone` | NOT NULL | default `now()` |
| `target_type` | `text` | NULL | — |
| `target_id` | `uuid` | NULL | — |

**Primary / unique keys**
- Primary key: `PRIMARY KEY (id)` (`bookmarks_pkey`)
- Unique: `UNIQUE (user_id, post_id)` (`bookmarks_user_id_post_id_key`)

**Foreign keys**
- `bookmarks_user_id_fkey`: `user_id` → `auth.users` (`id`)

## Public functions

All functions in the `public` schema at snapshot time, with identity arguments, result type, and SECURITY DEFINER status.

| Function signature | Returns | Security definer |
|---|---|---|
| `public.accept_connection_rpc(p_request_id uuid)` | `uuid` | yes |
| `public.are_users_blocked(user_a uuid, user_b uuid)` | `boolean` | yes |
| `public.block_user_rpc(p_blocked_id uuid)` | `void` | yes |
| `public.can_send_connection_request()` | `boolean` | yes |
| `public.check_message_rate_limit(p_thread_id uuid, p_sender_id uuid)` | `boolean` | yes |
| `public.check_post_rate_limit()` | `trigger` | yes |
| `public.get_feed_page(p_user_id uuid, p_page_offset integer, p_page_size integer, p_mode text)` | `json` | no |
| `public.get_intel_digest(p_user_id uuid)` | `TABLE(entity_type text, entity_id text, entity_name text, entity_image text, change_description text, priority_score integer, url text)` | yes |
| `public.get_live_status()` | `TABLE(is_something_live boolean, live_event_id uuid, live_event_title text, live_event_type text, live_event_embed_url text, next_event_id uuid, next_event_title text, next_event_start timestamp with time zone, minutes_until_next integer)` | yes |
| `public.get_thread_for_users(user_a uuid, user_b uuid)` | `uuid` | yes |
| `public.get_trending_hashtags(p_hours integer)` | `TABLE(hashtag text, count integer, velocity_pct integer)` | yes |
| `public.gin_extract_query_trgm(text, internal, smallint, internal, internal, internal, internal)` | `internal` | no |
| `public.gin_extract_value_trgm(text, internal)` | `internal` | no |
| `public.gin_trgm_consistent(internal, smallint, text, integer, internal, internal, internal, internal)` | `boolean` | no |
| `public.gin_trgm_triconsistent(internal, smallint, text, integer, internal, internal, internal)` | `"char"` | no |
| `public.gtrgm_compress(internal)` | `internal` | no |
| `public.gtrgm_consistent(internal, text, smallint, oid, internal)` | `boolean` | no |
| `public.gtrgm_decompress(internal)` | `internal` | no |
| `public.gtrgm_distance(internal, text, smallint, oid, internal)` | `double precision` | no |
| `public.gtrgm_in(cstring)` | `gtrgm` | no |
| `public.gtrgm_options(internal)` | `void` | no |
| `public.gtrgm_out(gtrgm)` | `cstring` | no |
| `public.gtrgm_penalty(internal, internal, internal)` | `internal` | no |
| `public.gtrgm_picksplit(internal, internal)` | `internal` | no |
| `public.gtrgm_same(gtrgm, gtrgm, internal)` | `internal` | no |
| `public.gtrgm_union(internal, internal)` | `gtrgm` | no |
| `public.handle_followers_badge_trigger()` | `trigger` | yes |
| `public.handle_new_message_unread()` | `trigger` | yes |
| `public.handle_new_startup_role()` | `trigger` | yes |
| `public.handle_new_user()` | `trigger` | yes |
| `public.handle_startup_claim_badge()` | `trigger` | yes |
| `public.has_role(_user_id uuid, _role app_role)` | `boolean` | yes |
| `public.has_role(u_id uuid, r_name text)` | `boolean` | yes |
| `public.log_launch_status_change()` | `trigger` | yes |
| `public.mark_thread_read(p_thread_id uuid, p_user_id uuid)` | `void` | yes |
| `public.notify_followers_of_new_role()` | `trigger` | yes |
| `public.notify_startup_followers()` | `trigger` | yes |
| `public.notify_themed_followers()` | `trigger` | yes |
| `public.notify_user_followers()` | `trigger` | yes |
| `public.protect_connection_request_columns()` | `trigger` | no |
| `public.protect_profile_privileged_columns()` | `trigger` | no |
| `public.set_limit(real)` | `real` | no |
| `public.show_limit()` | `real` | no |
| `public.show_trgm(text)` | `text[]` | no |
| `public.similarity(text, text)` | `real` | no |
| `public.similarity_dist(text, text)` | `real` | no |
| `public.similarity_op(text, text)` | `boolean` | no |
| `public.strict_word_similarity(text, text)` | `real` | no |
| `public.strict_word_similarity_commutator_op(text, text)` | `boolean` | no |
| `public.strict_word_similarity_dist_commutator_op(text, text)` | `real` | no |
| `public.strict_word_similarity_dist_op(text, text)` | `real` | no |
| `public.strict_word_similarity_op(text, text)` | `boolean` | no |
| `public.update_updated_at_column()` | `trigger` | no |
| `public.word_similarity(text, text)` | `real` | no |
| `public.word_similarity_commutator_op(text, text)` | `boolean` | no |
| `public.word_similarity_dist_commutator_op(text, text)` | `real` | no |
| `public.word_similarity_dist_op(text, text)` | `real` | no |
| `public.word_similarity_op(text, text)` | `boolean` | no |

## Optional / legacy relations

- `badge_awards`: does not exist in `public`.
- `topic_discoveries`: exists in `public`.
- `aggregate_reactions`: exists in `public`.

## Realtime publications

| Publication | Schema | Table |
|---|---|---|
| `supabase_realtime` | `public` | `bookmarks` |
| `supabase_realtime` | `public` | `likes` |
| `supabase_realtime` | `public` | `messages` |
| `supabase_realtime` | `public` | `posts` |
| `supabase_realtime` | `public` | `startup_posts` |
| `supabase_realtime` | `public` | `themed_posts` |
| `supabase_realtime_messages_publication` | `realtime` | `messages_2026_10_19` |
| `supabase_realtime_messages_publication` | `realtime` | `messages_2026_10_20` |
| `supabase_realtime_messages_publication` | `realtime` | `messages_2026_10_21` |
| `supabase_realtime_messages_publication` | `realtime` | `messages_2026_10_22` |
| `supabase_realtime_messages_publication` | `realtime` | `messages_2026_10_23` |

## Storage buckets and object policies

### `post-media`

- Public: `True`; file-size limit: `52428800` bytes; MIME allowlist: `image/*, video/*`.

Policies on `storage.objects`:

- `Authenticated users can upload media` — INSERT for `authenticated`; predicate/check: `(bucket_id = 'post-media'::text)`.
- `Authenticated users upload post media` — INSERT for `authenticated`; predicate/check: `(bucket_id = 'post-media'::text)`.
- `Post media public read` — SELECT for `public`; predicate/check: `(bucket_id = 'post-media'::text)`.
- `Public Access` — SELECT for `anon, authenticated`; predicate/check: `(bucket_id = 'post-media'::text)`.
- `Users can delete own media` — DELETE for `authenticated`; predicate/check: `((bucket_id = 'post-media'::text) AND (owner = auth.uid()))`.

## Role-overload note

`has_role(uuid, app_role)` and `has_role(uuid, text)` both exist. Their argument names differ (`_user_id`, `_role` versus `u_id`, `r_name`); authenticated named-argument calls resolved to each overload. Anonymous EXECUTE is false for both. Current RLS policies call the `app_role` overload; no public function body was found depending on the text overload.
