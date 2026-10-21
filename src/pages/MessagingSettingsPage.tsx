import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { ArrowLeft, Save, Shield, MessageSquare, Check, X, Bell } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useOwnProfile } from "@/hooks/useProfile";
import { useMessagingSettings, useUpdateMessagingSettings } from "@/hooks/useMessaging";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { PageLoading } from "@/components/PageState";
import { DeveloperAccess } from "@/components/settings/DeveloperAccess";
import { toast } from "sonner";

const INTENT_CATEGORIES = [
  { value: "Collaboration", label: "Collaboration" },
  { value: "Investment Interest", label: "Investment Interest" },
  { value: "Job Opportunity", label: "Job Opportunity" },
  { value: "Research", label: "Research" },
  { value: "Question", label: "Question" },
  { value: "Other", label: "Other" },
];

function isMessagingOpenTo(value: string | null): value is "everyone" | "followers" | "nobody" {
  return value === "everyone" || value === "followers" || value === "nobody";
}

export default function MessagingSettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const { data: profile } = useOwnProfile(user);
  const { data: settings, isLoading } = useMessagingSettings(user?.id);
  const updateSettings = useUpdateMessagingSettings();

  const [openTo, setOpenTo] = useState<"everyone" | "followers" | "nobody">("everyone");
  const [categories, setCategories] = useState<string[]>([]);
  const [showOnline, setShowOnline] = useState(true);
  const [requireCompleteness, setRequireCompleteness] = useState(false);
  const [weeklyDigest, setWeeklyDigest] = useState(false);

  useEffect(() => {
    if (settings) {
      setOpenTo(isMessagingOpenTo(settings.messaging_open_to) ? settings.messaging_open_to : "everyone");
      setCategories(settings.messaging_allowed_categories || []);
      setShowOnline(settings.show_online_status !== false);
      setRequireCompleteness(!!settings.require_complete_profile_to_message);
    }
    if (profile) {
      setWeeklyDigest(profile.weekly_digest_opt_in);
    }
  }, [settings, profile]);

  if (authLoading || isLoading) {
    return <PageLoading label="Loading privacy settings..." />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const isVerified = profile?.badges.some(
    (b: string) => b === "Space Pioneer" || b === "Startup Founder" || b === "Mission Contributor"
  ) || false;

  const handleToggleCategory = (cat: string) => {
    if (categories.includes(cat)) {
      setCategories(categories.filter((c) => c !== cat));
    } else {
      setCategories([...categories, cat]);
    }
  };

  const handleSave = async () => {
    try {
      await updateSettings.mutateAsync({
        messaging_open_to: openTo,
        messaging_allowed_categories: categories,
        show_online_status: showOnline,
        require_complete_profile_to_message: requireCompleteness,
      });
      const { error: digestError } = await supabase
        .from("profiles")
        .update({ weekly_digest_opt_in: weeklyDigest })
        .eq("user_id", user!.id);
      if (digestError) throw digestError;
      toast.success("Messaging privacy settings saved.");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save settings.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <Link
        to="/profile"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to profile
      </Link>

      <div className="glass-panel p-6 space-y-6">
        <div>
          <h1 className="text-xl font-bold glow-text flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Messaging Privacy Settings
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Configure who can reach you and what type of communications are allowed in your inbox.
          </p>
        </div>

        <div className="space-y-6 pt-4 border-t border-glass-border">
          {/* WHO CAN MESSAGE ME */}
          <div className="space-y-3">
            <Label className="text-sm font-semibold flex items-center gap-1.5">
              <MessageSquare className="h-4 w-4 text-cyan-400" />
              Who can send me connection requests?
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {(["everyone", "followers", "nobody"] as const).map((opt) => {
                const active = openTo === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setOpenTo(opt)}
                    className={`px-3 py-2.5 rounded-lg text-xs font-semibold border transition-all duration-200 capitalize ${
                      active
                        ? "bg-primary/20 border-primary text-primary shadow-[0_0_12px_rgba(34,211,238,0.2)]"
                        : "bg-muted/30 border-glass-border text-muted-foreground hover:border-muted-foreground/30 hover:text-foreground"
                    }`}
                  >
                    {opt === "followers" ? "People I Follow" : opt}
                  </button>
                );
              })}
            </div>
          </div>

          {/* CATEGORY FILTERS */}
          {openTo !== "nobody" && (
            <div className="space-y-3 pt-4 border-t border-glass-border/50">
              <div>
                <Label className="text-sm font-semibold">Allowed Intent Categories</Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Turn off categories to auto-decline incoming messages matching those intents.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {INTENT_CATEGORIES.map((cat) => {
                  const allowed = categories.includes(cat.value);
                  return (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => handleToggleCategory(cat.value)}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium border transition-all duration-150 ${
                        allowed
                          ? "bg-primary/10 border-primary/40 text-primary"
                          : "bg-muted/10 border-glass-border text-muted-foreground hover:bg-muted/20"
                      }`}
                    >
                      <span>{cat.label}</span>
                      {allowed ? (
                        <Check className="h-3.5 w-3.5 shrink-0" />
                      ) : (
                        <X className="h-3.5 w-3.5 shrink-0 opacity-40" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ONLINE STATUS */}
          <div className="flex items-center justify-between pt-4 border-t border-glass-border/50">
            <div className="space-y-0.5">
              <Label htmlFor="online-status" className="text-sm font-semibold">
                Show Online Status
              </Label>
              <p className="text-xs text-muted-foreground max-w-md">
                When enabled, other users can see a green active dot if you were active within the last 3 minutes.
              </p>
            </div>
            <Switch
              id="online-status"
              checked={showOnline}
              onCheckedChange={setShowOnline}
              className="data-[state=checked]:bg-primary"
            />
          </div>

          {/* SENDER COMPLETENESS GATE */}
          <div className="flex items-center justify-between pt-4 border-t border-glass-border/50">
            <div className="space-y-0.5">
              <Label htmlFor="completeness-gate" className="text-sm font-semibold flex items-center gap-1.5">
                Require Completed Profile
                {!isVerified && (
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded border border-amber-500/30">
                    Verified Only
                  </span>
                )}
              </Label>
              <p className="text-xs text-muted-foreground max-w-md">
                Only allow senders who have completed their profiles (avatar, bio, and at least 3 posts) to connect with you.
              </p>
            </div>
            <Switch
              id="completeness-gate"
              checked={requireCompleteness}
              onCheckedChange={setRequireCompleteness}
              disabled={!isVerified}
              className="data-[state=checked]:bg-primary disabled:opacity-40"
            />
          </div>

          {/* WEEKLY INTEL DIGEST */}
          <div className="flex items-center justify-between pt-4 border-t border-glass-border/50">
            <div className="space-y-0.5">
              <Label htmlFor="weekly-digest" className="text-sm font-semibold flex items-center gap-1.5">
                <Bell className="h-4 w-4 text-cyan-400" />
                Weekly Intel Digest
              </Label>
              <p className="text-xs text-muted-foreground max-w-md">
                Receive a weekly email digest with top changes from your network, trending hashtags, and open roles.
              </p>
            </div>
            <Switch
              id="weekly-digest"
              checked={weeklyDigest}
              onCheckedChange={setWeeklyDigest}
              className="data-[state=checked]:bg-primary"
            />
          </div>

          {/* DEVELOPER ACCESS */}
          <DeveloperAccess />
        </div>

        <div className="flex justify-end pt-4 border-t border-glass-border">
          <Button
            onClick={handleSave}
            disabled={updateSettings.isPending}
            className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold flex items-center gap-1.5"
          >
            <Save className="h-4 w-4" />
            {updateSettings.isPending ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>
    </div>
  );
}
