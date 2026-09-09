import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import BottomNav from "./BottomNav";
import UploadModal from "./UploadModal";
import { useUI } from "../context/UIContext";

export default function Layout() {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const openUploadModal = (file?: File) => {
    setPendingFile(file ?? null);
    setIsUploadOpen(true);
  };
  const closeUploadModal = () => {
    setIsUploadOpen(false);
    setPendingFile(null); // ቀጣይ ጊዜ ስንከፍት አሮጌ file እንዳይቀር
  };
  const {isFullscreenModalOpen}=useUI();
  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-100">
      <Sidebar onUploadClick={() => openUploadModal()} />
      <main className="relative flex-1 overflow-hidden bg-bodey-bg ">
        <Outlet />
      </main>
      {!isFullscreenModalOpen &&(
      <BottomNav onUploadClick={(file) => openUploadModal(file)} />
  )}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={closeUploadModal}
        initialFile={pendingFile}
      />
    </div>
  );
}
