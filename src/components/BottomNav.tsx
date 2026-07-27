import { NavLink, useNavigate } from "react-router-dom";
import { ROUTES } from "../routes";
import { cn } from "../utils";
import { useNotifications } from "../context/NotificationContext";
import {
  HouseSimple,
  UsersThree,
  Plus,
  Bell,
  UserCircle,
} from "@phosphor-icons/react";

interface BottomNavProps {
  onUploadClick?: () => void;
}

export default function BottomNav({ onUploadClick }: BottomNavProps) {
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();

  const handleUpload = () => {
    if (onUploadClick) onUploadClick();
    else navigate(ROUTES.profile);
  };

  const leftItems = [
    { label: "Home", to: ROUTES.home, icon: HouseSimple },
    { label: "Community", to: ROUTES.community, icon: UsersThree },
  ];

  const rightItems = [
    {
      label: "Notifications",
      to: ROUTES.notifications,
      icon: Bell,
      badge: unreadCount,
    },
    { label: "Profile", to: ROUTES.profile, icon: UserCircle },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface shadow-input border-t border-input-border flex items-center h-16 px-2">
      {/* Left: Home + Community */}
      <div className="flex flex-1 items-center justify-around">
        {leftItems.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === ROUTES.home}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center  gap-0.5 px-3 py-1  transition-colors",
                isActive ? "text-brand-dark" : "text-text"  ,
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={22} weight={isActive ? "regular" : "bold"} />
                <span className="text-[10px] font-medium">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>

      {/* Center: + Upload */}
      <div className="flex items-center justify-center px-2">
        <button
          onClick={handleUpload}
          className="w-14 h-14 bg-brand  rounded-full flex items-center justify-center
           shadow-xl -translate-y-4 border-4 border-input active:scale-95 transition-transform"
          aria-label="Upload"
        >
          <Plus className="w-7 h-7 text-white" strokeWidth={2.5} />
        </button>
      </div>

      {/* Right: Notifications + Profile */}
      <div className="flex flex-1 items-center justify-around">
        {rightItems.map(({ label, to, icon: Icon, badge }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center gap-0.5 px-3  py-1  transition-colors",
                isActive ? "text-brand-dark" : "text-text",
              )
            }
          >
            {({ isActive }) => (
              <>
                <div className="relative">
                  <Icon size={22} weight={isActive ? "regular" : "bold"} />
                  {badge != null && badge > 0 && (
                    <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                      {badge > 9 ? "9+" : badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}