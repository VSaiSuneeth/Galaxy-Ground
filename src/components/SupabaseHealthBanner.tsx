import { AlertTriangle, Database, RefreshCw } from "lucide-react";
import { useSupabaseHealth } from "@/hooks/useSupabaseHealth";

const SupabaseHealthBanner = () => {
  const { data, isLoading, refetch, isFetching } = useSupabaseHealth();

  if (isLoading || !data) return null;

  const total = data.totalContent;
  const envMissing = data.envMissing ?? [];
  const envIssue = envMissing.length > 0;
  const connIssue = !!data.connectionError;
  const emptyDb = !connIssue && !envIssue && total === 0;
  const schemaIssue = Object.keys(data.tableErrors).length > 0;
  const warnings = Object.entries(data.tableWarnings || {});
  const bookmarksWarn = data.tableWarnings?.bookmarks;
  const onlyBookmarksHint =
    !!bookmarksWarn && !schemaIssue && !connIssue && !envIssue && !emptyDb;

  if (data.ok && !schemaIssue && !connIssue && !envIssue && (total > 0 || onlyBookmarksHint)) {
    return null;
  }

  return (
    <div className="mb-4 glass-panel border border-destructive/30 p-4 text-sm">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
        <div className="flex-1 space-y-2">
          <p className="font-medium text-foreground flex items-center gap-2">
            <Database className="h-4 w-4" />
            Supabase connection or data issue
          </p>

          {envIssue && (
            <p className="text-muted-foreground">
              Missing environment variables: <code className="text-xs">{envMissing.join(", ")}</code>.
              Copy <code className="text-xs">.env.example</code> → <code className="text-xs">.env</code> and add keys from
              Supabase Dashboard → Settings → API.
            </p>
          )}

          {connIssue && (
            <p className="text-muted-foreground">
              {data.connectionError} Verify <code className="text-xs">VITE_SUPABASE_URL</code> matches your project,
              the project is not paused, and migrations are applied (<code className="text-xs">supabase db push</code>).
            </p>
          )}

          {schemaIssue && (
            <ul className="text-xs text-muted-foreground list-disc pl-4">
              {Object.entries(data.tableErrors)
                .slice(0, 5)
                .map(([t, msg]) => (
                  <li key={t}>
                    <strong>{t}</strong>: {msg}
                  </li>
                ))}
            </ul>
          )}

          {bookmarksWarn && !schemaIssue && (
            <p className="text-xs text-muted-foreground">{bookmarksWarn}</p>
          )}

          {warnings.length > 0 && !schemaIssue && !bookmarksWarn && (
            <ul className="text-xs text-muted-foreground list-disc pl-4">
              {warnings.slice(0, 3).map(([t, msg]) => (
                <li key={t}>
                  <strong>{t}</strong>: {msg}
                </li>
              ))}
            </ul>
          )}

          {emptyDb && (
            <p className="text-muted-foreground">
              Connected, but feed tables are empty (0 posts). Run migrations on project{" "}
              <code className="text-xs">lmdswaagcdxulcczkqmu</code> and optionally invoke edge functions for RSS content.
              User posts require signing in and creating content.
            </p>
          )}

          {!emptyDb && data.ok === false && data.counts && (
            <p className="text-xs text-muted-foreground">
              Row counts: posts={data.counts.posts ?? "?"}, startup_posts={data.counts.startup_posts ?? "?"},
              themed_posts={data.counts.themed_posts ?? "?"}
            </p>
          )}

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <RefreshCw className={`h-3 w-3 ${isFetching ? "animate-spin" : ""}`} />
            Re-check connection
          </button>
        </div>
      </div>
    </div>
  );
};

export default SupabaseHealthBanner;
