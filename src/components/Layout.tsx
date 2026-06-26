import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import NotificationBell from './NotificationBell';

export default function Layout() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-100">
      <Sidebar />
      <main className="relative flex-1 overflow-hidden">
        <NotificationBell />
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}