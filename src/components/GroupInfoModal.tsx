/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef } from "react";
import {
  ArrowLeft,
  X,
  UserPlus,
  Camera,
  Pencil,
  LogOut,
  Trash2,
  Check,
} from "lucide-react";
import type { Chat, GroupMember, SelectableUser, Message } from "../types";
import MemberPickerModal from "./MemberPickerModal";

interface GroupInfoModalProps {
  chat: Chat;
  members: GroupMember[];
  messages: Message[];
  availableUsersForInvite: SelectableUser[];
  onInviteMembers: (chatId: string, invitedUsers: SelectableUser[]) => void;
  onViewMedia: (url: string) => void;
  onLeaveGroup: (chatId: string) => void;
  onDeleteGroup: (chatId: string) => void;
  onUpdateGroupInfo: (
    chatId: string,
    updates: {
      name?: string;
      avatarUrl?: string;
      description?: string;
      cover?: string;
    },
  ) => void;
  onClose: () => void;
}

// Title: GroupInfoModal — Group detail view (Cover → Avatar → Name → Bio → Members → Settings)
export default function GroupInfoModal({
  chat,
  members,
  availableUsersForInvite,
  onInviteMembers,
  onLeaveGroup,
  onDeleteGroup,
  onUpdateGroupInfo,
  onClose,
}: GroupInfoModalProps) {
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [editName, setEditName] = useState(chat.name);
  const [editBio, setEditBio] = useState(chat.description || "");
  const [confirmAction, setConfirmAction] = useState<"leave" | "delete" | null>(
    null,
  );
  const photoInputRef = useRef<HTMLInputElement>(null);

  const existingUsernames = new Set(members.map((m) => m.username));
  const invitableUsers = availableUsersForInvite.filter(
    (u) => !existingUsernames.has(u.username),
  );

  const validateImage = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file!");
      return false;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be under 5MB!");
      return false;
    }
    return true;
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !validateImage(file)) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      onUpdateGroupInfo(chat.id, { avatarUrl: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleSaveName = () => {
    const trimmed = editName.trim();
    if (!trimmed) return;
    onUpdateGroupInfo(chat.id, { name: trimmed });
    setIsEditingName(false);
  };

  const handleSaveBio = () => {
    onUpdateGroupInfo(chat.id, { description: editBio.trim() });
    setIsEditingBio(false);
  };

  const isOwner = !!chat.isCreatedByMe;

  return (
    <div className="fixed inset-0 z-[120] bg-bg flex flex-col animate-in fade-in duration-150">
      <div className="px-4 pt-4 pb-2 shrink-0">
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-surface shadow-md border border-border flex items-center justify-center text-icon-primary hover:bg-surface-hover transition-colors"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-5 pb-6 flex flex-col items-center text-center">
          {/* Avatar + ካሜራ (owner ብቻ) */}
          <div className="relative mt-2">
            <div className="w-28 h-28 rounded-full overflow-hidden bg-surface-secondary shadow-sm">
              {chat.avatarUrl ? (
                <img
                  src={chat.avatarUrl}
                  alt={chat.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div
                  className={`w-full h-full ${chat.bgGradient} flex items-center justify-center text-white font-black text-3xl`}
                >
                  {chat.avatarLabel}
                </div>
              )}
            </div>
            {isOwner && (
              <button
                onClick={() => photoInputRef.current?.click()}
                className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-surface shadow-md border border-border flex items-center justify-center text-primary hover:bg-surface-hover transition-colors"
                aria-label="Change group photo"
              >
                <Camera className="w-4 h-4" />
              </button>
            )}
            <input
              type="file"
              ref={photoInputRef}
              onChange={handlePhotoChange}
              accept="image/*"
              className="hidden"
            />
          </div>

          {/* ስም (+ እርሳስ → ✓) */}
          {isEditingName ? (
            <div className="flex items-center gap-2 mt-4 w-full max-w-xs">
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                maxLength={60}
                autoFocus
                className="flex-1 min-w-0 text-xl font-black text-input-text bg-transparent text-center border-b-2 border-primary outline-none"
              />
              <button
                onClick={handleSaveName}
                className="p-1.5 text-success hover:bg-success-light rounded-full"
                aria-label="Save name"
              >
                <Check className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  setEditName(chat.name);
                  setIsEditingName(false);
                }}
                className="p-1.5 text-icon-muted hover:bg-surface-hover rounded-full"
                aria-label="Cancel"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 mt-4 max-w-full">
              <h3 className="text-2xl font-black text-text-primary tracking-tight truncate">
                {chat.name}
              </h3>
              {isOwner && (
                <button
                  onClick={() => setIsEditingName(true)}
                  className="p-1.5 text-icon-muted hover:text-link shrink-0"
                  aria-label="Edit group name"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          <p className="text-sm text-text-secondary mt-1">
            {chat.membersCount} members
          </p>

          {/* Description (+ እርሳስ → ✓) */}
          {isEditingBio ? (
            <div className="mt-3 w-full max-w-sm">
              <textarea
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                maxLength={300}
                rows={3}
                autoFocus
                className="w-full text-sm text-input-text bg-input-bg border border-input-border rounded-xl p-2.5 outline-none focus:border-input-focus placeholder-input-placeholder resize-none"
                placeholder="Add a bio for this group..."
              />
              <div className="flex justify-end gap-1 mt-1">
                <button
                  onClick={() => {
                    setEditBio(chat.description || "");
                    setIsEditingBio(false);
                  }}
                  className="p-1.5 text-icon-muted hover:bg-surface-hover rounded-full"
                  aria-label="Cancel"
                >
                  <X className="w-5 h-5" />
                </button>
                <button
                  onClick={handleSaveBio}
                  className="p-1.5 text-success hover:bg-success-light rounded-full"
                  aria-label="Save bio"
                >
                  <Check className="w-5 h-5" />
                </button>
              </div>
            </div>
          ) : (
            (chat.description || isOwner) && (
              <div className="flex items-start justify-center gap-1.5 mt-3 max-w-sm">
                <p
                  className={`text-sm leading-relaxed whitespace-pre-wrap break-words ${
                    chat.description ? "text-text-primary" : "text-text-muted"
                  }`}
                >
                  {chat.description || "Add a description"}
                </p>
                {isOwner && (
                  <button
                    onClick={() => setIsEditingBio(true)}
                    className="p-1 text-icon-muted hover:text-link shrink-0"
                    aria-label="Edit bio"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )
          )}
        </div>

        {/* Add Members + Leave/Delete Group */}
        <div
          className={`px-4 pb-8 grid gap-3 max-w-lg mx-auto ${
            isOwner ? "grid-cols-2" : "grid-cols-1"
          }`}
        >
          {isOwner && (
            <button
              onClick={() => setIsInviteOpen(true)}
              className="flex items-center justify-center gap-2 bg-surface hover:bg-surface-hover border border-border shadow-sm rounded-2xl py-4 text-sm font-bold text-link transition-colors"
            >
              <UserPlus className="w-5 h-5" />
              Add Members
            </button>
          )}
          <button
            onClick={() => setConfirmAction(isOwner ? "delete" : "leave")}
            className={`flex items-center justify-center gap-2 bg-surface border border-border shadow-sm rounded-2xl py-4 text-sm font-bold transition-colors ${
              isOwner
                ? "text-error hover:bg-error-light"
                : "text-error hover:bg-error-light"
            }`}
          >
            {isOwner ? (
              <Trash2 className="w-5 h-5" />
            ) : (
              <LogOut className="w-5 h-5" />
            )}
            {isOwner ? "Delete Group" : "Leave Group"}
          </button>
        </div>
      </div>

      {/* Add Members — ልክ እንደ Create Group ደረጃ 1 ተመሳሳይ ስክሪን */}
      {isInviteOpen && (
        <MemberPickerModal
          isOpen={isInviteOpen}
          availableUsers={invitableUsers}
          confirmLabel="Add"
          onClose={() => setIsInviteOpen(false)}
          onConfirm={(selected) => {
            onInviteMembers(chat.id, selected);
            setIsInviteOpen(false);
          }}
        />
      )}

      {confirmAction && (
        <div
          className="fixed inset-0 bg-overlay backdrop-blur-sm flex items-center justify-center z-[145] p-4 animate-in fade-in duration-150"
          onClick={() => setConfirmAction(null)}
        >
          <div
            className="bg-surface w-full max-w-xs rounded-2xl shadow-2xl p-5 text-center animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-error-light flex items-center justify-center mx-auto mb-3 text-error">
              {confirmAction === "leave" ? (
                <LogOut className="w-6 h-6" />
              ) : (
                <Trash2 className="w-6 h-6" />
              )}
            </div>
            <h3 className="text-base font-black text-text-primary mb-1">
              {confirmAction === "leave"
                ? "Leave this group?"
                : "Delete this group?"}
            </h3>
            <p className="text-xs text-text-secondary font-semibold mb-5">
              {confirmAction === "leave"
                ? "You can rejoin later if it's public."
                : "This action cannot be undone. All messages will be permanently removed for everyone."}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmAction(null)}
                className="flex-1 py-2.5 bg-surface-secondary hover:bg-surface-hover rounded-xl text-xs font-black text-text-secondary transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (confirmAction === "leave") onLeaveGroup(chat.id);
                  else onDeleteGroup(chat.id);
                  setConfirmAction(null);
                  onClose();
                }}
                className="flex-1 py-2.5 bg-error hover:bg-error/90 rounded-xl text-xs font-black text-white shadow-md transition-all"
              >
                {confirmAction === "leave" ? "Leave" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
