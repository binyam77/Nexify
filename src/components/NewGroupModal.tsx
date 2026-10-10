/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from "react";
import { ArrowLeft, Camera, ChevronRight, UserPlus } from "lucide-react";
import type { Chat, SelectableUser } from "../types";

interface NewGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateGroup: (
    newChat: Chat,
    initialMembers: SelectableUser[],
  ) => Promise<boolean> | boolean | void;
  onOpenMemberPicker: () => void;
  pickedMembers: SelectableUser[];
  /** ← ቀስት: ወደ Add Members ለመመለስ። ካልተሰጠ onClose ይጠራል */
  onBack?: () => void;
}

const MAX_NAME_LENGTH = 60;
const MAX_DESCRIPTION_LENGTH = 300;
// ሁሉም አዲስ group በነባሪ ሰማያዊ (Ocean Blue) — የቀለም ምርጫ ተወግዷል
const DEFAULT_THEME = "bg-gradient-2";
const MAX_VISIBLE_SELECTED = 4;
// Title: NewGroupModal — Full-screen group creation flow
export default function NewGroupModal({
  isOpen,
  onClose,
  onCreateGroup,
  onOpenMemberPicker,
  pickedMembers,
  onBack,
}: NewGroupModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;
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
      bgGradient: DEFAULT_THEME,
      membersCount: 1 + pickedMembers.length,
      onlineCount: 1,
      isJoined: true,
      type: "group",
      avatarUrl: avatarUrl || undefined,
      isCreatedByMe: true,
    };

    setIsSubmitting(true);
    let ok: boolean | void = false;
    try {
      ok = await onCreateGroup(newChat, pickedMembers);
    } finally {
      setIsSubmitting(false);
    }
    // አልተሳካም (ለምሳሌ ግንኙነት የለም) → ፎርሙ ክፍት ይቆያል፣ የተጻፈው አይጠፋም
    if (ok === false) return;

    setName("");
    setDescription("");
    setAvatarUrl("");

    if (fileInputRef.current) fileInputRef.current.value = "";
    onClose();
  };

  const visibleMembers = pickedMembers.slice(0, MAX_VISIBLE_SELECTED);
  const extraCount = pickedMembers.length - visibleMembers.length;

  return (
    <div className="fixed inset-0 h-[100svh] bg-bodey-bg z-50 flex flex-col animate-in fade-in duration-150">
      <header className="relative px-4 py-4 flex items-center shrink-0">
        <button
          onClick={onBack ?? onClose}
          className="relative z-10 p-1.5 text-gray-700 hover:bg-gray-50 rounded-xl transition-all"
          aria-label="Back"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h3 className="absolute inset-x-0 text-center text-lg font-extrabold text-gray-900 tracking-tight pointer-events-none">
          New Group
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
                    alt="Group"
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
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
          </div>

          {/* Group Name */}
          <div>
            <label
              htmlFor="groupName"
              className="block text-sm font-extrabold text-gray-900 mb-2"
            >
              Group Name
            </label>
            <input
              id="groupName"
              type="text"
              required
              maxLength={MAX_NAME_LENGTH}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter group name"
              className="w-full bg-input border border-input-border rounded-2xl px-4 py-3 text-sm font-medium text-input-text placeholder-gray-400 focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all duration-200"
            />
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="groupDesc"
              className="block text-sm font-extrabold text-gray-900 mb-2"
            >
              Description
            </label>
            <textarea
              id="groupDesc"
              rows={3}
              maxLength={MAX_DESCRIPTION_LENGTH}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your group"
              className="w-full bg-input border border-input-border rounded-2xl px-4 py-3 text-sm font-medium text-input-text placeholder-gray-400 focus:border-brand focus:ring-1 focus:ring-brand outline-none transition-all duration-200 resize-none"
            />
          </div>

          {/* Add Members (→ Add Members ስክሪን) */}
          <button
            type="button"
            onClick={onOpenMemberPicker}
            className="w-full flex items-center justify-between gap-3 bg-blue-50 hover:bg-blue-100 rounded-2xl px-4 py-3.5 text-sm font-bold text-brand transition-colors"
          >
            <span className="flex items-center gap-3">
              <UserPlus className="w-5 h-5" />
              Add Members
            </span>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>

          {/* Selected Members */}
          {pickedMembers.length > 0 && (
            <div>
              <h4 className="text-sm font-extrabold text-gray-900 mb-3">
                Selected Members
              </h4>
              <div className="flex items-start gap-4">
                {visibleMembers.map((u) => (
                  <div
                    key={u.id}
                    className="flex flex-col items-center gap-1 w-14"
                  >
                    <div className="w-12 h-12 rounded-full bg-blue-100 overflow-hidden flex items-center justify-center text-blue-600 font-bold">
                      {u.photo ? (
                        <img
                          src={u.photo}
                          alt={u.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        u.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <span className="text-xs text-gray-600 truncate max-w-full">
                      {u.name}
                    </span>
                  </div>
                ))}
                {extraCount > 0 && (
                  <div className="flex flex-col items-center gap-1 w-14">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-500">
                      +{extraCount}
                    </div>
                    <span className="text-xs text-gray-600">More</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </form>

      <div className="p-4 pb-[max(1.5rem,calc(env(safe-area-inset-bottom)+1rem))] shrink-0">
        <div className="max-w-lg mx-auto">
          <button
            onClick={handleSubmit}
            disabled={!name.trim() || isSubmitting}
            className="w-full py-3.5 bg-brand hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-brand text-white text-sm font-extrabold rounded-2xl transition-all shadow-md"
          >
            Create Group
          </button>
        </div>
      </div>
    </div>
  );
}
