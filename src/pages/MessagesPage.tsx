import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  useConnectionRequests,
  useSentRequests,
  useActiveThreads,
  useThreadMessages,
  useRespondConnectionRequest,
  useSendMessage,
  useMarkThreadRead,
  useBlockUser,
  type ConnectionRequest,
  type MessageThread,
} from "@/hooks/useMessaging";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { UserAvatar } from "@/components/brand/UserAvatar";
import { toast } from "sonner";
import {
  MessageSquare,
  Send,
  UserCheck,
  UserX,
  ShieldAlert,
  ArrowLeft,
  MailOpen,
  Circle,
  MoreVertical,
  Flag,
} from "lucide-react";
import { PageError, PageLoading } from "@/components/PageState";
import { supabase } from "@/integrations/supabase/client";

// Color maps for category pills
const CATEGORY_COLORS: Record<string, string> = {
  "Collaboration": "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  "Investment Interest": "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "Job Opportunity": "bg-violet-500/10 text-violet-400 border-violet-500/20",
  "Research": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "Question": "bg-gray-500/10 text-gray-400 border-gray-500/20",
  "Other": "bg-gray-500/10 text-gray-400 border-gray-500/20",
};

export default function MessagesPage() {
  const { threadId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data: requests = [], isLoading: reqsLoading, refetch: refetchReqs } = useConnectionRequests();
  const { data: sent = [], isLoading: sentLoading } = useSentRequests();
  const { data: threads = [], isLoading: threadsLoading, refetch: refetchThreads } = useActiveThreads();

  const [activeTab, setActiveTab] = useState<"conversations" | "requests" | "sent">("conversations");
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const activeThread = threads.find((t) => t.id === threadId);

  // Set default tab if navigating to inbox
  useEffect(() => {
    if (!threadId) {
      // If there are requests but no threads, maybe show requests
      if (requests.length > 0 && threads.length === 0) {
        setActiveTab("requests");
      }
    }
  }, [threadId, requests, threads]);

  if (!user) {
    return <NavigateToAuth />;
  }

  return (
    <div className="h-[calc(100vh-4.5rem)] flex gap-4 max-w-6xl mx-auto">
      {/* LEFT COLUMN: Thread List / navigation (Visible on desktop, hidden on mobile thread view) */}
      <div
        className={`w-full md:w-80 shrink-0 glass-panel flex flex-col p-4 overflow-hidden ${
          threadId ? "hidden md:flex" : "flex"
        }`}
      >
        <div className="flex items-center justify-between pb-3 border-b border-glass-border">
          <h2 className="text-lg font-bold glow-text flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Messages
          </h2>
          {requests.length > 0 && (
            <Badge className="bg-rose-500 text-white border-0 font-bold px-2 py-0.5 text-[10px] animate-pulse">
              {requests.length} New
            </Badge>
          )}
        </div>

        {/* Inbox Navigation Tabs */}
        <div className="grid grid-cols-3 gap-1 my-3 bg-muted/20 p-1 rounded-lg">
          {(["conversations", "requests", "sent"] as const).map((tab) => {
            const label = tab === "conversations" ? "Chats" : tab === "requests" ? "Requests" : "Sent";
            const isActive = activeTab === tab && !threadId;
            return (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  navigate("/messages");
                }}
                className={`py-1.5 rounded-md text-xs font-semibold transition-all duration-150 capitalize ${
                  isActive
                    ? "bg-primary/20 text-primary border border-primary/20"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
                {tab === "requests" && requests.length > 0 && ` (${requests.length})`}
              </button>
            );
          })}
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
          {threadsLoading ? (
            <div className="text-center py-8 text-xs text-muted-foreground">Loading threads...</div>
          ) : threads.length === 0 ? (
            <div className="text-center py-8 text-xs text-muted-foreground">No conversations yet.</div>
          ) : (
            threads.map((t) => {
              const isSelected = t.id === threadId;
              const hasUnread = t.participant_a === user.id ? t.participant_a_unread > 0 : t.participant_b_unread > 0;
              const unreadCount = t.participant_a === user.id ? t.participant_a_unread : t.participant_b_unread;

              return (
                <button
                  key={t.id}
                  onClick={() => navigate(`/messages/${t.id}`)}
                  className={`w-full text-left p-3 rounded-lg flex items-center gap-3 border transition-all duration-150 ${
                    isSelected
                      ? "bg-primary/15 border-primary/30 text-foreground shadow-[0_0_8px_rgba(34,211,238,0.1)]"
                      : "bg-muted/10 border-glass-border hover:bg-muted/20 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <div className="relative shrink-0">
                    <UserAvatar src={t.other_participant?.avatar_url} seed={t.other_participant?.user_id} label={t.other_participant?.display_name} size={48} />
                    {/* Online status indicator */}
                    {t.other_participant?.show_online_status && isOnline(t.other_participant?.last_seen_at) && (
                      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border border-background shadow-sm" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <p className={`text-sm font-semibold truncate ${hasUnread ? "text-foreground font-bold" : "text-foreground/90"}`}>
                        {t.other_participant?.display_name || t.other_participant?.username || "Space Explorer"}
                      </p>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {formatTime(t.last_message_at)}
                      </span>
                    </div>
                    <p className={`text-xs truncate ${hasUnread ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                      {hasUnread ? "New message..." : "Click to view chat"}
                    </p>
                  </div>
                  {hasUnread && (
                    <span className="h-4 min-w-[16px] rounded-full bg-primary text-[10px] text-primary-foreground font-bold flex items-center justify-center px-1 shrink-0">
                      {unreadCount}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Active Chat Thread or Tab Contents */}
      <div className="flex-1 glass-panel flex flex-col overflow-hidden relative">
        {threadId ? (
          activeThread ? (
            <ChatThreadWindow
              thread={activeThread}
              onOpenReport={() => setReportModalOpen(true)}
              isMenuOpen={isMenuOpen}
              setIsMenuOpen={setIsMenuOpen}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
              <ShieldAlert className="h-12 w-12 text-rose-500 mb-2 animate-bounce" />
              <h3 className="text-lg font-bold text-foreground">Permission Wall</h3>
              <p className="text-sm text-muted-foreground max-w-sm mt-1">
                You cannot access this message thread. Verify that you have a mutual-accept connection with this user.
              </p>
              <Button onClick={() => navigate("/messages")} className="mt-4 bg-primary text-primary-foreground">
                Back to Inbox
              </Button>
            </div>
          )
        ) : (
          <InboxTabsArea
            activeTab={activeTab}
            requests={requests}
            sent={sent}
            onResponseRefresh={() => {
              refetchReqs();
              refetchThreads();
            }}
          />
        )}
      </div>

      {/* REPORT MODAL */}
      <Dialog open={reportModalOpen} onOpenChange={setReportModalOpen}>
        <DialogContent className="sm:max-w-[420px] glass-panel-strong border-glass-border text-foreground">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-1.5">
              <Flag className="h-5 w-5 text-rose-400" />
              Report Conversation
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Provide detail to assist moderation audits. Galaxy Ground aims for professional space discourse.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 my-2">
            <Label htmlFor="report-reason" className="text-sm font-semibold">Reason for report</Label>
            <Textarea
              id="report-reason"
              placeholder="E.g., Harassment, inappropriate sales outreach, spam..."
              className="bg-muted/20 border-glass-border min-h-[90px]"
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => setReportModalOpen(false)}>Cancel</Button>
            <Button
              onClick={async () => {
                if (!reportReason.trim()) return toast.error("Write a reason first.");
                try {
                  const otherUser = activeThread?.other_participant?.user_id;
                  if (!otherUser) return;
                  const { error } = await supabase.from("moderation_reports").insert({
                    reporter_id: user.id,
                    target_type: "user",
                    target_id: otherUser,
                    reason: `Chat Report: ${reportReason}`,
                  });
                  if (error) throw error;
                  toast.success("Conversation reported. Administrators will audit.");
                  setReportReason("");
                  setReportModalOpen(false);
                } catch (error: unknown) {
                  const message = error instanceof Error ? error.message : "Failed to submit report.";
                  toast.error(message);
                }
              }}
              className="bg-rose-500 hover:bg-rose-600 text-white font-semibold"
            >
              Submit Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// =========================================================================
// SUBCOMPONENTS
// =========================================================================

function NavigateToAuth() {
  const navigate = useNavigate();
  return (
    <div className="glass-panel w-full max-w-[calc(100vw-2rem)] sm:max-w-md mx-auto p-6 sm:p-8 text-center space-y-4 my-10">
      <MessageSquare className="h-10 w-10 text-primary mx-auto opacity-80" />
      <h2 className="text-xl font-bold">Secure Messaging</h2>
      <p className="text-sm text-muted-foreground">
        Sign in to view your threads and accept connection invites from other experts.
      </p>
      <Button onClick={() => navigate("/auth")} className="w-full bg-primary text-primary-foreground">
        Sign In
      </Button>
    </div>
  );
}

// 1. Inbox tabs area selector view
function InboxTabsArea({
  activeTab,
  requests,
  sent,
  onResponseRefresh,
}: {
  activeTab: "requests" | "conversations" | "sent";
  requests: ConnectionRequest[];
  sent: ConnectionRequest[];
  onResponseRefresh: () => void;
}) {
  const respond = useRespondConnectionRequest();

  const handleAction = async (requestId: string, action: "accepted" | "declined" | "blocked") => {
    try {
      await respond.mutateAsync({ requestId, action });
      toast.success(`Request ${action === "accepted" ? "accepted!" : action === "declined" ? "declined." : "blocked."}`);
      onResponseRefresh();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to process request.");
    }
  };

  if (activeTab === "conversations") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <MailOpen className="h-14 w-14 text-primary/40 mb-3" />
        <h3 className="text-lg font-bold text-foreground">Select a Conversation</h3>
        <p className="text-sm text-muted-foreground max-w-xs mt-1">
          Pick a connection thread from the sidebar or click Connect on any user profile to request contact.
        </p>
      </div>
    );
  }

  if (activeTab === "requests") {
    return (
      <div className="flex-1 flex flex-col p-4 overflow-y-auto">
        <h3 className="text-sm font-semibold text-muted-foreground mb-4">Incoming Connections Requests</h3>
        {requests.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
            <UserCheck className="h-10 w-10 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">No pending requests yet. Your inbox is clean.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => (
              <div key={req.id} className="glass-panel p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-glass-border">
                <div className="flex items-center gap-3">
                  <UserAvatar src={req.sender_profile?.avatar_url} seed={req.requester_id} label={req.sender_profile?.display_name} size={48} />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-bold text-foreground">
                        {req.sender_profile?.display_name || req.sender_profile?.username || "Explorer"}
                      </h4>
                      <Badge className={`text-[10px] font-semibold border ${CATEGORY_COLORS[req.intent_category] || "bg-muted text-muted-foreground"}`}>
                        {req.intent_category}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">@{req.sender_profile?.username || "explorer"}</p>
                    <p className="text-xs text-foreground/80 mt-1.5 italic bg-muted/20 p-2 rounded border border-glass-border max-w-md">
                      "{req.context_message}"
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 w-full sm:w-auto shrink-0 justify-end">
                  <Button
                    onClick={() => handleAction(req.id, "declined")}
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-foreground text-xs"
                    disabled={respond.isPending}
                  >
                    Decline
                  </Button>
                  <Button
                    onClick={() => handleAction(req.id, "blocked")}
                    variant="ghost"
                    size="sm"
                    className="text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 text-xs"
                    disabled={respond.isPending}
                  >
                    Block
                  </Button>
                  <Button
                    onClick={() => handleAction(req.id, "accepted")}
                    size="sm"
                    className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold text-xs"
                    disabled={respond.isPending}
                  >
                    Accept
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col p-4 overflow-y-auto">
      <h3 className="text-sm font-semibold text-muted-foreground mb-4">Sent Connection Invites</h3>
      {sent.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
          <MessageSquare className="h-10 w-10 text-muted-foreground/30 mb-2" />
          <p className="text-sm text-muted-foreground">You haven't sent any connection requests yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sent.map((req) => (
            <div key={req.id} className="glass-panel p-3.5 flex items-center justify-between border border-glass-border">
              <div className="flex items-center gap-3">
                <UserAvatar src={req.recipient_profile?.avatar_url} seed={req.recipient_id} label={req.recipient_profile?.display_name} size={44} />
                <div>
                  <h4 className="text-sm font-bold text-foreground">
                    {req.recipient_profile?.display_name || req.recipient_profile?.username || "Explorer"}
                  </h4>
                  <p className="text-xs text-muted-foreground">Intent: {req.intent_category}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[10px] text-muted-foreground">
                  {new Date(req.created_at).toLocaleDateString()}
                </span>
                <Badge className={`text-[10px] capitalize font-bold ${
                  req.status === "accepted"
                    ? "bg-green-500/10 text-green-400 border border-green-500/20"
                    : req.status === "declined"
                    ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                    : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                }`}>
                  {req.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// 2. Realtime Chat Window
function ChatThreadWindow({
  thread,
  onOpenReport,
  isMenuOpen,
  setIsMenuOpen,
}: {
  thread: MessageThread;
  onOpenReport: () => void;
  isMenuOpen: boolean;
  setIsMenuOpen: (o: boolean) => void;
}) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: messages = [], isLoading } = useThreadMessages(thread.id);
  const sendMessage = useSendMessage();
  const markRead = useMarkThreadRead();
  const blockUser = useBlockUser();

  const [typed, setTyped] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark read on load & incoming messages
  useEffect(() => {
    if (thread.id && user) {
      markRead.mutate(thread.id);
    }
  }, [thread.id, messages.length, user]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typed.trim() || sendMessage.isPending) return;

    try {
      await sendMessage.mutateAsync({
        threadId: thread.id,
        content: typed.trim(),
      });
      setTyped("");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to send message.");
    }
  };

  const handleBlock = async () => {
    if (!window.confirm(`Are you sure you want to block this user? The chat thread will be permanently severed.`)) return;
    try {
      await blockUser.mutateAsync(thread.other_participant!.user_id);
      toast.success("User blocked.");
      navigate("/messages");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to block user.");
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-glass-border bg-muted/10">
        <div className="flex items-center gap-3">
          <Button
            onClick={() => navigate("/messages")}
            variant="ghost"
            size="icon"
            className="md:hidden text-muted-foreground hover:text-foreground shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <UserAvatar src={thread.other_participant?.avatar_url} seed={thread.other_participant?.user_id} label={thread.other_participant?.display_name} size={44} />
          <div>
            <h3 className="text-sm font-bold text-foreground">
              {thread.other_participant?.display_name || thread.other_participant?.username || "Space Explorer"}
            </h3>
            <p className="text-[10px] text-muted-foreground flex items-center gap-1.5">
              {thread.other_participant?.show_online_status && isOnline(thread.other_participant?.last_seen_at) ? (
                <>
                  <Circle className="h-1.5 w-1.5 fill-green-500 text-green-500" />
                  Active now
                </>
              ) : (
                "Offline"
              )}
            </p>
          </div>
        </div>

        {/* Action Menu dropdown */}
        <div className="relative">
          <Button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground shrink-0"
          >
            <MoreVertical className="h-5 w-5" />
          </Button>

          {isMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)} />
              <div className="absolute right-0 mt-1 w-40 rounded-lg glass-panel border border-glass-border shadow-lg py-1.5 z-20 text-xs">
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenReport();
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-muted/50 text-foreground flex items-center gap-2"
                >
                  <Flag className="h-3.5 w-3.5 text-rose-400" />
                  Report Chat
                </button>
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    handleBlock();
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-rose-950/20 text-rose-400 flex items-center gap-2"
                >
                  <UserX className="h-3.5 w-3.5" />
                  Block User
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Messages body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/5">
        {isLoading ? (
          <div className="text-center text-xs text-muted-foreground py-10">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-xs text-muted-foreground py-10">
            Connection unlock complete. Send a friendly cosmic greeting! 🌌
          </div>
        ) : (
          messages.map((m) => {
            const isMe = m.sender_id === user?.id;
            return (
              <div key={m.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm ${
                    isMe
                      ? "bg-primary text-primary-foreground rounded-br-none shadow-[0_2px_8px_rgba(34,211,238,0.25)]"
                      : "glass-panel border-glass-border text-foreground rounded-bl-none"
                  }`}
                >
                  <p className="leading-relaxed break-words whitespace-pre-wrap">{m.content}</p>
                  <div className="flex justify-end items-center gap-1 mt-1 text-[9px] opacity-60">
                    <span>{formatTime(m.created_at)}</span>
                    {isMe && (
                      <span className="text-[10px] select-none font-bold">
                        {m.read_at ? "✓✓" : "✓"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Composer footer */}
      <form onSubmit={handleSend} className="p-3 border-t border-glass-border flex gap-2 items-center bg-muted/10">
        <div className="flex-1 relative">
          <Textarea
            value={typed}
            onChange={(e) => setTyped(e.target.value.slice(0, 1000))}
            placeholder="Type your message..."
            rows={1}
            className="w-full bg-muted/20 border-glass-border focus:border-primary text-sm min-h-[40px] max-h-[120px] rounded-xl pr-10 py-2.5 resize-none scrollbar-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
            }}
          />
          <span className="absolute right-3.5 bottom-2.5 text-[9px] text-muted-foreground">
            {1000 - typed.length}
          </span>
        </div>
        <Button
          type="submit"
          disabled={!typed.trim() || sendMessage.isPending}
          size="icon"
          className="rounded-full bg-primary hover:bg-primary/90 text-primary-foreground h-10 w-10 shrink-0 shadow-[0_0_10px_rgba(34,211,238,0.2)]"
        >
          <Send className="h-4.5 w-4.5" />
        </Button>
      </form>
    </div>
  );
}

// =========================================================================
// HELPERS
// =========================================================================

function formatTime(isoStr: string) {
  const d = new Date(isoStr);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function isOnline(lastSeenIso?: string | null) {
  if (!lastSeenIso) return false;
  const lastSeen = new Date(lastSeenIso).getTime();
  const diffMinutes = (Date.now() - lastSeen) / 1000 / 60;
  return diffMinutes < 3;
}
