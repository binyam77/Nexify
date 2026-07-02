/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, Send, Paperclip, Smile, Search, EllipsisVertical, 
  CheckCheck, Users, HelpCircle, Pencil, Trash2, Heart, Image, 
  Video, X, ThumbsUp, Plus, Check, Mic
} from 'lucide-react';
import type { Chat, Message } from '../types';

interface MessageAreaProps {
  chat: Chat | null;
  messages: Message[];
  onSendMessage: (text: string, mediaUrl?: string, mediaType?: 'image' | 'video' | 'audio' | 'pdf') => void;
  onEditMessage: (messageId: string, newText: string) => void;
  onDeleteMessage: (messageId: string) => void;
  onReactMessage: (messageId: string, emoji: string) => void;
  onJoinChat: (chatId: string) => void;
  onBack: () => void; // Handle going back on mobile
  currentUserProfile: {
    name: string;
    username: string;
    avatar: string;
    role: string;
  };
}

// Title: MessageArea Component (Message Workspace Window)
// This section displays selected chat/room details, past conversations, and the message composition footer.
// If the user has not joined the community (isJoined = false), the text area is replaced by a "Join Community" button.
export default function MessageArea({
  chat,
  messages,
  onSendMessage,
  onEditMessage,
  onDeleteMessage,
  onReactMessage,
  onJoinChat,
  onBack,
  currentUserProfile,
}: MessageAreaProps) {
  const [inputText, setInputText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const feedEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const QUICK_EMOJIS = ['👍', '❤️', '😂', '😆', '😭', '😡'];

  const mockGroupMembers = [
    { name: 'Yonas G.', bg: 'bg-emerald-500', initial: 'Y' },
    { name: 'Selam W.', bg: 'bg-indigo-500', initial: 'S' },
    { name: 'Abel K.', bg: 'bg-amber-500', initial: 'A' },
    { name: 'Aster T.', bg: 'bg-pink-500', initial: 'A' },
    { name: 'Michael B.', bg: 'bg-violet-500', initial: 'M' },
  ];

  // Scroll to bottom when a new message is received or active chat changes
  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chat]);

  // Textarea auto-resize effect (limit to 7 rows, approx 160px)
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      const maxHeight = 160; // Max height for ~7 rows
      if (scrollHeight > maxHeight) {
        textarea.style.height = `${maxHeight}px`;
        textarea.style.overflowY = 'auto';
      } else {
        textarea.style.height = `${scrollHeight}px`;
        textarea.style.overflowY = 'hidden';
      }
    }
  }, [inputText]);

  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [selectedOptionsMessage, setSelectedOptionsMessage] = useState<Message | null>(null);

  // Timer references for long-press gesture (አጥብቆ መጫን)
  const pressTimerRef = useRef<any>(null);

  const startPressTimer = (msg: Message) => {
    if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
    pressTimerRef.current = setTimeout(() => {
      setSelectedOptionsMessage(msg);
    }, 450); // 450ms matches normal press-and-hold (አጥብቆ ሲነካው)
  };

  const cancelPressTimer = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  };

  const [messageSearchQuery, setMessageSearchQuery] = useState('');
  const [isSearchingMessages, setIsSearchingMessages] = useState(false);
  const [showMediaSelector, setShowMediaSelector] = useState(false);
  const [attachedMedia, setAttachedMedia] = useState<{ url: string; type: 'image' | 'video' | 'audio' | 'pdf'; name?: string } | null>(null);

  const filteredMessages = messages.filter((msg) => {
    if (!messageSearchQuery) return true;
    return msg.text.toLowerCase().includes(messageSearchQuery.toLowerCase());
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      let detectedType: 'image' | 'video' | 'audio' | 'pdf' = 'image';
      
      if (file.type.startsWith('video/')) {
        detectedType = 'video';
      } else if (file.type.startsWith('audio/')) {
        detectedType = 'audio';
      } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        detectedType = 'pdf';
      }

      setAttachedMedia({
        url: dataUrl,
        type: detectedType,
        name: file.name
      });
    };
    reader.readAsDataURL(file);
    // Clear input so selecting the same file again triggers change event
    e.target.value = '';
  };

  const submitMessage = () => {
    if (!inputText.trim() && !attachedMedia) return;

    if (editingMessageId) {
      onEditMessage(editingMessageId, inputText);
      setEditingMessageId(null);
    } else {
      onSendMessage(inputText, attachedMedia?.url, attachedMedia?.type);
      setAttachedMedia(null);
    }
    setInputText('');
    setShowEmojiPicker(false);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    submitMessage();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // We let Enter function as standard newline insertion in the textarea on all platforms
    // to allow multi-line drafting. The user will use the explicit Send button to submit.
  };
  // Display welcome interface if no chat room is selected
  if (!chat) {
    return (
      <div className="flex-1 hidden md:flex flex-col items-center justify-center p-8 bg-white text-center">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4 animate-bounce">
          <Users className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-gray-900">Welcome to Nexify Community</h3>
        <p className="text-gray-500 text-sm max-w-sm mt-1.5 leading-relaxed">
          Select or join one of the developer community chats in the sidebar to start exchanging direct messages and feedback!
        </p>
      </div>
    );
  }

  return (
    <section className="flex-1 flex flex-col bg-white h-full relative min-h-0 overflow-hidden" aria-label="Current Conversation">
      
      {/* 1. Header - Conversation title, online member count or last seen timestamp */}
      <header className="py-4 md:py-5 min-h-[76px] px-5 md:px-7 
     text-white border-b border-gray-100 flex items-center justify-between bg-brand shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-3.5 ">
          {/* Back button shown on mobile view only */}
          <button
            onClick={onBack}
            className="md:hidden p-1.5 text-gray-900 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Back to chat list"
          >
            <ArrowLeft className="w-5 h-5 " />
          </button>

          {/* Custom Avatar label initials or photo */}
          {chat.avatarUrl ? (
            <img
              src={chat.avatarUrl}
              alt={chat.name}
              className="w-10 h-10 rounded-xl object-cover shrink-0 shadow-sm border border-input-border"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center
             font-bold text-sm text-white shrink-0 shadow-sm ${chat.bgGradient}`}>
              {chat.avatarLabel}
            </div>
          )}

          <div className="min-w-0 ">
            <h2 className="text-[19px] md:text-base font-bold text-input 
            truncate tracking-tight">
              {chat.name}
            </h2>
            {chat.type === 'group' ? (
              <span className="text-[11px] md:text-xs text-gray-500 font-bold tracking-wide 
              flex items-center gap-1 leading-none mt-0.5" id="group-online-status">
                <span className="w-1.5 h-1.5 rounded-full bg-success inline-block animate-pulse"></span>
                <span>{chat.onlineCount} online</span>
              </span>
            ) : chat.isOnline !== false ? (
              <span className="text-[11px] md:text-xs text-emerald-600 font-extrabold tracking-wider uppercase flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-md mt-0.5" id="chat-online-status">
                <span className="w-1.5 h-1.5 rounded-full bg-success inline-block"></span>
                <span>online</span>
              </span>
            ) : (
              <span className="text-[11px] md:text-xs text-gray-500 font-bold flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded-md mt-0.5 animate-in fade-in duration-200" id="chat-online-status">
                <span className="w-1.5 h-1.5 rounded-full bg-gray-400 inline-block animate-pulse"></span>
                <span>last seen {chat.lastSeen || 'recently'}</span>
              </span>
            )}
          </div>
        </div>

        {/* Top-right action buttons (Search & Options) */}
        <div className="flex items-center gap-1">
          <button 
            onClick={() => {
              setIsSearchingMessages(!isSearchingMessages);
              if (isSearchingMessages) {
                setMessageSearchQuery('');
              }
            }}
            className={`p-2 rounded-xl transition-all ${
              isSearchingMessages 
                ? 'text-blue-600 bg-blue-50' 
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
            }`} 
            aria-label="Search messages"
            title="Search"
          >
            <Search className="w-5 h-5" />
          </button>
          {chat.type === 'group' && (
            <button className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all" aria-label="More options">
              <EllipsisVertical className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>

      {/* Search Input Dropdown inside MessageArea */}
      {isSearchingMessages && (
        <div className="px-5 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center gap-3 animate-in slide-in-from-top duration-200" id="message-search-bar">
          <div className="relative flex-1">
            <input
              type="text"
              value={messageSearchQuery}
              onChange={(e) => setMessageSearchQuery(e.target.value)}
              placeholder="Search messages in this chat..."
              className="w-full pl-10 pr-10 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-700 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 outline-none"
              autoFocus
            />
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-gray-400" />
            {messageSearchQuery && (
              <button 
                onClick={() => setMessageSearchQuery('')}
                className="absolute right-3 top-2 p-0.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <button
            onClick={() => {
              setIsSearchingMessages(false);
              setMessageSearchQuery('');
            }}
            className="text-xs text-blue-600 hover:text-blue-800 font-bold px-2 py-1 hover:bg-blue-50 rounded-md transition-all shrink-0"
          >
            Close
          </button>
        </div>
      )}

      {/* 2. Messages conversation stream with a clean plain solid background */}
      <div className="flex-1 min-h-0 px-5 py-6 md:px-10 md:py-8 overflow-y-auto space-y-6 md:space-y-7 bg-gray-50">
        {messages.length === 0 ? (
          <div className="text-center py-12 animate-in fade-in duration-300">
            <p className="text-xs text-gray-500 font-bold bg-gray-50 border border-gray-100 rounded-full px-4.5 py-1.5 inline-block shadow-sm">
              No messages here yet. Say Hi! 👋
            </p>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="text-center py-12 animate-in fade-in duration-300">
            <p className="text-xs text-gray-500 font-bold bg-gray-50 border border-gray-100 rounded-full px-4.5 py-1.5 inline-block shadow-sm">
              No matching messages found.
            </p>
          </div>
        ) : (
          filteredMessages.map((msg) => {
            // --- ግሩፕ ከሆነ ተራ ቻት በግራና ቀኝ ከነ ፕሮፋይላቸው ይወጣል ---
            const hasMedia = !!msg.mediaUrl;
            
            if (msg.isSentByMe) {
                return (
                  <div key={msg.id} className="w-full flex justify-end pr-2 md:pr-4 min-w-0">
                    <div className="max-w-[85%] md:max-w-[70%] flex justify-end items-end gap-3 animate-in fade-in slide-in-from-right-1 duration-200 min-w-0">
                      <article 
                        onMouseDown={() => startPressTimer(msg)}
                        onTouchStart={() => startPressTimer(msg)}
                        onMouseUp={cancelPressTimer}
                        onTouchEnd={cancelPressTimer}
                        onMouseLeave={cancelPressTimer}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          setSelectedOptionsMessage(msg);
                        }}
                        onClick={() => setSelectedOptionsMessage(msg)}
                        className="bg-[#2481cc] text-white px-4 py-2.5 rounded-[18px] rounded-br-[3px] relative shadow-sm flex flex-col gap-1 min-w-0 max-w-full break-words cursor-pointer select-none hover:brightness-105 active:scale-[0.99] transition-all"
                        title="Click or hold for options"
                      >
                        {/* Media display if attached */}
                        {hasMedia && (
                          <div className="rounded-xl overflow-hidden mb-2 max-w-full bg-[#1b63a0]">
                            {msg.mediaType === 'video' ? (
                              <video src={msg.mediaUrl} controls className="max-h-60 object-cover w-full" />
                            ) : msg.mediaType === 'audio' ? (
                              <div className="p-3 flex flex-col gap-1.5">
                                <span className="text-[10px] font-black uppercase tracking-wider opacity-75 flex items-center gap-1">
                                  <span>🎵 Audio Attachment</span>
                                </span>
                                <audio src={msg.mediaUrl} controls className="w-full max-h-12" />
                              </div>
                            ) : msg.mediaType === 'pdf' ? (
                              <div className="p-3.5 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 bg-[#164e7d] text-white">
                                    PDF
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-xs font-black truncate leading-tight">Document.pdf</span>
                                    <span className="text-[9px] opacity-75">Click to view/download</span>
                                  </div>
                                </div>
                                <a 
                                  href={msg.mediaUrl} 
                                  download="document.pdf" 
                                  className="px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wide shrink-0 transition-colors bg-white text-blue-600 hover:bg-blue-50"
                                >
                                  Open
                                </a>
                              </div>
                            ) : (
                              <img src={msg.mediaUrl} alt="message media" className="max-h-60 object-cover w-full" referrerPolicy="no-referrer" />
                            )}
                          </div>
                        )}

                        <div className="flex flex-col gap-1">
                          <p className="text-[14px] md:text-[14.5px] leading-relaxed whitespace-pre-wrap selection:bg-blue-300 font-medium select-text">
                            {msg.text}
                          </p>

                          <div className="flex items-center justify-end gap-1.5 self-end text-[10px] text-blue-100/80 font-bold select-none mt-1">
                            {msg.isEdited && <span className="text-white bg-white/20 px-1 py-0.2 rounded text-[7px] uppercase font-black">Edited</span>}
                            <time dateTime={msg.time}>{msg.time}</time>
                            
                            {/* Visual Options Dots Button */}
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedOptionsMessage(msg);
                              }}
                              className="opacity-60 hover:opacity-100 p-0.5 hover:bg-white/20 rounded text-white transition-opacity ml-1 shrink-0 cursor-pointer"
                              title="Message options"
                            >
                              <EllipsisVertical className="w-3 h-3" />
                            </button>
                            <CheckCheck className="w-3.5 h-3.5 text-blue-100" />
                          </div>
                        </div>

                        {/* reactions display inside bubble */}
                        {chat.type === 'group' && !chat.isCreatedByMe && ((msg.reactions || []).length > 0) && (
                          <div className="flex flex-wrap gap-1 mt-2.5">
                            {(msg.reactions || []).map((r) => (
                              <button
                                key={r.emoji}
                                onClick={() => onReactMessage(msg.id, r.emoji)}
                                className={`text-[10px] px-1.5 py-0.5 rounded-md flex items-center gap-1 bg-white/10 text-white hover:bg-white/20 `}
                              >
                                <span>{r.emoji}</span>
                                <span>{r.count}</span>
                              </button>
                            ))}
                          </div>
                        )}

                      </article>

                      {/* Current user's dynamic profile avatar shown on the right side of their own messages */}
                      {currentUserProfile?.avatar ? (
                        <img 
                          src={currentUserProfile.avatar} 
                          alt={currentUserProfile.name} 
                          className="w-9 h-9 rounded-full object-cover border border-white shadow-sm shrink-0 hover:scale-105  active:scale-95 transition-all select-none"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div 
                          className="w-9 h-9 rounded-full bg-gradient-to-b from-[#019BE5] to-[#0071E3] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm border border-white hover:scale-105 active:scale-95 transition-all select-none"
                        >
                          {currentUserProfile?.name ? currentUserProfile.name.charAt(0).toUpperCase() : 'M'}
                        </div>
                      )}
                    </div>
                  </div>
                );
              } else {
                const initials = msg.senderName ? msg.senderName.charAt(0).toUpperCase() : '?';
                const colors = [
                  'bg-indigo-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500', 'bg-pink-500',
                  'bg-blue-500', 'bg-cyan-500', 'bg-rose-500', 'bg-purple-500', 'bg-teal-500'
                ];
                const colorIdx = (msg.senderName || "").split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
                const avatarBg = colors[colorIdx];

                return (
                  <div key={msg.id} className="w-full flex justify-start pl-2 md:pl-4 min-w-0">
                    <div className="max-w-[85%] md:max-w-[70%] flex justify-start items-end gap-3 animate-in fade-in slide-in-from-left-1 duration-200 min-w-0">
                      {/* Sender user avatar badge */}
                      <div 
                        className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-sm border border-white hover:scale-105 active:scale-95 transition-all select-none ${avatarBg}`}
                        title={msg.senderName}
                      >
                        {initials}
                      </div>

                      <article 
                        onMouseDown={() => startPressTimer(msg)}
                        onTouchStart={() => startPressTimer(msg)}
                        onMouseUp={cancelPressTimer}
                        onTouchEnd={cancelPressTimer}
                        onMouseLeave={cancelPressTimer}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          setSelectedOptionsMessage(msg);
                        }}
                        onClick={() => setSelectedOptionsMessage(msg)}
                        className="bg-[#f1f3f4] text-gray-900 px-4 py-2.5 rounded-[18px] rounded-bl-[3px] relative shadow-sm flex flex-col gap-1 flex-1 min-w-0 break-words cursor-pointer select-none hover:bg-gray-200/80 active:scale-[0.99] transition-all"
                        title="Click or hold for options"
                      >
                        <span className="text-[11px] font-black tracking-wide text-[#2481cc] select-none">
                          {msg.senderName}
                        </span>

                        {/* Media display if attached */}
                        {hasMedia && (
                          <div className="rounded-xl overflow-hidden mb-2 max-w-full bg-white/60 border border-gray-200/50">
                            {msg.mediaType === 'video' ? (
                              <video src={msg.mediaUrl} controls className="max-h-60 object-cover w-full" />
                            ) : msg.mediaType === 'audio' ? (
                              <div className="p-3 flex flex-col gap-1.5">
                                <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 flex items-center gap-1">
                                  <span>🎵 Audio Attachment</span>
                                </span>
                                <audio src={msg.mediaUrl} controls className="w-full max-h-12" />
                              </div>
                            ) : msg.mediaType === 'pdf' ? (
                              <div className="p-3.5 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 bg-red-50 text-red-500">
                                    PDF
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-xs font-black truncate leading-tight text-gray-800">Document.pdf</span>
                                    <span className="text-[9px] text-gray-500">Click to view/download</span>
                                  </div>
                                </div>
                                <a 
                                  href={msg.mediaUrl} 
                                  download="document.pdf" 
                                  className="px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wide shrink-0 transition-colors bg-blue-600 text-white hover:bg-blue-700"
                                >
                                  Open
                                </a>
                              </div>
                            ) : (
                              <img src={msg.mediaUrl} alt="message media" className="max-h-60 object-cover w-full" referrerPolicy="no-referrer" />
                            )}
                          </div>
                        )}

                        <div className="flex flex-col gap-1">
                          <p className="text-sm leading-relaxed text-gray-800 whitespace-pre-wrap font-medium select-text">
                            {msg.text}
                          </p>

                          <div className="flex items-center justify-end gap-1.5 self-end text-[10px] text-gray-500 font-bold select-none mt-1">
                            {msg.isEdited && <span className="text-blue-600 bg-blue-50 px-1 py-0.2 rounded text-[7px] uppercase font-black">Edited</span>}
                            <time dateTime={msg.time}>{msg.time}</time>
                            
                            {/* Visual Options Dots Button */}
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedOptionsMessage(msg);
                              }}
                              className="opacity-60 hover:opacity-100 p-0.5 hover:bg-gray-100 rounded text-gray-500 transition-opacity ml-1 shrink-0 cursor-pointer"
                              title="Message options"
                            >
                              <EllipsisVertical className="w-3 h-3" />
                            </button>
                            
                            {/* Quick Emoji Reaction Action on Hover - essential list */}
                            {chat.type === 'group' && !chat.isCreatedByMe && (
                              <div className="flex items-center gap-1 text-[11px] ml-1">
                                {['👍', '❤️', '😂', '😆', '😭', '😡'].map((emoji) => (
                                  <button
                                    key={emoji}
                                    onClick={() => onReactMessage(msg.id, emoji)}
                                    className="hover:scale-130 transition-transform px-0.5 active:scale-90"
                                    title={`React with ${emoji}`}
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Reactions display underneath bubble */}
                        {chat.type === 'group' && !chat.isCreatedByMe && ((msg.reactions || []).length > 0) && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {(msg.reactions || []).map((r) => (
                              <button
                                key={r.emoji}
                                onClick={() => onReactMessage(msg.id, r.emoji)}
                                className={`text-[10px] px-1.5 py-0.5 rounded-md flex items-center gap-1 border border-gray-200/60 bg-gray-50 hover:bg-gray-100 text-gray-600`}
                              >
                                <span>{r.emoji}</span>
                                <span>{r.count}</span>
                              </button>
                            ))}
                          </div>
                        )}

                      </article>
                    </div>
                  </div>
                );
              }
          })
        )}
        <div ref={feedEndRef} />
      </div>

      {/* 3. የመልዕክት መጻፊያ ወይም የመቀላቀያ (Join) አዝራር */}
      <footer className="border-t border-gray-100 bg-white px-4 pt-4 pb-20 md:pb-4 shrink-0 relative select-none">
        {chat.isJoined || chat.type === 'chat' ? (
          // ተጠቃሚው ግሩፑን ተቀላቅሏል ወይም የራሱ የግል ቻት ነው፡ መጻፊያ ሳጥኑ ይታያል
          <div className="relative">
              {/* Editing and Media previews */}
              {editingMessageId && (
                <div className="flex items-center justify-between bg-blue-50 border border-blue-100/80 rounded-xl px-4 py-2.5 mb-3 animate-in slide-in-from-bottom-2 text-blue-700">
                  <div className="flex items-center gap-2">
                    <Pencil className="w-4 h-4 shrink-0 animate-pulse text-blue-600" />
                    <p className="text-xs font-extrabold text-blue-800">
                      Editing message... (Press send to update)
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingMessageId(null);
                      setInputText('');
                    }}
                    className="p-1 text-blue-500 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {attachedMedia && (
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100/80 rounded-xl px-4 py-2.5 mb-3 animate-in slide-in-from-bottom-2 text-emerald-700">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xl shrink-0 select-none">
                      {attachedMedia.type === 'video' ? '🎥' : attachedMedia.type === 'audio' ? '🎵' : attachedMedia.type === 'pdf' ? '📄' : '📷'}
                    </span>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest leading-none">Attachment ready</span>
                      <span className="text-xs font-bold text-emerald-800 mt-1 truncate">
                        {attachedMedia.name || (attachedMedia.type === 'video' ? 'Selected Video' : attachedMedia.type === 'audio' ? 'Selected Audio' : attachedMedia.type === 'pdf' ? 'Selected PDF Document' : 'Selected Image')}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAttachedMedia(null)}
                    className="p-1 text-emerald-500 hover:text-emerald-800 hover:bg-emerald-100 rounded-lg transition-all shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Hidden Native File Selector */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*,video/*,audio/*,application/pdf"
                className="hidden"
                id="native-media-file-input"
              />

              {/* Functional Interactive Emoji Picker Dropup */}
              {showEmojiPicker && (
                <div className="absolute bottom-16 left-0 bg-white border border-gray-100 rounded-2xl p-4.5 shadow-2xl z-30 w-72 sm:w-80 animate-in fade-in slide-in-from-bottom-2 duration-200">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2.5 mb-2.5">
                    <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Select Emoji</span>
                    <button 
                      type="button" 
                      onClick={() => setShowEmojiPicker(false)}
                      className="text-[10px] bg-red-50 text-red-500 hover:bg-red-100 px-2 py-0.5 rounded-md font-bold transition-colors"
                    >
                      Close
                    </button>
                  </div>
                  <div className="grid grid-cols-6 gap-2">
                    {QUICK_EMOJIS.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => {
                          setInputText((prev) => prev + emoji);
                          setShowEmojiPicker(false);
                        }}
                        className="w-10 h-10 flex items-center justify-center text-xl hover:bg-gray-50 active:scale-90 rounded-xl transition-all duration-150 select-none"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <form onSubmit={handleSend} className="flex items-end gap-3 w-full">
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className={`p-2.5 rounded-xl transition-all duration-200 shrink-0 mb-1 ${
                    showEmojiPicker 
                      ? 'text-blue-600 bg-blue-50 focus:scale-95' 
                      : 'text-gray-400 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                  aria-label="Add emoji"
                  title="Choose emoji"
                >
                  <Smile className="w-5.5 h-5.5" />
                </button>

                <textarea
                  ref={textareaRef}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Write a message..."
                  rows={1}
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 placeholder-gray-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all duration-200 resize-none overflow-y-hidden min-h-[46px] leading-relaxed"
                />

                <button
                  type="button"
                  onClick={() => {
                    fileInputRef.current?.click();
                    setShowEmojiPicker(false);
                  }}
                  className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-gray-50 rounded-xl transition-all duration-200 focus:scale-95 shrink-0 group mb-1"
                  aria-label="Attach file"
                  title="Attach file (Photo, video, audio, or PDF)"
                >
                  <Plus className="w-5.5 h-5.5 stroke-[2.5] transition-transform duration-300 group-hover:rotate-90" />
                </button>

                <button
                  type="submit"
                  disabled={!inputText.trim() && !attachedMedia}
                  className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 shrink-0 select-none mb-1 ${
                    inputText.trim() || attachedMedia 
                      ? 'bg-[#2481cc] hover:bg-[#2075b8] text-white shadow-md shadow-blue-200 hover:scale-105 active:scale-95 cursor-pointer' 
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                  aria-label="Send message"
                  title="Send message"
                >
                  <Send className="w-5 h-5 transform -rotate-12 translate-x-0.5" />
                </button>
              </form>
            </div>
        ) : (
          // Not joined room: show the Join room layout call to action
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2 px-1">
            <div className="text-center sm:text-left">
              <h4 className="text-xs md:text-sm font-bold text-blue-600">
                You are in preview mode!
              </h4>
              <p className="text-[11px] md:text-xs text-gray-400 font-semibold leading-relaxed">
                Join this room to send messages and keep track of group news.
              </p>
            </div>
            <button
              onClick={() => onJoinChat(chat.id)}
              className="w-full sm:w-auto px-6 py-2.5 bg-[#2481cc] hover:bg-[#2075b8] hover:scale-[1.02] text-white text-xs md:text-sm font-extrabold rounded-xl transition-all shadow-md shadow-blue-200 shrink-0 uppercase tracking-wider"
            >
              Join group
            </button>
          </div>
        )}
      </footer>

      {/* 4. Message Options Choice Modal */}
      {selectedOptionsMessage && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedOptionsMessage(null)}
        >
          <div 
            className="bg-white w-full max-w-xs rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <span className="text-sm font-bold text-gray-800">Message Options</span>
              <button 
                onClick={() => setSelectedOptionsMessage(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Options list */}
            <div className="p-2 flex flex-col gap-1">
              
              {/* Edit Option:
                  Allowed if:
                  1. It's sent by me (isSentByMe = true)
                  2. It is a Group/Channel chat (chat.type !== 'chat')
              */}
              {selectedOptionsMessage.isSentByMe && chat?.type !== 'chat' && (
                <button
                  onClick={() => {
                    setEditingMessageId(selectedOptionsMessage.id);
                    setInputText(selectedOptionsMessage.text);
                    setSelectedOptionsMessage(null);
                    setTimeout(() => {
                      textareaRef.current?.focus();
                    }, 85);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-xl transition-colors text-left"
                >
                  <Pencil className="w-4 h-4 text-blue-500" />
                  <span>Edit Message</span>
                </button>
              )}

              {/* Delete Option:
                  Allowed if:
                  1. Sent by me (isSentByMe = true) OR
                  2. It is a Private Chat (chat.type === 'chat')
              */}
              {(selectedOptionsMessage.isSentByMe || chat?.type === 'chat') && (
                <button
                  onClick={() => {
                    onDeleteMessage(selectedOptionsMessage.id);
                    setSelectedOptionsMessage(null);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors text-left"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Message</span>
                </button>
              )}

              {/* Copy Text Option: Always available */}
              <button
                onClick={() => {
                  navigator.clipboard.writeText(selectedOptionsMessage.text);
                  setSelectedOptionsMessage(null);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 rounded-xl transition-colors text-left"
              >
                <Check className="w-4 h-4 text-emerald-500" />
                <span>Copy Text</span>
              </button>

              {/* Close Button */}
              <button
                onClick={() => setSelectedOptionsMessage(null)}
                className="w-full text-center py-2.5 mt-2 text-xs font-black text-gray-400 hover:text-gray-600 uppercase tracking-widest border-t border-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FUTURE: Code reference for persisting messages in PostgreSQL database using server proxy */}
      {/* // FUTURE: POST request to Express API: /api/messages with body { chatId: chat.id, text: inputText } */}
    </section>
  );
}
