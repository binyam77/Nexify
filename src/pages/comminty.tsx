/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { CheckCircle } from "lucide-react";

import ChatsSidebar from "../components/ChatsSidebar";
import MessageArea from "../components/MessageArea";
import NewChannelModal from "../components/NewChannelModal";
import NewGroupModal from "../components/NewGroupModal";
import Profile from "./profile";
import { useAuth } from "../context/AuthContext";
import type { Chat, Message, NavTab } from "../types";
import { useLocation } from "react-router-dom";
import { useUI } from "../context/UIContext";
import CreateChoiceModal from "../components/CreateChoiceModal";
import MemberPickerModal from "../components/MemberPickerModal";
import type { SelectableUser } from "../types";
// ==========================================
// Title: This is the primary Community.tsx file
// ==========================================
// This is the main workspace component managing the Nexify Community features.
// Features a mobile-responsive, Telegram-style layout, and an elegant desktop dual-pane view.
// Users can create new communities/groups and join existing ones.
export default function Community() {
  const [activeTab, setActiveTab] = useState<NavTab>("community");
  const [globalUploadTrigger, setGlobalUploadTrigger] = useState(false);
  const [activeChatId, setActiveChatId] = useState<string | null>(null); // መጀመሪያ ላይ Rooms list ብቻ ይታይ፤ ምንም chat auto-select አይደረግም

  const [isNewChannelOpen, setIsNewChannelOpen] = useState(false);
  const [isNewGroupOpen, setIsNewGroupOpen] = useState(false);
  const [isCreateChoiceOpen, setIsCreateChoiceOpen] = useState(false);
  const [isMemberPickerOpen, setIsMemberPickerOpen] = useState(false);
  const [pickedMembers, setPickedMembers] = useState<SelectableUser[]>([]);

  // Group member-picker's data source — ወደፊት real follow/follower data ብቻ ይተካዋል፣ MemberPickerModal ራሱ አይቀየርም
  // ⏳ ለጊዜው Profile's demo otherUsers — backend ሲመጣ: GET /api/users/me/following ን ይተካል
  const availableMembersForPicker: SelectableUser[] = [
    { id: "abel_codes", name: "Abel T.", username: "abel_codes", photo: "" },
    { id: "betty_dev", name: "Betty Dev", username: "betty_dev", photo: "" },
  ];

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
        name: "Sniper trader",
        description: "Weekly analsis  forex",
        lastMsgText: "System: Subscribe to get our weekly digest!",
        lastMsgSender: "System",
        lastMsgTime: "Yesterdey",
        unreadCount: 1,
        avatarLabel: "ST",
        bgGradient: "bg-gradient-3",
        membersCount: 860,
        onlineCount: 0,
        isJoined: false,
        type: "channel",
        isCreatedByMe: false,
      },
      {
        id: "group-demo-2",
        name: "Nq emini tarders",
        lastMsgText: "Sustem: Subscribe to get our weeky digest!",
        lastMsgSender: "Binjamin",
        lastMsgTime: "Yesterday",
        unreadCount: 0,
        avatarLabel: "NQ",
        bgGradient: "bg-gradient-1",
        membersCount: 1005,
        onlineCount: 235,
        isJoined: false,
        type: "group",
      },
      {
        id: "chat-2",
        name: "Abel T. (UI/UX Designer)",
        participantUsername: "abel_codes",
        bio: "Passionate UI/UX designer crafting clean, human-centered interfaces",
        lastMsgText: "Abel: The mobile screen version looks amazing!",
        lastMsgSender: "Abel",
        lastMsgTime: "09:15 AM",
        unreadCount: 0,
        avatarLabel: "AT",
        bgGradient: "bg-gradient-2",
        membersCount: 2,
        onlineCount: 1,
        isJoined: false,
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
        "group-demo-1": [
          {
            id: "m2",
            senderName: "Nq emini tarders",
            text: "Anyone up for pair programming this weekend?",
            time: "Yesterdey",
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

  // Save changes to localStorage on change
  useEffect(() => {
    localStorage.setItem("nexify_chats", JSON.stringify(chats));
  }, [chats]);

  useEffect(() => {
    localStorage.setItem("nexify_messages_db", JSON.stringify(messagesDb));
  }, [messagesDb]);

  // Total unread messages count for active chats to display on the sidebar
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Sidebar's unreadCommunityCount prop ላይ ጥክም ላይ ይውላል
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

  // Delete chat/group/channel permanently (localStorage ውስጥ ካለው ሙሉ ይጠፋል፤ refresh/relogin ቢሆንም አይመለስም)
  const handleDeleteChat = (chatId: string) => {
    setChats((prev) => prev.filter((c) => c.id !== chatId));
    setMessagesDb((prev) => {
      const updated = { ...prev };
      delete updated[chatId];
      return updated;
    });
    if (activeChatId === chatId) {
      setActiveChatId(null);
    }
    triggerToast("🗑️ Deleted successfully!");

    // ==========================================
    // FUTURE: Delete on backend too:
    // ==========================================
    // fetch(`/api/communities/${chatId}`, { method: 'DELETE' });
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
  // Create new group logic
  const handleCreateGroup = (
    newChat: Chat,
    initialMembers: SelectableUser[],
  ) => {
    setChats((prev) => [newChat, ...prev]);
    setMessagesDb((prev) => ({
      ...prev,
      [newChat.id]: [],
    }));
    setActiveChatId(newChat.id);
    setPickedMembers([]);
    const memberNote =
      initialMembers.length > 0
        ? ` with ${initialMembers.length} member${initialMembers.length > 1 ? "s" : ""} added`
        : "";
    triggerToast(
      `🚀 Group "${newChat.name}" created successfully${memberNote}!`,
    );
    // ⏳ FUTURE: POST /api/groups/:id/members with initialMembers.map(m => m.id)
    // ==========================================
    // FUTURE: Save newly created group in PostgreSQL using INSERT query:
    // ==========================================
    // fetch('/api/groups/create', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(newChat)
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
    bio?: string;
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
        bio: user.bio,
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
        [newChatId]: [],
      }));
      setActiveChatId(newChatId);
      setActiveTab("community");
      triggerToast(`💬 Secure conversation started with ${user.name}`);
    }
  };
  //Profile >> Community chat redirect
  useEffect(() => {
    const state = location.state as {
      openChatWith?: {
        name: string;
        username: string;
        photo: string;
        bio?: string;
      };
    };
    /*eslint-disable react-hooks/set-state-in-effect -- location.state ን redirect trigger አድርገን መጠከም ትክክለኛ  pattern ነው*/
    if (state?.openChatWith) {
      handleStartChat(state.openChatWith);
      window.history.replaceState({}, "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handleStartChat በየ render ስለሚፈጠር dependency ማድረግ loop ይፈጥራል
  }, [location.state]);
  // Active selected room details
  const activeChat = chats.find((c) => c.id === activeChatId) || null;
  const activeMessages = activeChatId ? messagesDb[activeChatId] || [] : [];

  // Channel/ Group/Chat  ውስጥ ሲገባ BottomNav መደበክ
  const { setFullscreenModalOpen } = useUI();
  useEffect(() => {
    setFullscreenModalOpen(!!activeChatId);
    return () => setFullscreenModalOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChatId]);
  return (
    <div className="flex w-full h-screen overflow-hidden bg-gray-50 text-gray-900 font-sans md:relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 bg-gray-900 border border-gray-800 text-white font-extrabold text-xs md:text-sm px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 z-[100] animate-bounce select-none">
          <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

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
                onCreatePlusClick={() => setIsCreateChoiceOpen(true)}
                onDeleteChat={handleDeleteChat}
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

      {/* 3. CREATE CHOICE MODAL (+ ተጭኖ ሲከፈት Channel/Group ምርጫ) */}
      <CreateChoiceModal
        isOpen={isCreateChoiceOpen}
        onClose={() => setIsCreateChoiceOpen(false)}
        onSelectChannel={() => {
          setIsCreateChoiceOpen(false);
          setIsNewChannelOpen(true);
        }}
        onSelectGroup={() => {
          setIsCreateChoiceOpen(false);
          setIsNewGroupOpen(true);
        }}
      />

      {/* 4. NEW CHANNEL MODAL (Create new Channel dialog window) */}
      <NewChannelModal
        isOpen={isNewChannelOpen}
        onClose={() => setIsNewChannelOpen(false)}
        onCreateChannel={handleCreateChannel}
      />
      {/*4. NEW GROUP MODAL (Create new Group dialog window)*/}
      <NewGroupModal
        isOpen={isNewGroupOpen}
        onClose={() => setIsNewGroupOpen(false)}
        onCreateGroup={handleCreateGroup}
        onOpenMemberPicker={() => setIsMemberPickerOpen(true)}
        pickedMembers={pickedMembers}
      />

      {/* 5. MEMBER PICKER MODAL (Group creation ውስጥ members መምረጫ) */}
      <MemberPickerModal
        isOpen={isMemberPickerOpen}
        availableUsers={availableMembersForPicker}
        onClose={() => setIsMemberPickerOpen(false)}
        onConfirm={(selected) => {
          setPickedMembers(selected);
          setIsMemberPickerOpen(false);
        }}
      />
    </div>
  );
}
