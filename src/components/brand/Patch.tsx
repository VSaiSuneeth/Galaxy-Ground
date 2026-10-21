import { cn } from "@/lib/utils";

const TONES = ["#FF6B1A", "#D9B36C", "#7FA37A", "#4FA3A5", "#6F86C9", "#A56BB2", "#D66E7F", "#8C97A3"];

const hash = (value: string) => {
  let result = 2166136261;
  for (const character of value) result = Math.imul(result ^ character.charCodeAt(0), 16777619);
  return result >>> 0;
};

interface PatchProps {
  seed?: string | null;
  label?: string | null;
  size?: number;
  shape?: "circle" | "squircle";
  className?: string;
}

export const Patch = ({ seed, label, size = 40, shape = "circle", className }: PatchProps) => {
  const key = seed || label || "galaxy-ground";
  const value = hash(key);
  const tone = TONES[value % TONES.length];
  const initials = (label || key).trim().split(/\s+/).slice(0, 2).map((word) => word[0]).join("").toUpperCase();

  return (
    <span
      className={cn("inline-flex shrink-0 items-center justify-center overflow-hidden", shape === "circle" ? "rounded-full" : "rounded-[28%]", className)}
      style={{ width: size, height: size, backgroundColor: tone, color: "#160A03" }}
      role="img"
      aria-label={label || undefined}
    >
      <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true">
        <rect width="48" height="48" fill={tone} />
        <path d={value % 3 === 0 ? "M-4 30L40-4M8 52L52 18" : value % 3 === 1 ? "M-4 38Q14 10 52 18" : "M-4 24Q18 4 52 30"} fill="none" stroke="#160A03" strokeOpacity=".18" strokeWidth="3" />
        <circle cx={value % 2 ? "37" : "12"} cy={value % 2 ? "13" : "35"} r="4" fill="#160A03" fillOpacity=".18" />
        <text x="24" y="30" textAnchor="middle" fontFamily="ui-monospace, monospace" fontWeight="600" fontSize={initials.length > 1 ? "15" : "19"} fill="#160A03">{initials}</text>
      </svg>
    </span>
  );
};

