import { useEffect, useState, useCallback, useMemo } from "react";
import { Sparkles, Rocket, Compass, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useOwnProfile } from "@/hooks/useProfile";
import { useStartups } from "@/hooks/useStartups";
import { useTopics } from "@/hooks/useTopics";
import { DEFAULT_INTERESTS, shouldPromptOnboarding, writeOnboardingStatus } from "@/lib/onboarding";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import FollowButton from "@/components/FollowButton";

const OnboardingModal = () => {
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useOwnProfile(user);
  const { data: startups = [], isLoading: startupsLoading } = useStartups();
  const { data: topicsData } = useTopics();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const userCreatedAt = user?.created_at;

  // Derive interest options from topic titles, falling back to DEFAULT_INTERESTS.
  // Topics are the preferred source because they represent curated space content.
  const interestOptions = useMemo(() => {
    if (topicsData && topicsData.length > 0) {
      return topicsData.map((t) => t.title).filter(Boolean);
    }
    return DEFAULT_INTERESTS;
  }, [topicsData]);

  useEffect(() => {
    if (!user || dismissed) return;
    if (profileLoading) return;
    if (!shouldPromptOnboarding(profile, userCreatedAt)) return;
    setOpen(true);
  }, [user, userCreatedAt, profile, profileLoading, dismissed]);

  const toggleInterest = (interest: string) => {
    setSelected((current) => (current.includes(interest) ? current.filter((item) => item !== interest) : [...current, interest]));
  };

  const handleSave = useCallback(async () => {
    if (!user) return;
    setSaving(true);
    try {
      const interests = selected.filter(Boolean);
      const { error } = await supabase.from("profiles").update({ interests }).eq("user_id", user.id);
      if (error) throw error;
      writeOnboardingStatus(user.id, true);
      setOpen(false);
      toast.success("Your launchpad is ready ✨");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save onboarding choices";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  }, [user, selected]);

  const handleClose = useCallback((value: boolean) => {
    setOpen(value);
    if (!value) {
      setDismissed(true);
    }
  }, []);

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl border-glass-border bg-background/90">
        <DialogHeader>
          <div className="inline-flex w-fit items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Welcome aboard
          </div>
          <DialogTitle className="text-2xl">Pick your orbit</DialogTitle>
          <DialogDescription>
            Choose a few interests so Galaxy Ground can surface relevant stories, creators, and launches for you.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            {interestOptions.map((interest) => {
              const active = selected.includes(interest);
              return (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  className={`rounded-full px-3 py-2 text-sm transition-colors ${active ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground hover:bg-muted/70"}`}
                >
                  {interest}
                </button>
              );
            })}
          </div>

          <div className="rounded-xl border border-glass-border bg-muted/20 p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Compass className="h-4 w-4 text-primary" /> Suggested launches to follow
            </div>
            <div className="space-y-3">
              {startupsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : startups.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No launches available yet.
                </p>
              ) : (
                startups.slice(0, 4).map((startup) => (
                  <div key={startup.id} className="flex items-center justify-between gap-3 rounded-lg bg-background/70 px-3 py-2">
                    <div>
                      <p className="font-medium text-foreground">{startup.name}</p>
                      <p className="text-xs text-muted-foreground">{startup.category}</p>
                    </div>
                    <FollowButton targetType="startup" targetId={startup.id} />
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-glass-border bg-primary/5 p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Rocket className="h-4 w-4 text-primary" /> We'll tailor tomorrow's feed around your picks.
            </div>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
            >
              {saving ? "Saving…" : "Continue"}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingModal;
