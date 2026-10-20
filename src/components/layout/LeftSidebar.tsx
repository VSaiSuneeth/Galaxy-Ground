import {
  Home,
  Compass,
  Building2,
  Users,
  Rocket,
  BookOpen,
  UserCircle,
  ChevronLeft,
  Bookmark,
  MessageSquare,
  Radio,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useUnreadMessagesCount } from "@/hooks/useMessaging";

interface LeftSidebarProps {
  open: boolean;
  onClose: () => void;
}

const navItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Compass, label: "Explore", path: "/explore" },
  { icon: Building2, label: "Launchpad", path: "/startups" },
  { icon: Users, label: "Orbits", path: "/communities" },
  { icon: Rocket, label: "Launch Calendar", path: "/missions" },
  { icon: Radio, label: "Live", path: "/live" },
  { icon: BookOpen, label: "Learning", path: "/learning" },
  { icon: Bookmark, label: "Hangar", path: "/bookmarks" },
  { icon: MessageSquare, label: "Messages", path: "/messages" },
  { icon: UserCircle, label: "Profile", path: "/profile" },
];

const LeftSidebar = ({ open, onClose }: LeftSidebarProps) => {
  const unreadCount = useUnreadMessagesCount();

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed lg:sticky top-0 lg:top-14 left-0 z-50 lg:z-30 h-screen lg:h-[calc(100vh-3.5rem)] w-64 glass-panel-strong border-r border-glass-border flex flex-col py-4 transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Mobile close */}
        <button
          onClick={onClose}
          className="lg:hidden absolute top-4 right-3 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <nav className="flex-1 px-3 space-y-1 mt-2 lg:mt-0">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-primary/10 text-primary glow-border"
                    : "text-sidebar-foreground hover:bg-muted/50 hover:text-foreground"
                }`
              }
            >
              <item.icon className="h-5 w-5 shrink-0" />
              <span>{item.label}</span>
              {item.path === "/messages" && unreadCount > 0 && (
                <span className="ml-auto bg-primary text-primary-foreground font-bold rounded-full text-[10px] px-1.5 py-0.5 animate-pulse">
                  {unreadCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom section */}
        <div className="px-3 pt-4 border-t border-glass-border">
          <div className="glass-panel p-3 text-center">
            <p className="text-xs text-muted-foreground">
              🚀 Galaxy Ground v1.0
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Explore the cosmos together
            </p>
          </div>
        </div>
      </aside>
    </>
  );
};

export default LeftSidebar;
