/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from "react";
import { Search, Plus, Globe, Trash2 } from "lucide-react";
import type { Chat } from "../types";

interface ChatsSidebarProps {
  chats: Chat[];
  activeChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onCreatePlusClick: () => void;
  onDeleteChat: (chatId: string) => void;
  onJoinChat: (chatId: string) => void;
  onToggleJoin: (chatId: string) => void;
  isLoadingSuggested?: boolean;
  suggestedError?: string | null;
  onRetrySuggested?: () => void;
  suggestedSearchQuery?: string;
  onSuggestedSearchChange?: (query: string) => void;
}

// Title: ChatsSidebar Component (Messages inbox + Communities discovery)
export default function ChatsSidebar({
  chats,
  activeChatId,
  onSelectChat,
  onCreatePlusClick,
  onDeleteChat,
  onToggleJoin,
  isLoadingSuggested = false,
  suggestedError = null,
  onRetrySuggested,
  suggestedSearchQuery = "",
  onSuggestedSearchChange,
}: ChatsSidebarProps) {
  // አንድ ነጠላ search — ዋጋው በ parent ይያዛል (debounced public search ያንቀሳቅሳል)
  const searchQuery = suggestedSearchQuery;
  const trimmedQuery = searchQuery.trim();
  const isSearching = trimmedQuery.length > 0;

  // Long-press to reveal delete confirmation (Messages tab ብቻ ላይ ተግባራዊ)
  const [confirmDeleteChat, setConfirmDeleteChat] = useState<Chat | null>(null);
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressFiredRef = useRef(false);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const MOVE_CANCEL_THRESHOLD = 10;

  const startPressTimer = (chat: Chat) => {
    if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
    longPressFiredRef.current = false;
    pressTimerRef.current = setTimeout(() => {
      longPressFiredRef.current = true;
      setConfirmDeleteChat(chat);
    }, 450);
  };
  const cancelPressTimer = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
    touchStartPosRef.current = null;
  };
  const handleTouchStart = (chat: Chat, e: React.TouchEvent) => {
    touchStartPosRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
    startPressTimer(chat);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartPosRef.current) return;
    const dx = Math.abs(e.touches[0].clientX - touchStartPosRef.current.x);
    const dy = Math.abs(e.touches[0].clientY - touchStartPosRef.current.y);
    if (dx > MOVE_CANCEL_THRESHOLD || dy > MOVE_CANCEL_THRESHOLD) {
      cancelPressTimer();
    }
  };
  const handleChatTap = (chat: Chat) => {
    if (longPressFiredRef.current) {
      longPressFiredRef.current = false;
      return;
    }
    onSelectChat(chat.id);
  };

  // የራስህ chats — local, private filter (ስም ወይም የመጨረሻ መልዕክት)
  const q = trimmedQuery.toLowerCase();
  const joinedChats = chats.filter(
    (chat) =>
      chat.isJoined &&
      (!q ||
        chat.name.toLowerCase().includes(q) ||
        chat.lastMsgText.toLowerCase().includes(q)),
  );

  // Public search ውጤቶች — backend የመለሳቸው፣ ገና ያልተቀላቀልካቸው community ብቻ
  const publicResults = chats.filter(
    (c) =>
      (c.type === "channel" || c.type === "group") &&
      !c.isJoined &&
      !c.isCreatedByMe,
  );
  return (
    <section
      className="w-full md:w-[350px] border-r border-gray-100 bg-bodey-bg flex flex-col h-full shrink-0"
      aria-label="Chats List"
    >
      {/* ራስጌ - የአርዕስት ክፍል */}
      <header className="p-5 bg-surface border-b border-gray-50 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2.5">
            <h1
              className="text-xl font-black tracking-tight text-text-h1"
              id="brand-header-title"
            >
              Communities
            </h1>
          </div>
        </div>
        <button
          type="button"
          onClick={onCreatePlusClick}
          className="p-2 text-brand hover:bg-hover-input rounded-xl transition-all shrink-0"
          aria-label="Create new channel or group"
          title="Create"
        >
          <Plus className="w-6 h-6" />
        </button>
      </header>

      {/* የፍለጋ ሳጥን (Search Bar) — Chats tab: local/private filter, Communities tab: public backend search */}
      <div className="px-4 py-3 bg-input shadow-input shrink-0">
        <div className="relative">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => onSuggestedSearchChange?.(e.target.value)}
            placeholder="Search communities..."
            className="w-full pl-10 pr-4 py-2.5 bg-surface-raised border border-input-border rounded-xl text-sm text-input-text placeholder:placeholder-input-text focus:bg-input
             focus:border-input-focus  outline-none transition-all "
          />
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
        </div>
      </div>
      {/* ===== ነጠላ ዝርዝር: My chats + (ሲፈለግ) Public results ===== */}
      <div className="flex-1 overflow-y-auto">
        {!isSearching && joinedChats.length === 0 && (
          <div className="flex flex-col items-center justify-center p-8 text-center h-full">
            <Globe className="w-10 h-10 text-gray-300 mb-3" />
            <p className="text-sm font-semibold text-gray-600">No chats yet</p>
            <p className="text-xs text-gray-400 mt-1 max-w-[220px]">
              Search above to find public channels & groups, or tap + to create
              one.
            </p>
          </div>
        )}

        {isSearching && joinedChats.length > 0 && (
          <h3 className="px-4.5 pt-4 pb-2 text-xs font-black text-gray-400 uppercase tracking-widest">
            My chats
          </h3>
        )}

        <div className="divide-y divide-gray-50">
          {joinedChats.map((chat) => {
            const isActive = activeChatId === chat.id;
            return (
              <article
                key={chat.id}
                onMouseDown={() => startPressTimer(chat)}
                onTouchStart={(e) => handleTouchStart(chat, e)}
                onTouchMove={handleTouchMove}
                onMouseUp={cancelPressTimer}
                onTouchEnd={cancelPressTimer}
                onMouseLeave={cancelPressTimer}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setConfirmDeleteChat(chat);
                }}
                onClick={() => handleChatTap(chat)}
                title="Hold for options"
                className={`flex items-center gap-3.5 px-4.5 py-4 cursor-pointer select-none transition-all duration-200 relative ${
                  isActive
                    ? "bg-blue-50/70 border-l-3 border-brand"
                    : "bg-input hover:bg-gray-50/60 "
                }`}
              >
                <div className="relative shrink-0 bg-brand rounded-full ">
                  {chat.avatarUrl ? (
                    <img
                      src={chat.avatarUrl}
                      alt={chat.name}
                      className="w-12 h-12 rounded-full object-cover shrink-0 shadow-sm border border-input"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-base
                         text-white shrink-0 shadow-sm ${chat.bgGradient}`}
                    >
                      {chat.avatarLabel}
                    </div>
                  )}
                  {chat.type === "chat" && chat.isOnline && (
                    <span
                      className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"
                      aria-label="Online"
                    />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold text-sm text-gray-900 truncate">
                      {chat.name}
                    </h3>
                    <time className="text-[11px] text-gray-400 font-medium">
                      {chat.lastMsgTime}
                    </time>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs text-gray-500 truncate font-medium">
                      <span className="text-gray-700 font-semibold">
                        {chat.lastMsgSender}:{" "}
                      </span>
                      {chat.lastMsgText}
                    </p>

                    {chat.unreadCount > 0 ? (
                      <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full select-none shrink-0 min-w-[18px] text-center">
                        {chat.unreadCount}
                      </span>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* ===== PUBLIC RESULTS (ሲፈለግ ብቻ) ===== */}
        {isSearching && (
          <div className="py-2">
            <h3 className="px-4.5 pt-3 pb-2 text-xs font-black text-gray-400 uppercase tracking-widest">
              Public results
            </h3>

            {suggestedError ? (
              <div className="flex flex-col items-center gap-3 px-4.5 py-6 text-center">
                <p className="text-xs font-bold text-gray-600">
                  {suggestedError}
                </p>
                <button
                  onClick={onRetrySuggested}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all"
                >
                  Retry
                </button>
              </div>
            ) : isLoadingSuggested ? (
              <div className="flex items-center justify-center gap-2 py-6">
                <div className="w-5 h-5 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                <p className="text-xs text-gray-400 font-semibold">
                  Searching...
                </p>
              </div>
            ) : publicResults.length === 0 ? (
              <p className="px-4.5 py-6 text-xs text-gray-400 font-medium text-center">
                {joinedChats.length === 0
                  ? "No results found."
                  : "No public communities found."}
              </p>
            ) : (
              publicResults.map((chat) => (
                <div
                  key={chat.id}
                  className="flex items-center gap-3.5 px-4.5 py-3.5"
                >
                  {chat.avatarUrl ? (
                    <img
                      src={chat.avatarUrl}
                      alt={chat.name}
                      className="w-12 h-12 rounded-full object-cover shadow-sm shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-base text-white shadow-sm shrink-0 ${chat.bgGradient}`}
                    >
                      {chat.avatarLabel}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm text-gray-900 truncate">
                      {chat.name}
                    </h3>
                    <p className="text-xs text-gray-400 truncate">
                      {chat.membersCount}{" "}
                      {chat.type === "channel" ? "subscribers" : "members"}
                    </p>
                  </div>
                  <button
                    onClick={() => onToggleJoin(chat.id)}
                    className="px-3.5 py-1.5 text-xs font-bold rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-colors shrink-0"
                  >
                    {chat.type === "channel" ? "Subscribe" : "Join"}
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal (hold-to-delete) */}
      {confirmDeleteChat && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4 animate-in fade-in duration-200"
          onClick={() => setConfirmDeleteChat(null)}
        >
          <div
            className="bg-white w-full max-w-xs rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-200 p-5 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-3 text-rose-500">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-slate-800 mb-1">
              Delete "{confirmDeleteChat.name}" ?
            </h3>
            <p className="text-xs text-slate-500 font-semibold mb-5">
              This action cannot be undone. All messages will be permanently
              removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDeleteChat(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-black text-slate-500 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteChat(confirmDeleteChat.id);
                  setConfirmDeleteChat(null);
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 rounded-xl text-xs font-black text-white shadow-md transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
