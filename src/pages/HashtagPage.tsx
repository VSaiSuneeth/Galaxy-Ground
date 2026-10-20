import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Hash } from "lucide-react";
import PostCard from "@/components/PostCard";
import CreatePost from "@/components/CreatePost";
import { usePosts } from "@/hooks/usePosts";
import { TRENDING_TOPICS } from "@/lib/feed-data";
import { useQueryClient } from "@tanstack/react-query";
import { asArray } from "@/lib/safe-data";

const HashtagPage = () => {
  const { tag = "" } = useParams();
  const key = tag.toLowerCase();
  const meta = TRENDING_TOPICS[key];
  const { data: posts, isLoading } = usePosts({ hashtag: key, includeAggregated: true });
  const postList = asArray(posts);
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: ["posts"] });

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <Link to="/" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to feed
      </Link>

      <div className="glass-panel p-6">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Hash className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">{meta?.tag || `#${tag}`}</h1>
            <p className="text-xs text-muted-foreground">{postList.length} posts</p>
          </div>
        </div>
        {meta && <p className="text-sm text-foreground/80 mt-3">{meta.description}</p>}
      </div>

      <CreatePost onCreated={refresh} />

      {isLoading ? (
        <div className="glass-panel p-8 text-center text-sm text-muted-foreground">Loading…</div>
      ) : postList.length === 0 ? (
        <div className="glass-panel p-6 text-center text-sm text-muted-foreground">
          No posts yet for this topic. Start the conversation with #{tag}.
        </div>
      ) : (
        postList.map((p) => <PostCard key={p.id} post={p} onDeleted={refresh} />)
      )}
    </div>
  );
};

export default HashtagPage;
