/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from "react";
import { ArrowLeft, Camera } from "lucide-react";
import type { Chat } from "../types";

interface NewChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateChannel: (newChat: Chat) => Promise<boolean> | boolean | void;
}
// ሁሉም አዲስ channel በነባሪ ሰማያዊ (Ocean Blue) — የቀለም ምርጫ ተወግዷል
const DEFAULT_THEME = "bg-gradient-2";
const MAX_NAME_LENGTH = 60;
const MAX_BIO_LENGTH = 300;

// Title: NewChannelModal — Full-screen channel creation flow (Cover → Photo → Name → Bio)
export default function NewChannelModal({
  isOpen,
  onClose,
  onCreateChannel,
}: NewChannelModalProps) {
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const validateImage = (file: File, maxMB: number) => {
    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file!");
      return false;
    }
    if (file.size > maxMB * 1024 * 1024) {
      alert(`File size must be under ${maxMB}MB!`);
      return false;
    }
    return true;
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !validateImage(file, 5)) return;
    const reader = new FileReader();
    reader.onloadend = () => setAvatarUrl(reader.result as string);
    reader.onerror = () =>
      alert("Failed to read the selected image. Please try another file.");
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setAvatarUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName || isSubmitting) return;

    const words = trimmedName.split(" ");
    const avatarLabel =
      words.length > 1
        ? (words[0][0] + words[1][0]).toUpperCase()
        : trimmedName.slice(0, 2).toUpperCase();

    const newChat: Chat = {
      id: `channel-${Date.now()}`,
      name: trimmedName,
      lastMsgText: "Welcome to this new channel! Stay tuned for updates.",
      lastMsgSender: "System",
      lastMsgTime: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      unreadCount: 0,
      avatarLabel,
      bgGradient: DEFAULT_THEME,
      membersCount: 1,
      onlineCount: 0,
      isJoined: true,
      type: "channel",
      avatarUrl: avatarUrl || undefined,
      description: bio.trim() || undefined,
      isCreatedByMe: true,
    };

    setIsSubmitting(true);
    let ok: boolean | void = false;
    try {
      ok = await onCreateChannel(newChat);
    } finally {
      setIsSubmitting(false);
    }
    // አልተሳካም (ለምሳሌ ግንኙነት የለም) → ፎርሙ ክፍት ይቆያል፣ የተጻፈው አይጠፋም
    if (ok === false) return;

    setAvatarUrl("");
    setName("");
    setBio("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    onClose();
  };

  return (
    <div className="fixed inset-0 h-[100svh] bg-bodey-bg z-50 flex flex-col animate-in fade-in duration-150">
      <header className="relative px-4 py-4 flex items-center shrink-0">
        <button
          onClick={onClose}
          className="relative z-10 p-1.5 text-gray-700 hover:bg-gray-50 rounded-xl transition-all"
          aria-label="Back"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h3 className="absolute inset-x-0 text-center text-lg font-extrabold text-gray-900 tracking-tight pointer-events-none">
          Create Channel
        </h3>
      </header>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6 max-w-lg mx-auto">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-2">
            <div className="relative">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-28 h-28 rounded-full overflow-hidden flex items-center justify-center bg-blue-100 text-gray-500 hover:bg-blue-200 transition-colors"
                aria-label="Add photo"
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Channel"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Camera className="w-10 h-10" />
                )}
              </button>
              <span className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-white shadow-md flex items-center justify-center text-brand pointer-events-none">
                <Camera className="w-4 h-4" />
              </span>
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-sm font-medium text-gray-500"
            >
              {avatarUrl ? "Change Photo" : "Add Photo"}
            </button>
            {avatarUrl && (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                className="text-xs font-bold text-red-500"
              >
                Remove
              </button>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarFileChange}
              accept="image/*"
              className="hidden"
            />
          </div>

          {/* Channel Name */}
          <div>
            <label
              htmlFor="channelName"
              className="block text-sm font-extrabold text-gray-900 mb-2"
            >
              Channel Name
            </label>
            <input
              id="channelName"
              type="text"
              required
              maxLength={MAX_NAME_LENGTH}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Channel name"
              className="w-full bg-input border border-input-border rounded-2xl px-4 py-3 text-sm font-medium text-input-text placeholder-gray-400 focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all duration-200"
            />
          </div>

          {/* Bio */}
          <div>
            <label
              htmlFor="channelBio"
              className="block text-sm font-extrabold text-gray-900 mb-2"
            >
              Bio
            </label>
            <textarea
              id="channelBio"
              rows={3}
              maxLength={MAX_BIO_LENGTH}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Describe your channel"
              className="w-full bg-input border border-input-border rounded-2xl px-4 py-3 text-sm font-medium text-input-text placeholder-gray-400 focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all duration-200 resize-none"
            />
          </div>
        </div>
      </form>

      <div className="p-4 pb-[max(1.5rem,calc(env(safe-area-inset-bottom)+1rem))] shrink-0">
        <div className="max-w-lg mx-auto">
          <button
            onClick={handleSubmit}
            disabled={!name.trim() || isSubmitting}
            className="w-full py-3.5 bg-brand hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-brand text-white text-sm font-extrabold rounded-2xl transition-all shadow-md"
          >
            Create Channel
          </button>
        </div>
      </div>
    </div>
  );
}
