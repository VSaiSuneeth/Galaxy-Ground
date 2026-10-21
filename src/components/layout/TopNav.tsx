import { User, LogOut, LogIn, MessageSquare } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUnreadMessagesCount } from "@/hooks/useMessaging";
import { useLiveStatus } from "@/hooks/useLiveStatus";
import { LogoMark } from "@/components/brand/LogoMark";
import { Wordmark } from "@/components/brand/Wordmark";
import SearchBar from "@/components/layout/SearchBar";
import NotificationsBell from "@/components/NotificationsBell";

const TopNav = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const unreadCount = useUnreadMessagesCount();
  const { data: liveStatus, isLoading, error } = useLiveStatus();

  return (
    <header className="sticky top-0 z-50 h-14 border-b border-border bg-background px-4 lg:hidden flex items-center gap-3">
      <Link to="/" className="flex items-center gap-2 shrink-0">
        <LogoMark size={28} />
        <Wordmark />
      </Link>

      <div className="hidden flex-1 min-w-0 max-w-xl mx-auto sm:block">
        <SearchBar />
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {/* Live Indicator */}
        {!isLoading && !error && liveStatus?.is_something_live && (
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
            <span className="telemetry text-destructive">Live</span>
          </div>
        )}

        {user ? (
          <>
            <NotificationsBell />
            <Link
              to="/messages"
              title="Messages"
              aria-label="Messages"
              className="relative p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <MessageSquare className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-primary-foreground">
                  {unreadCount}
                </span>
              )}
            </Link>
            <Link
              to="/profile"
              aria-label="Profile"
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <User className="h-5 w-5" />
            </Link>
            <button
              onClick={signOut}
              title="Sign out"
              aria-label="Sign out"
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </>
        ) : (
          <button
            onClick={() => navigate("/auth")}
            className="flex items-center gap-1.5 rounded-full bg-brand px-3 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-brand/90 transition-colors"
          >
            <LogIn className="h-4 w-4" />
            Sign in
          </button>
        )}
      </div>
    </header>
  );
};

export default TopNav;
