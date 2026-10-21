import { useRef, useState } from "react";
import { ImagePlus, Video, Send, X, Loader2, Orbit } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useLocation, useNavigate } from "react-router-dom";
import { extractHashtags } from "@/lib/post-utils";
import { COMMUNITY_META } from "@/lib/communities";

interface Props {
  defaultCommunity?: string;
  onCreated?: () => void;
}

const MAX_MB = 50;

const CreatePost = ({ defaultCommunity, onCreated }: Props) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const [selectedCommunity, setSelectedCommunity] = useState<string | null>(defaultCommunity || null);
  const imgRef = useRef<HTMLInputElement>(null);
  const vidRef = useRef<HTMLInputElement>(null);

  const pick = (kind: "image" | "video") => {
    if (!user) {
      navigate("/auth");
      return;
    }
    (kind === "image" ? imgRef : vidRef).current?.click();
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > MAX_MB * 1024 * 1024) {
      toast.error(`File must be under ${MAX_MB}MB`);
      return;
    }
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  };

  const clearFile = () => {
    setFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    if (imgRef.current) imgRef.current.value = "";
    if (vidRef.current) vidRef.current.value = "";
  };

  const submit = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    const content = text.trim();
    if (!content && !file) return;
    setPosting(true);
    try {
      let media_url: string | null = null;
      let media_type: "image" | "video" | null = null;
      if (file) {
        const ext = file.name.split(".").pop() || "bin";
        const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error: upErr } = await supabase.storage.from("post-media").upload(path, file, {
          cacheControl: "3600",
          upsert: false,
        });
        if (upErr) throw upErr;
        const { data } = supabase.storage.from("post-media").getPublicUrl(path);
        media_url = data.publicUrl;
        media_type = file.type.startsWith("video") ? "video" : "image";
      }
      const { error } = await supabase.from("posts").insert({
        user_id: user.id,
        content: content || (media_type === "image" ? "📸" : media_type === "video" ? "🎬" : ""),
        media_url,
        media_type,
        community: selectedCommunity || null,
        hashtags: extractHashtags(content),
      });
      if (error) throw error;
      toast.success("Posted 🚀");
      setText("");
      setSelectedCommunity(defaultCommunity || null);
      clearFile();
      onCreated?.();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to post");
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="border-b border-border px-3 py-4 sm:px-4">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={user ? "What's happening up there?" : "Sign in to share with the community"}
        disabled={!user}
        className="min-h-[80px] w-full resize-none rounded-md border border-input bg-muted px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground disabled:opacity-60"
      />
      
      {previewUrl && (
        <div className="relative mt-3 overflow-hidden rounded-lg border border-border">
          {file?.type.startsWith("video") ? (
            <video src={previewUrl} controls className="w-full max-h-80" />
          ) : (
            <img src={previewUrl} alt="preview" className="w-full max-h-80 object-cover" />
          )}
          <button
            onClick={clearFile}
            aria-label="Remove attachment"
            className="absolute right-2 top-2 rounded-full bg-background p-1.5 text-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      <input ref={imgRef} type="file" accept="image/*" onChange={onFile} className="hidden" />
      <input ref={vidRef} type="file" accept="video/*" onChange={onFile} className="hidden" />
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1">
          <button
            onClick={() => pick("image")}
            aria-label="Add image"
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <ImagePlus className="h-4 w-4" /> Image
          </button>
          <button
            onClick={() => pick("video")}
            aria-label="Add video"
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <Video className="h-4 w-4" /> Video
          </button>
          {!location.pathname.startsWith("/community/") && (
            <label className="relative flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted hover:text-foreground">
              <Orbit className="h-4 w-4" />
              <span className="hidden sm:inline">Orbit</span>
              <select
                aria-label="Post orbit"
                value={selectedCommunity || ""}
                onChange={(event) => setSelectedCommunity(event.target.value || null)}
                className="absolute inset-0 cursor-pointer opacity-0"
              >
                <option value="">No Orbit</option>
                {COMMUNITY_META.map((community) => <option key={community.slug} value={community.slug}>{community.name}</option>)}
              </select>
            </label>
          )}
        </div>
        <button
          onClick={submit}
          disabled={posting || (!text.trim() && !file)}
          className="flex items-center gap-1.5 rounded-full bg-brand px-4 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-brand/90 disabled:opacity-50 transition-colors"
        >
          {posting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Post
        </button>
      </div>
    </div>
  );
};

export default CreatePost;
