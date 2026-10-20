import { useAuth } from "@/hooks/useAuth";
import { useLiveStatus } from "@/hooks/useLiveStatus";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Loader2,
  Clock,
  Bell,
  Video,
  AlertTriangle,
  Aperture,
  MoreHorizontal,
  Sparkles,
  Star,
  Users,
  Zap,
  Rocket,
  Megaphone,
} from "lucide-react";
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

const EventTypeIcon: React.FC<{
  eventType: string;
  className?: string;
}> = ({ eventType, className }) => {
  // Map event types to icons
  const iconMap: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
    "ISS Stream": Aperture,
    "Conference": Users,
    "Engine Test": Zap,
    "Mission Broadcast": Rocket,
    "Startup Demo": Sparkles,
    "Astronomy Event": Star,
    "Agency Announcement": Megaphone,
    "Other": MoreHorizontal,
    upcoming: Clock,
  };
  const Icon = iconMap[eventType] || Users;
  return <Icon className={className} />;
};

const LiveHubPage = () => {
  const { session } = useAuth();
  const { data: liveStatus, isLoading, error } = useLiveStatus();

  const handleSetReminder = useCallback(async () => {
    if (!session) {
      window.location.href = "/auth";
      return;
    }

    if (!liveStatus?.next_event_id) {
      alert("No upcoming event to set reminder for");
      return;
    }

    try {
      const { error: reminderError } = await supabase.from("live_event_reminders").insert({
        user_id: session.user.id,
        event_type: "live_event",
        event_id: liveStatus.next_event_id,
        reminder_offset_minutes: 10,
      });
      if (reminderError) throw reminderError;
      alert("Reminder set successfully!");
    } catch (reminderError: unknown) {
      const message = reminderError instanceof Error ? reminderError.message : "Unknown error";
      alert(`Failed to set reminder: ${message}`);
    }
  }, [liveStatus?.next_event_id, session]);

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p className="mt-2 text-muted-foreground">Loading live status...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center py-8">
        <AlertTriangle className="h-6 w-6 text-destructive" />
        <p className="mt-2 text-destructive">Failed to load live status: {error.message}</p>
        <button onClick={() => window.location.reload()} className="mt-4 btn">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-64px)] p-4">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Mission Control Live Hub</h1>
        <p className="text-muted-foreground">
          Live streams, launch countdowns, and community reactions.
        </p>
      </header>

      {/* Current Live Event */}
      {liveStatus.is_something_live && liveStatus.live_event_id ? (
        <Card className="mb-6">
          <CardHeader className="flex flex-col space-between sm:flex-row sm:items-center">
            <div>
              <CardTitle className="flex items-center gap-3">
                <EventTypeIcon eventType={liveStatus.live_event_type ?? "Other"} className="h-5 w-5" />
                <span className="text-foreground">{liveStatus.live_event_title ?? "Live Event"}</span>
              </CardTitle>
              {liveStatus.live_event_type && (
                <CardDescription className="mt-1 text-muted-foreground text-sm uppercase tracking-wider">
                  {liveStatus.live_event_type}
                </CardDescription>
              )}
            </div>
            <div className="flex items-center gap-4">
              {liveStatus.live_event_embed_url ? (
                <a
                  href={liveStatus.live_event_embed_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-ghost"
                >
                  Watch Live
                </a>
              ) : null}
            </div>
          </CardHeader>
          <CardContent>
            {liveStatus.live_event_embed_url && (
              <div className="aspect-w-16 aspect-h-9 bg-muted rounded-lg overflow-hidden mb-4">
                {/* We could embed an iframe here if we have an embed URL */}
                <iframe
                  title="Live stream"
                  src={liveStatus.live_event_embed_url}
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              {liveStatus.live_event_title ?? "A live event is currently happening."}
            </p>
          </CardContent>
          <CardFooter className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">
              Started: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            {liveStatus.live_event_embed_url ? (
              <button
                onClick={() => {
                  if (liveStatus.live_event_embed_url) {
                    navigator.clipboard.writeText(liveStatus.live_event_embed_url);
                  }
                }}
                className="btn btn-sm btn-ghost"
              >
                Copy Link
              </button>
            ) : null}
          </CardFooter>
        </Card>
      ) : (
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Video className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">No live event right now</span>
            </div>
          </CardHeader>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">
              Check back later for live streams, launch coverage, and special events.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Next Upcoming Event */}
      {liveStatus.next_event_id && liveStatus.next_event_title ? (
        <Card className="mb-6">
          <CardHeader className="flex flex-col space-between sm:flex-row sm:items-center">
            <div>
              <CardTitle className="flex items-center gap-3">
                <EventTypeIcon eventType="upcoming" className="h-5 w-5" />
                <span className="text-foreground">{liveStatus.next_event_title}</span>
              </CardTitle>
              <CardDescription className="mt-1 text-muted-foreground text-sm">
                {liveStatus.minutes_until_next !== null && liveStatus.minutes_until_next >= 0
                  ? `Starts in ${Math.floor(liveStatus.minutes_until_next / 60)}h ${liveStatus.minutes_until_next % 60}m`
                  : "Upcoming"}
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              {session ? (
                <Button
                  variant="outline"
                  onClick={handleSetReminder}
                  disabled={!liveStatus.next_event_id}
                >
                  Remind Me
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => (window.location.href = "/auth")}
                  size="icon"
                  aria-label="Sign in to set reminder"
                >
                  <Bell className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {/* Countdown timer */}
            <div className="text-3xl font-mono font-bold text-center mb-4">
              {liveStatus.minutes_until_next !== null && liveStatus.minutes_until_next >= 0 ? (
                <>
                  {String(Math.floor(liveStatus.minutes_until_next / 60)).padStart(2, "0")}
                  :
                  {String(liveStatus.minutes_until_next % 60).padStart(2, "0")}
                  :
                  {String(Math.floor((liveStatus.minutes_until_next % 1) * 60)).padStart(2, "0")}
                </>
              ) : (
                "--:--:--"
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {liveStatus.next_event_title}
            </p>
          </CardContent>
        </Card>
      ) : null}

      {/* Past Events Archive - placeholder */}
      <Card className="mb-6">
        <CardHeader>
          <h2 className="text-lg font-semibold">Past Events</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Event archive coming soon. Check back for recordings and highlights of past live events.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default LiveHubPage;
