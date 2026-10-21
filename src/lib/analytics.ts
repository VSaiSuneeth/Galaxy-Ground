import { siteConfig } from "@/lib/site-config";

const CONSENT_KEY = "galaxy-ground:analytics-consent";

export type AnalyticsConsent = "granted" | "denied" | null;

export function getAnalyticsConsent(): AnalyticsConsent {
  const value = localStorage.getItem(CONSENT_KEY);
  return value === "granted" || value === "denied" ? value : null;
}

export function setAnalyticsConsent(value: Exclude<AnalyticsConsent, null>): void {
  localStorage.setItem(CONSENT_KEY, value);
  if (value === "granted") loadGtm();
}

export function loadGtm(): void {
  if (!siteConfig.gtmId || document.getElementById("gg-gtm")) return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });
  const script = document.createElement("script");
  script.id = "gg-gtm";
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(siteConfig.gtmId)}`;
  document.head.appendChild(script);
}

export function trackPageView(pathname: string): void {
  if (getAnalyticsConsent() !== "granted" || !siteConfig.gtmId) return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: "page_view", page_path: pathname });
}

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}
