import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { getAnalyticsConsent, loadGtm, trackPageView } from "@/lib/analytics";
import { siteConfig } from "@/lib/site-config";

const PAGE_TITLES: Array<[string, string]> = [
  ["/explore", "Explore"], ["/startups", "Startups"], ["/communities", "Orbits"],
  ["/missions", "Missions"], ["/learning", "Learn"], ["/live", "Live"],
  ["/privacy", "Privacy"], ["/terms", "Terms"],
];

function pageTitle(pathname: string): string {
  const match = PAGE_TITLES.find(([path]) => pathname === path || pathname.startsWith(`${path}/`));
  return match ? `${match[1]} | ${siteConfig.name}` : siteConfig.name;
}

function isPrivatePath(pathname: string): boolean {
  return ["/auth", "/admin", "/messages", "/settings", "/profile", "/bookmarks"].some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export default function RouteMeta() {
  const { pathname } = useLocation();
  useEffect(() => {
    document.title = pageTitle(pathname);
    document.querySelector('meta[name="robots"]')?.setAttribute("content", isPrivatePath(pathname) ? "noindex, nofollow" : "index, follow");
    document.querySelector('link[rel="canonical"]')?.setAttribute("href", `${siteConfig.url}${pathname}`);
    if (getAnalyticsConsent() === "granted") loadGtm();
    trackPageView(pathname);
  }, [pathname]);
  return null;
}
