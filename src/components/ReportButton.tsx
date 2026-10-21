import { useState } from "react";
import { Flag } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type ReportTargetType = "post" | "startup_post" | "themed_post" | "comment" | "user" | "thread";

interface ReportButtonProps {
  targetId: string;
  targetType: ReportTargetType;
  className?: string;
}

const ReportButton = ({ targetId, targetType, className }: ReportButtonProps) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    const cleanedReason = reason.trim();
    if (!user) {
      toast.error("Sign in to report content.");
      return;
    }
    if (cleanedReason.length < 10) {
      toast.error("Please provide at least 10 characters.");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("moderation_reports").insert({
      reporter_id: user.id,
      target_type: targetType,
      target_id: targetId,
      reason: cleanedReason,
    });
    setSubmitting(false);

    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Report submitted for review.");
    setReason("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={className}
        aria-label="Report content"
        title="Report content"
        onClick={() => {
          if (!user) {
            toast.error("Sign in to report content.");
            return;
          }
          setOpen(true);
        }}
      >
        <Flag className="h-4 w-4" />
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report content</DialogTitle>
          <DialogDescription>Tell the moderation team what needs review.</DialogDescription>
        </DialogHeader>
        <textarea
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Describe the issue"
          maxLength={500}
          className="min-h-28 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button type="button" onClick={submit} disabled={submitting || reason.trim().length < 10}>
            Submit report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReportButton;
