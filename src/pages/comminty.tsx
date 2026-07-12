/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { CheckCircle } from "lucide-react";
import Sidebar from "../components/Sidebar";
import ChatsSidebar from "../components/ChatsSidebar";
import MessageArea from "../components/MessageArea";
import NewChannelModal from "../components/NewChannelModal";
import Profile from "./profile";
import { useAuth } from "../context/AuthContext";
import type { Chat, Message, NavTab } from "../types";
import { saveMediaFile } from "../lib/db";
import { useLocation } from "react-router-dom";
// ==========================================
// Title: This is the primary Community.tsx file
// ==========================================
// This is the main workspace component managing the Nexify Community features.
// Features a mobile-responsive, Telegram-style layout, and an elegant desktop dual-pane view.
// Users can create new communities/groups and join existing ones.
export default function Community() {
  const [activeTab, setActiveTab] = useState<NavTab>("community");
  const [globalUploadTrigger, setGlobalUploadTrigger] = useState(false);
  const [activeChatId, setActiveChatId] = useState<string | null>(
    "channel-demo-1",
  ); // መጀመሪያ ላይ Channel Demo የተመረጠ ይሁን
  const [isNewChannelOpen, setIsNewChannelOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // User profile details (Current member profile loaded dynamically from localStorage)
  const { user } = useAuth();
  const userProfile = {
    name: user?.name || user?.username || "User",
    role: user?.bio?.split(".")[0] || "Developer",
    avatar: user?.photo || "",
    username: user?.username || "username",
  };

  // List of group rooms (Community Chats / Channels)
  // Users can create their own rooms or join existing public rooms.
  const [chats, setChats] = useState<Chat[]>(() => {
    const savedChats = localStorage.getItem("nexify_chats");
    if (savedChats) {
      try {
        return JSON.parse(savedChats);
      } catch (e) {
        console.error("Error parsing saved chats from localStorage:", e);
      }
    }
    return [
      {
        id: "channel-demo-1",
        name: "Nexify Announcements",
        lastMsgText: "System: Welcome to our official announcements channel!",
        lastMsgSender: "System",
        lastMsgTime: "10:42 AM",
        unreadCount: 1,
        avatarLabel: "NX",
        bgGradient: "bg-gradient-1",
        membersCount: 1420,
        onlineCount: 0,
        isJoined: true,
        type: "channel",
        isCreatedByMe: true,
      },
      {
        id: "chat-2",
        name: "Abel T. (UI/UX Designer)",
        participantUsername: "abel_codes",
        lastMsgText: "Abel: The mobile screen version looks amazing!",
        lastMsgSender: "Abel",
        lastMsgTime: "09:15 AM",
        unreadCount: 0,
        avatarLabel: "AT",
        bgGradient: "bg-gradient-2",
        membersCount: 2,
        onlineCount: 1,
        isJoined: true,
        type: "chat",
        isOnline: true,
      },
    ];
  });

  // Local message database indexed by chatId
  const [messagesDb, setMessagesDb] = useState<Record<string, Message[]>>(
    () => {
      const savedDb = localStorage.getItem("nexify_messages_db");
      if (savedDb) {
        try {
          return JSON.parse(savedDb);
        } catch (e) {
          console.error("Error parsing saved messages from localStorage:", e);
        }
      }
      return {
        "channel-demo-1": [
          {
            id: "m1",
            senderName: "System",
            text: "Welcome to our official announcements channel! Only the channel owner can post here — subscribers can react with emoji.",
            time: "10:42 AM",
            isSentByMe: false,
          },
        ],
        "chat-2": [
          {
            id: "m2_1",
            senderName: "Abel",
            text: "The mobile screen version looks amazing! I used Inter for buttons and Outfit for display headers.",
            time: "09:15 AM",
            isSentByMe: false,
          },
        ],
      };
    },
  );
  const location = useLocation();
  // Profile >>Community chat redirect
  useEffect(() => {
    const state = location.state as {
      openChatWith?: { name: string; username: string; photo: string };
    };
    if (state?.openChatWith) {
      handleStartChat(state.openChatWith);
      // State ተዳ ፟>> reload ሲሆን እንደገና እንዳይከፈት
      window.history.replaceState({}, "");
    }
  }, []);
  // Save changes to localStorage on change
  useEffect(() => {
    localStorage.setItem("nexify_chats", JSON.stringify(chats));
  }, [chats]);

  useEffect(() => {
    localStorage.setItem("nexify_messages_db", JSON.stringify(messagesDb));
  }, [messagesDb]);

  // Total unread messages count for active chats to display on the sidebar
  const unreadTotal = chats.reduce(
    (sum, c) => sum + (c.isJoined ? c.unreadCount : 0),
    0,
  );

  // Return formatted timestamp showing date and time
  const getFormattedDateTime = () => {
    const now = new Date();
    const optionsDate: Intl.DateTimeFormatOptions = {
      month: "short",
      day: "numeric",
    };
    const optionsTime: Intl.DateTimeFormatOptions = {
      hour: "2-digit",
      minute: "2-digit",
    };
    const dateStr = now.toLocaleDateString("en-US", optionsDate);
    const timeStr = now.toLocaleTimeString("en-US", optionsTime);
    return `${dateStr}, ${timeStr}`;
  };

  // Trigger toast notification
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Chat/Room selection handler
  const handleSelectChat = (chatId: string) => {
    setActiveChatId(chatId);

    // Clear unread count for this selected room
    setChats((prev) =>
      prev.map((c) => (c.id === chatId ? { ...c, unreadCount: 0 } : c)),
    );
  };

  // Send message logic (Supports attachments for rich media like image, video, audio & pdf)
  const handleSendMessage = (
    text: string,
    mediaUrl?: string,
    mediaType?: "image" | "video" | "audio" | "pdf",
  ) => {
    if (!activeChatId) return;

    const formattedTime = getFormattedDateTime();

    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      senderName: userProfile.name,
      text: text,
      time: formattedTime,
      isSentByMe: true,
      mediaUrl,
      mediaType,
      reactions: [],
    };

    // 1. Update message store (Messages DB Update)
    setMessagesDb((prev) => ({
      ...prev,
      [activeChatId]: [...(prev[activeChatId] || []), newMsg],
    }));

    // 2. Update the last message preview text and time on the sidebar list
    setChats((prev) =>
      prev.map((c) => {
        if (c.id === activeChatId) {
          const previewText = mediaUrl
            ? (mediaType === "video" ? "🎥 Video Post" : "📷 Photo Post") +
              (text ? `: ${text}` : "")
            : text;
          return {
            ...c,
            lastMsgText: previewText,
            lastMsgSender: userProfile.name,
            lastMsgTime: formattedTime,
          };
        }
        return c;
      }),
    );
  };

  // Quick Post Creator: saves new community/feed posts directly from the Community tab
  const handleQuickPostCreated = async (text: string, file: File | null) => {
    const postId = Date.now();
    let isVideo = false;
    let fileName = "";

    if (file) {
      isVideo = file.type.startsWith("video/");
      fileName = file.name;
      try {
        await saveMediaFile(postId, file);
      } catch (err) {
        console.error("Error saving media post file in IndexedDB:", err);
      }
    }

    const hashtags = text.match(/#\w+/g) || [];
    const newPost = {
      id: postId,
      isVideo,
      fileName,
      description: text.trim(),
      hashtags,
      username: userProfile.username,
      avatar: userProfile.avatar || null,
      views: 0,
      likes: 0,
      liked: false,
      saves: 0,
      saved: false,
      timestamp: new Date().toISOString(),
    };

    const savedPosts = localStorage.getItem("userPostsMeta");
    let postsList = [];
    if (savedPosts) {
      try {
        postsList = JSON.parse(savedPosts);
      } catch (e) {
        console.error("Error loading posts list for quick creation:", e);
      }
    }
    const updated = [newPost, ...postsList];
    localStorage.setItem("userPostsMeta", JSON.stringify(updated));
    triggerToast("🚀 አዲስ ልጥፍ ወደ ፕሮፋይልዎ በተሳካ ሁኔታ ተለጥፏል!");
  };

  // Edit message logic
  const handleEditMessage = (messageId: string, newText: string) => {
    if (!activeChatId) return;

    setMessagesDb((prev) => ({
      ...prev,
      [activeChatId]: (prev[activeChatId] || []).map((msg) =>
        msg.id === messageId ? { ...msg, text: newText, isEdited: true } : msg,
      ),
    }));

    // Update the last message text in the sidebar if the edited message is the last one
    setChats((prev) =>
      prev.map((c) => {
        if (c.id === activeChatId) {
          return {
            ...c,
            lastMsgText: newText,
          };
        }
        return c;
      }),
    );
  };

  // Delete message logic (removes message and dynamically recalculates sidebar preview)
  const handleDeleteMessage = (messageId: string) => {
    if (!activeChatId) return;

    const currentMsgs = messagesDb[activeChatId] || [];
    const updatedMsgs = currentMsgs.filter((msg) => msg.id !== messageId);

    setMessagesDb((prev) => ({
      ...prev,
      [activeChatId]: updatedMsgs,
    }));

    // Update the last message in the sidebar
    setChats((prev) =>
      prev.map((c) => {
        if (c.id === activeChatId) {
          if (updatedMsgs.length > 0) {
            const lastMsg = updatedMsgs[updatedMsgs.length - 1];
            const senderPrefix = lastMsg.isSentByMe ? "Me" : lastMsg.senderName;
            const previewText = lastMsg.mediaUrl
              ? (lastMsg.mediaType === "video"
                  ? "🎥 Video Post"
                  : "📷 Photo Post") + (lastMsg.text ? `: ${lastMsg.text}` : "")
              : lastMsg.text;
            return {
              ...c,
              lastMsgText:
                c.type === "group"
                  ? `${senderPrefix}: ${previewText}`
                  : previewText,
              lastMsgTime: lastMsg.time,
            };
          } else {
            return {
              ...c,
              lastMsgText: "No messages here yet.",
              lastMsgTime: "",
            };
          }
        }
        return c;
      }),
    );

    triggerToast("🗑️ Message deleted successfully!");
  };

  // Reaction logic (Allows at most one selected reaction per message per user)
  const handleReactMessage = (messageId: string, emoji: string) => {
    if (!activeChatId) return;

    setMessagesDb((prev) => ({
      ...prev,
      [activeChatId]: (prev[activeChatId] || []).map((msg) => {
        if (msg.id !== messageId) return msg;

        // First remove any existing reaction by 'Me' (ensuring max 1 reaction per user)
        let currentReactions = msg.reactions || [];

        // Find if 'Me' had a prior reaction on any emoji
        const priorReaction = currentReactions.find((r) =>
          r.users.includes("Me"),
        );

        // Remove 'Me' from the prior reaction
        if (priorReaction) {
          currentReactions = currentReactions
            .map((r) => {
              if (r.users.includes("Me")) {
                const updatedUsers = r.users.filter((u) => u !== "Me");
                return {
                  ...r,
                  count: updatedUsers.length,
                  users: updatedUsers,
                };
              }
              return r;
            })
            .filter((r) => r.count > 0);
        }

        // If the newly selected emoji is different from the prior one, add it:
        const wasPriorThisEmoji =
          priorReaction && priorReaction.emoji === emoji;

        if (!wasPriorThisEmoji) {
          // Check if the emoji already has a reaction block
          const existingReaction = currentReactions.find(
            (r) => r.emoji === emoji,
          );
          if (existingReaction) {
            currentReactions = currentReactions.map((r) =>
              r.emoji === emoji
                ? { ...r, count: r.count + 1, users: [...r.users, "Me"] }
                : r,
            );
          } else {
            currentReactions = [
              ...currentReactions,
              { emoji, count: 1, users: ["Me"] },
            ];
          }
        }

        return { ...msg, reactions: currentReactions };
      }),
    }));
  };

  // Join community group room handler
  const handleJoinChat = (chatId: string) => {
    const targetChat = chats.find((c) => c.id === chatId);
    const isChannel = targetChat?.type === "channel";

    setChats((prev) =>
      prev.map((c) => {
        if (c.id === chatId) {
          triggerToast(`🎉 You have successfully joined "${c.name}"!`);
          return {
            ...c,
            isJoined: true,
            membersCount: c.membersCount + 1,
            unreadCount: 0,
          };
        }
        return c;
      }),
    );

    if (!isChannel) {
      // Send a system welcome message inside group chat
      const systemMsg: Message = {
        id: `sys-${Date.now()}`,
        senderName: "System",
        text: `🎉 ${userProfile.name} has joined the community group! Welcome!`,
        time: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        isSentByMe: false,
      };

      setMessagesDb((prev) => ({
        ...prev,
        [chatId]: [...(prev[chatId] || []), systemMsg],
      }));
    }

    // ==========================================================
    // FUTURE: Register joining group in PostgreSQL using user ID and group ID:
    // ==========================================================
    // fetch('/api/communities/join', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ chatId, userId: 'current_user_id' })
    // });
  };

  // Create new channel logic
  const handleCreateChannel = (newChat: Chat) => {
    setChats((prev) => [newChat, ...prev]);
    setMessagesDb((prev) => ({
      ...prev,
      [newChat.id]: [],
    }));
    setActiveChatId(newChat.id);
    triggerToast(`📢 Channel "${newChat.name}" created successfully!`);

    // ==========================================
    // FUTURE: Save newly created channel in PostgreSQL using INSERT query:
    // ==========================================
    // fetch('/api/channels/create', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(newChat)
    // });
  };

  // Start or open a chat with another developer
  const handleStartChat = (user: {
    name: string;
    username: string;
    photo: string;
  }) => {
    // Security:exact username match ብቻ (name substring matching broken  access control risk ነበረው -
    // ተመሳሳይ/ተመሳሳይ ስም ያላቸው 2 ተተካሚዎች ቢኖሩም የተሳሳተ ፕሪቫተ ችሃት ይከፍት ነበረ)
    const existingChat = chats.find(
      (c) => c.type === "chat" && c.participantUsername === user.username,
    );

    if (existingChat) {
      setActiveChatId(existingChat.id);
      setActiveTab("community");
      triggerToast(`💬 Chat opened with ${user.name}`);
    } else {
      // Create a brand new direct chat
      const newChatId = `chat-direct-${Date.now()}`;
      const initials = user.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
      const newChat: Chat = {
        id: newChatId,
        name: `${user.name} (@${user.username})`,
        participantUsername: user.username,
        lastMsgText: "Welcome! Start your conversation here.",
        lastMsgSender: user.name,
        lastMsgTime: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        unreadCount: 0,
        avatarLabel: initials,
        avatarUrl: user.photo || undefined,
        bgGradient: "bg-gradient-3",
        membersCount: 2,
        onlineCount: 1,
        isJoined: true,
        type: "chat",
        isOnline: true,
      };

      setChats((prev) => [newChat, ...prev]);
      setMessagesDb((prev) => ({
        ...prev,
        [newChatId]: [
          {
            id: `init-${Date.now()}`,
            senderName: "System",
            text: `👋 This is the start of your secure direct message channel with ${user.name}.`,
            time: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            isSentByMe: false,
          },
        ],
      }));
      setActiveChatId(newChatId);
      setActiveTab("community");
      triggerToast(`💬 Secure conversation started with ${user.name}`);
    }
  };

  // Active selected room details
  const activeChat = chats.find((c) => c.id === activeChatId) || null;
  const activeMessages = activeChatId ? messagesDb[activeChatId] || [] : [];

  return (
    <div className="flex w-full h-screen overflow-hidden bg-gray-50 text-gray-900 font-sans md:relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-gray-900 border border-gray-800 text-white font-extrabold text-xs md:text-sm px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 z-[100] animate-bounce select-none">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. SIDEBAR (Left navigation bar) */}

      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab: NavTab) => {
          setActiveTab(tab);
        }}
        unreadCommunityCount={unreadTotal}
        onUploadClick={() => {
          setActiveTab("profile");

          setGlobalUploadTrigger(true);
        }}
        hideOnMobile={activeTab === "community" && !!activeChatId}
      />

      {/* Dynamic Tab Switching */}
      {activeTab === "community" && (
        /* Workspace View (Community Workspace Card) */
        <main className="flex-1 flex overflow-hidden h-full min-h-0">
          <div className="flex-1 flex w-full h-full overflow-hidden relative min-h-0">
            {/* Chats sidebar list
                Hidden on mobile screen if a chat room is active (Telegram-style navigation) */}
            <div
              className={`w-full md:w-auto h-full shrink-0 ${activeChatId ? "hidden md:block" : "block"}`}
            >
              <ChatsSidebar
                chats={chats}
                activeChatId={activeChatId}
                onSelectChat={handleSelectChat}
                onCreateChannelClick={() => setIsNewChannelOpen(true)}
                onNewPostClick={() => {
                  setActiveTab("profile");
                  setGlobalUploadTrigger(true);
                }}
              />
            </div>

            {/* Active messaging workspace
                Hidden on mobile screen if no active chat is selected */}
            <div
              className={`flex-1 h-full relative min-h-0 overflow-hidden ${!activeChatId ? "hidden md:block" : "block"}`}
            >
              <MessageArea
                chat={activeChat}
                messages={activeMessages}
                onSendMessage={handleSendMessage}
                onEditMessage={handleEditMessage}
                onDeleteMessage={handleDeleteMessage}
                onReactMessage={handleReactMessage}
                onJoinChat={handleJoinChat}
                onBack={() => setActiveChatId(null)} // Handle going back on mobile
                currentUserProfile={userProfile}
              />
            </div>
          </div>
        </main>
      )}

      {activeTab === "profile" && (
        <Profile
          triggerGlobalUpload={globalUploadTrigger}
          onClearGlobalUpload={() => setGlobalUploadTrigger(false)}
          onBackToCommunity={() => setActiveTab("community")}
          onStartChat={handleStartChat}
        />
      )}

      {/* 3. NEW CHANNEL MODAL (Create new Channel dialog window) */}
      <NewChannelModal
        isOpen={isNewChannelOpen}
        onClose={() => setIsNewChannelOpen(false)}
        onCreateChannel={handleCreateChannel}
      />
    </div>
  );
}
