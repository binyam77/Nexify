/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef } from "react";
import { X, Users, UserPlus, Image as ImageIcon, Camera, Pencil, LogOut, Trash2, Check } from "lucide-react";
import type { Chat, GroupMember, SelectableUser, Message } from "../types";
import MembersListModal from "./MembersListModal";
import MemberPickerModal from "./MemberPickerModal";
import MediaGalleryModal from "./MediaGalleryModal";

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
    updates: { name?: string; avatarUrl?: string; description?: string; cover?: string },
  ) => void;
  onClose: () => void;
}

// Title: GroupInfoModal — Group detail view (Cover → Avatar → Name → Bio → Members → Settings)
export default function GroupInfoModal({
  chat,
  members,
  messages,
  availableUsersForInvite,
  onInviteMembers,
  onViewMedia,
  onLeaveGroup,
  onDeleteGroup,
  onUpdateGroupInfo,
  onClose,
}: GroupInfoModalProps) {
  const [isMembersOpen, setIsMembersOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isMediaOpen, setIsMediaOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [editName, setEditName] = useState(chat.name);
  const [editBio, setEditBio] = useState(chat.description || "");
  const [confirmAction, setConfirmAction] = useState<"leave" | "delete" | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

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

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !validateImage(file)) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      onUpdateGroupInfo(chat.id, { cover: reader.result as string });
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

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[120] flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200 max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cover */}
        <div className="relative h-36 bg-gray-200 shrink-0 group">
          {chat.cover ? (
            <img src={chat.cover} alt="Group cover" className="w-full h-full object-cover" />
          ) : (
            <div className={`w-full h-full ${chat.bgGradient} flex items-center justify-center`}>
              <Users className="w-8 h-8 text-white/70" />
            </div>
          )}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 bg-black/40 hover:bg-black/60 text-white rounded-full transition-all"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

       {chat.isCreatedByMe && (
            <button
              onClick={() => coverInputRef.current?.click()}
              className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
              title="Change cover"
            >
              <span className="flex items-center gap-1.5 text-white text-xs font-bold bg-black/40 px-3 py-1.5 rounded-full">
                <Camera className="w-3.5 h-3.5" />
                Change Cover
              </span>
            </button>
          )}
          <input
            type="file"
            ref={coverInputRef}
            onChange={handleCoverChange}
            accept="image/*"
            className="hidden"
          />

          <div className="absolute -bottom-8 left-5 w-16 h-16 rounded-2xl border-4 border-white shadow-md overflow-hidden bg-gray-100 group/avatar">
            {chat.avatarUrl ? (
              <img src={chat.avatarUrl} alt={chat.name} className="w-full h-full object-cover" />
            ) : (
              <div className={`w-full h-full ${chat.bgGradient} flex items-center justify-center text-white font-black`}>
                {chat.avatarLabel}
              </div>
            )}
            {chat.isCreatedByMe && (
              <button
                onClick={() => photoInputRef.current?.click()}
                className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${
                  chat.avatarUrl ? "opacity-0 group-hover/avatar:opacity-100" : "opacity-100"
                }`}
                title="Change group photo"
              >
                <Camera className="w-4 h-4 text-white" />
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
        </div>

        <div className="pt-11 px-5 pb-5 overflow-y-auto">
          {isEditingName ? (
            <div className="flex items-center gap-2">
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                maxLength={60}
                autoFocus
                className="flex-1 text-lg font-black text-gray-900 border-b-2 border-blue-500 outline-none"
              />
              <button onClick={handleSaveName} className="p-1 text-emerald-600 hover:bg-emerald-50 rounded">
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setEditName(chat.name);
                  setIsEditingName(false);
                }}
                className="p-1 text-gray-400 hover:bg-gray-50 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-gray-900 tracking-tight">{chat.name}</h3>
              {chat.isCreatedByMe && (
                <button
                  onClick={() => setIsEditingName(true)}
                  className="p-1 text-gray-400 hover:text-blue-600"
                  aria-label="Edit group name"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
          <p className="text-xs text-gray-400 font-semibold mt-0.5">
            {chat.membersCount} members
          </p>

          {isEditingBio ? (
            <div className="mt-3">
              <textarea
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                maxLength={300}
                rows={3}
                autoFocus
                className="w-full text-sm text-gray-700 border border-blue-300 rounded-lg p-2.5 outline-none focus:border-blue-500 resize-none"
                placeholder="Add a bio for this group..."
              />
              <div className="flex justify-end gap-2 mt-1.5">
                <button
                  onClick={() => {
                    setEditBio(chat.description || "");
                    setIsEditingBio(false);
                  }}
                  className="text-xs font-bold text-gray-400 hover:text-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveBio}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800"
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-1.5 mt-3">
              <p className="text-sm text-gray-600 leading-relaxed flex-1">
                {chat.description || "No description provided."}
              </p>
              {chat.isCreatedByMe && (
                <button
                  onClick={() => setIsEditingBio(true)}
                  className="p-1 text-gray-400 hover:text-blue-600 shrink-0"
                  aria-label="Edit bio"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          <button
            onClick={() => setIsMembersOpen(true)}
            className="w-full flex items-center justify-between gap-3 bg-gray-50 hover:bg-gray-100 border border-gray-100 rounded-xl px-4 py-3 mt-5 transition-all"
          >
            <span className="flex items-center gap-2 text-sm font-bold text-gray-700">
              <Users className="w-4 h-4 text-blue-500" />
              View Members
            </span>
            <span className="text-xs text-gray-400 font-semibold">
              {members.length} →
            </span>
          </button>

          <button
            onClick={() => setIsInviteOpen(true)}
            className="w-full flex items-center justify-between gap-3 bg-gray-50 hover:bg-gray-100 border border-gray-100 rounded-xl px-4 py-3 mt-2 transition-all"
          >
            <span className="flex items-center gap-2 text-sm font-bold text-gray-700">
              <UserPlus className="w-4 h-4 text-emerald-500" />
              Invite Members
            </span>
            <span className="text-xs text-gray-400 font-semibold">→</span>
          </button>

          <button
            onClick={() => setIsMediaOpen(true)}
            className="w-full flex items-center justify-between gap-3 bg-gray-50 hover:bg-gray-100 border border-gray-100 rounded-xl px-4 py-3 mt-2 transition-all"
          >
            <span className="flex items-center gap-2 text-sm font-bold text-gray-700">
              <ImageIcon className="w-4 h-4 text-amber-500" />
              Media / Files
            </span>
            <span className="text-xs text-gray-400 font-semibold">→</span>
          </button>

          <div className="mt-5 pt-4 border-t border-gray-100 space-y-2">
            <button
              onClick={() => setConfirmAction("leave")}
              className="w-full flex items-center gap-2 text-sm font-bold text-orange-600 hover:bg-orange-50 rounded-xl px-4 py-3 transition-all"
            >
              <LogOut className="w-4 h-4" />
              Leave Group
            </button>
            {chat.isCreatedByMe && (
              <button
                onClick={() => setConfirmAction("delete")}
                className="w-full flex items-center gap-2 text-sm font-bold text-rose-600 hover:bg-rose-50 rounded-xl px-4 py-3 transition-all"
              >
                <Trash2 className="w-4 h-4" />
                Delete Group
              </button>
            )}
          </div>
        </div>
      </div>

      {isMembersOpen && (
        <MembersListModal
          isOpen={isMembersOpen}
          members={members}
          onClose={() => setIsMembersOpen(false)}
        />
      )}

      {isInviteOpen && (
        <MemberPickerModal
          isOpen={isInviteOpen}
          availableUsers={invitableUsers}
          onClose={() => setIsInviteOpen(false)}
          onConfirm={(selected) => {
            onInviteMembers(chat.id, selected);
            setIsInviteOpen(false);
          }}
        />
      )}

      {isMediaOpen && (
        <MediaGalleryModal
          isOpen={isMediaOpen}
          messages={messages}
          onClose={() => setIsMediaOpen(false)}
          onSelectMedia={(url) => {
            setIsMediaOpen(false);
            onViewMedia(url);
          }}
        />
      )}

      {confirmAction && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[145] p-4 animate-in fade-in duration-150"
          onClick={() => setConfirmAction(null)}
        >
          <div
            className="bg-white w-full max-w-xs rounded-2xl shadow-2xl p-5 text-center animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-3 text-rose-500">
              {confirmAction === "leave" ? <LogOut className="w-6 h-6" /> : <Trash2 className="w-6 h-6" />}
            </div>
            <h3 className="text-base font-black text-slate-800 mb-1">
              {confirmAction === "leave" ? "Leave this group?" : "Delete this group?"}
            </h3>
            <p className="text-xs text-slate-500 font-semibold mb-5">
              {confirmAction === "leave"
                ? "You can rejoin later if it's public."
                : "This action cannot be undone. All messages will be permanently removed for everyone."}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmAction(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-black text-slate-500 transition-all"
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
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 rounded-xl text-xs font-black text-white shadow-md transition-all"
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