/** Resolved Supabase client env (supports legacy anon key name). */
export function getSupabaseEnv() {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const key =
    (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined) ||
    (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined);

  const missing: string[] = [];
  if (!url?.trim()) missing.push("VITE_SUPABASE_URL");
  if (!key?.trim()) missing.push("VITE_SUPABASE_PUBLISHABLE_KEY or VITE_SUPABASE_ANON_KEY");

  return { url: url?.trim() ?? "", key: key?.trim() ?? "", missing };
}

export function formatAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "Wrong email or password.";
  if (m.includes("email not confirmed")) return "Confirm your email before signing in (check inbox/spam).";
  if (m.includes("user already registered")) return "An account with this email already exists. Try signing in.";
  if (m.includes("password")) return message;
  if (m.includes("fetch failed") || m.includes("failed to fetch")) {
    return "Cannot reach Supabase. Check VITE_SUPABASE_URL, network, and that the project is not paused.";
  }
  if (m.includes("row-level security") || m.includes("permission denied")) {
    return "Database permission denied (RLS). Ensure migrations are applied on your Supabase project.";
  }
  return message;
}
