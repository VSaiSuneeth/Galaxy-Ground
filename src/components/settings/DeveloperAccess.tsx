import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Key, Copy, Check, AlertTriangle, ExternalLink, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import type { Database } from "@/integrations/supabase/types";

type ApiKey = Database["public"]["Tables"]["api_keys"]["Row"];

function isKeyResponse(value: unknown): value is { key: string; error?: string } {
  return value !== null
    && typeof value === "object"
    && "key" in value
    && typeof value.key === "string";
}

const API_FUNCTION_URL = import.meta.env.VITE_SUPABASE_URL
  ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-api-key`
  : "";

export const DeveloperAccess = () => {
  const { user } = useAuth();
  const [apiKey, setApiKey] = useState<ApiKey | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [plaintextKey, setPlaintextKey] = useState("");
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [todayUsage, setTodayUsage] = useState(0);
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false);

  const loadKey = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("api_keys")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    setApiKey(data || null);

    if (data) {
      const today = new Date().toISOString().slice(0, 10);
      const { count } = await supabase
        .from("api_usage_log")
        .select("id", { count: "exact", head: true })
        .eq("api_key_hash", data.key_hash)
        .gte("created_at", today);
      setTodayUsage(count ?? 0);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadKey();
  }, [loadKey]);

  const generateKey = async () => {
    if (!user) return;
    setGenerating(true);
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) { toast.error("Not authenticated"); return; }
      const res = await fetch(API_FUNCTION_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      const json: unknown = await res.json();
      if (!res.ok) {
        toast.error(isKeyResponse(json) && json.error ? json.error : "Failed to generate key");
        return;
      }
      if (!isKeyResponse(json)) {
        toast.error("The API key service returned an invalid response.");
        return;
      }
      setPlaintextKey(json.key);
      setShowKeyModal(true);
      loadKey();
      toast.success("API key generated!");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to generate key");
    } finally {
      setGenerating(false);
    }
  };

  const copyKey = async () => {
    try {
      await navigator.clipboard.writeText(plaintextKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const revokeKey = async () => {
    if (!apiKey) return;
    const { error } = await supabase
      .from("api_keys")
      .update({ is_active: false })
      .eq("id", apiKey.id);
    if (error) { toast.error(error.message); return; }
    toast.success("API key revoked");
    setShowRevokeConfirm(false);
    setApiKey(null);
  };

  if (!user) return null;

  return (
    <>
      <div className="space-y-4 pt-4 border-t border-glass-border/50">
        <div className="flex items-center gap-2">
          <Key className="h-4 w-4 text-cyan-400" />
          <Label className="text-sm font-semibold">Developer Access</Label>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" /> Loading...
          </div>
        ) : apiKey ? (
          <div className="space-y-3 bg-muted/20 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <code className="text-xs bg-muted/40 px-2 py-0.5 rounded font-mono">
                {apiKey.key_prefix}•••••••••
              </code>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">
                {apiKey.tier}
              </span>
            </div>

            {/* Usage bar */}
            <div>
              <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                <span>{todayUsage} / 100 requests today</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted/30 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${Math.min(100, (todayUsage / 100) * 100)}%`, backgroundColor: "hsl(190, 100%, 50%)" }}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowRevokeConfirm(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
              >
                <Trash2 className="h-3 w-3" /> Revoke Key
              </button>
              <a
                href="/docs/api"
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs text-primary hover:bg-primary/10 transition-colors"
              >
                Read the API docs → <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground">No API key yet.</p>
            <button
              onClick={generateKey}
              disabled={generating}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors"
            >
              {generating && <Loader2 className="h-3 w-3 animate-spin" />}
              {generating ? "Generating…" : "Generate Key"}
            </button>
          </div>
        )}
      </div>

      {/* One-time key display modal */}
      <Dialog open={showKeyModal} onOpenChange={setShowKeyModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-cyan-400" />
              Your API Key
            </DialogTitle>
            <DialogDescription>
              Copy this key now. You will not be able to see it again.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-muted/30 rounded-lg p-3 break-all">
            <code className="text-xs font-mono text-foreground">{plaintextKey}</code>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={copyKey}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm border border-glass-border hover:bg-muted/50 transition-colors"
            >
              {copied ? (
                <><Check className="h-4 w-4 text-green-400" /> Copied!</>
              ) : (
                <><Copy className="h-4 w-4" /> Copy to Clipboard</>
              )}
            </button>
            <button
              onClick={() => setShowKeyModal(false)}
              className="px-4 py-2 rounded-lg text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              I've saved my key
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Revoke confirmation */}
      <Dialog open={showRevokeConfirm} onOpenChange={setShowRevokeConfirm}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Revoke API Key?
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. Any services using this key will immediately lose access.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setShowRevokeConfirm(false)}
              className="px-4 py-2 rounded-lg text-sm border border-glass-border hover:bg-muted/50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={revokeKey}
              className="px-4 py-2 rounded-lg text-sm bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors"
            >
              Revoke
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
