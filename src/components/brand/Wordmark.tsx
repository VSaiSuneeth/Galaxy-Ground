import { cn } from "@/lib/utils";

export const Wordmark = ({ className }: { className?: string }) => (
  <span className={cn("font-display text-lg font-semibold text-foreground", className)}>Galaxy Ground</span>
);

