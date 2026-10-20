import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

type InternalCallerResult =
  | { ok: true; userId?: string }
  | { ok: false; response: Response };

function json(status: number, error: string): Response {
  return new Response(JSON.stringify({ error }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function constantTimeEqual(left: string, right: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const [leftHash, rightHash] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(left)),
    crypto.subtle.digest("SHA-256", encoder.encode(right)),
  ]);
  const a = new Uint8Array(leftHash);
  const b = new Uint8Array(rightHash);
  let difference = 0;
  for (let index = 0; index < a.length; index += 1) difference |= a[index] ^ b[index];
  return difference === 0;
}

/** Allows a pg_cron invocation or a verified administrator to run internal jobs. */
export async function requireInternalCaller(req: Request): Promise<InternalCallerResult> {
  const cronSecret = Deno.env.get("CRON_SECRET");
  const suppliedCronSecret = req.headers.get("x-cron-secret");
  if (cronSecret && suppliedCronSecret && await constantTimeEqual(suppliedCronSecret, cronSecret)) {
    return { ok: true };
  }

  const authorization = req.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return { ok: false, response: json(401, "Authentication required") };

  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceKey) return { ok: false, response: json(500, "Function authentication is not configured") };

  const supabase = createClient(url, serviceKey);
  const token = authorization.slice("Bearer ".length);
  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !authData.user) return { ok: false, response: json(401, "Invalid authentication token") };

  const { data: role, error: roleError } = await supabase
    .from("user_roles")
    .select("id")
    .eq("user_id", authData.user.id)
    .eq("role", "admin")
    .maybeSingle();
  if (roleError || !role) return { ok: false, response: json(403, "Administrator role required") };

  return { ok: true, userId: authData.user.id };
}
