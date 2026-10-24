import { useEffect } from "react";
import { X } from "lucide-react";

interface MediaViewerProps {
  media: { url: string; type: "image" | "video" } | null;
  onClose: () => void;
}

// የሙሉ ማያ ፎቶ/ቪዲዮ ማሳያ — Esc ወይም ከበስተጀርባ መታ ሲደረግ ይዘጋል
export default function MediaViewer({ media, onClose }: MediaViewerProps) {
  useEffect(() => {
    if (!media) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [media, onClose]);

  if (!media) return null;

  return (
    <div
      className="fixed inset-0 z-[120] bg-black/90 flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Media viewer"
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-colors"
        aria-label="Close viewer"
      >
        <X className="w-6 h-6" />
      </button>
      {media.type === "video" ? (
        <video
          src={media.url}
          controls
          autoPlay
          playsInline
          className="max-h-[90vh] max-w-full rounded-lg"
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <img
          src={media.url}
          alt="Full size media"
          className="max-h-[90vh] max-w-full object-contain rounded-lg"
          referrerPolicy="no-referrer"
          onClick={(e) => e.stopPropagation()}
        />
      )}
    </div>
  );
}
