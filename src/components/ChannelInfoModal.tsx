/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo, useState, useRef } from "react";
import {
  ArrowLeft,
  X,
  Image as ImageIcon,
  Link2,
  Camera,
  Pencil,
  LogOut,
  Trash2,
  Check,
  Play,
} from "lucide-react";
import type { Chat, Message } from "../types";

// http(s) links ብቻ — javascript: ወዘተ አይታዩም
const URL_REGEX = /https?:\/\/[^\s<>"']+/gi;
const stripTrailingPunctuation = (u: string) => u.replace(/[.,;:!?)\]}]+$/, "");

interface ChannelInfoModalProps {
  chat: Chat;
  messages: Message[];
  onViewMedia: (url: string) => void;
  onUnsubscribe: (chatId: string) => void;
  onDeleteChannel: (chatId: string) => void;
  onUpdateChannelInfo: (
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

// Title: ChannelInfoModal — Channel detail view (Cover → Name → Bio → Media/Analytics → Settings)
export default function ChannelInfoModal({
  chat,
  messages,
  onViewMedia,
  onUnsubscribe,
  onDeleteChannel,
  onUpdateChannelInfo,
  onClose,
}: ChannelInfoModalProps) {
  const [activeTab, setActiveTab] = useState<"media" | "links">("media");
  const [viewer, setViewer] = useState<{
    url: string;
    type: "image" | "video";
  } | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [editName, setEditName] = useState(chat.name);
  const [editBio, setEditBio] = useState(chat.description || "");
  const [confirmAction, setConfirmAction] = useState<
    "unsubscribe" | "delete" | null
  >(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  // በ chat ውስጥ ከተጫኑት መልዕክቶች — አዲሱ መጀመሪያ
  const mediaItems = useMemo(
    () =>
      messages
        .filter(
          (m) =>
            !!m.mediaUrl && m.mediaType !== "audio" && m.mediaType !== "pdf",
        )
        .reverse(),
    [messages],
  );

  const linkItems = useMemo(() => {
    const items: { id: string; url: string; text: string }[] = [];
    for (const m of [...messages].reverse()) {
      const found = m.text?.match(URL_REGEX) ?? [];
      for (const raw of found) {
        items.push({
          id: `${m.id}-${items.length}`,
          url: stripTrailingPunctuation(raw),
          text: m.text,
        });
      }
    }
    return items;
  }, [messages]);

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
      onUpdateChannelInfo(chat.id, { avatarUrl: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleSaveName = () => {
    const trimmed = editName.trim();
    if (!trimmed) return;
    onUpdateChannelInfo(chat.id, { name: trimmed });
    setIsEditingName(false);
  };

  const handleSaveBio = () => {
    onUpdateChannelInfo(chat.id, { description: editBio.trim() });
    setIsEditingBio(false);
  };

  const isOwner = !!chat.isCreatedByMe;

  return (
    <div className="fixed inset-0 z-[120] bg-white flex flex-col animate-in fade-in duration-150">
      {/* ከላይ: ← ቀስት + Leave Channel (subscriber) / Delete Channel (owner) */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0">
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white shadow-md border border-gray-100 flex items-center justify-center text-gray-900 hover:bg-gray-50 transition-colors"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {isOwner ? (
          <button
            onClick={() => setConfirmAction("delete")}
            className="flex items-center gap-1.5 text-sm font-bold text-rose-600 hover:bg-rose-50 rounded-full px-4 py-2 transition-all"
          >
            <Trash2 className="w-4 h-4" />
            Delete Channel
          </button>
        ) : (
          <button
            onClick={() => setConfirmAction("unsubscribe")}
            className="flex items-center gap-1.5 text-sm font-bold text-orange-600 hover:bg-orange-50 rounded-full px-4 py-2 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Leave Channel
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="px-5 pb-6 flex flex-col items-center text-center">
          {/* Avatar + ካሜራ (owner ብቻ) */}
          <div className="relative mt-2">
            <div className="w-28 h-28 rounded-full overflow-hidden bg-gray-100 shadow-sm">
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
                className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-white shadow-md border border-gray-100 flex items-center justify-center text-brand hover:bg-gray-50 transition-colors"
                aria-label="Change channel photo"
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
                className="flex-1 min-w-0 text-xl font-black text-gray-900 text-center border-b-2 border-blue-500 outline-none"
              />
              <button
                onClick={handleSaveName}
                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-full"
                aria-label="Save name"
              >
                <Check className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  setEditName(chat.name);
                  setIsEditingName(false);
                }}
                className="p-1.5 text-gray-400 hover:bg-gray-50 rounded-full"
                aria-label="Cancel"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 mt-4 max-w-full">
              <h3 className="text-2xl font-black text-gray-900 tracking-tight truncate">
                {chat.name}
              </h3>
              {isOwner && (
                <button
                  onClick={() => setIsEditingName(true)}
                  className="p-1.5 text-gray-400 hover:text-blue-600 shrink-0"
                  aria-label="Edit channel name"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          <p className="text-sm text-gray-500 mt-1">
            {chat.membersCount} subscribers
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
                className="w-full text-sm text-gray-700 border border-blue-300 rounded-xl p-2.5 outline-none focus:border-blue-500 resize-none"
                placeholder="Add a bio for this channel..."
              />
              <div className="flex justify-end gap-1 mt-1">
                <button
                  onClick={() => {
                    setEditBio(chat.description || "");
                    setIsEditingBio(false);
                  }}
                  className="p-1.5 text-gray-400 hover:bg-gray-50 rounded-full"
                  aria-label="Cancel"
                >
                  <X className="w-5 h-5" />
                </button>
                <button
                  onClick={handleSaveBio}
                  className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-full"
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
                    chat.description ? "text-gray-800" : "text-gray-400"
                  }`}
                >
                  {chat.description || "Add a description"}
                </p>
                {isOwner && (
                  <button
                    onClick={() => setIsEditingBio(true)}
                    className="p-1 text-gray-400 hover:text-blue-600 shrink-0"
                    aria-label="Edit bio"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )
          )}
        </div>

        {/* Media / Links */}
        <div className="px-4 pb-8">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex border-b border-gray-100">
              <button
                onClick={() => setActiveTab("media")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold border-b-2 transition-colors ${
                  activeTab === "media"
                    ? "text-brand border-brand"
                    : "text-gray-400 border-transparent hover:text-gray-600"
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                Media
              </button>
              <button
                onClick={() => setActiveTab("links")}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-bold border-b-2 transition-colors ${
                  activeTab === "links"
                    ? "text-brand border-brand"
                    : "text-gray-400 border-transparent hover:text-gray-600"
                }`}
              >
                <Link2 className="w-4 h-4" />
                Links
              </button>
            </div>

            {activeTab === "media" ? (
              mediaItems.length === 0 ? (
                <p className="py-10 text-center text-sm text-gray-400 font-medium">
                  No media yet
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-1 p-1">
                  {mediaItems.map((m) => {
                    const isVideo = m.mediaType === "video";
                    return (
                      <button
                        key={m.id}
                        onClick={() =>
                          setViewer({
                            url: m.mediaUrl as string,
                            type: isVideo ? "video" : "image",
                          })
                        }
                        className="relative aspect-square overflow-hidden rounded-lg bg-gray-100"
                      >
                        {isVideo ? (
                          <>
                            <video
                              src={m.mediaUrl}
                              muted
                              preload="metadata"
                              className="w-full h-full object-cover"
                            />
                            <span className="absolute bottom-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center text-white">
                              <Play className="w-3 h-3" fill="white" />
                            </span>
                          </>
                        ) : (
                          <img
                            src={m.mediaUrl}
                            alt="Shared media"
                            loading="lazy"
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              )
            ) : linkItems.length === 0 ? (
              <p className="py-10 text-center text-sm text-gray-400 font-medium">
                No links yet
              </p>
            ) : (
              <div className="divide-y divide-gray-50">
                {linkItems.map((l) => (
                  <a
                    key={l.id}
                    href={l.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <p className="text-sm font-semibold text-blue-600 truncate">
                      {l.url}
                    </p>
                    <p className="text-xs text-gray-400 truncate mt-0.5">
                      {l.text}
                    </p>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ሙሉ ገጽ ፎቶ/ቪዲዮ ማሳያ */}
      {viewer && (
        <div
          className="fixed inset-0 z-[130] bg-black/90 flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setViewer(null)}
        >
          <button
            onClick={() => setViewer(null)}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all"
            aria-label="Close viewer"
          >
            <X className="w-6 h-6" />
          </button>
          {viewer.type === "video" ? (
            <video
              src={viewer.url}
              controls
              autoPlay
              playsInline
              className="max-h-[90vh] max-w-full rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <img
              src={viewer.url}
              alt="Full size media"
              className="max-h-[90vh] max-w-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          )}
        </div>
      )}

      {/* Leave / Delete ማረጋገጫ */}
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
              {confirmAction === "unsubscribe" ? (
                <LogOut className="w-6 h-6" />
              ) : (
                <Trash2 className="w-6 h-6" />
              )}
            </div>
            <h3 className="text-base font-black text-slate-800 mb-1">
              {confirmAction === "unsubscribe"
                ? "Leave this channel?"
                : "Delete this channel?"}
            </h3>
            <p className="text-xs text-slate-500 font-semibold mb-5">
              {confirmAction === "unsubscribe"
                ? "You can rejoin anytime."
                : "This action cannot be undone. All posts will be permanently removed for everyone."}
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
                  if (confirmAction === "unsubscribe") onUnsubscribe(chat.id);
                  else onDeleteChannel(chat.id);
                  setConfirmAction(null);
                  onClose();
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 rounded-xl text-xs font-black text-white shadow-md transition-all"
              >
                {confirmAction === "unsubscribe" ? "Leave" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
