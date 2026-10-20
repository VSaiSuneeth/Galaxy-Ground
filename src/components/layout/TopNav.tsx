import { User, Menu, LogOut, LogIn, MessageSquare } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useUnreadMessagesCount } from "@/hooks/useMessaging";
import { useLiveStatus } from "@/hooks/useLiveStatus";
import logo from "@/assets/logo.png";
import SearchBar from "@/components/layout/SearchBar";
import NotificationsBell from "@/components/NotificationsBell";

interface TopNavProps {
  onMenuToggle?: () => void;
}

const TopNav = ({ onMenuToggle }: TopNavProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const unreadCount = useUnreadMessagesCount();
  const { data: liveStatus, isLoading, error } = useLiveStatus();

  return (
    <header className="sticky top-0 z-50 glass-panel-strong border-b border-glass-border px-4 lg:px-6 h-14 flex items-center gap-4">
      <button
        onClick={onMenuToggle}
        className="lg:hidden p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
      >
        <Menu className="h-5 w-5" />
      </button>

      <Link to="/" className="flex items-center gap-2 shrink-0">
        <img src={logo} alt="Galaxy Ground" className="h-8 w-8" />
        <span className="text-lg font-bold glow-text text-foreground hidden sm:block">
          Galaxy Ground
        </span>
      </Link>

      <div className="flex-1 min-w-0 max-w-xl mx-auto">
        <SearchBar />
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {/* Live Indicator */}
        {!isLoading && !error && liveStatus?.is_something_live && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <span className="text-xs text-red-500 font-medium">LIVE</span>
          </div>
        )}

        {user ? (
          <>
            <NotificationsBell />
            <Link
              to="/messages"
              title="Messages"
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors relative"
            >
              <MessageSquare className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 h-4 min-w-[16px] rounded-full bg-primary text-[10px] text-primary-foreground font-bold flex items-center justify-center px-1 shadow-[0_0_6px_rgba(34,211,238,0.4)] animate-pulse">
                  {unreadCount}
                </span>
              )}
            </Link>
            <Link
              to="/profile"
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <User className="h-5 w-5" />
            </Link>
            <button
              onClick={signOut}
              title="Sign out"
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </>
        ) : (
          <button
            onClick={() => navigate("/auth")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
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