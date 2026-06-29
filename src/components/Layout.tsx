import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import UploadModal from "./UploadModal";

export default function Layout() {
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-100">
      <Sidebar onUploadClick={() => setIsUploadOpen(true)} />
      <main className="relative flex-1 overflow-hidden ">
        <Outlet />
      </main>
      <BottomNav onUploadClick={() => setIsUploadOpen(true)} />
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
      />
    </div>
  );
}
