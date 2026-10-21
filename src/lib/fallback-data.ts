/** Sample records are local-only by default and never masquerade as live data in production. */
export const allowFallbackData =
  import.meta.env.VITE_ALLOW_FALLBACK_DATA === "true" ||
  (import.meta.env.DEV && import.meta.env.VITE_ALLOW_FALLBACK_DATA !== "false");
