import { Bell } from 'lucide-react';

interface NotificationBellProps {
  count?: number;
}

/**
 * Floats top-right on every screen size. On mobile it sits on top of the
 * full-screen video, so it gets a translucent dark backdrop to stay readable.
 * TODO: replace the default count with real notification data once that API exists.
 */
export default function NotificationBell({ count = 3 }: NotificationBellProps) {
  return (
    <div className="absolute right-4 top-4 z-30">
      <button type="button" className="relative flex h-10 w-10 items-center justify-center rounded-full bg-black/25 text-white backdrop-blur-sm transition-colors hover:bg-black/35 md:bg-slate-100 md:text-slate-700 md:hover:bg-slate-200" aria-label="Notifications">
        <Bell size={20} />
        {count > 0 && (
          <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
            {count}
          </span>
        )}
      </button>
    </div>
  );
}                                            