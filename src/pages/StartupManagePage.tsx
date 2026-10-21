import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ExternalLink, Rocket, Briefcase, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { RolesTab } from "@/components/manage/RolesTab";
import { AnalyticsTab } from "@/components/manage/AnalyticsTab";

interface ManagedStartup {
  id: string;
  slug: string;
  name: string;
  logo_url: string | null;
  claimed_by_user_id: string | null;
}

const StartupManagePage = () => {
  const { slug = "" } = useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [startup, setStartup] = useState<ManagedStartup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("roles");

  useEffect(() => {
    if (authLoading || !slug) return;
    if (!user) {
      navigate("/auth", { replace: true });
      return;
    }
    const load = async () => {
      setLoading(true);
      const { data, error: err } = await supabase
        .from("startups")
        .select("id, slug, name, logo_url, claimed_by_user_id")
        .eq("slug", slug)
        .maybeSingle();
      if (err) {
        setError(err.message);
        setLoading(false);
        return;
      }
      if (!data) {
        setError("Startup not found.");
        setLoading(false);
        return;
      }
      if (!data.claimed_by_user_id) {
        setStartup(data);
        setError("unclaimed");
        setLoading(false);
        return;
      }
      if (data.claimed_by_user_id !== user.id) {
        toast.error("You don't have permission to manage this startup.");
        navigate(`/startup/${slug}`, { replace: true });
        return;
      }
      setStartup(data);
      setLoading(false);
    };
    load();
  }, [slug, user, authLoading, navigate]);

  if (authLoading || loading) {
    return (
      <div className="mx-auto max-w-4xl glass-panel flex justify-center p-10">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error === "unclaimed") {
    return (
      <div className="mx-auto max-w-2xl glass-panel p-8 text-center space-y-4">
        <Rocket className="h-10 w-10 text-muted-foreground mx-auto" />
        <h1 className="text-xl font-bold text-foreground">This startup has not been claimed yet</h1>
        <p className="text-sm text-muted-foreground">
          To manage this profile, you need to claim ownership first.
        </p>
        <p className="text-xs text-muted-foreground/60">
          {/* TODO: Replace with a real claim flow once implemented */}
          Claim functionality is not yet available. Check back later.
        </p>
        <Link
          to={`/startup/${slug}`}
          className="inline-block px-4 py-2 rounded-lg text-sm bg-primary text-primary-foreground hover:bg-primary/90"
        >
          View public profile
        </Link>
      </div>
    );
  }

  if (error || !startup) {
    return (
      <div className="mx-auto max-w-2xl glass-panel p-8 text-center text-sm text-muted-foreground">
        {error || "Startup not found."}
      </div>
    );
  }

  const sidebarTabs = [
    { value: "roles", label: "Roles", icon: Briefcase },
    { value: "analytics", label: "Analytics", icon: BarChart3 },
  ];

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="glass-panel p-4 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-muted overflow-hidden flex items-center justify-center">
            {startup.logo_url ? (
              <img src={startup.logo_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <Rocket className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">{startup.name}</h1>
            <p className="text-xs text-muted-foreground">Managing {startup.name}</p>
          </div>
        </div>
        <Link
          to={`/startup/${slug}`}
          target="_blank"
          className="flex items-center gap-1 text-xs text-primary hover:underline"
        >
          View Public Profile <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      <div className="flex gap-4">
        {/* Desktop sidebar */}
        <nav className="hidden md:block w-48 shrink-0 space-y-1">
          {sidebarTabs.map((t) => (
            <button
              key={t.value}
              onClick={() => setActiveTab(t.value)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                activeTab === t.value
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </nav>

        {/* Mobile horizontal tabs */}
        <div className="flex-1">
          <div className="md:hidden mb-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full">
                <TabsTrigger value="roles" className="flex-1">Roles</TabsTrigger>
                <TabsTrigger value="analytics" className="flex-1">Analytics</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {activeTab === "roles" && <RolesTab startupId={startup.id} startupSlug={slug} />}
          {activeTab === "analytics" && <AnalyticsTab startupId={startup.id} />}
        </div>
      </div>
    </div>
  );
};

export default StartupManagePage;
