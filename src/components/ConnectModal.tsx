import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useSendConnectionRequest } from "@/hooks/useMessaging";
import { toast } from "sonner";
import { AlertCircle, HelpCircle } from "lucide-react";

interface ConnectModalProps {
  recipientId: string;
  recipientName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const INTENT_CATEGORIES = [
  { value: "Collaboration", label: "Collaboration", color: "border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/10" },
  { value: "Investment Interest", label: "Investment", color: "border-amber-500/30 text-amber-400 hover:bg-amber-500/10" },
  { value: "Job Opportunity", label: "Job / Careers", color: "border-violet-500/30 text-violet-400 hover:bg-violet-500/10" },
  { value: "Research", label: "Research", color: "border-blue-500/30 text-blue-400 hover:bg-blue-500/10" },
  { value: "Question", label: "Question", color: "border-gray-500/30 text-gray-400 hover:bg-gray-500/10" },
  { value: "Other", label: "Other", color: "border-gray-500/30 text-gray-400 hover:bg-gray-500/10" },
];

export default function ConnectModal({
  recipientId,
  recipientName,
  isOpen,
  onClose,
  onSuccess,
}: ConnectModalProps) {
  const [category, setCategory] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const sendRequest = useSendConnectionRequest();

  const charCount = message.length;
  const isMessageValid = charCount >= 20 && charCount <= 300;
  const canSubmit = category && isMessageValid && !sendRequest.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    try {
      await sendRequest.mutateAsync({
        recipientId,
        category,
        message,
      });
      toast.success("Connection request sent!");
      setMessage("");
      setCategory("");
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Failed to send request.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px] glass-panel-strong border-glass-border text-foreground">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold glow-text">
            Connect with {recipientName}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            Professional connections on Galaxy Ground require intent classification and a short introduction.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-2">
          {/* Category Selector */}
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Select Connection Intent</Label>
            <div className="grid grid-cols-3 gap-2">
              {INTENT_CATEGORIES.map((cat) => {
                const isSelected = category === cat.value;
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(cat.value)}
                    className={`px-2 py-2.5 rounded-lg text-xs font-semibold border transition-all duration-200 text-center ${
                      isSelected
                        ? "bg-primary/20 border-primary text-primary shadow-[0_0_12px_rgba(34,211,238,0.25)]"
                        : `bg-muted/30 border-muted-foreground/20 hover:border-muted-foreground/45 ${cat.color}`
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Context Message */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="context-message" className="text-sm font-semibold">
                Introduction Message
              </Label>
              <span
                className={`text-xs ${
                  charCount < 20
                    ? "text-rose-400"
                    : charCount > 300
                    ? "text-rose-400"
                    : "text-muted-foreground"
                }`}
              >
                {charCount}/300 (min 20)
              </span>
            </div>
            <Textarea
              id="context-message"
              placeholder="E.g., Hi! I saw your recent post on propulsion engineering. I'm a researcher from IIT Madras and would love to collaborate..."
              className="min-h-[110px] bg-muted/20 border-glass-border focus:border-primary text-sm rounded-lg"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={sendRequest.isPending}
            />
          </div>

          {/* Help banner */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-cyan-950/20 border border-cyan-800/20 text-xs text-cyan-300">
            <HelpCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <p>
              Providing clear context helps recipient understand your outreach and respond faster. Gated messaging keeps discussions professional.
            </p>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={sendRequest.isPending}
              className="text-muted-foreground hover:text-foreground"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!canSubmit}
              className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold"
            >
              {sendRequest.isPending ? "Sending..." : "Send Request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
