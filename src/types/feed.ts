export interface FeedPost {
  id: string;
  user_id: string;
  content: string;
  media_url: string | null;
  media_type: "image" | "video" | null;
  community: string | null;
  hashtags: string[] | null;
  created_at: string;
  author: {
    user_id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
  likes_count: number;
  comments_count: number;
  user_has_liked?: boolean;
  user_has_bookmarked?: boolean;
  reaction_type?: string | null;
  reaction_summary?: Array<{ reaction_type: string; count: number }>;
  source?: "user" | "startup" | "themed";
  target_id?: string;
  startup_slug?: string;
  startup_name?: string;
  themed_handle?: string;
  source_url?: string;
  startup_id?: string;
  account_id?: string;
}
