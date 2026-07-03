import { useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, UserPlus, AtSign, Bell, CheckCheck, Trash2 } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import type { AppNotification, NotificationType } from '../context/NotificationContext';
import { ROUTES } from '../routes';
import { cn } from '../utils';

// Notification icon by type
function NotifIcon({ type }: { type: NotificationType }) {
  const base = "w-4 h-4";
  switch (type) {
    case 'like':    return <Heart className={cn(base, "text-rose-500")} fill="currentColor" />;
    case 'comment': return <MessageCircle className={cn(base, "text-emerald-500")}fill="currentColor" />;
    case 'follow':  return <UserPlus className={cn(base, "text-blue-500")} />;
    case 'mention': return <AtSign className={cn(base, "text-purple-500")} />;
    default:        return <Bell className={cn(base, "text-slate-400")}fill="currentColor" />;
  }
}

// Icon bg color by type
function iconBg(type: NotificationType) {
  switch (type) {
    case 'like':    return 'bg-input';
    case 'comment': return 'bg-input';
    case 'follow':  return 'bg-input';
    case 'mention': return 'bg-input';
    default:        return 'bg-slate-100';
  }
}

// Time formatter
function formatTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7)  return `${d}d ago`;
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function NotifItem({ notif, onRead }: { notif: AppNotification; onRead: () => void }) {
  return (
    <div
      onClick={onRead}
      className={cn(
        "flex items-start gap-3 px-4 py-3.5 cursor-pointer transition-colors hover:bg-slate-50",
        !notif.isRead && "bg-blue-50/60 hover:bg-blue-50"
      )}
    >
      {/* Avatar + icon */}
      <div className="relative shrink-0">
        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
          {notif.actorAvatar
            ? <img src={notif.actorAvatar} className="w-full h-full object-cover rounded-full" alt="" />
            : notif.actorUsername[0]?.toUpperCase()
          }
        </div>
        <div className={cn(
          "absolute -bottom-0.5 -right-0.5 w-5 h-5  rounded-full flex items-center justify-center",
          iconBg(notif.type)
        )}>
          <NotifIcon type={notif.type} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-800 leading-snug">
          <span className="font-bold">{notif.actorUsername}</span>
          {' '}{notif.message}
        </p>
        <p className="text-xs text-slate-400 mt-0.5">{formatTime(notif.createdAt)}</p>
      </div>

      {/* Unread dot */}
      {!notif.isRead && (
        <div className="w-2 h-2 rounded-full bg-success shrink-0 mt-1.5" />
      )}
    </div>
  );
}

export default function Notifications() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();
  const navigate = useNavigate();

  const unread = notifications.filter(n => !n.isRead);
  const read   = notifications.filter(n =>  n.isRead);

  return (
    <div className="h-full w-full overflow-y-auto bg-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-100 px-4 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Notifications</h1>
          {unreadCount > 0 && (
            <p className="text-xs text-slate-400 mt-0.5">{unreadCount} new</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              Mark all read
            </button>
          )}
          {notifications.length > 0 && (
            <button
              onClick={clearAll}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-rose-500 px-3 py-1.5 rounded-lg hover:bg-rose-50 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear
            </button>
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
          <p className="px-4 pt-4 pb-2 text-xs font-bold text-input-text uppercase tracking-wider">New</p>
          <div className="divide-y divide-slate-100 bg-slate-300">
            {unread.map(n => (
              <NotifItem key={n.id} notif={n} onRead={() => markAsRead(n.id)} />
            ))}
          </div>
        </div>
      )}

      {/* Read */}
      {read.length > 0 && (
        <div>
          <p className="px-4 pt-4 pb-2 text-xs font-bold text-input-text uppercase tracking-wider">Earlier</p>
          <div className="divide-y divide-slate-100">
            {read.map(n => (
              <NotifItem key={n.id} notif={n} onRead={() => markAsRead(n.id)} />
            ))}
          </div>
        </div>
      )}

      {/* Bottom padding for mobile nav */}
      <div className="h-20 md:h-4" />
    </div>
  );
}