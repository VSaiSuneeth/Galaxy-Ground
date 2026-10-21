import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAdminRole } from "@/hooks/useAdminRole";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, Database, Clock, Calendar, Award, Building2, 
  CheckCircle2, XCircle, Flag, Loader2, Plus, Trash2, Edit, Save
} from "lucide-react";

const AdminDashboardPage = () => {
  const { user, loading } = useAuth();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState("content");

  // Admin role check
  const { data: isAdmin, isLoading: checkingRole } = useAdminRole(user?.id);

  if (loading || checkingRole) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto glass-panel p-8 text-center">
        <Shield className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h1 className="text-xl font-semibold mb-2">Admin Access Required</h1>
        <p className="text-sm text-muted-foreground mb-4">Please sign in to access the admin dashboard.</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto glass-panel p-8 text-center">
        <Shield className="mx-auto h-12 w-12 text-destructive mb-4" />
        <h1 className="text-xl font-semibold mb-2">Access Denied</h1>
        <p className="text-sm text-muted-foreground">Your account does not have admin privileges.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 py-6 px-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-primary/10">
          <Shield className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Manage content, users, and system health</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-2 lg:grid-cols-4 w-full">
          <TabsTrigger value="content">Content Quality</TabsTrigger>
          <TabsTrigger value="edge">Edge Functions</TabsTrigger>
          <TabsTrigger value="live">Live Events</TabsTrigger>
          <TabsTrigger value="spotlight">Spotlight</TabsTrigger>
          <TabsTrigger value="roles">Open Roles</TabsTrigger>
          <TabsTrigger value="vendors">Vendors</TabsTrigger>
          <TabsTrigger value="badges">Badge Awards</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="content">
          <ContentQualityPanel />
        </TabsContent>

        <TabsContent value="edge">
          <EdgeFunctionHealthPanel />
        </TabsContent>

        <TabsContent value="live">
          <LiveEventsPanel />
        </TabsContent>

        <TabsContent value="spotlight">
          <SpotlightPanel />
        </TabsContent>

        <TabsContent value="roles">
          <OpenRolesPanel />
        </TabsContent>

        <TabsContent value="vendors">
          <VendorsPanel />
        </TabsContent>

        <TabsContent value="badges">
          <BadgeAwardsPanel />
        </TabsContent>

        <TabsContent value="reports">
          <ModerationReportsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Content Quality Panel
const ContentQualityPanel = () => {
  const { data: posts, isLoading } = useQuery({
    queryKey: ["admin-posts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("posts")
        .select("id, content, created_at, profiles!inner(username)")
        .order("created_at", { ascending: false })
        .limit(50);
      return data || [];
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Content Quality
        </CardTitle>
        <CardDescription>Monitor and moderate recent posts</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {posts?.map((post: any) => (
              <div key={post.id} className="p-3 rounded-lg bg-muted/30 border">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">@{post.profiles?.username}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{post.content}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{new Date(post.created_at).toLocaleString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Edge Function Health Panel
const EdgeFunctionHealthPanel = () => {
  const { data: syncJobs, isLoading } = useQuery({
    queryKey: ["sync-jobs"],
    queryFn: async () => {
      const { data } = await supabase
        .from("sync_jobs")
        .select("*")
        .order("last_run_at", { ascending: false })
        .limit(20);
      return data || [];
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Edge Function Health
        </CardTitle>
        <CardDescription>Last-run status per cron job</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {syncJobs?.map((job: any) => (
              <div key={job.id} className="p-3 rounded-lg bg-muted/30 border flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{job.job_name}</p>
                  <p className="text-xs text-muted-foreground">
                    Last run: {job.last_run_at ? new Date(job.last_run_at).toLocaleString() : "Never"}
                  </p>
                  <p className="text-xs text-muted-foreground">Items processed: {job.items_processed || 0}</p>
                </div>
                <Badge variant={job.status === "ok" ? "default" : "destructive"}>
                  {job.status || "unknown"}
                </Badge>
              </div>
            ))}
            {(!syncJobs || syncJobs.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-4">No sync jobs found</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Live Events Panel
const LiveEventsPanel = () => {
  const { data: events, isLoading } = useQuery({
    queryKey: ["live-events"],
    queryFn: async () => {
      const { data } = await supabase
        .from("live_events")
        .select("*")
        .order("scheduled_at", { ascending: false })
        .limit(20);
      return data || [];
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Curated Live Events
        </CardTitle>
        <CardDescription>Manage live event calendar</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" /> Add Event
            </Button>
            {events?.map((event: any) => (
              <div key={event.id} className="p-3 rounded-lg bg-muted/30 border">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{event.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {event.scheduled_at ? new Date(event.scheduled_at).toLocaleString() : "No date"}
                    </p>
                    <Badge variant={event.status === "live" ? "default" : "secondary"} className="mt-2">
                      {event.status}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {(!events || events.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-4">No live events found</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Spotlight Panel (India in Space)
const SpotlightPanel = () => {
  const { data: featured, isLoading } = useQuery({
    queryKey: ["featured-content"],
    queryFn: async () => {
      const { data } = await supabase
        .from("featured_content")
        .select("*")
        .eq("content_type", "spotlight")
        .order("created_at", { ascending: false });
      return data || [];
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5" />
          India in Space Spotlight
        </CardTitle>
        <CardDescription>Manage featured spotlight content</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" /> Add Spotlight
            </Button>
            {featured?.map((item: any) => (
              <div key={item.id} className="p-3 rounded-lg bg-muted/30 border">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{item.description}</p>
                    <Badge variant={item.is_active ? "default" : "secondary"} className="mt-2">
                      {item.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {(!featured || featured.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-4">No spotlight content found</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Open Roles Panel
const OpenRolesPanel = () => {
  const { data: roles, isLoading } = useQuery({
    queryKey: ["startup-roles-admin"],
    queryFn: async () => {
      const { data } = await supabase
        .from("startup_roles")
        .select("*, startups!inner(name, slug)")
        .eq("is_active", true)
        .order("posted_at", { ascending: false })
        .limit(50);
      return data || [];
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Open Roles Management
        </CardTitle>
        <CardDescription>Manage job listings across all startups</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" /> Add Role
            </Button>
            {roles?.map((role: any) => (
              <div key={role.id} className="p-3 rounded-lg bg-muted/30 border">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{role.title}</p>
                    <p className="text-xs text-muted-foreground">{role.startups?.name}</p>
                    <Badge variant="outline" className="mt-2">{role.role_type}</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {(!roles || roles.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-4">No open roles found</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Vendors Panel
const VendorsPanel = () => {
  const { data: vendors, isLoading } = useQuery({
    queryKey: ["vendors"],
    queryFn: async () => {
      const { data } = await supabase
        .from("vendors")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      return data || [];
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Vendor Directory
        </CardTitle>
        <CardDescription>Manage and verify vendors</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" /> Add Vendor
            </Button>
            {vendors?.map((vendor: any) => (
              <div key={vendor.id} className="p-3 rounded-lg bg-muted/30 border">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{vendor.name}</p>
                    <p className="text-xs text-muted-foreground">{vendor.category}</p>
                    <Badge variant={vendor.is_verified ? "default" : "secondary"} className="mt-2">
                      {vendor.is_verified ? "Verified" : "Pending"}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {(!vendors || vendors.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-4">No vendors found</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Badge Awards Panel
const BadgeAwardsPanel = () => {
  const { data: awards, isLoading } = useQuery({
    queryKey: ["badge-awards-admin"],
    queryFn: async () => {
      const { data } = await supabase
        .from("profile_badge_awards")
        .select("id, awarded_at, badges!profile_badge_awards_badge_id_fkey(name, description), profiles!profile_badge_awards_user_id_fkey(username)")
        .order("awarded_at", { ascending: false })
        .limit(50);
      return data || [];
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5" />
          Badge Awards
        </CardTitle>
        <CardDescription>Manage user badge awards</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            <Button size="sm" className="gap-2">
              <Plus className="h-4 w-4" /> Award Badge
            </Button>
            {awards?.map((award: any) => (
              <div key={award.id} className="p-3 rounded-lg bg-muted/30 border">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{award.badges?.name}</p>
                    <p className="text-xs text-muted-foreground">@{award.profiles?.username}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Awarded: {award.awarded_at ? new Date(award.awarded_at).toLocaleString() : "Unknown"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {(!awards || awards.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-4">No badge awards found</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const ModerationReportsPanel = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["moderation-reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("moderation_reports")
        .select("id, reporter_id, target_type, target_id, reason, details, status, created_at, reviewed_at")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });
  const updateReport = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "open" | "reviewing" | "resolved" | "dismissed" }) => {
      const { error } = await supabase
        .from("moderation_reports")
        .update({ status, reviewed_by: user!.id, reviewed_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["moderation-reports"] }),
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Flag className="h-5 w-5" /> Moderation reports</CardTitle>
        <CardDescription>Reports submitted by Galaxy Ground members.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div> : (
          <div className="space-y-3">
            {reports.map((report) => (
              <article key={report.id} className="rounded-lg border bg-muted/30 p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{report.target_type}: {report.reason}</p>
                    {report.details && <p className="mt-1 text-sm text-muted-foreground break-words">{report.details}</p>}
                    <p className="mt-2 text-xs text-muted-foreground">Reported {new Date(report.created_at).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={report.status === "open" ? "destructive" : "secondary"}>{report.status}</Badge>
                    <Select value={report.status} onValueChange={(status: "open" | "reviewing" | "resolved" | "dismissed") => updateReport.mutate({ id: report.id, status })}>
                      <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="reviewing">Reviewing</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="dismissed">Dismissed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </article>
            ))}
            {reports.length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">No moderation reports found.</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminDashboardPage;
