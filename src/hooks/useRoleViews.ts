import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const SESSION_KEY = "galaxy-ground:role-viewed";

/**
 * Tracks when a role card is ≥50% visible for ≥2 seconds.
 * Fires a single debounced insert into role_views per role per browser session.
 */
export function useRoleViewTracking(roleId: string | undefined) {
  const { user } = useAuth();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firedRef = useRef(false);

  const canFire = useCallback(() => {
    if (!roleId) return false;
    if (firedRef.current) return false;
    try {
      const viewed = JSON.parse(sessionStorage.getItem(SESSION_KEY) || "[]");
      if (viewed.includes(roleId)) return false;
    } catch { /* ignore */ }
    return true;
  }, [roleId]);

  const markFired = useCallback(() => {
    if (!roleId) return;
    firedRef.current = true;
    try {
      const viewed = JSON.parse(sessionStorage.getItem(SESSION_KEY) || "[]");
      viewed.push(roleId);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(viewed));
    } catch { /* ignore */ }
  }, [roleId]);

  const record = useCallback(() => {
    if (!roleId || !canFire()) return;
    markFired();
    const sessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    // Fire-and-forget — silenty ignore errors
    void supabase.from("role_views").insert({
      role_id: roleId,
      user_id: user?.id || null,
      session_id: sessionId,
      viewer_badges: user ? null : [],
    }).then(() => undefined, () => undefined);
  }, [roleId, user, canFire, markFired]);

  const ref = useCallback((node: HTMLElement | null) => {
    if (!node || !roleId) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        if (entry.intersectionRatio >= 0.5) {
          if (!timerRef.current) {
            timerRef.current = setTimeout(() => {
              record();
            }, 2000);
          }
        } else {
          if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
          }
        }
      },
      { threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    observer.observe(node);
    return () => {
      observer.disconnect();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [roleId, record]);

  return { trackRef: ref };
}
