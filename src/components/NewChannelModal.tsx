/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from "react";
import {
  X,
  Plus,
  Radio,
  Upload,
  Trash2,
  Camera,
  Image as ImageIcon,
} from "lucide-react";
import type { Chat } from "../types";

interface NewChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateChannel: (newChat: Chat) => void;
}

const MAX_NAME_LENGTH = 60;
const MAX_DESCRIPTION_LENGTH = 300;

// Title: NewChannelModal Component (New channel creation form)
// ተጠቃሚዎች Channel ብቻ መፍጠር ይችላሉ (Group feature ተነስቷል)።
// Channel ውስጥ creator ብቻ ይለጥፋል፤ subscribers ደግሞ emoji reaction ብቻ ማድረግ ይችላሉ (posting የለም)።
export default function NewChannelModal({
  isOpen,
  onClose,
  onCreateChannel,
}: NewChannelModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [coverUrl, setCoverUrl] = useState<string>("");
  const [gradientIndex, setGradientIndex] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const gradients = [
    { label: "Sunset Red", class: "bg-gradient-1" },
    { label: "Ocean Blue", class: "bg-gradient-2" },
    { label: "Emerald Mint", class: "bg-gradient-3" },
    { label: "Purple Dream", class: "bg-gradient-4" },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Security: MIME type ማረጋገጫ — extension ብቻ ሳይሆን actual file type
    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file!");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be under 5MB!");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarUrl(reader.result as string);
    };
    reader.onerror = () => {
      alert("Failed to read the selected image. Please try another file.");
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setAvatarUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please  select a valid image file!");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be under 5MB!");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setCoverUrl(reader.result as string);
    };
    reader.onerror = () => {
      alert("Failed to read the selected image.Please try another file. ");
    };
    reader.readAsDataURL(file);
  };
  const handleRemoveCover = () => {
    setCoverUrl("");
    if (coverInputRef.current) {
      coverInputRef.current.value = "";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;

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
      bgGradient: gradients[gradientIndex - 1]?.class || "bg-gradient-1",
      membersCount: 1, // creator ራሱ የመጀመሪያው subscriber
      onlineCount: 0, // Channel ላይ "online" ጽንሰ-ሀሳብ አይተገበርም
      isJoined: true, // creator ራሱ በራሱ subscribed ነው
      type: "channel",
      avatarUrl: avatarUrl || undefined,
      cover: coverUrl || undefined,
      description: description.trim() || undefined,
      isCreatedByMe: true,
    };

    onCreateChannel(newChat);

    setName("");
    setDescription("");
    setAvatarUrl("");
    setCoverUrl("");
    setGradientIndex(1);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (coverInputRef.current) coverInputRef.current.value = "";
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-100 animate-in fade-in zoom-in duration-200">
        <header className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-extrabold text-gray-900 tracking-tight">
              Create New Channel
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-xl transition-all"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar"
        >
          <div>
            <label className="block text-xs font-black text-gray-600 uppercase tracking-widest mb-1.5">
              Channel Profile Photo
            </label>
            <div className="flex items-center gap-4 bg-gray-50 border border-gray-100 p-3.5 rounded-xl">
              <div className="relative w-14 h-14 rounded-xl bg-gray-200 overflow-hidden shrink-0 flex items-center justify-center border border-gray-100">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Channel"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className={`w-full h-full flex items-center justify-center text-white font-black text-sm ${gradients[gradientIndex - 1]?.class || "bg-gradient-1"}`}
                  >
                    {name
                      ? name
                          .split(" ")
                          .map((w) => w[0])
                          .join("")
                          .slice(0, 2)
                          .toUpperCase() || "?"
                      : "?"}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity text-white"
                  title="Upload Image"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-[10px] font-bold text-gray-700 hover:bg-gray-50 transition-all flex items-center gap-1"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Upload Image</span>
                  </button>
                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      className="px-2.5 py-1.5 bg-red-50 border border-red-100 rounded-lg text-[10px] font-bold text-red-600 hover:bg-red-100 transition-all flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remove</span>
                    </button>
                  )}
                </div>
                <p className="text-[9px] text-gray-400">
                  JPEG, PNG file format. Max 5MB.
                </p>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-gray-600 uppercase tracking-widest mb-1.5">
              Cover Photo
            </label>
            <div
              onClick={() => coverInputRef.current?.click()}
              className="w-full h-24 rounded-xl bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center 
  cursor-pointer overflow-hidden relative group"
            >
              {coverUrl ? (
                <>
                  <img
                    src={coverUrl}
                    alt="Cover preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-5 h-5 text-white" />
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveCover();
                    }}
                    className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-red-600 text-white rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center text-gray-400 ">
                  <ImageIcon className="w-6 h-6 mb-1 text-gray-300" />
                  <span className="text-xs font-semibold">
                    Add a channel cover
                  </span>
                </div>
              )}
            </div>
            <input
              type="file"
              ref={coverInputRef}
              onChange={handleCoverFileChange}
              accept="image/*"
              className="hidden"
            />
          </div>

          <div>
            <label
              htmlFor="channelName"
              className="block text-xs font-black text-gray-600 uppercase tracking-widest mb-1.5"
            >
              Channel Name *
            </label>
            <input
              id="channelName"
              type="text"
              required
              maxLength={MAX_NAME_LENGTH}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Nexify Announcements"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 placeholder-gray-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all duration-200"
            />
          </div>

          <div>
            <label
              htmlFor="channelDesc"
              className="block text-xs font-black text-gray-600 uppercase tracking-widest mb-1.5"
            >
              Topic / Purpose / Description
            </label>
            <textarea
              id="channelDesc"
              rows={2}
              maxLength={MAX_DESCRIPTION_LENGTH}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this channel is about..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 placeholder-gray-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all duration-200 resize-none"
            />
          </div>

          {!avatarUrl && (
            <div>
              <span className="block text-xs font-black text-gray-600 uppercase tracking-widest mb-2.5">
                Choose Fallback Theme Color
              </span>
              <div className="grid grid-cols-4 gap-3">
                {gradients.map((gradient, index) => {
                  const isSelected = gradientIndex === index + 1;
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setGradientIndex(index + 1)}
                      className={`h-9 rounded-xl cursor-pointer ${gradient.class} flex items-center justify-center transition-all ${
                        isSelected
                          ? "ring-4 ring-blue-500 scale-[1.05]"
                          : "opacity-80 hover:opacity-100 hover:scale-[1.02]"
                      }`}
                      title={gradient.label}
                    >
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-white shadow-sm" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-gray-100 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-600 text-sm font-bold rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 text-white text-sm font-extrabold rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-blue-200"
            >
              <Plus className="w-4 h-4" />
              <span>Launch Channel</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
