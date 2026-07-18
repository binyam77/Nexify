/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { X, Circle } from "lucide-react";
import type { Chat } from "../types";

interface ChatInfoModalProps {
  chat: Chat;
  onClose: () => void;
}

// Title: ChatInfoModal — Private chat detail view (Cover → Photo → Name → Stories → Empty)
export default function ChatInfoModal({ chat, onClose }: ChatInfoModalProps) {
  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[120] flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cover */}
        <div className="relative h-36 bg-gray-200">
          {chat.cover ? (
            <img src={chat.cover} alt="Cover" className="w-full h-full object-cover" />
          ) : (
            <div className={`w-full h-full ${chat.bgGradient}`} />
          )}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 bg-black/40 hover:bg-black/60 text-white rounded-full transition-all"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Profile photo overlapping cover (circular for a person, not a room) */}
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full border-4 border-white shadow-md overflow-hidden bg-gray-100">
            {chat.avatarUrl ? (
              <img src={chat.avatarUrl} alt={chat.name} className="w-full h-full object-cover" />
            ) : (
              <div className={`w-full h-full ${chat.bgGradient} flex items-center justify-center text-white font-black text-lg`}>
                {chat.avatarLabel}
              </div>
            )}
          </div>
        </div>

        {/* Name */}
        <div className="pt-14 px-5 pb-5 text-center">
          <h3 className="text-lg font-black text-gray-900 tracking-tight">{chat.name}</h3>
          {chat.isOnline !== false ? (
            <p className="text-xs text-emerald-600 font-bold mt-1 flex items-center justify-center gap-1">
              <Circle className="w-2 h-2 fill-emerald-500 text-emerald-500" />
              online
            </p>
          ) : (
            <p className="text-xs text-gray-400 font-semibold mt-1">
              last seen {chat.lastSeen || "recently"}
            </p>
          )}

          {/* Bio section */}
          <div className="mt-6 pt-5 border-t border-gray-100 text-left">
            <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-2">
              Bio
            </h4>
            <p className="text-sm text-gray-600 leading-relaxed">
              {chat.bio || "No bio yet."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}