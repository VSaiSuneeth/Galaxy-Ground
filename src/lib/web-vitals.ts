/**
 * Reports Core Web Vitals metrics.
 *
 * Uses the browser's built-in PerformanceObserver when available.
 * In production the measurements are logged so they appear in server-side
 * log aggregators.  A future iteration should forward them to an analytics
 * endpoint or RUM service.
 *
 * TODO: Replace console.log with a POST to your RUM endpoint (e.g. Plausible,
 * Vercel Analytics, Datadog RUM) once the service is configured.
 */

type MetricName = "CLS" | "FCP" | "FID" | "INP" | "LCP" | "TTFB";

interface LayoutShiftEntry extends PerformanceEntry {
  hadRecentInput: boolean;
  value: number;
}

interface FirstInputEntry extends PerformanceEntry {
  processingStart: number;
}

function logMetric(name: MetricName, value: number): void {
  if (!import.meta.env.PROD) return;

  // Duration in milliseconds (CLS is unitless).
  const label = value < 100 ? "good" : value < 300 ? "needs-improvement" : "poor";
  console.log(`[web-vital] ${name}: ${value.toFixed(1)} (${label})`);

  // TODO: POST to a RUM endpoint:
  //   navigator.sendBeacon("/api/vitals", JSON.stringify({ name, value, label }));
}

export function reportWebVitals(): void {
  if (typeof window === "undefined" || !window.PerformanceObserver) return;

  try {
    // Largest Contentful Paint
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      if (entries.length > 0) logMetric("LCP", entries[entries.length - 1].startTime);
    }).observe({ type: "largest-contentful-paint", buffered: true });
  } catch { /* silently ignore unsupported metric */ }

  try {
    // First Contentful Paint
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        logMetric("FCP", entry.startTime);
        break;
      }
    }).observe({ type: "first-contentful-paint", buffered: true });
  } catch { /* silently ignore */ }

  try {
    // Cumulative Layout Shift
    let clsValue = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const layoutShift = entry as LayoutShiftEntry;
        if (!layoutShift.hadRecentInput) clsValue += layoutShift.value;
      }
      logMetric("CLS", clsValue);
    }).observe({ type: "layout-shift", buffered: true });
  } catch { /* silently ignore */ }

  try {
    // First Input Delay / Interaction to Next Paint
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const firstInput = entry as FirstInputEntry;
        logMetric("FID", firstInput.processingStart - firstInput.startTime);
        break;
      }
    }).observe({ type: "first-input", buffered: true });
  } catch { /* silently ignore */ }

  // Time to First Byte (from Navigation Timing API)
  if (performance?.getEntriesByType) {
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    if (nav) {
      logMetric("TTFB", nav.responseStart - nav.requestStart);
    }
  }
}
