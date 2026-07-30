/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { X, Image as ImageIcon } from "lucide-react";
import type { Message } from "../types";

interface MediaGalleryModalProps {
  isOpen: boolean;
  messages: Message[];
  onClose: () => void;
  onSelectMedia: (url: string) => void;
}

// Title: MediaGalleryModal — Group/Channel ውስጥ የተላኩ media (image/video) grid view
export default function MediaGalleryModal({
  isOpen,
  messages,
  onClose,
  onSelectMedia,
}: MediaGalleryModalProps) {
  if (!isOpen) return null;

  const mediaMessages = messages.filter(
    (m) => m.mediaUrl && (m.mediaType === "image" || m.mediaType === "video"),
  );

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[135] flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200 flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="px-5 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
          <h3 className="text-base font-black text-gray-900">
            Media ({mediaMessages.length})
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-xl transition-all"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-3">
          {mediaMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
              <ImageIcon className="w-10 h-10 text-gray-300" />
              <p className="text-sm font-bold text-gray-400">No shared media yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {mediaMessages.map((m) => (
                <button
                  key={m.id}
                  onClick={() => m.mediaUrl && onSelectMedia(m.mediaUrl)}
                  className="aspect-square rounded-lg overflow-hidden bg-gray-100 relative group"
                >
                  {m.mediaType === "video" ? (
                    <video src={m.mediaUrl} className="w-full h-full object-cover" muted />
                  ) : (
                    <img
                      src={m.mediaUrl}
                      alt="Shared media"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  )}
                  {m.mediaType === "video" && (
                    <span className="absolute top-1 right-1 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                      🎥
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}