export function extractHashtags(text: string): string[] {
  const re = /#([a-zA-Z0-9_]+)/g;
  const tags = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) tags.add(m[1].toLowerCase());
  return Array.from(tags);
}

export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function avatarEmoji(seed?: string | null): string {
  const emojis = ["🌟", "🚀", "🪐", "🔭", "🛰️", "👨‍🚀", "👩‍🚀", "🌌", "☄️", "🌠"];
  const s = seed ?? "explorer";
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return emojis[h % emojis.length];
}
