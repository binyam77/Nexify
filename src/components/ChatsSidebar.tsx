/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from "react";
import { Search, Plus, Globe, Trash2, Users, Radio } from "lucide-react";
import type { Chat } from "../types";

interface ChatsSidebarProps {
  chats: Chat[];
  activeChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onCreatePlusClick: () => void;
  onDeleteChat: (chatId: string) => void;
  onJoinChat: (chatId: string) => void;
}

type SidebarTab = "messages" | "communities";

// Title: ChatsSidebar Component (Messages inbox + Communities discovery)
export default function ChatsSidebar({
  chats,
  activeChatId,
  onSelectChat,
  onCreatePlusClick,
  onDeleteChat,
  onJoinChat,
}: ChatsSidebarProps) {
  const [activeTab, setActiveTab] = useState<SidebarTab>("messages");
  const [searchQuery, setSearchQuery] = useState("");

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

  // መልዕክቶችን በስም ለመፈለግ
  const searchFiltered = chats.filter((chat) => {
    return (
      chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.lastMsgText.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Messages tab: ተቀላቅሏቸው ያሉት ብቻ
  const joinedChats = searchFiltered.filter((c) => c.isJoined);

  // Communities tab: ያልተቀላቀላቸው ብቻ (Suggested)
  const suggestedGroups = searchFiltered.filter(
    (c) => c.type === "group" && !c.isJoined,
  );
  const suggestedChannels = searchFiltered.filter(
    (c) => c.type === "channel" && !c.isJoined,
  );

  return (
    <section
      className="w-full md:w-[350px] border-r border-gray-100 bg-gray-50 flex flex-col h-full shrink-0"
      aria-label="Chats List"
    >
      {/* ራስጌ - የአርዕስት ክፍል */}
      <header className="p-5 bg-white border-b border-gray-50 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="Nexify"
              className="w-8 h-8 object-contain shrink-0"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
            <h1
              className="text-xl font-black tracking-tight text-gray-900"
              id="brand-header-title"
            >
              Nexify
            </h1>
          </div>
        </div>
        <button
          type="button"
          onClick={onCreatePlusClick}
          className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all shrink-0"
          aria-label="Create new channel or group"
          title="Create"
        >
          <Plus className="w-6 h-6" />
        </button>
      </header>

      {/* Tab switcher: Messages / Communities */}
      <div className="flex border-b border-gray-100 bg-white shrink-0">
        <button
          onClick={() => setActiveTab("messages")}
          className={`flex-1 py-3 text-sm font-bold transition-colors border-b-2 ${
            activeTab === "messages"
              ? "text-blue-600 border-blue-600"
              : "text-gray-400 border-transparent hover:text-gray-600"
          }`}
        >
          Messages
        </button>
        <button
          onClick={() => setActiveTab("communities")}
          className={`flex-1 py-3 text-sm font-bold transition-colors border-b-2 ${
            activeTab === "communities"
              ? "text-blue-600 border-blue-600"
              : "text-gray-400 border-transparent hover:text-gray-600"
          }`}
        >
          Communities
        </button>
      </div>

      {/* የፍለጋ ሳጥን (Search Bar) */}
      <div className="px-4 py-3 bg-input shadow-input shrink-0">
        <div className="relative">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeTab === "messages"
                ? "Search chats..."
                : "Search communities..."
            }
            className="w-full pl-10 pr-4 py-2.5 bg-input border border-input-border rounded-xl text-sm text-input-text placeholder:placeholder-input-text focus:bg-input
             focus:border-input-focus  outline-none transition-all "
          />
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
        </div>
      </div>

      {/* ===== MESSAGES TAB ===== */}
      {activeTab === "messages" && (
        <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
          {joinedChats.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center h-full">
              <Globe className="w-10 h-10 text-gray-300 mb-3" />
              <p className="text-sm font-semibold text-gray-600">
                No messages yet
              </p>
              <p className="text-xs text-gray-400 mt-1 max-w-[200px]">
                Join a group or channel from the Communities tab to get started.
              </p>
            </div>
          ) : (
            joinedChats.map((chat) => {
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
            })
          )}
        </div>
      )}

      {/* ===== COMMUNITIES TAB (Discovery) ===== */}
      {activeTab === "communities" && (
        <div className="flex-1 overflow-y-auto">
          {/* Suggested Groups — horizontal scroll (Facebook-style) */}
          {suggestedGroups.length > 0 && (
            <div className="py-4 border-b border-gray-100">
              <h3 className="px-4.5 mb-3 text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                Suggested Groups
              </h3>
              <div className="flex gap-3 overflow-x-auto px-4.5 pb-1 scrollbar-none">
                {suggestedGroups.map((chat) => (
                  <div
                    key={chat.id}
                    onClick={() => onSelectChat(chat.id)}
                    className="flex-shrink-0 w-36 bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <div
                      className={`h-16 ${chat.bgGradient} flex items-center justify-center`}
                    >
                      {chat.avatarUrl ? (
                        <img
                          src={chat.avatarUrl}
                          alt={chat.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-white font-black text-lg">
                          {chat.avatarLabel}
                        </span>
                      )}
                    </div>
                    <div className="p-2.5">
                      <p className="text-xs font-bold text-gray-900 truncate mb-0.5">
                        {chat.name}
                      </p>
                      <p className="text-[10px] text-gray-400 mb-2">
                        {chat.membersCount} members
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onJoinChat(chat.id);
                        }}
                        className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded-lg transition-colors"
                      >
                        Join
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Suggested Channels — vertical list, add-friend style */}
          <div className="py-4">
            <h3 className="px-4.5 mb-2 text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5" />
              Suggested Channels
            </h3>
            {suggestedChannels.length === 0 ? (
              <p className="px-4.5 text-xs text-gray-400 font-medium py-4">
                No suggested channels right now.
              </p>
            ) : (
              suggestedChannels.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => onSelectChat(chat.id)}
                  className="flex items-center gap-3.5 px-4.5 py-3.5 cursor-pointer hover:bg-white transition-colors"
                >
                  <div className="relative shrink-0">
                    {chat.avatarUrl ? (
                      <img
                        src={chat.avatarUrl}
                        alt={chat.name}
                        className="w-12 h-12 rounded-full object-cover shadow-sm"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-base text-white shadow-sm ${chat.bgGradient}`}
                      >
                        {chat.avatarLabel}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm text-gray-900 truncate">
                      {chat.name}
                    </h3>
                    <p className="text-xs text-gray-400 truncate">
                      {chat.membersCount} subscribers
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onJoinChat(chat.id);
                    }}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-full transition-colors shrink-0"
                  >
                    Subscribe
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal (Messages tab, hold-to-delete) */}
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
