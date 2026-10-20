import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import PostCard from "@/components/PostCard";
import CommentsSection from "@/components/CommentsSection";
import { usePostById } from "@/hooks/usePosts";

const PostDetailPage = () => {
  const { id } = useParams();
  const { data: post, isLoading } = usePostById(id);

  if (isLoading) {
    return <div className="max-w-2xl mx-auto glass-panel p-6 text-sm text-muted-foreground">Loading post...</div>;
  }

  if (!post) {
    return <div className="max-w-2xl mx-auto glass-panel p-6 text-sm text-muted-foreground">Post not found.</div>;
  }

  const isUser = post.source === "user" || !post.source;
  const aggregateType = post.source === "startup" ? "startup" : post.source === "themed" ? "themed" : null;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <Link to="/" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to feed
      </Link>
      <PostCard post={post} />
      <div className="glass-panel p-4">
        {isUser ? (
          <CommentsSection postId={post.id} />
        ) : aggregateType && post.target_id ? (
          <CommentsSection targetType={aggregateType} targetId={post.target_id} />
        ) : null}
      </div>
    </div>
  );
};

export default PostDetailPage;
