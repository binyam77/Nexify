/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { X,  Radio } from "lucide-react";
import type { Chat } from "../types";

interface ChannelInfoModalProps {
  chat: Chat;
  onClose: () => void;
}

// Title: ChannelInfoModal — Channel detail view (Cover → Creator name → Empty)
export default function ChannelInfoModal({ chat, onClose }: ChannelInfoModalProps) {
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
            <img src={chat.cover} alt="Channel cover" className="w-full h-full object-cover" />
          ) : (
            <div className={`w-full h-full ${chat.bgGradient} flex items-center justify-center`}>
              <Radio className="w-8 h-8 text-white/70" />
            </div>
          )}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 bg-black/40 hover:bg-black/60 text-white rounded-full transition-all"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Channel avatar overlapping cover */}
          <div className="absolute -bottom-8 left-5 w-16 h-16 rounded-2xl border-4 border-white shadow-md overflow-hidden bg-gray-100">
            {chat.avatarUrl ? (
              <img src={chat.avatarUrl} alt={chat.name} className="w-full h-full object-cover" />
            ) : (
              <div className={`w-full h-full ${chat.bgGradient} flex items-center justify-center text-white font-black`}>
                {chat.avatarLabel}
              </div>
            )}
          </div>
        </div>

        {/* Creator name / channel name */}
        <div className="pt-11 px-5 pb-5">
          <h3 className="text-lg font-black text-gray-900 tracking-tight">{chat.name}</h3>
          <p className="text-xs text-gray-400 font-semibold mt-0.5">
            📢 {chat.membersCount} subscribers
          </p>
          <p className="text-sm text-gray-600 mt-3 leading-relaxed">
            {chat.description || "No description provided."}
          </p>
        </div>
      </div>
    </div>
  );
}