import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Send, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { timeAgo, avatarEmoji } from "@/lib/post-utils";
import { asArray } from "@/lib/safe-data";
import ReportButton from "./ReportButton";

interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  author: { username: string | null; display_name: string | null } | null;
}

type CommentRow = Omit<Comment, "author">;
type CommentAuthor = NonNullable<Comment["author"]> & { user_id: string };

type Props =
  | { postId: string; targetType?: undefined; targetId?: undefined; onCountChange?: (n: number) => void }
  | { postId?: undefined; targetType: "startup" | "themed"; targetId: string; onCountChange?: (n: number) => void };

const CommentsSection = (props: Props) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const isAggregate = !!props.targetType;
  const targetType = props.targetType;
  const targetId = props.targetId;
  const postId = props.postId;
  const onCountChange = props.onCountChange;

  const load = useCallback(async () => {
    let data: CommentRow[] = [];
    let error: { message: string } | null = null;
    if (isAggregate) {
      const result = await supabase
        .from("aggregate_comments")
        .select("id, user_id, content, created_at")
        .eq("target_type", targetType!)
        .eq("target_id", targetId!)
        .order("created_at", { ascending: true });
      data = result.data ?? [];
      error = result.error;
    } else {
      const result = await supabase
        .from("comments")
        .select("id, user_id, content, created_at")
        .eq("post_id", postId!)
        .order("created_at", { ascending: true });
      data = result.data ?? [];
      error = result.error;
    }
    if (error) { toast.error(error.message); setLoading(false); return; }
    const ids = Array.from(new Set(data.map((c) => c.user_id)));
    const { data: profiles } = ids.length
      ? await supabase.from("profiles").select("user_id, username, display_name").in("user_id", ids)
      : { data: [] as CommentAuthor[] };
    const map = new Map((profiles ?? []).map((profile) => [profile.user_id, profile]));
    const enriched = data.map((comment) => ({ ...comment, author: map.get(comment.user_id) ?? null }));
    setComments(enriched);
    onCountChange?.(enriched.length);
    setLoading(false);
  }, [isAggregate, onCountChange, postId, targetId, targetType]);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async () => {
    if (!user) { toast.error("Sign in to comment"); return; }
    const trimmed = text.trim();
    if (!trimmed) return;
    setPosting(true);
    const { error } = isAggregate
      ? await supabase.from("aggregate_comments").insert({
          target_type: props.targetType!, target_id: props.targetId!, user_id: user.id, content: trimmed,
        })
      : await supabase.from("comments").insert({
          post_id: props.postId!, user_id: user.id, content: trimmed,
        });
    setPosting(false);
    if (error) { toast.error(error.message); return; }
    setText("");
    load();
  };

  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = "0px";
    textareaRef.current.style.height = `${Math.min(160, textareaRef.current.scrollHeight)}px`;
  }, [text]);

  const del = async (id: string) => {
    const { error } = isAggregate
      ? await supabase.from("aggregate_comments").delete().eq("id", id)
      : await supabase.from("comments").delete().eq("id", id);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <div className="mt-3 pt-3 border-t border-glass-border space-y-3">
      {user && (
        <div className="flex gap-2">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="Add a comment…"
            rows={1}
            className="flex-1 bg-muted/30 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40 resize-none overflow-y-auto"
          />
          <button
            onClick={submit}
            disabled={posting || !text.trim()}
            className="px-3 py-1.5 rounded-lg text-sm bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      )}
      {loading ? (
        <p className="text-xs text-muted-foreground">Loading comments…</p>
      ) : asArray(comments).length === 0 ? (
        <p className="text-xs text-muted-foreground">No comments yet. Be the first.</p>
      ) : (
        <ul className="space-y-2">
          {asArray(comments).map((c) => (
            <li key={c.id} className="flex gap-2 group">
              <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-sm shrink-0">
                {avatarEmoji(c.user_id)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="bg-muted/30 rounded-lg px-3 py-1.5">
                  <Link
                    to={`/u/${c.user_id}`}
                    className="text-xs font-semibold text-foreground hover:text-primary"
                  >
                    {c.author?.display_name || c.author?.username || "user"}
                  </Link>
                  <p className="text-sm text-foreground/90 break-words">{c.content}</p>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5 ml-1">{timeAgo(c.created_at)}</p>
              </div>
              {user?.id === c.user_id && (
                <button
                  onClick={() => del(c.id)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-opacity"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
              {user?.id !== c.user_id && (
                <ReportButton
                  targetType="comment"
                  targetId={c.id}
                  className="h-6 w-6 opacity-0 text-muted-foreground group-hover:opacity-100 hover:text-destructive"
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default CommentsSection;
