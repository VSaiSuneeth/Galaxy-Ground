import { Search, Building2, Loader2, User as UserIcon, Hash, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { asArray } from "@/lib/safe-data";

type ResultRow =
  | { kind: "user"; id: string; title: string; subtitle: string; href: string }
  | { kind: "startup"; id: string; title: string; subtitle: string; href: string }
  | { kind: "creator"; id: string; title: string; subtitle: string; href: string }
  | { kind: "hashtag"; id: string; title: string; subtitle: string; href: string }
  | { kind: "post"; id: string; title: string; subtitle: string; href: string };

function useUnifiedSearch(query: string) {
  return useQuery({
    queryKey: ["unified-search", query],
    enabled: query.trim().length >= 2,
    queryFn: async (): Promise<ResultRow[]> => {
      const q = query.trim();
      const ilike = `%${q}%`;
      const tagq = q.replace(/^#/, "").toLowerCase();

      const [users, startups, creators, userPosts, startupPosts, themedPosts, hashtagInPosts, hashtagInStartupPosts, hashtagInThemedPosts] = await Promise.all([
        supabase
          .from("profiles")
          .select("user_id, username, display_name, avatar_url")
          .or(`username.ilike.${ilike},display_name.ilike.${ilike}`)
          .limit(5),
        supabase
          .from("startups")
          .select("id, slug, name, category")
          .ilike("name", ilike)
          .limit(5),
        supabase
          .from("themed_accounts")
          .select("id, handle, display_name, category")
          .or(`handle.ilike.${ilike},display_name.ilike.${ilike}`)
          .limit(5),
        supabase.from("posts").select("id, content, user_id").ilike("content", ilike).order("created_at", { ascending: false }).limit(3),
        supabase.from("startup_posts").select("id, content, startup_id, startups(slug, name)").or(`content.ilike.${ilike},title.ilike.${ilike}`).order("published_at", { ascending: false }).limit(2),
        supabase.from("themed_posts").select("id, content, account_id, themed_accounts(handle, display_name)").or(`content.ilike.${ilike},title.ilike.${ilike}`).order("published_at", { ascending: false }).limit(2),
        // Lightweight hashtag checks across all feed sources
        supabase
          .from("posts").select("hashtags").contains("hashtags", [tagq]).limit(1),
        supabase
          .from("startup_posts").select("hashtags").contains("hashtags", [tagq]).limit(1),
        supabase
          .from("themed_posts").select("hashtags").contains("hashtags", [tagq]).limit(1),
      ]);

      const out: ResultRow[] = [];
      for (const u of users.data || []) {
        out.push({
          kind: "user",
          id: u.user_id,
          title: u.display_name || u.username || "user",
          subtitle: u.username ? `@${u.username}` : "Member",
          href: `/u/${u.user_id}`,
        });
      }
      for (const s of startups.data || []) {
        out.push({
          kind: "startup",
          id: s.id,
          title: s.name,
          subtitle: s.category,
          href: `/startup/${s.slug}`,
        });
      }
      for (const c of creators.data || []) {
        out.push({
          kind: "creator",
          id: c.id,
          title: c.display_name,
          subtitle: `@${c.handle} · ${c.category}`,
          href: `/creator/${c.handle}`,
        });
      }
      for (const p of userPosts.data || []) {
        out.push({
          kind: "post",
          id: p.id,
          title: (p.content || "").slice(0, 64),
          subtitle: "User post",
          href: `/post/${p.id}`,
        });
      }
      for (const p of startupPosts.data || []) {
        out.push({
          kind: "post",
          id: `startup_${p.id}`,
          title: (p.content || "").slice(0, 64),
          subtitle: `Startup · ${(p as any).startups?.name || "Startup"}`,
          href: `/post/startup_${p.id}`,
        });
      }
      for (const p of themedPosts.data || []) {
        out.push({
          kind: "post",
          id: `themed_${p.id}`,
          title: (p.content || "").slice(0, 64),
          subtitle: `Creator · @${(p as any).themed_accounts?.handle || "creator"}`,
          href: `/post/themed_${p.id}`,
        });
      }
      const hashtagExists =
        (hashtagInPosts.data || []).length > 0 ||
        (hashtagInStartupPosts.data || []).length > 0 ||
        (hashtagInThemedPosts.data || []).length > 0;

      if (hashtagExists) {
        out.push({
          kind: "hashtag",
          id: tagq,
          title: `#${tagq}`,
          subtitle: "Trending topic",
          href: `/hashtag/${tagq}`,
        });
      }
      return asArray(out);
    },
  });
}

const iconFor = (kind: ResultRow["kind"]) => {
  if (kind === "user") return <UserIcon className="h-4 w-4 text-primary" />;
  if (kind === "startup") return <Building2 className="h-4 w-4 text-secondary" />;
  if (kind === "creator") return <Sparkles className="h-4 w-4 text-secondary" />;
  if (kind === "post") return <Search className="h-4 w-4 text-primary" />;
  return <Hash className="h-4 w-4 text-primary" />;
};

const SearchBar = () => {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [focused, setFocused] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const { data: results, isFetching } = useUnifiedSearch(query);
  const resultList = asArray(results);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={wrapRef} className="relative w-full">
      <div
        className={`relative flex items-center rounded-full transition-all duration-300 ${
          focused ? "bg-muted/80 ring-1 ring-primary/40 glow-border" : "bg-muted/40"
        }`}
      >
        <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => { setFocused(true); setOpen(true); }}
          onBlur={() => setFocused(false)}
          placeholder="Search posts, users, startups, creators, #topics…"
          className="w-full min-w-0 bg-transparent pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
        {isFetching && <Loader2 className="absolute right-3 h-3.5 w-3.5 animate-spin text-muted-foreground" />}
      </div>

      {open && query.trim().length >= 2 && (
        <div className="absolute top-full left-0 right-0 mt-2 glass-panel-strong rounded-xl border border-glass-border overflow-hidden shadow-xl z-50">
          {resultList.length === 0 ? (
            <p className="p-4 text-xs text-muted-foreground text-center">
              {isFetching ? "Searching…" : "No matches"}
            </p>
          ) : (
            <ul className="max-h-96 overflow-y-auto">
              {resultList.map((r) => (
                <li key={`${r.kind}-${r.id}`}>
                  <Link
                    to={r.href}
                    onClick={() => { setOpen(false); setQuery(""); }}
                    className="flex items-center gap-3 p-3 hover:bg-muted/40 transition-colors"
                  >
                    <div className="h-9 w-9 rounded-lg bg-muted/30 flex items-center justify-center shrink-0">
                      {iconFor(r.kind)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{r.title}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{r.subtitle}</p>
                    </div>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70">{r.kind}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
