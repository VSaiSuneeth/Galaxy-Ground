import { useState } from "react";
import { cn } from "@/lib/utils";
import { Patch } from "./Patch";

interface UserAvatarProps {
  src?: string | null;
  seed?: string | null;
  label?: string | null;
  size?: number;
  shape?: "circle" | "squircle";
  className?: string;
}

export const UserAvatar = ({ src, seed, label, size = 44, shape = "circle", className }: UserAvatarProps) => {
  const [failed, setFailed] = useState(false);
  const radius = shape === "circle" ? "rounded-full" : "rounded-[28%]";

  if (!src || failed) return <Patch seed={seed} label={label} size={size} shape={shape} className={className} />;

  return (
    <span className={cn("inline-block shrink-0 overflow-hidden bg-muted", radius, className)} style={{ width: size, height: size }}>
      <img src={src} alt="" width={size} height={size} loading="lazy" decoding="async" onError={() => setFailed(true)} className="h-full w-full object-cover" />
    </span>
  );
};
