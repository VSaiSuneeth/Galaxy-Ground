import { createRoot } from "react-dom/client";
import "@fontsource/space-grotesk/300.css";
import "@fontsource/space-grotesk/400.css";
import "@fontsource/space-grotesk/500.css";
import "@fontsource/space-grotesk/600.css";
import "@fontsource/space-grotesk/700.css";
import App from "./App.tsx";
import { initSentry } from "@/lib/sentry";
import { reportWebVitals } from "@/lib/web-vitals";
import "./index.css";

// Initialise error monitoring (no-op until @sentry/react is installed).
initSentry();

// Report Web Vitals in production (silent in dev).
reportWebVitals();

// Register service worker for offline support and asset caching.
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Service worker registration failures are non-fatal.
    });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
