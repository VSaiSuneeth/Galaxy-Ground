// Weekly Intel Digest email.
// Intended cron: Monday 03:00 UTC.
//
// Deploy:
//   supabase functions deploy send-weekly-digest --no-verify-jwt
//
// Optional email secrets:
//   RESEND_API_KEY
//   EMAIL_FROM_ADDRESS
//   EMAIL_FROM_NAME
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { requireInternalCaller } from "../_shared/auth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("SITE_ORIGIN") ?? "",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const EMAIL_FROM = Deno.env.get("EMAIL_FROM_ADDRESS") ?? "intel@galaxyground.app";
const EMAIL_FROM_NAME = Deno.env.get("EMAIL_FROM_NAME") ?? "Galaxy Ground Intel";

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  if (!RESEND_API_KEY) {
    console.log(`[send-weekly-digest] Dry run, no RESEND_API_KEY. Would send email to ${to}: ${subject}`);
    return true;
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: `${EMAIL_FROM_NAME} <${EMAIL_FROM}>`,
      to,
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.error(`[send-weekly-digest] Email provider failed: ${res.status} ${body}`);
  }

  return res.ok;
}

function buildDigestEmail(data: {
  digestItems: any[];
  trending: any[];
  openRoles: any[];
}): { subject: string; html: string } {
  const digestItems = data.digestItems || [];
  const trending = data.trending || [];
  const roles = data.openRoles || [];

  let html = `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#0a0a1a;color:#e2e8f0;">`;
  html += `<h1 style="color:#22d3ee;">Galaxy Ground Intel</h1>`;

  if (digestItems.length > 0) {
    html += `<h2>What Changed</h2>`;
    for (const item of digestItems) {
      html += `<div style="padding:12px;margin:8px 0;background:rgba(255,255,255,0.05);border-radius:8px;">
        <strong>${escapeHtml(item.entity_name)}</strong>: ${escapeHtml(item.change_description)}
      </div>`;
    }
  }

  if (trending.length > 0) {
    html += `<h2>Trending</h2><p>`;
    for (const h of trending) {
      html += `<span style="display:inline-block;padding:4px 12px;margin:4px;background:rgba(34,211,238,0.1);border-radius:16px;color:#22d3ee;">#${escapeHtml(h.hashtag)}</span>`;
    }
    html += `</p>`;
  }

  if (roles.length > 0) {
    html += `<h2>Open Roles</h2>`;
    for (const r of roles) {
      html += `<div style="padding:8px;margin:4px 0;background:rgba(255,255,255,0.05);border-radius:8px;">
        <strong>${escapeHtml(r.title)}</strong> at ${escapeHtml(r.startups?.name || "a startup you follow")}
      </div>`;
    }
  }

  html += `<hr style="border-color:rgba(255,255,255,0.1);margin:24px 0;" />`;
  html += `<p style="color:#94a3b8;font-size:12px;">You received this because you opted into the Weekly Intel Digest.</p>`;
  html += `</div>`;

  return {
    subject: `Galaxy Ground Intel - ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric" })}`,
    html,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const caller = await requireInternalCaller(req);
  if (!caller.ok) return caller.response;

  if (!RESEND_API_KEY) {
    return new Response(JSON.stringify({ status: "not_configured", error: "RESEND_API_KEY is not configured" }), {
      status: 503,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data: optedInUsers, error: profilesError } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("weekly_digest_opt_in", true);

    if (profilesError) throw profilesError;

    if (!optedInUsers || optedInUsers.length === 0) {
      return new Response(JSON.stringify({ sent: 0, failed: 0, message: "No opted-in users" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let sent = 0;
    let failed = 0;

    for (const row of optedInUsers) {
      try {
        const { data: digest } = await supabase.rpc("get_intel_digest", { p_user_id: row.user_id });
        const { data: trending } = await supabase.rpc("get_trending_hashtags", { p_hours: 168 });

        const { data: follows } = await supabase
          .from("follows")
          .select("target_id")
          .eq("follower_id", row.user_id)
          .eq("target_type", "startup");

        const startupIds = (follows || []).map((follow: any) => follow.target_id).filter(Boolean);
        let roles: any[] = [];

        if (startupIds.length > 0) {
          const { data: roleRows } = await supabase
            .from("startup_roles")
            .select("id, title, startup_id, startups!inner(slug, name)")
            .eq("is_active", true)
            .in("startup_id", startupIds)
            .limit(5);
          roles = roleRows || [];
        }

        const { subject, html } = buildDigestEmail({
          digestItems: digest || [],
          trending: trending || [],
          openRoles: roles,
        });

        const { data: userData } = await supabase.auth.admin.getUserById(row.user_id);
        const email = userData?.user?.email;
        if (!email) {
          failed++;
          continue;
        }

        const ok = await sendEmail(email, subject, html);
        if (ok) sent++;
        else failed++;
      } catch (error) {
        console.error("[send-weekly-digest] user failed", row.user_id, (error as Error).message);
        failed++;
      }
    }

    return new Response(JSON.stringify({ sent, failed, dry_run: !RESEND_API_KEY }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
