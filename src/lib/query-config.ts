/** Shared TanStack Query defaults — applied globally and per-hook. */
export const QUERY_DEFAULTS = {
  staleTime: 60_000,
  gcTime: 300_000,
  refetchOnWindowFocus: false,
} as const;

/** Sidebar suggestions refresh once per day. */
export const SIDEBAR_SUGGESTIONS_STALE_MS = 24 * 60 * 60 * 1000;
