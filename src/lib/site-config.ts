const FALLBACK_SITE_URL = "https://galaxy-ground-space-hub-main-d2.vercel.app";

export const siteConfig = {
  name: "Galaxy Ground",
  description: "Your ground station for everything space.",
  url: (import.meta.env.VITE_SITE_URL || FALLBACK_SITE_URL).replace(/\/$/, ""),
  gtmId: import.meta.env.VITE_GTM_ID || "",
  googleSiteVerification: import.meta.env.VITE_GOOGLE_SITE_VERIFICATION || "",
};
