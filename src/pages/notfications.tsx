import { useEffect, useRef } from "react";
import {
  Heart,
  MessageCircle,
  UserPlus,
  Bell,
} from "lucide-react";
import { useNotifications } from "../context/NotificationContext";
import type {
  AppNotification,
  NotificationType,
} from "../context/NotificationContext";
import { cn } from "../utils";
import { useNavigate } from "react-router-dom";
import { userProfilePath } from "../routes";
// Notification icon by type
function NotifIcon({ type }: { type: NotificationType }) {
  const base = "w-4 h-4";
  switch (type) {
    case "like":
      return (
        <Heart className={cn(base, "text-rose-500")} fill="currentColor" />
      );
    case "comment":
      return (
        <MessageCircle
          className={cn(base, "text-emerald-500")}
          fill="currentColor"
        />
      );
    case "follow":
      return <UserPlus className={cn(base, "text-blue-500")} />;
    default:
      return (
        <Bell className={cn(base, "text-slate-400")} fill="currentColor" />
      );
  }
}

// Icon bg color by type
function iconBg(type: NotificationType) {
  switch (type) {
    case "like":
      return "bg-input";
    case "comment":
      return "bg-input";
    case "follow":
      return "b-ginput";
    default:
      return "bg-slate-100";
  }
}

// Time formatter
function formatTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function NotifItem({
  notif,
  onRead,
  onNavigate,
}: {
  notif: AppNotification;
  onRead: () => void;
  onNavigate: (notif: AppNotification) => void;
}) {
  const handleClick = () => {
    onRead();
    onNavigate(notif);
  };
  return (
    <div
      onClick={handleClick}
      className={cn(
        "flex items-start gap-3 px-4 py-3.5 cursor-pointer transition-colors hover:bg-slate-50",
        !notif.isRead && "bg-blue-50/60 hover:bg-blue-50",
      )}
    >
      {/* Avatar + icon */}
      <div className="relative shrink-0">
        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
          {notif.actorAvatar ? (
            <img
              src={notif.actorAvatar}
              className="w-full h-full object-cover rounded-full"
              alt=""
            />
          ) : (
            notif.actorUsername[0]?.toUpperCase()
          )}
        </div>
        <div
          className={cn(
            "absolute -bottom-0.5 -right-0.5 w-5 h-5  rounded-full flex items-center justify-center",
            iconBg(notif.type),
          )}
        >
          <NotifIcon type={notif.type} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-800 leading-snug">
          <span className="font-bold">{notif.actorUsername}</span>{" "}
          {notif.message}
        </p>
        <p className="text-xs text-small-text mt-0.5">
          {formatTime(notif.createdAt)}
        </p>
      </div>

      {/* Unread dot */}
      {!notif.isRead && (
        <div className="w-2 h-2 rounded-full bg-success shrink-0 mt-1.5" />
      )}
    </div>
  );
}
export default function Notifications() {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    isLoading,
    hasMore,
    loadMore,
    markAsRead,
  } = useNotifications();
  // Routes to wherever the notification is about — Like/Comment go to the
  // post, Follow goes to the actor's profile. Reuses the app's own
  // existing route helpers (userProfilePath, /post/:id) rather than
  // constructing paths locally, so this stays consistent with however
  // Profile/Post navigation works everywhere else in the app.
  const handleNavigate = (notif: AppNotification) => {
    if (notif.type === "follow") {
      navigate(userProfilePath(notif.actorUsername));
      return;
    }
    if (notif.postId) {
      navigate(`/post/${notif.postId}`);
    }
  };

  // Infinite scroll: observes a sentinel element at the bottom of the
  // list and requests the next page once it enters the viewport — same
  // "boring, conventional" IntersectionObserver pattern rather than a
  // manual scroll-position calculation.
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !isLoading) {
          void loadMore();
        }
      },
      { rootMargin: "200px" }, // trigger slightly before it's fully visible
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, isLoading, loadMore]);

  const unread = notifications.filter((n) => !n.isRead);
  const read = notifications.filter((n) => n.isRead);
  return (
    <div className="h-full w-full overflow-y-auto bg-bodey-bg">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-bodey-bg border-b border-slate-100 px-4 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-h1">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-xs text-small-text mt-0.5">{unreadCount} new</p>
          )}
        </div>
      </div>

      {/* Empty state */}
      {notifications.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-400">
          <Bell className="w-12 h-12 opacity-30" />
          <p className="font-semibold">No notifications yet</p>
          <p className="text-sm">Like, comment, or follow to see activity</p>
        </div>
      )}

      {/* Unread */}
      {unread.length > 0 && (
        <div>
          <p className="px-4 pt-4 pb-2 text-xs font-bold text-text uppercase tracking-wider">
            New
          </p>
          <div className="divide-y divide-slate-100 bg-slate-300">
            {unread.map((n) => (
              <NotifItem 
              key={n.id} 
              notif={n} 
              onRead={() => markAsRead(n.id)}
              onNavigate={handleNavigate} />
            ))}
          </div>
        </div>
      )}

      {/* Read */}
      {read.length > 0 && (
        <div>
          <p className="px-4 pt-4 pb-2 text-xs font-bold text-input-text uppercase tracking-wider">
            Earlier
          </p>
          <div className="divide-y divide-slate-100">
            {read.map((n) => (
              <NotifItem 
               key={n.id}
                notif={n}
                 onRead={() => markAsRead(n.id)}
                 onNavigate={handleNavigate} />
            ))}
          </div>
        </div>
      )}
      {/* Infinite scroll sentinel + loading indicator */}
      {hasMore && (
        <div ref={sentinelRef} className="flex justify-center py-4">
          {isLoading && (
            <div className="w-5 h-5 border-2 border-slate-300 border-t-brand-dark rounded-full animate-spin" />
          )}
        </div>
      )}
      {/* Bottom padding for mobile nav */}
      <div className="h-20 md:h-4" />
    </div>
  );
}
