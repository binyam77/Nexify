/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { CheckCircle } from "lucide-react";
import Sidebar from "../components/Sidebar";
import ChatsSidebar from "../components/ChatsSidebar";
import MessageArea from "../components/MessageArea";
import NewGroupModal from "../components/NewGroupModal";
import Profile from "./profile";
import { useAuth } from "../context/AuthContext";
import type { Chat, Message, NavTab } from "../types";
import { saveMediaFile } from "../lib/db";

// ==========================================
// Title: This is the primary Community.tsx file
// ==========================================
// This is the main workspace component managing the Nexify Community features.
// Features a mobile-responsive, Telegram-style layout, and an elegant desktop dual-pane view.
// Users can create new communities/groups and join existing ones.
export default function Community() {
  const [activeTab, setActiveTab] = useState<NavTab>("community");
  const [globalUploadTrigger, setGlobalUploadTrigger] = useState(false);
  const [activeChatId, setActiveChatId] = useState<string | null>("chat-1"); // መጀመሪያ ላይ Nexify Developers የተመረጠ ይሁን
  const [isNewGroupOpen, setIsNewGroupOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // User profile details (Current member profile loaded dynamically from localStorage)
  const { user } = useAuth();
  const userProfile = {
    name: user?.username || "User",
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
        id: "chat-1",
        name: "Nexify Developers",
        lastMsgText: "Yonas: I have finished the new CSS layout...",
        lastMsgSender: "Yonas",
        lastMsgTime: "10:42 AM",
        unreadCount: 3,
        avatarLabel: "NX",
        bgGradient: "bg-gradient-1",
        membersCount: 1420,
        onlineCount: 45,
        isJoined: true,
        type: "group",
      },
      {
        id: "chat-2",
        name: "Abel T. (UI/UX Designer)",
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
      {
        id: "chat-3",
        name: "Ethiopian Tech Community",
        lastMsgText: "Natnael: Who will participate in tomorrow's workshop?",
        lastMsgSender: "Natnael",
        lastMsgTime: "Yesterday",
        unreadCount: 0,
        avatarLabel: "ET",
        bgGradient: "bg-gradient-3",
        membersCount: 4120,
        onlineCount: 198,
        isJoined: true,
        type: "group",
      },
      {
        id: "chat-4",
        name: "Business & Startup Group",
        lastMsgText: "Kia: I have sent the updated financial model.",
        lastMsgSender: "Kia",
        lastMsgTime: "Sunday",
        unreadCount: 0,
        avatarLabel: "BS",
        bgGradient: "bg-gradient-4",
        membersCount: 650,
        onlineCount: 8,
        isJoined: true,
        type: "group",
      },
      {
        id: "chat-5",
        name: "Open Source Pioneers",
        lastMsgText: "Welcome! Join this public room to collaborate.",
        lastMsgSender: "System",
        lastMsgTime: "08:00 AM",
        unreadCount: 0,
        avatarLabel: "OS",
        bgGradient: "bg-gradient-2",
        membersCount: 2310,
        onlineCount: 34,
        isJoined: false,
        type: "group",
      },
      {
        id: "chat-6",
        name: "Mahlet Dev (Frontend Pioneer)",
        lastMsgText: "Explore indexing, relational tables and schemas.",
        lastMsgSender: "System",
        lastMsgTime: "3 days ago",
        unreadCount: 0,
        avatarLabel: "MD",
        bgGradient: "bg-gradient-4",
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
        "chat-1": [
          {
            id: "m1",
            senderName: "Yonas",
            text: "Hello everyone! I just finished designing the new Nexify community page. Please take a look and share your feedback.",
            time: "10:38 AM",
            isSentByMe: false,
          },
          {
            id: "m2",
            senderName: "Me",
            text: "Wow! This looks clean! Making the mobile view look and feel exactly like Telegram is going to make it very user-friendly.",
            time: "10:40 AM",
            isSentByMe: true,
          },
          {
            id: "m3",
            senderName: "Helen",
            text: "Looks great! The top search feature and the sidebar navigation icons are perfectly aligned. Keep it up!",
            time: "10:42 AM",
            isSentByMe: false,
          },
        ],
        "chat-2": [
          {
            id: "m2_1",
            senderName: "Almaz",
            text: "The mobile screen version looks amazing! I used Inter for buttons and Outfit for display headers.",
            time: "09:15 AM",
            isSentByMe: false,
          },
        ],
        "chat-3": [
          {
            id: "m3_1",
            senderName: "Natnael",
            text: "Who will participate in tomorrow's workshop? It will cover scalable Express routers in backend services.",
            time: "Yesterday",
            isSentByMe: false,
          },
        ],
        "chat-4": [
          {
            id: "m4_1",
            senderName: "Kia",
            text: "I have sent the updated financial model. Let me know if we need adjustments for cloud hosting budgets.",
            time: "Sunday",
            isSentByMe: false,
          },
        ],
        "chat-5": [
          {
            id: "m5_1",
            senderName: "System",
            text: 'Welcome to Open Source Pioneers! This group is viewable by all. Click the "Join Community Chat" button below to fully participate.',
            time: "08:00 AM",
            isSentByMe: false,
          },
        ],
        "chat-6": [
          {
            id: "m6_1",
            senderName: "System",
            text: "PostgreSQL discussions feed. Ask indexing, migration, and clustering questions here.",
            time: "3 days ago",
            isSentByMe: false,
          },
        ],
      };
    },
  );

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

  // Create new group/room logic
  const handleCreateGroup = (newChat: Chat) => {
    setChats((prev) => [newChat, ...prev]);
    setMessagesDb((prev) => ({
      ...prev,
      [newChat.id]: [],
    }));
    setActiveChatId(newChat.id);
    triggerToast(`🚀 Community "${newChat.name}" created successfully!`);

    // ==========================================
    // FUTURE: Save newly created community in PostgreSQL using INSERT query:
    // ==========================================
    // fetch('/api/communities/create', {
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
    // Check if we already have a direct chat with this developer
    const existingChat = chats.find(
      (c) => c.type === "chat" && c.name.includes(user.name),
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
                onCreateGroupClick={() => setIsNewGroupOpen(true)}
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

      {/* 3. NEW GROUP MODAL (Create new group/room dialog window) */}
      <NewGroupModal
        isOpen={isNewGroupOpen}
        onClose={() => setIsNewGroupOpen(false)}
        onCreateGroup={handleCreateGroup}
      />
    </div>
  );
}
