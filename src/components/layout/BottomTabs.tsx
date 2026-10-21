import { BookOpen, Compass, Home, Plus, UserCircle } from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";

const tabs = [
  { to: "/", label: "Home", icon: Home },
  { to: "/explore", label: "Explore", icon: Compass },
  { to: "/learning", label: "Learn", icon: BookOpen },
  { to: "/profile", label: "Profile", icon: UserCircle },
];

const BottomTabs = () => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  if (pathname.startsWith("/messages/")) return null;

  return (
    <nav aria-label="Mobile navigation" className="fixed inset-x-0 bottom-0 z-50 flex h-[calc(56px+env(safe-area-inset-bottom))] items-start justify-around border-t border-border bg-background px-2 pb-[env(safe-area-inset-bottom)] pt-1 md:hidden">
      {tabs.slice(0, 2).map((tab) => <Tab key={tab.to} {...tab} />)}
      <button type="button" aria-label="Compose" onClick={() => { navigator.vibrate?.(8); navigate("/?compose=1"); }} className="-mt-5 flex h-12 w-12 items-center justify-center rounded-full bg-brand text-primary-foreground shadow-sm"><Plus className="h-6 w-6" /></button>
      {tabs.slice(2).map((tab) => <Tab key={tab.to} {...tab} />)}
    </nav>
  );
};

const Tab = ({ to, label, icon: Icon }: (typeof tabs)[number]) => (
  <NavLink to={to} onClick={() => navigator.vibrate?.(8)} className={({ isActive }) => `relative flex min-w-12 flex-col items-center gap-0.5 px-2 py-1 text-[11px] ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
    {({ isActive }) => <><Icon className="h-6 w-6" /><span>{label}</span>{isActive && <span className="absolute -bottom-0.5 h-1 w-1 rounded-full bg-brand" />}</>}
  </NavLink>
);

export default BottomTabs;
