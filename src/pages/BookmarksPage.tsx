import PostCard from "@/components/PostCard";
import { useBookmarkedPosts } from "@/hooks/useBookmarks";
import { asArray } from "@/lib/safe-data";

const BookmarksPage = () => {
  const { data: posts, isLoading } = useBookmarkedPosts();
  const postList = asArray(posts);

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div className="glass-panel p-4">
        <h1 className="text-lg font-semibold text-foreground">Saved posts</h1>
        <p className="text-xs text-muted-foreground mt-1">Your personal bookmark collection.</p>
      </div>
      {isLoading ? (
        <div className="glass-panel p-6 text-sm text-muted-foreground">Loading bookmarks...</div>
      ) : postList.length === 0 ? (
        <div className="glass-panel p-6 text-sm text-muted-foreground">No saved posts yet.</div>
      ) : (
        postList.map((post) => <PostCard key={post.id} post={post} />)
      )}
    </div>
  );
};

export default BookmarksPage;
