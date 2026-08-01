/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from "react";
import {
  ArrowLeft,
  Plus,
  Upload,
  Trash2,
  Camera,
  UserPlus,
} from "lucide-react";
import type { Chat, SelectableUser } from "../types";

interface NewGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateGroup: (newChat: Chat, initialMembers: SelectableUser[]) => void;
  onOpenMemberPicker: () => void;
  pickedMembers: SelectableUser[];
}

const MAX_NAME_LENGTH = 60;
const MAX_DESCRIPTION_LENGTH = 300;

// Title: NewGroupModal — Full-screen group creation flow
export default function NewGroupModal({
  isOpen,
  onClose,
  onCreateGroup,
  onOpenMemberPicker,
  pickedMembers,
}: NewGroupModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [gradientIndex, setGradientIndex] = useState(0); // 0 = ምንም አልተመረጠም፣ ተጠቃሚው ራሱ ይምረጥ
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file!");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be under 5MB!");
      return;
    }
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
      id: `group-${Date.now()}`,
      name: trimmedName,
      lastMsgText: "Welcome to our new community group!",
      lastMsgSender: "System",
      lastMsgTime: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      unreadCount: 0,
      avatarLabel,
      bgGradient: gradients[gradientIndex - 1]?.class || "bg-gradient-1",
      membersCount: 1 + pickedMembers.length,
      onlineCount: 1,
      isJoined: true,
      type: "group",
      avatarUrl: avatarUrl || undefined,
      isCreatedByMe: true,
    };

    onCreateGroup(newChat, pickedMembers);

    setName("");
    setDescription("");
    setAvatarUrl("");
    setGradientIndex(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col animate-in fade-in duration-150">
      <header className="px-4 py-4 border-b border-gray-100 flex items-center gap-3 shrink-0">
        <button
          onClick={onClose}
          className="p-1.5 text-gray-600 hover:bg-gray-50 rounded-xl transition-all"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h3 className="text-lg font-extrabold text-gray-900 tracking-tight">
          Create New Group
        </h3>
      </header>

      <form
        onSubmit={handleSubmit}
        className="flex-1 overflow-y-auto p-6 space-y-4 max-w-lg mx-auto w-full"
      >
        <div>
          <label className="block text-xs font-black text-gray-600 uppercase tracking-widest mb-1.5">
            Group Profile Photo
          </label>
          <div className="flex items-center gap-4 bg-gray-50 border border-gray-100 p-3.5 rounded-xl">
            <div className="relative w-14 h-14 rounded-xl bg-gray-200 overflow-hidden shrink-0 flex items-center justify-center border border-gray-100">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Group"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className={`w-full h-full flex items-center justify-center text-white font-black text-sm ${gradientIndex > 0 ? gradients[gradientIndex - 1].class : "bg-gray-300"}`}
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
                className="absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity text-white"
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
            Add Members (optional)
          </label>
          <button
            type="button"
            onClick={onOpenMemberPicker}
            className="w-full flex items-center justify-between gap-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-all"
          >
            <span className="flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-blue-500" />
              {pickedMembers.length > 0
                ? `${pickedMembers.length} member${pickedMembers.length > 1 ? "s" : ""} selected`
                : "Select from people you follow/are followed by"}
            </span>
            <span className="text-blue-600 text-xs font-bold">Choose</span>
          </button>
          <p className="text-[10px] text-gray-400 mt-1">
            You can skip this and let people join the group later instead.
          </p>
        </div>

        <div>
          <label
            htmlFor="groupName"
            className="block text-xs font-black text-gray-600 uppercase tracking-widest mb-1.5"
          >
            Group Name *
          </label>
          <input
            id="groupName"
            type="text"
            required
            maxLength={MAX_NAME_LENGTH}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="group name"
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 placeholder-gray-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all duration-200"
          />
        </div>

        <div>
          <label
            htmlFor="groupDesc"
            className="block text-xs font-black text-gray-600 uppercase tracking-widest mb-1.5"
          >
            Description
          </label>
          <textarea
            id="groupDesc"
            rows={2}
            maxLength={MAX_DESCRIPTION_LENGTH}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe what this group is about..."
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
      </form>

      <div className="p-4 border-t border-gray-100 shrink-0">
        <button
          onClick={handleSubmit}
          disabled={!name.trim()}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 text-white text-sm font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md shadow-blue-200"
        >
          <Plus className="w-4 h-4" />
          <span>Create Group</span>
        </button>
      </div>
    </div>
  );
}
