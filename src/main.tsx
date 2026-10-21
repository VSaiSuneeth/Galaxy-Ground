import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { initSentry } from "@/lib/sentry";
import { reportWebVitals } from "@/lib/web-vitals";
import "@fontsource-variable/instrument-sans";
import "@fontsource-variable/fraunces";
import "@fontsource-variable/jetbrains-mono";
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
