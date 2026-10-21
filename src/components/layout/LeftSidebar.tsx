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
import { LogoMark } from "@/components/brand/LogoMark";
import { Wordmark } from "@/components/brand/Wordmark";

const navItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: Compass, label: "Explore", path: "/explore" },
  { icon: Building2, label: "Launchpad", path: "/startups" },
  { icon: Users, label: "Orbits", path: "/communities" },
  { icon: Rocket, label: "Launches", path: "/missions" },
  { icon: Radio, label: "Live", path: "/live" },
  { icon: BookOpen, label: "Learn", path: "/learning" },
  { icon: Bookmark, label: "Hangar", path: "/bookmarks" },
  { icon: MessageSquare, label: "Messages", path: "/messages" },
  { icon: UserCircle, label: "Profile", path: "/profile" },
];

const LeftSidebar = () => {
  const unreadCount = useUnreadMessagesCount();

  return (
    <aside className="sticky top-0 hidden h-dvh border-r border-border bg-background py-4 md:flex md:w-[72px] md:flex-col xl:w-[280px]">
        <div className="flex items-center justify-center gap-2 px-4 pb-5 xl:justify-start"><LogoMark size={30} /><Wordmark className="hidden xl:block" /></div>
        <nav aria-label="Primary" className="flex-1 space-y-1 px-2 xl:px-3">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `relative flex items-center justify-center gap-3 rounded-full px-3 py-2.5 text-sm font-medium transition-colors duration-200 xl:justify-start ${
                  isActive
                    ? "bg-muted text-foreground before:absolute before:left-0 before:h-5 before:w-[3px] before:bg-brand"
                    : "text-sidebar-foreground hover:bg-muted hover:text-foreground"
                }`
              }
            >
              <item.icon className="h-5 w-5 shrink-0" />
              <span className="hidden xl:inline">{item.label}</span>
              {item.path === "/messages" && unreadCount > 0 && (
                <span className="ml-auto rounded-full bg-brand px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                  {unreadCount}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Bottom section */}
        <div className="border-t border-border px-4 pt-4" />
      </aside>
  );
};

export default LeftSidebar;
