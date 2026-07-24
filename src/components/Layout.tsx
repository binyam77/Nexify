import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import UploadModal from "./UploadModal";
import { useUI } from "../context/UIContext";

export default function Layout() {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const {isFullscreenModalOpen}=useUI();
  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-100">
      <Sidebar onUploadClick={() => setIsUploadOpen(true)} />
      <main className="relative flex-1 overflow-hidden bg-bodey-bg ">
        <Outlet />
      </main>
      {!isFullscreenModalOpen &&(
      <BottomNav onUploadClick={() => setIsUploadOpen(true)} />
  )}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
      />
    </div>
  );
}
