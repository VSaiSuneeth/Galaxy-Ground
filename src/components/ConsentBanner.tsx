import { useState } from "react";
import { getAnalyticsConsent, setAnalyticsConsent } from "@/lib/analytics";

export default function ConsentBanner() {
  const [consent, setConsent] = useState(() => getAnalyticsConsent());
  if (consent) return null;

  const choose = (value: "granted" | "denied") => {
    setAnalyticsConsent(value);
    setConsent(value);
  };

  return (
    <aside className="fixed inset-x-3 bottom-3 z-[100] mx-auto max-w-xl border border-border bg-background p-4 shadow-lg" aria-label="Analytics consent">
      <p className="text-sm text-foreground">Help us understand which pages are useful.</p>
      <div className="mt-3 flex justify-end gap-2">
        <button type="button" onClick={() => choose("denied")} className="rounded-md border border-border px-3 py-2 text-sm hover:bg-muted">Decline</button>
        <button type="button" onClick={() => choose("granted")} className="rounded-md bg-brand px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-brand/90">Accept</button>
      </div>
    </aside>
  );
}
