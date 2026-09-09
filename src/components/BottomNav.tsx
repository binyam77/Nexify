import { NavLink, useNavigate } from "react-router-dom";
import { ROUTES } from "../routes";
import { cn } from "../utils";
import { useNotifications } from "../context/NotificationContext";
import { useState, useRef } from "react";
import {
  HouseSimple,
  UsersThree,
  Plus,
  Bell,
  UserCircle,
  Camera,
  Image,
  X,
  VideoCamera,
} from "@phosphor-icons/react";

interface BottomNavProps {
  onUploadClick?: (file: File) => void;
}

export default function BottomNav({ onUploadClick }: BottomNavProps) {
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const cameraPhotoInputRef = useRef<HTMLInputElement>(null);
  const cameraVideoInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handlePlusClick = () => {
    if (onUploadClick) setIsCreateOpen(true);
    else navigate(ROUTES.profile);
  };

  const handleFilePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setIsCreateOpen(false);
    e.target.value = ""; // ተመሳሳይ ፋይል ደግመህ ብትመርጥ onChange ይተኩስ ዘንድ
    if (file && onUploadClick) onUploadClick(file);
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
                isActive ? "text-brand-dark" : "text-text",
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
          onClick={handlePlusClick}
          className="w-14 h-14 bg-brand  rounded-full flex items-center justify-center
           shadow-xl -translate-y-4 border-4 border-input active:scale-95 transition-transform"
          aria-label="Upload"
        >
          <Plus className="w-7 h-7 text-white" strokeWidth={2.5} />
        </button>

               <input
          ref={cameraPhotoInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFilePicked}
          className="hidden"
        />
        <input
          ref={cameraVideoInputRef}
          type="file"
          accept="video/*"
          capture="environment"
          onChange={handleFilePicked}
          className="hidden"
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="video/*,image/*"
          onChange={handleFilePicked}
          className="hidden"
        />
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
        {isCreateOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/60 flex items-end justify-center md:items-center"
          onClick={() => setIsCreateOpen(false)}
        >
          <div
            className="bg-white w-full max-w-sm rounded-t-2xl md:rounded-2xl p-4 pb-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-slate-900">Create</h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>
            <button
              onClick={() => cameraPhotoInputRef.current?.click()}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                <Camera className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Take Photo</p>
                <p className="text-xs text-slate-400">Use your camera to take a photo</p>
              </div>
            </button>

            <button
              onClick={() => cameraVideoInputRef.current?.click()}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center">
                <VideoCamera className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Record Video</p>
                <p className="text-xs text-slate-400">Use your camera to record a video</p>
              </div>
            </button>

            <button
              onClick={() => galleryInputRef.current?.click()}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors text-left"
            >
              <div className="w-10 h-10 rounded-full bg-violet-50 flex items-center justify-center">
                <Image className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Upload</p>
                <p className="text-xs text-slate-400">Choose from your gallery</p>
              </div>
            </button>
          </div>
        </div>
      )}
    </nav>
        
  );
}
