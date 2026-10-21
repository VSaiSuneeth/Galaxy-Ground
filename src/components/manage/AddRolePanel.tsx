import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { X, Loader2 } from "lucide-react";
import { toast } from "sonner";

export interface RoleData {
  id: string;
  title: string;
  role_type: string;
  work_mode: string;
  location: string | null;
  description: string;
  apply_url: string;
  tags: string[];
  expires_at: string | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  startupId: string;
  editingRole?: RoleData | null;
  onSaved: () => void;
}

const ROLE_TYPE_OPTIONS = ["Full-time", "Part-time", "Internship", "Contract", "Volunteer"];
const WORK_MODE_OPTIONS = ["On-site", "Remote", "Hybrid"];
const TAG_SUGGESTIONS = [
  "propulsion", "avionics", "software", "structures", "systems",
  "policy", "finance", "operations", "testing", "design",
];

export const AddRolePanel = ({ open, onClose, startupId, editingRole, onSaved }: Props) => {
  const isEditing = !!editingRole;
  const [title, setTitle] = useState("");
  const [roleType, setRoleType] = useState("");
  const [workMode, setWorkMode] = useState("Remote");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [applyUrl, setApplyUrl] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [urlError, setUrlError] = useState("");

  // Prefill fields when opening for edit, or reset for new role
  useEffect(() => {
    if (!open) return;
    if (editingRole) {
      setTitle(editingRole.title || "");
      setRoleType(editingRole.role_type || "");
      setWorkMode(editingRole.work_mode || "Remote");
      setLocation(editingRole.location || "");
      setDescription(editingRole.description || "");
      setApplyUrl(editingRole.apply_url || "");
      setTags(editingRole.tags || []);
      setExpiresAt(editingRole.expires_at ? editingRole.expires_at.split("T")[0] : "");
    } else {
      setTitle("");
      setRoleType("");
      setWorkMode("Remote");
      setLocation("");
      setDescription("");
      setApplyUrl("");
      setTags([]);
      const d = new Date();
      d.setDate(d.getDate() + 90);
      setExpiresAt(d.toISOString().split("T")[0]);
    }
    setTagInput("");
    setUrlError("");
  }, [open, editingRole]);

  const descLen = description.length;
  const descColor = descLen >= 190 ? "text-red-500" : descLen >= 160 ? "text-amber-400" : "text-muted-foreground";

  const validateUrl = (value: string) => {
    if (!value.startsWith("http://") && !value.startsWith("https://")) {
      setUrlError("URL must start with http:// or https://");
      return false;
    }
    setUrlError("");
    return true;
  };

  const addTag = (tag: string) => {
    const t = tag.trim().toLowerCase();
    if (!t || tags.includes(t) || tags.length >= 5) return;
    setTags((prev) => [...prev, t]);
  };

  const removeTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  const handleSubmit = async () => {
    if (!title.trim() || title.length > 80) { toast.error("Title is required (max 80 chars)"); return; }
    if (!roleType) { toast.error("Role type is required"); return; }
    if (!workMode) { toast.error("Work mode is required"); return; }
    if (workMode !== "Remote" && !location.trim()) { toast.error("Location is required for this work mode"); return; }
    if (!description.trim() || description.length < 1) { toast.error("Description is required"); return; }
    if (!applyUrl.trim()) { toast.error("Apply URL is required"); return; }
    if (!validateUrl(applyUrl)) return;

    setSaving(true);
    const payload = {
      title: title.trim(),
      role_type: roleType,
      work_mode: workMode,
      location: workMode !== "Remote" ? location.trim() : null,
      description: description.trim(),
      apply_url: applyUrl.trim(),
      tags: tags.length > 0 ? tags : null,
      expires_at: expiresAt || null,
    };

    let error: { message: string } | null = null;
    if (isEditing) {
      ({ error } = await supabase.from("startup_roles").update(payload).eq("id", editingRole!.id));
    } else {
      ({ error } = await supabase.from("startup_roles").insert({ ...payload, startup_id: startupId }));
    }
    setSaving(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(isEditing ? "Role updated successfully!" : "Role posted successfully!");
      onClose();
      onSaved();
    }
  };

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent className="w-[400px] sm:w-[400px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEditing ? "Edit Role" : "Add Role"}</SheetTitle>
          <SheetDescription>
            {isEditing ? "Update this open role for your startup." : "Post a new open role for this startup."}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Title */}
          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">Title *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={80}
              className="w-full bg-muted/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40"
              placeholder="e.g. Propulsion Engineer"
            />
          </div>

          {/* Role Type */}
          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">Role Type *</label>
            <div className="flex flex-wrap gap-1.5">
              {ROLE_TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setRoleType(opt)}
                  className={`px-3 py-1.5 rounded-md text-xs transition-colors ${
                    roleType === opt
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/30 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Work Mode */}
          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">Work Mode *</label>
            <div className="flex gap-1.5">
              {WORK_MODE_OPTIONS.map((opt) => (
                <button
                  key={opt}
                  onClick={() => setWorkMode(opt)}
                  className={`px-3 py-1.5 rounded-md text-xs transition-colors ${
                    workMode === opt
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/30 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Location */}
          {workMode !== "Remote" && (
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Location *</label>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                maxLength={60}
                className="w-full bg-muted/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40"
                placeholder="e.g. Bengaluru, India"
              />
            </div>
          )}

          {/* Description */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-foreground">Description *</label>
              <span className={`text-[10px] ${descColor}`}>{descLen}/200</span>
            </div>
            <textarea
              value={description}
              onChange={(e) => { if (e.target.value.length <= 200) setDescription(e.target.value); }}
              rows={4}
              maxLength={200}
              className="w-full bg-muted/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40 resize-none"
              placeholder="Describe the role..."
            />
          </div>

          {/* Apply URL */}
          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">Apply URL *</label>
            <input
              value={applyUrl}
              onChange={(e) => { setApplyUrl(e.target.value); setUrlError(""); }}
              onBlur={() => { if (applyUrl) validateUrl(applyUrl); }}
              className={`w-full bg-muted/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40 ${
                urlError ? "ring-1 ring-red-500" : ""
              }`}
              placeholder="https://..."
            />
            {urlError && <p className="text-[10px] text-red-500 mt-1">{urlError}</p>}
          </div>

          {/* Tags */}
          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">
              Tags {tags.length > 0 && <span className="text-muted-foreground">({tags.length}/5)</span>}
            </label>
            <div className="flex flex-wrap gap-1 mb-2">
              {tags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-primary/10 text-primary">
                  {tag}
                  <button onClick={() => removeTag(tag)} className="hover:text-destructive"><X className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  addTag(tagInput);
                  setTagInput("");
                }
              }}
              disabled={tags.length >= 5}
              className="w-full bg-muted/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40 disabled:opacity-50"
              placeholder="Type and press Enter to add..."
            />
            <div className="flex flex-wrap gap-1 mt-1.5">
              {TAG_SUGGESTIONS.filter((s) => !tags.includes(s)).map((s) => (
                <button
                  key={s}
                  onClick={() => addTag(s)}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-muted/20 text-muted-foreground hover:text-foreground"
                >
                  +{s}
                </button>
              ))}
            </div>
          </div>

          {/* Expires At */}
          <div>
            <label className="text-xs font-medium text-foreground mb-1 block">Expires (optional)</label>
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className="w-full bg-muted/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40"
            />
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="w-full py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {saving ? "Saving…" : isEditing ? "Save Changes" : "Post Role"}
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
