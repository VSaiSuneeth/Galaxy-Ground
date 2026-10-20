/**
 * Sentry integration wrapper.
 *
 * Currently a no-op that logs to console.  To activate:
 *
 *   1. npm install @sentry/react @sentry/browser
 *   2. Replace the function bodies below with real Sentry calls.
 *   3. Set VITE_SENTRY_DSN in .env (or as a build-time env).
 *   4. Call initSentry() from main.tsx before rendering the app.
 *
 * After activation the existing reportError() calls across the codebase
 * will automatically forward errors to Sentry with zero additional changes.
 */

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined;

/** True after initSentry() has been called. */
let _initialized = false;

/**
 * Call once from main.tsx to initialise Sentry.
 *
 * Until the SDK is installed this is a no-op that logs a reminder
 * in development.
 */
export function initSentry(): void {
  if (_initialized) return;
  _initialized = true;

  if (!SENTRY_DSN) {
    if (import.meta.env.DEV) {
      console.warn("[sentry] VITE_SENTRY_DSN not set — errors will only log to console.");
    }
    return;
  }

  // TODO: After `npm install @sentry/react`, uncomment the lines below.
  //   Sentry.init({
  //     dsn: SENTRY_DSN,
  //     environment: import.meta.env.MODE,
  //     integrations: [Sentry.browserTracingIntegration()],
  //     tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
  //   });
  //   console.log("[sentry] Initialised with DSN:", SENTRY_DSN.slice(0, 20) + "...");
}

/**
 * Capture an exception with context.
 *
 * Safe to call before initSentry() — messages are queued to console
 * until the SDK is installed.
 */
export function captureException(error: unknown, context: string): void {
  const message = error instanceof Error ? error.message : String(error ?? "Unknown error");
  const stack = error instanceof Error ? error.stack : undefined;

  // TODO: After @sentry/react is installed, replace the body with:
  //   Sentry.withScope((scope) => {
  //     scope.setExtra("context", context);
  //     Sentry.captureException(error);
  //   });

  console.error(`[Galaxy Ground] ${context}: ${message}`);
  if (stack) console.error(stack);
}

/**
 * Set user context so errors are attributed to the current user.
 * Call after auth state changes.
 */
export function setSentryUser(userId: string | null, email?: string | null): void {
  if (!_initialized) return;
  // TODO: After @sentry/react is installed:
  //   Sentry.setUser(userId ? { id: userId, email: email ?? undefined } : null);
}

/** Set a breadcrumb for the current transaction. */
export function addSentryBreadcrumb(message: string, category = "action"): void {
  if (!_initialized) return;
  // TODO: After @sentry/react is installed:
  //   Sentry.addBreadcrumb({ message, category });
}
