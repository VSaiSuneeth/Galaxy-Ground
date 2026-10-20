import { AlertTriangle, Loader2 } from "lucide-react";

export function PageLoading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="max-w-2xl mx-auto glass-panel p-8 flex flex-col items-center justify-center gap-2">
      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

export function PageError({
  title = "Something went wrong",
  message,
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="max-w-2xl mx-auto glass-panel p-8 text-center border border-destructive/20">
      <AlertTriangle className="h-6 w-6 text-destructive mx-auto mb-2" />
      <p className="text-sm font-medium text-foreground">{title}</p>
      {message && <p className="text-xs text-muted-foreground mt-2">{message}</p>}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 px-4 py-1.5 rounded-lg text-sm bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Retry
        </button>
      )}
    </div>
  );
}
