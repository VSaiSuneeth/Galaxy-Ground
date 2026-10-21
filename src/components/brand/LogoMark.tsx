import { cn } from "@/lib/utils";

interface LogoMarkProps {
  className?: string;
  size?: number;
}

export const LogoMark = ({ className, size = 32 }: LogoMarkProps) => (
  <svg
    viewBox="0 0 64 64"
    width={size}
    height={size}
    className={cn("shrink-0 text-foreground", className)}
    aria-hidden="true"
  >
    <path d="M45.54 14.66A22 22 0 1 0 54 32H35" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="52.1" cy="23.05" r="3.4" fill="hsl(var(--brand))" />
  </svg>
);

