const PostSkeleton = () => (
  <div className="glass-panel p-4 animate-pulse">
    <div className="flex items-center gap-3 mb-3">
      <div className="h-10 w-10 rounded-full bg-muted/40" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-32 bg-muted/40 rounded" />
        <div className="h-2.5 w-20 bg-muted/30 rounded" />
      </div>
    </div>
    <div className="space-y-2 mb-3">
      <div className="h-3 w-full bg-muted/40 rounded" />
      <div className="h-3 w-5/6 bg-muted/40 rounded" />
      <div className="h-3 w-3/4 bg-muted/30 rounded" />
    </div>
    <div className="h-40 w-full bg-muted/20 rounded-lg" />
    <div className="flex gap-2 mt-3 pt-2 border-t border-glass-border">
      <div className="h-6 w-14 bg-muted/30 rounded" />
      <div className="h-6 w-14 bg-muted/30 rounded" />
      <div className="h-6 w-14 bg-muted/30 rounded" />
    </div>
  </div>
);

export default PostSkeleton;
