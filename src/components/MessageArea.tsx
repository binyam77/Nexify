/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import {
  ArrowLeft,
  Send,
  Smile,
  Search,
  EllipsisVertical,
  CheckCheck,
  Users,
  Pencil,
  Trash2,
  X,
  Plus,
  Check,
  Mic,
  Square,
  Pin,
  PinOff,
} from "lucide-react";
import ChannelInfoModal from "./ChannelInfoModal";
import ChatInfoModal from "./ChatInfoModal";
import GroupInfoModal from "./GroupInfoModal";
import type { Chat, Message, GroupMember, SelectableUser } from "../types";

interface MessageAreaProps {
  chat: Chat | null;
  messages: Message[];
  onSendMessage: (
    text: string,
    mediaUrl?: string,
    mediaType?: "image" | "video" | "audio" | "pdf",
  ) => void;
  onEditMessage: (messageId: string, newText: string) => void;
  onDeleteMessage: (messageId: string) => void;
  onReactMessage: (messageId: string, emoji: string) => void;
  onPinMessage?: (messageId: string) => void;
  onLeaveGroup?: (chatId: string) => void;
  onDeleteGroup?: (chatId: string) => void;
  onUpdateGroupInfo?: (
    chatId: string,
    updates: {
      name?: string;
      avatarUrl?: string;
      description?: string;
      cover?: string;
    },
  ) => void;
  onUnsubscribeChannel?: (chatId: string) => void;
  onDeleteChannel?: (chatId: string) => void;
  onUpdateChannelInfo?: (
    chatId: string,
    updates: {
      name?: string;
      avatarUrl?: string;
      description?: string;
      cover?: string;
    },
  ) => void;
  onJoinChat: (chatId: string) => void;
  onUserTyping?: () => void;
  onInviteMembers?: (chatId: string, invitedUsers: SelectableUser[]) => void;
  availableUsersForInvite?: SelectableUser[];
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
  onPinMessage,
  onJoinChat,
  onLeaveGroup,
  onDeleteGroup,
  onUpdateGroupInfo,
  onUnsubscribeChannel,
  onDeleteChannel,
  onUpdateChannelInfo,
  onUserTyping,
  onInviteMembers,
  availableUsersForInvite,
  onBack,
  currentUserProfile,
}: MessageAreaProps) {
  const [inputText, setInputText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const feedEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const QUICK_EMOJIS = ["👍", "❤️", "😂", "😆", "😭", "😡"];

  // Scroll to bottom when a new message is received or active chat changes
  useEffect(() => {
    feedEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chat]);

  // Textarea auto-resize effect (limit to 7 rows, approx 160px)
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      const scrollHeight = textarea.scrollHeight;
      const maxHeight = 160; // Max height for ~7 rows
      if (scrollHeight > maxHeight) {
        textarea.style.height = `${maxHeight}px`;
        textarea.style.overflowY = "auto";
      } else {
        textarea.style.height = `${scrollHeight}px`;
        textarea.style.overflowY = "hidden";
      }
    }
  }, [inputText]);

  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [selectedOptionsMessage, setSelectedOptionsMessage] =
    useState<Message | null>(null);

  //ፎቶ ሲነካ ሙሉ፟ገት ለማሳየት ( options modal ካልሆነ የተለየ )
  const [viewingMedia, setViewingMedia] = useState<string | null>(null);

  // Channel header ተነክቶ ሲከፈት (Cover/create name/Empty detail view)
  const [isChannelInfoOpen, setChannelInfoOpen] = useState(false);

  // Group header ተነክቶ ሲከፈት (Cover/Name/Description/Members)
  const [isGroupInfoOpen, setIsGroupInfoOpen] = useState(false);

  // ⏳ ለጊዜው demo members — backend ሲመጣ: GET /api/groups/:id/members ን ይተካል
  const demoGroupMembers: GroupMember[] = [
    {
      id: "me",
      name: currentUserProfile.name,
      username: currentUserProfile.username,
      photo: currentUserProfile.avatar,
      isAdmin: true,
    },
    { id: "yonas", name: "Yonas G.", username: "yonas_g", photo: "" },
    { id: "selam", name: "Selam W.", username: "selam_w", photo: "" },
    { id: "abelk", name: "Abel K.", username: "abel_k", photo: "" },
  ];
  // Private chat header ተነክቶ ሲከፈት (Cover/photo /name/Stories/Empty detail view)
  const [isChatInfoOpen, setIsChatInfoOpen] = useState(false);

  // Timer references for long-press gesture -ብቻ hold options modal ይከፈታል ፈታን ንኪኪ አይደለም
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressFiredRef = useRef(false);

  const startPressTimer = (msg: Message) => {
    if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
    longPressFiredRef.current = false;
    pressTimerRef.current = setTimeout(() => {
      longPressFiredRef.current = true;
      setSelectedOptionsMessage(msg);
    }, 450); // 450ms matches normal press-and-hold (አጥብቆ ሲነካው)
  };

  const cancelPressTimer = () => {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
      pressTimerRef.current = null;
    }
  };
  //ፎቶ  ሲነካ ማየት እንጂ options box  መክፈት የለበትም: long-press ገና ከተነሳ ግን  ችላ እንል (double-trigger መከላከያ)
  const handleImageClick = (e: React.MouseEvent, url?: string) => {
    e.stopPropagation();
    if (longPressFiredRef.current) {
      longPressFiredRef.current = false;
      return;
    }
    if (url) setViewingMedia(url);
  };
  const [messageSearchQuery, setMessageSearchQuery] = useState("");
  const [isSearchingMessages, setIsSearchingMessages] = useState(false);
  const [attachedMedia, setAttachedMedia] = useState<{
    url: string;
    type: "image" | "video" | "audio" | "pdf";
    name?: string;
  } | null>(null);

  // Voice recording (MediaRecorder Web API)
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAttachedMedia({ url, type: "audio", name: "Voice message" });
        stream.getTracks().forEach((track) => track.stop());
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);
    } catch (err) {
      console.error("Microphone access denied or unavailable:", err);
      alert(
        "Could not access microphone. Please check your browser permissions.",
      );
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.onstop = null;
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream
        .getTracks()
        .forEach((track) => track.stop());
    }
    setIsRecording(false);
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
  };

  const formatRecordingTime = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const filteredMessages = messages.filter((msg) => {
    if (!messageSearchQuery) return true;
    return msg.text.toLowerCase().includes(messageSearchQuery.toLowerCase());
  });
  //Channel subscriber (creator ያልሆነ መታፍ አይችልም _ emoji reaction only)
  const isChannelSubscriberOnly = chat
    ? chat.type === "channel" && !chat.isCreatedByMe
    : false;
  const canCompose =
    !!chat &&
    !isChannelSubscriberOnly &&
    (chat.isJoined || chat.type === "chat");
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      let detectedType: "image" | "video" | "audio" | "pdf" = "image";

      if (file.type.startsWith("video/")) {
        detectedType = "video";
      } else if (file.type.startsWith("audio/")) {
        detectedType = "audio";
      } else if (
        file.type === "application/pdf" ||
        file.name.endsWith(".pdf")
      ) {
        detectedType = "pdf";
      }

      setAttachedMedia({
        url: dataUrl,
        type: detectedType,
        name: file.name,
      });
    };
    reader.readAsDataURL(file);
    // Clear input so selecting the same file again triggers change event
    e.target.value = "";
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
    setInputText("");
    setShowEmojiPicker(false);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    submitMessage();
  };

  const handleKeyDown = () => {
    // We let Enter function as standard newline insertion in the textarea on all platforms
    // to allow multi-line drafting. The user will use the explicit Send button to submit.
  };
  // Display welcome interface if no chat room is selected
  if (!chat) {
    return (
      <div className="flex-1 hidden  md:flex flex-col items-center justify-center p-8 bg-white text-center">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4 animate-bounce">
          <Users className="w-8 h-8" />
        </div>
        <h3 className="s-bold text-gray-900">Welcome to Nexify Community</h3>
        <p className="text-gray-500 text-sm max-w-sm mt-1.5 leading-relaxed">
          Select or join one of the creator community chats in the sidebar to
          start exchanging direct messages and feedback!
        </p>
      </div>
    );
  }

  return (
    <section
      className="flex-1 flex flex-col bg-white h-full relative min-h-0 overflow-hidden"
      aria-label="Current Conversation"
    >
      {/* 1. Header - Conversation title, online member count or last seen timestamp */}
      <header
        className="py-4 md:py-5 min-h-[76px] px-5 md:px-7 
     text-white border-b border-gray-100 flex items-center justify-between bg-brand shrink-0 shadow-sm z-10"
      >
        <div className="flex items-center gap-3.5 ">
          {/* Back button shown on mobile view only */}
          <button
            onClick={onBack}
            className="md:hidden p-1.5 text-gray-900 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Back to chat list"
          >
            <ArrowLeft className="w-5 h-5 " />
          </button>

          {/* Channel ብቻ ተነክቶ Detail view ይከፈታል*/}

          <div
            onClick={() => {
              if (chat.type === "channel") setChannelInfoOpen(true);
              else if (chat.type === "chat") setIsChatInfoOpen(true);
              else if (chat.type === "group") setIsGroupInfoOpen(true);
            }}
            className="flex items-center gap-3.5 min-w-0 cursor-pointer"
          >
            {chat.avatarUrl ? (
              <img
                src={chat.avatarUrl}
                alt={chat.name}
                className="w-10 h-10 rounded-xl object-cover shrink-0 shadow-sm border border-input-border"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div
                className={`w-10 h-10 rounded-xl bg-success flex items-center justify-center
                font-bold text-sm text-white shrink-0 shadow-sm ${chat.bgGradient}`}
              >
                {chat.avatarLabel}
              </div>
            )}
            <div className="min-w-0">
              <h2
                className="text-[19px] md:text-base font-bold text-input
              truncate tracking-tight"
              >
                {chat.name}
              </h2>

              {chat.type === "group" ? (
                <span
                  className="text-[11px] md:text-xs text-input font-bold tracking-wide 
              flex items-center gap-1 leading-none mt-0.5"
                  id="group-online-status"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-success inline-block animate-pulse"></span>
                  <span>{chat.onlineCount} online</span>
                </span>
              ) : chat.type === "channel" ? (
                <span
                  className="text-[11px] md:text-xs text-input font-bold tracking-wide 
              flex items-center gap-1 leading-none mt-0.5"
                  id="channel-subscriber-status"
                >
                  <span>📢 {chat.membersCount} subscribers</span>
                </span>
              ) : chat.isOnline !== false ? (
                <span
                  className="text-[11px] md:text-xs text-gray-100 font-extrabold tracking-wider flex items-center gap-1 px-2 py-0.5 rounded-md mt-0.5"
                  id="chat-online-status"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-success inline-block"></span>
                  <span>online</span>
                </span>
              ) : (
                <span
                  className="text-[11px] md:text-xs text-gray-500  flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded-md mt-0.5 animate-in fade-in duration-200"
                  id="chat-online-status"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 inline-block animate-pulse"></span>
                  <span>last seen {chat.lastSeen || "recently"}</span>
                </span>
              )}
            </div>
          </div>
        </div>
        {/* Top-right action buttons (Search & Options) */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              setIsSearchingMessages(!isSearchingMessages);
              if (isSearchingMessages) {
                setMessageSearchQuery("");
              }
            }}
            className={`p-2 rounded-xl transition-all ${
              isSearchingMessages
                ? "text-input-text bg-blue-50"
                : "text-input-text hover:text-gray-900 hover:bg-gray-100"
            }`}
            aria-label="Search messages"
            title="Search"
          >
            <Search className="w-5 h-5" />
          </button>
          {chat.type === "group" && (
            <button
              onClick={() => setIsGroupInfoOpen(true)}
              className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all"
              aria-label="Group info"
            >
              <EllipsisVertical className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>
      {/* Pinned message banner (Group/Channel ብቻ) */}
      {(chat.type === "group" || chat.type === "channel") &&
        messages.some((m) => m.isPinned) && (
          <div className="px-5 py-2 bg-amber-50 border-b border-amber-100 flex items-center gap-2 shrink-0">
            <Pin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <p className="text-xs text-amber-800 font-semibold truncate flex-1">
              {messages.filter((m) => m.isPinned).slice(-1)[0]?.text ||
                "Pinned message"}
            </p>
          </div>
        )}

      {/* Search Input Dropdown inside MessageArea */}
      {isSearchingMessages && (
        <div
          className="px-5 py-2.5 bg-gray-50 border-b border-gray-100 flex items-center gap-3 animate-in slide-in-from-top duration-200"
          id="message-search-bar"
        >
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
                onClick={() => setMessageSearchQuery("")}
                className="absolute right-3 top-2 p-0.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <button
            onClick={() => {
              setIsSearchingMessages(false);
              setMessageSearchQuery("");
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
          chat.type === "channel" ? (
            <div className="flex flex-col items-center justify-center py-16 animate-in fade-in duration-300 px-6 text-center gap-2">
              <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-sm border border-gray-100 bg-gray-100 flex items-center justify-cenetr shrink-0">
                {chat.avatarUrl ? (
                  <img
                    src={chat.avatarUrl}
                    alt={chat.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className={`w-full h-full ${chat.bgGradient} flex items-center justify-center text-white font-black`}
                  >
                    {chat.avatarLabel}
                  </div>
                )}
              </div>
              <h4 className="text-sm font-black text-gray-800 mt-1 ">
                {chat.name}
              </h4>
              <p className="text-xs text-gray-400 max-w-xs">
                {chat.description ||
                  (chat.isCreatedByMe
                    ? "You haven't posted anything yet."
                    : "The channel owner hasn't posted anything yet.")}
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 animate-in fade-in duration-300 gap-3 px-6 text-center">
              <div className="w-16 h-16 rounded-full overflow-hidden shadow-sm border-gray-100 bg-gray-100 flex items-center justify-center shrink-0">
                {chat.avatarUrl ? (
                  <img
                    src={chat.avatarUrl}
                    alt={chat.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className={`w-full h-full ${chat.bgGradient} flex items-cenetr justify-center text-white font-black text-lg`}
                  >
                    {chat.avatarLabel}
                  </div>
                )}
              </div>
              <h4 className="text-sm font-black text-gray-800">{chat.name}</h4>
              <p className="text-xs text-gray-400 max-w-xs">
                No messages here yet - send the first one to start the
                conversation!👋
              </p>
            </div>
          )
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
                <div
                  key={msg.id}
                  className="w-full flex justify-end pr-2 md:pr-4 min-w-0"
                >
                  <div
                    className="max-w-[88%] md:max-w-[75%] flex justify-end items-end
                 gap-3 animate-in fade-in slide-in-from-right-1 duration-200 min-w-0"
                  >
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
                      className="bg-[#2481cc] text-white px-4 py-2.5 rounded-[18px] rounded-br-[3px] relative shadow-sm flex flex-col gap-1 min-w-0 max-w-full break-words cursor-pointer select-none hover:brightness-105 active:scale-[0.99] transition-all"
                      title="Click or hold for options"
                    >
                      {/* Media display if attached */}
                      {hasMedia && (
                        <div className="rounded-xl overflow-hidden mb-2 -mx-4 -mt-2.5 bg-[#1b63a0]">
                          {msg.mediaType === "video" ? (
                            <video
                              src={msg.mediaUrl}
                              controls
                              className="max-h-60 object-cover w-full"
                            />
                          ) : msg.mediaType === "audio" ? (
                            <div className="p-3 flex flex-col gap-1.5">
                              <span className="text-[10px] font-black uppercase tracking-wider opacity-75 flex items-center gap-1">
                                <span>🎵 Audio Attachment</span>
                              </span>
                              <audio
                                src={msg.mediaUrl}
                                controls
                                className="w-full max-h-12"
                              />
                            </div>
                          ) : msg.mediaType === "pdf" ? (
                            <div className="p-3.5 flex items-center justify-between gap-4">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 bg-[#164e7d] text-white">
                                  PDF
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className="text-xs font-black truncate leading-tight">
                                    Document.pdf
                                  </span>
                                  <span className="text-[9px] opacity-75">
                                    Click to view/download
                                  </span>
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
                            <img
                              src={msg.mediaUrl}
                              alt="message media"
                              onClick={(e) => handleImageClick(e, msg.mediaUrl)}
                              className="max-h-60 object-cover w-full"
                              referrerPolicy="no-referrer"
                            />
                          )}
                        </div>
                      )}

                      <div className="flex flex-col gap-1">
                        <p className="text-[14px] md:text-[14.5px] leading-relaxed whitespace-pre-wrap selection:bg-blue-300 font-medium select-text">
                          {msg.text}
                        </p>

                        <div className="flex items-center justify-end gap-1.5 self-end text-[10px] text-blue-100/80 font-bold select-none mt-1">
                          {msg.isEdited && (
                            <span className="text-white bg-white/20 px-1 py-0.2 rounded text-[7px] uppercase font-black">
                              Edited
                            </span>
                          )}
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
                          <CheckCheck
                            className={`w-3.5 h-3.5 ${msg.seen ? "text-sky-300" : "text-blue-100/60"}`}
                          />
                        </div>
                      </div>

                      {/* reactions display inside bubble - only Channel */}
                      {chat.type === "channel" &&
                        !chat.isCreatedByMe &&
                        (msg.reactions || []).length > 0 && (
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

                    {/* Current user's avatar - private chat ("chat" type) ላይ አይታይም፤ (Channel = broadcast-only, ፎቶ አያስፈልገውም) */}
                    {chat.type !== "chat" &&
                      chat.type !== "channel" &&
                      (currentUserProfile?.avatar ? (
                        <img
                          src={currentUserProfile.avatar}
                          alt={currentUserProfile.name}
                          className="w-9 h-9 rounded-full object-cover border border-white shadow-sm shrink-0 hover:scale-105  active:scale-95 transition-all select-none"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-full bg-gradient-to-b from-[#019BE5] to-[#0071E3] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm border border-white hover:scale-105 active:scale-95 transition-all select-none">
                          {currentUserProfile?.name
                            ? currentUserProfile.name.charAt(0).toUpperCase()
                            : "M"}
                        </div>
                      ))}
                  </div>
                </div>
              );
            } else {
              const initials = msg.senderName
                ? msg.senderName.charAt(0).toUpperCase()
                : "?";
              const colors = [
                "bg-indigo-500",
                "bg-emerald-500",
                "bg-violet-500",
                "bg-amber-500",
                "bg-pink-500",
                "bg-blue-500",
                "bg-cyan-500",
                "bg-rose-500",
                "bg-purple-500",
                "bg-teal-500",
              ];
              const colorIdx =
                (msg.senderName || "")
                  .split("")
                  .reduce((acc, char) => acc + char.charCodeAt(0), 0) %
                colors.length;
              const avatarBg = colors[colorIdx];

              return (
                <div
                  key={msg.id}
                  className="w-full flex justify-start pl-2 md:pl-4 min-w-0"
                >
                  <div className="max-w-[88%] md:max-w-[75%] flex justify-start items-end gap-3 animate-in fade-in slide-in-from-left-1 duration-200 min-w-0">
                    {/* Sender user avatar badge- private chat/channel ላይ አይታይም */}
                    {chat.type !== "chat" && chat.type !== "channel" && (
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-sm border border-white hover:scale-105 active:scale-95 transition-all select-none ${avatarBg}`}
                        title={msg.senderName}
                      >
                        {initials}
                      </div>
                    )}
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
                      className="bg-[#f1f3f4] text-gray-900 px-4 py-2.5 rounded-[18px] rounded-bl-[3px] relative shadow-sm flex flex-col gap-1 flex-1 min-w-0 break-words cursor-pointer select-none hover:bg-gray-200/80 active:scale-[0.99] transition-all"
                      title="Click or hold for options"
                    >
                      <span className="text-[11px] font-black tracking-wide text-[#2481cc] select-none">
                        {msg.senderName}
                      </span>

                      {/* Media display if attached */}
                      {hasMedia && (
                        <div className="rounded-xl overflow-hidden mb-2 -mx-4 -mt-2.5 bg-white/60 border border-gray-200/50">
                          {msg.mediaType === "video" ? (
                            <video
                              src={msg.mediaUrl}
                              controls
                              className="max-h-60 object-cover w-full"
                            />
                          ) : msg.mediaType === "audio" ? (
                            <div className="p-3 flex flex-col gap-1.5">
                              <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 flex items-center gap-1">
                                <span>🎵 Audio Attachment</span>
                              </span>
                              <audio
                                src={msg.mediaUrl}
                                controls
                                className="w-full max-h-12"
                              />
                            </div>
                          ) : msg.mediaType === "pdf" ? (
                            <div className="p-3.5 flex items-center justify-between gap-4">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 bg-red-50 text-red-500">
                                  PDF
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className="text-xs font-black truncate leading-tight text-gray-800">
                                    Document.pdf
                                  </span>
                                  <span className="text-[9px] text-gray-500">
                                    Click to view/download
                                  </span>
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
                            <img
                              src={msg.mediaUrl}
                              alt="message media"
                              onClick={(e) => handleImageClick(e, msg.mediaUrl)}
                              className="max-h-60 object-cover w-full cursor-zoom-in"
                              referrerPolicy="no-referrer"
                            />
                          )}
                        </div>
                      )}

                      <div className="flex flex-col gap-1">
                        <p className="text-sm leading-relaxed text-gray-800 whitespace-pre-wrap font-medium select-text">
                          {msg.text}
                        </p>

                        <div className="flex items-center justify-end gap-1.5 self-end text-[10px] text-gray-500 font-bold select-none mt-1">
                          {msg.isEdited && (
                            <span className="text-blue-600 bg-blue-50 px-1 py-0.2 rounded text-[7px] uppercase font-black">
                              Edited
                            </span>
                          )}
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

                          {/* Quick Emoji Reaction Action on Hover - only channel */}
                          {chat.type === "channel" && !chat.isCreatedByMe && (
                            <div className="flex items-center gap-1 text-[11px] ml-1">
                              {["👍", "❤️", "😂", "😆", "😭", "😡"].map(
                                (emoji) => (
                                  <button
                                    key={emoji}
                                    onClick={() =>
                                      onReactMessage(msg.id, emoji)
                                    }
                                    className="hover:scale-130 transition-transform px-0.5 active:scale-90"
                                    title={`React with ${emoji}`}
                                  >
                                    {emoji}
                                  </button>
                                ),
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Reactions display underneath bubble - only Channel*/}
                      {chat.type === "channel" &&
                        !chat.isCreatedByMe &&
                        (msg.reactions || []).length > 0 && (
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
        {chat.typingUsers && chat.typingUsers.length > 0 && (
          <div className="w-full flex justify-start pl-2 md:pl-4">
            <div className="bg-[#f1f3f4] px-4 py-3 rounded-[18px] rounded-bl-[3px] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
            </div>
          </div>
        )}
        <div ref={feedEndRef} />
      </div>

      {/* 3. የመልዕክት መጻፊያ ወይም የመቀላቀያ (Join) አዝራር */}
      <footer className="border-t border-gray-100 bg-white px-4 pt-4 pb-20 md:pb-4 shrink-0 relative select-none">
        {canCompose ? (
          // መታፍ ይችላል:private chat; channel creator ወይም የተከላከለው group
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
                    setInputText("");
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
                    {attachedMedia.type === "video"
                      ? "🎥"
                      : attachedMedia.type === "audio"
                        ? "🎵"
                        : attachedMedia.type === "pdf"
                          ? "📄"
                          : "📷"}
                  </span>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest leading-none">
                      Attachment ready
                    </span>
                    <span className="text-xs font-bold text-emerald-800 mt-1 truncate">
                      {attachedMedia.name ||
                        (attachedMedia.type === "video"
                          ? "Selected Video"
                          : attachedMedia.type === "audio"
                            ? "Selected Audio"
                            : attachedMedia.type === "pdf"
                              ? "Selected PDF Document"
                              : "Selected Image")}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAttachedMedia(null)}
                  className="p-1 text-success hover:text-emerald-800 hover:bg-emerald-100 rounded-lg transition-all shrink-0"
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
                  <span className="text-xs font-black text-gray-400 uppercase tracking-widest">
                    Select Emoji
                  </span>
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

            <form onSubmit={handleSend} className="flex items-end gap-2 w-full">
              {/* Input wrapper: emoji + textarea + attach icon all live inside this single pill */}
              <div
                className="flex-1 flex items-end gap-1 bg-white shadow-sm
              border border-gray-200 rounded-3xl px-2 py-1.5 focus-within:border-blue-400 transition-all duration-200"
              >
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className={`p-2 rounded-full transition-all duration-200 shrink-0 mb-0.5 ${
                    showEmojiPicker
                      ? "text-blue-600 bg-blue-50"
                      : "text-gray-400 hover:text-blue-600 hover:bg-gray-100"
                  }`}
                  aria-label="Add emoji"
                  title="Choose emoji"
                >
                  <Smile className="w-5.5 h-5.5" />
                </button>

                <textarea
                  ref={textareaRef}
                  value={inputText}
                  onChange={(e) => {
                    setInputText(e.target.value);
                    onUserTyping?.();
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Write a message..."
                  rows={1}
                  style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                  className="flex-1 bg-transparent px-1 py-2 text-sm font-medium text-input-text placeholder:placeholder-input-placeholder outline-none resize-none min-h-[20px] leading-relaxed [&::-webkit-scrollbar]:hidden"
                />

                {/* Attach (+) icon: only visible while the input is empty, like WhatsApp */}
                {!inputText.trim() && (
                  <button
                    type="button"
                    onClick={() => {
                      fileInputRef.current?.click();
                      setShowEmojiPicker(false);
                    }}
                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-gray-100 rounded-full transition-all duration-200 shrink-0 group mb-0.5"
                    aria-label="Attach file"
                    title="Attach file (Photo, video, audio, or PDF)"
                  >
                    <Plus className="w-5.5 h-5.5 stroke-[2.5] transition-transform duration-300 group-hover:rotate-90" />
                  </button>
                )}
              </div>

              {!inputText.trim() && !attachedMedia ? (
                <button
                  type="button"
                  onClick={startRecording}
                  className="w-12 h-12 rounded-full flex items-center justify-center bg-[#2481cc] hover:bg-[#2075b8] text-white shadow-md shadow-blue-200 hover:scale-105 active:scale-95 transition-all duration-200 shrink-0 select-none"
                  aria-label="Record voice message"
                  title="Record voice message"
                >
                  <Mic className="w-5 h-5" />
                </button>
              ) : (
                <button
                  type="submit"
                  className="w-12 h-12 rounded-full flex items-center justify-center bg-[#2481cc] hover:bg-[#2075b8] text-white shadow-md shadow-blue-200 hover:scale-105 active:scale-95 transition-all duration-200 shrink-0 select-none cursor-pointer"
                  aria-label="Send message"
                  title="Send message"
                >
                  <Send className="w-5 h-5 transform -rotate-12 translate-x-0.5" />
                </button>
              )}
            </form>

            {/* Recording overlay — composer ን ይተካል፣ ገልብጦ ወይም ልኮ ማቆም ይቻላል */}
            {isRecording && (
              <div className="absolute inset-x-0 bottom-0 top-0 bg-white flex items-center gap-3 px-2 rounded-3xl animate-in fade-in duration-150">
                <button
                  type="button"
                  onClick={cancelRecording}
                  className="p-2.5 text-rose-500 hover:bg-rose-50 rounded-full transition-colors shrink-0"
                  aria-label="Cancel recording"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <div className="flex-1 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse shrink-0" />
                  <span className="text-sm font-bold text-gray-700">
                    Recording... {formatRecordingTime(recordingSeconds)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={stopRecording}
                  className="w-12 h-12 rounded-full flex items-center justify-center bg-[#2481cc] hover:bg-[#2075b8] text-white shrink-0 transition-all"
                  aria-label="Stop and send recording"
                  title="Stop and attach"
                >
                  <Square className="w-4 h-4" fill="white" />
                </button>
              </div>
            )}
          </div>
        ) : isChannelSubscriberOnly && chat.isJoined ? (
          // Subscribe አድርጓል ግን creator ስላልሆነ መጻፍ አይችልም — emoji reaction ብቻ
          <div className="text-center py-3">
            <p className="text-xs text-gray-400 font-semibold">
              📢 Only the channel owner can post here. You can react to posts
              with emoji.
            </p>
          </div>
        ) : (
          // Not joined/subscribed: show the Join/Subscribe call to action
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2 px-1">
            <div className="text-center sm:text-left">
              <h4 className="text-xs md:text-sm font-bold text-blue-600">
                You are in preview mode!
              </h4>
              <p className="text-[11px] md:text-xs text-gray-400 font-semibold leading-relaxed">
                {chat.type === "channel"
                  ? "Subscribe to this channel to receive updates."
                  : "Join this room to send messages and keep track of group news."}
              </p>
            </div>
            <button
              onClick={() => onJoinChat(chat.id)}
              className="w-full sm:w-auto px-6 py-2.5 bg-[#2481cc] hover:bg-[#2075b8] hover:scale-[1.02] text-white text-xs md:text-sm font-extrabold rounded-xl transition-all shadow-md shadow-blue-200 shrink-0 uppercase tracking-wider"
            >
              {chat.type === "channel" ? "Subscribe" : "Join group"}
            </button>
          </div>
        )}
        {chat.type === "channel" && !chat.isJoined && (
          <p className="text-[10px] text-gray-400 font-semibold text-center mt-2">
            🔒 This is a private channel - only the owner can post.
          </p>
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
              <span className="text-sm font-bold text-gray-800">
                Message Options
              </span>
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
              {selectedOptionsMessage.isSentByMe && chat?.type !== "chat" && (
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
              {(selectedOptionsMessage.isSentByMe || chat?.type === "chat") && (
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

              {/* Pin/Unpin Option: Group/Channel creator ብቻ */}
              {(chat.type === "group" ||
                (chat.type === "channel" && chat.isCreatedByMe)) && (
                <button
                  onClick={() => {
                    onPinMessage?.(selectedOptionsMessage.id);
                    setSelectedOptionsMessage(null);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-700 hover:bg-amber-50 hover:text-amber-600 rounded-xl transition-colors text-left"
                >
                  {selectedOptionsMessage.isPinned ? (
                    <PinOff className="w-4 h-4 text-amber-500" />
                  ) : (
                    <Pin className="w-4 h-4 text-amber-500" />
                  )}
                  <span>
                    {selectedOptionsMessage.isPinned
                      ? "Unpin Message"
                      : "Pin Message"}
                  </span>
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
      {/* 5. Full-screen Image Viewer (ፎቶ ተነክቶ ሲታይ) */}
      {viewingMedia && (
        <div
          className="fixed inset-0 bg-black/90 z-[120] flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setViewingMedia(null)}
        >
          <button
            onClick={() => setViewingMedia(null)}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full transition-all"
            aria-label="Close viewer"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={viewingMedia}
            alt="Full size media"
            className="max-h-[90vh] max-w-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
      {/*6. Channel Info Detail View (Cover/ creator name / empty) */}
      {isChannelInfoOpen && chat.type === "channel" && (
        <ChannelInfoModal
          chat={chat}
          messages={messages}
          onViewMedia={(url) => setViewingMedia(url)}
          onUnsubscribe={onUnsubscribeChannel || (() => {})}
          onDeleteChannel={onDeleteChannel || (() => {})}
          onUpdateChannelInfo={onUpdateChannelInfo || (() => {})}
          onClose={() => setChannelInfoOpen(false)}
        />
      )}
      {/*7.  Private Chat Detail View (Cover/Photo/Name/Stories / Empty) */}
      {isChatInfoOpen && chat.type === "chat" && (
        <ChatInfoModal chat={chat} onClose={() => setIsChatInfoOpen(false)} />
      )}
      {/* 8. Group Info Detail View (Cover/Name/Description/Members) */}
      {isGroupInfoOpen && chat.type === "group" && (
        <GroupInfoModal
          chat={chat}
          members={demoGroupMembers}
          messages={messages}
          availableUsersForInvite={availableUsersForInvite || []}
          onInviteMembers={onInviteMembers || (() => {})}
          onViewMedia={(url) => setViewingMedia(url)}
          onLeaveGroup={onLeaveGroup || (() => {})}
          onDeleteGroup={onDeleteGroup || (() => {})}
          onUpdateGroupInfo={onUpdateGroupInfo || (() => {})}
          onClose={() => setIsGroupInfoOpen(false)}
        />
      )}
      {/* FUTURE: Code reference for persisting messages in PostgreSQL database using server proxy */}
      {/* // FUTURE: POST request to Express API: /api/messages with body { chatId: chat.id, text: inputText } */}
    </section>
  );
}
