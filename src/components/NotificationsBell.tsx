import { Bell, Check } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useNotifications } from "@/hooks/useNotifications";
import { timeAgo } from "@/lib/post-utils";
import { asArray } from "@/lib/safe-data";

const NotificationsBell = () => {
  const { data: notifications, unread, markAllRead, markRead } = useNotifications();
  const notificationList = asArray(notifications);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((s) => !s)}
        className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[340px] max-h-[480px] overflow-y-auto glass-panel-strong rounded-xl border border-glass-border shadow-xl z-50">
          <div className="flex items-center justify-between p-3 border-b border-glass-border">
            <p className="text-sm font-semibold text-foreground">Notifications</p>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="text-[11px] text-primary hover:underline flex items-center gap-1"
              >
                <Check className="h-3 w-3" /> Mark all read
              </button>
            )}
          </div>
          {notificationList.length === 0 ? (
            <p className="p-6 text-xs text-muted-foreground text-center">
              No notifications yet. Follow accounts to get updates.
            </p>
          ) : (
            <ul className="divide-y divide-glass-border">
              {notificationList.map((n) => (
                <li key={n.id}>
                  <Link
                    to={n.link || "/"}
                    onClick={() => {
                      markRead(n.id);
                      setOpen(false);
                    }}
                    className={`flex gap-3 p-3 hover:bg-muted/40 transition-colors ${n.read ? "" : "bg-primary/5"}`}
                  >
                    {n.image_url ? (
                      <img src={n.image_url} alt="" className="h-10 w-10 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-muted/30 flex items-center justify-center text-xs shrink-0">
                        🚀
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-foreground">
                        <span className="font-semibold">{n.account_name || n.account_handle || "Account"}</span>{" "}
                        <span className="text-muted-foreground">posted</span>
                      </p>
                      {n.title && <p className="text-sm text-foreground/90 line-clamp-1 mt-0.5">{n.title}</p>}
                      {n.preview && <p className="text-xs text-muted-foreground line-clamp-2">{n.preview}</p>}
                      <p className="text-[10px] text-muted-foreground/80 mt-1">{timeAgo(n.created_at)}</p>
                    </div>
                    {!n.read && <span className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationsBell;
