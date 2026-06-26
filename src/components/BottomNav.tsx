// NEW FILE. Mobile-only tab bar that replaces the top nav on small screens.
// Sits fixed at the bottom, on top of the full-screen video, so it needs a
// translucent + blurred background to stay legible.
import { NavLink } from 'react-router-dom';
import { House, Users, User, Settings } from 'lucide-react';
import { ROUTES } from '../routes';
import { cn } from '../utils';

const navItems = [
  { label: 'Home', to: ROUTES.home, icon: House },
  { label: 'Community', to: ROUTES.community, icon: Users },
  { label: 'Profile', to: ROUTES.profile, icon: User },
  { label: 'Settings', to: ROUTES.settings, icon: Settings },
];

export default function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-slate-200 bg-white/90 px-2 pb-[max(env(safe-area-inset-bottom),8px)] pt-2 backdrop-blur-md md:hidden">
      {navItems.map(({ label, to, icon: Icon }) => (
        <NavLink key={to} to={to} end={to === ROUTES.home} className={({ isActive }) => cn('flex flex-1 flex-col items-center gap-1 rounded-lg py-1.5 text-[11px] font-semibold text-slate-500 transition-colors', isActive && 'text-blue-600')}>
          <Icon size={22} />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}