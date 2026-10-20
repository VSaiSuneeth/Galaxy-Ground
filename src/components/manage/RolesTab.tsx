import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Plus, ChevronDown, ChevronRight, Power, Pencil } from "lucide-react";
import { toast } from "sonner";
import { AddRolePanel, type RoleData } from "@/components/manage/AddRolePanel";

interface Role {
  id: string;
  startup_id: string;
  title: string;
  role_type: string;
  work_mode: string;
  location: string | null;
  description: string;
  apply_url: string;
  tags: string[];
  expires_at: string | null;
  posted_at: string;
  is_active: boolean;
}

interface Props {
  startupId: string;
  startupSlug: string;
}

export const RolesTab = ({ startupId, startupSlug }: Props) => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInactive, setShowInactive] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleData | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("startup_roles")
      .select("*")
      .eq("startup_id", startupId)
      .order("posted_at", { ascending: false });
    if (error) {
      toast.error(error.message);
    } else {
      setRoles((data || []) as Role[]);
    }
    setLoading(false);
  }, [startupId]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleActive = async (role: Role) => {
    const { error } = await supabase
      .from("startup_roles")
      .update({ is_active: !role.is_active })
      .eq("id", role.id);
    if (error) {
      toast.error(error.message);
    } else {
      setRoles((prev) => prev.map((r) => (r.id === role.id ? { ...r, is_active: !r.is_active } : r)));
    }
  };

  const openAdd = () => {
    setEditingRole(null);
    setPanelOpen(true);
  };

  const openEdit = (role: Role) => {
    setEditingRole({
      id: role.id,
      title: role.title,
      role_type: role.role_type,
      work_mode: role.work_mode,
      location: role.location,
      description: role.description,
      apply_url: role.apply_url,
      tags: role.tags || [],
      expires_at: role.expires_at,
    });
    setPanelOpen(true);
  };

  const activeRoles = roles.filter((r) => r.is_active);
  const inactiveRoles = roles.filter((r) => !r.is_active);

  if (loading) {
    return (
      <div className="glass-panel p-6 flex justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">
          Open Roles ({activeRoles.length})
        </h2>
        <button
          onClick={openAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> Add Role
        </button>
      </div>

      {activeRoles.length === 0 && inactiveRoles.length === 0 ? (
        <div className="glass-panel p-8 text-center text-sm text-muted-foreground">
          No roles posted yet. Click "Add Role" to create your first one.
        </div>
      ) : (
        <div className="space-y-2">
          {activeRoles.map((role) => (
            <RoleRow key={role.id} role={role} onToggle={toggleActive} onEdit={openEdit} />
          ))}
        </div>
      )}

      {inactiveRoles.length > 0 && (
        <div className="glass-panel">
          <button
            onClick={() => setShowInactive(!showInactive)}
            className="w-full flex items-center justify-between p-3 text-sm text-muted-foreground hover:text-foreground"
          >
            <span>Inactive Roles ({inactiveRoles.length})</span>
            {showInactive ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
          {showInactive && (
            <div className="px-3 pb-3 space-y-2 border-t border-glass-border pt-2">
              {inactiveRoles.map((role) => (
                <RoleRow key={role.id} role={role} onToggle={toggleActive} onEdit={openEdit} />
              ))}
            </div>
          )}
        </div>
      )}

      <AddRolePanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        startupId={startupId}
        editingRole={editingRole}
        onSaved={load}
      />
    </div>
  );
};

const ROLE_TYPE_COLORS: Record<string, string> = {
  "Full-time": "bg-blue-500/10 text-blue-400",
  "Part-time": "bg-green-500/10 text-green-400",
  Internship: "bg-purple-500/10 text-purple-400",
  Contract: "bg-amber-500/10 text-amber-400",
  Volunteer: "bg-pink-500/10 text-pink-400",
};

const RoleRow = ({ role, onToggle, onEdit }: { role: Role; onToggle: (r: Role) => void; onEdit: (r: Role) => void }) => (
  <div className="glass-panel p-3 flex items-center justify-between gap-3">
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-foreground">{role.title}</span>
        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${ROLE_TYPE_COLORS[role.role_type] || "bg-muted/30 text-muted-foreground"}`}>
          {role.role_type}
        </span>
        <span className="text-[10px] text-muted-foreground">
          {role.work_mode}
          {role.location && role.work_mode !== "Remote" ? ` · ${role.location}` : ""}
        </span>
      </div>
    </div>
    <div className="flex items-center gap-2 shrink-0">
      <button
        onClick={() => onToggle(role)}
        className={`p-1.5 rounded-md transition-colors ${
          role.is_active ? "text-green-400 hover:bg-green-500/10" : "text-muted-foreground hover:bg-muted/50"
        }`}
        title={role.is_active ? "Deactivate" : "Activate"}
      >
        <Power className="h-4 w-4" />
      </button>
      <button
        onClick={() => onEdit(role)}
        className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50"
        title="Edit"
      >
        <Pencil className="h-4 w-4" />
      </button>
    </div>
  </div>
);
