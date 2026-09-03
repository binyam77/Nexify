/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
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
import {
  listMyCommunitiesRequest,
  listSuggestedCommunitiesRequest,
  createCommunityRequest,
  joinCommunityRequest,
  leaveCommunityRequest,
  deleteCommunityRequest,
  updateCommunityRequest,
  listMessagesRequest,
  editMessageRequest,
  deleteMessageRequest,
  togglePinMessageRequest,
  reactToMessageRequest,
  type MessageMediaType as BackendMessageMediaType,
} from "../api/community.api";
import {
  mapCommunityListItemToChat,
  mapCommunitySuggestedToChat,
  mapCommunityMessageToMessage,
} from "../lib/realtime.mappers";
import { useRealtime } from "../context/RealtimeContext";
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
    { id: "abel_dj", name: "Abel T.", username: "abel_dj", photo: "" },
    { id: "betty_dev", name: "Betty Dev", username: "betty_dev", photo: "" },
  ];

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // User profile details (Current member profile loaded dynamically from localStorage)
  const { user, accessToken } = useAuth();
  const { socket, joinRoom, sendMessage, markRead, startTyping, stopTyping } =
    useRealtime();
  const userProfile = {
    name: user?.name || user?.username || "User",
    role: user?.bio?.split(".")[0] || "Developer",
    avatar: user?.photo || "",
    username: user?.username || "username",
  };

  // Chat list. The single "chat-2" entry below is Chat-domain (1:1) DEMO
  // data — untouched, out of this refactor's scope. Community entries
  // (channel/group) are no longer seeded here or from localStorage; they
  // are loaded from the real backend by the effect further down and
  // merged into this same array once they arrive.
  const [chats, setChats] = useState<Chat[]>([
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
  ]);

  // Message store indexed by chat id. For Community chats this is
  // populated from the backend (listMessagesRequest + live 'message:new'
  // events); for the demo "chat-2" entry it stays local-only, unchanged.
  const [messagesDb, setMessagesDb] = useState<Record<string, Message[]>>({
    "chat-2": [
      {
        id: "m2_1",
        senderName: "Abel",
        text: "The mobile screen version looks amazing! I used Inter for buttons and Outfit for display headers.",
        time: "09:15 AM",
        isSentByMe: false,
      },
    ],
  });
  const location = useLocation();

  // ================= LOAD COMMUNITIES (mine + suggested) =================
  useEffect(() => {
    if (!accessToken || !user) return;
    const token = accessToken; // narrowed local const - nested closures below can safly use this
    let cancelled = false;

    async function loadCommunities() {
      try {
        const [mine, suggested] = await Promise.all([
          listMyCommunitiesRequest(token),
          listSuggestedCommunitiesRequest(token),
        ]);
        if (cancelled) return;

        const mineChats = mine.items.map((item) =>
          mapCommunityListItemToChat(item, user.id),
        );
        const suggestedChats = suggested.items.map(mapCommunitySuggestedToChat);

        setChats((prev) => {
          const chatOnly = prev.filter((c) => c.type === "chat");
          return [...mineChats, ...suggestedChats, ...chatOnly];
        });
      } catch (err) {
        console.error("Failed to load communities:", err);
        triggerToast("⚠️ Could not load your communities.");
      }
    }

    void loadCommunities();
    return () => {
      cancelled = true;
    };
  }, [accessToken, user]);

  // ================= REALTIME: incoming messages =================
  useEffect(() => {
    if (!socket || !user) return;

    function handleMessageNew(payload: {
      scope: string;
      targetId: string;
      message: unknown;
    }) {
      if (payload.scope !== "community") return;

      const mapped = mapCommunityMessageToMessage(
        payload.message as Parameters<typeof mapCommunityMessageToMessage>[0],
        user!.id,
      );

      setMessagesDb((prev) => ({
        ...prev,
        [payload.targetId]: [...(prev[payload.targetId] || []), mapped],
      }));

      setChats((prev) =>
        prev.map((c) => {
          if (c.id !== payload.targetId) return c;
          const isViewingThisChat = c.id === activeChatId;
          return {
            ...c,
            lastMsgText: mapped.mediaUrl
              ? mapped.text || "📷 Media"
              : mapped.text,
            lastMsgSender: mapped.senderName,
            lastMsgTime: mapped.time,
            unreadCount:
              isViewingThisChat || mapped.isSentByMe ? 0 : c.unreadCount + 1,
          };
        }),
      );

      if (payload.targetId === activeChatId) {
        markRead("community", payload.targetId).catch(() => {});
      }
    }

    function handleTypingStart(payload: {
      scope: string;
      targetId: string;
      userId: string;
    }) {
      if (payload.scope !== "community" || payload.userId === user!.id) return;
      setChats((prev) =>
        prev.map((c) =>
          c.id === payload.targetId
            ? {
                ...c,
                typingUsers: [
                  ...new Set([...(c.typingUsers || []), payload.userId]),
                ],
              }
            : c,
        ),
      );
    }

    function handleTypingStop(payload: {
      scope: string;
      targetId: string;
      userId: string;
    }) {
      if (payload.scope !== "community") return;
      setChats((prev) =>
        prev.map((c) =>
          c.id === payload.targetId
            ? {
                ...c,
                typingUsers: (c.typingUsers || []).filter(
                  (id) => id !== payload.userId,
                ),
              }
            : c,
        ),
      );
    }

    socket.on("message:new", handleMessageNew);
    socket.on("typing:start", handleTypingStart);
    socket.on("typing:stop", handleTypingStop);
    return () => {
      socket.off("message:new", handleMessageNew);
      socket.off("typing:start", handleTypingStart);
      socket.off("typing:stop", handleTypingStop);
    };
  }, [socket, user, activeChatId, markRead]);

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
  const isCommunityChat = (chat: Chat | undefined | null) =>
    chat?.type === "channel" || chat?.type === "group";

  const handleLeaveGroup = async (chatId: string) => {
    const target = chats.find((c) => c.id === chatId);

    if (isCommunityChat(target)) {
      if (!accessToken) return;
      try {
        await leaveCommunityRequest(accessToken, chatId);
      } catch (err) {
        console.error("Failed to leave community:", err);
        triggerToast("⚠️ Failed to leave. Please try again.");
        return;
      }
    }

    setChats((prev) =>
      prev.map((c) =>
        c.id === chatId
          ? {
              ...c,
              isJoined: false,
              membersCount: Math.max(0, c.membersCount - 1),
            }
          : c,
      ),
    );
    if (activeChatId === chatId) setActiveChatId(null);
    triggerToast("👋 You left the group.");
  };

  const handleUpdateGroupInfo = async (
    chatId: string,
    updates: {
      name?: string;
      avatarUrl?: string;
      description?: string;
      cover?: string;
    },
  ) => {
    const target = chats.find((c) => c.id === chatId);

    if (isCommunityChat(target)) {
      if (!accessToken) return;
      try {
        await updateCommunityRequest(accessToken, chatId, {
          name: updates.name,
          avatar: updates.avatarUrl,
          description: updates.description,
          cover: updates.cover,
        });
      } catch (err) {
        console.error("Failed to update community:", err);
        triggerToast("⚠️ Failed to update. Please try again.");
        return;
      }
    }

    setChats((prev) =>
      prev.map((c) => (c.id === chatId ? { ...c, ...updates } : c)),
    );
    triggerToast("✅ Group updated!");
  };
  const handleDeleteChat = async (chatId: string) => {
    const target = chats.find((c) => c.id === chatId);

    if (isCommunityChat(target)) {
      if (!accessToken) return;
      try {
        await deleteCommunityRequest(accessToken, chatId);
      } catch (err) {
        console.error("Failed to delete community:", err);
        triggerToast("⚠️ Failed to delete. Please try again.");
        return;
      }
    }

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
  };

  // DEMO ONLY: contact "typing..." simulation — real backend ሲመጣ Socket.IO 'typing' event
  // emit/receive ብቻ ይተካዋል፣ ይህ function ራሱ ይጠፋል
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleUserTyping = () => {
    if (!activeChatId) return;
    const targetChat = chats.find((c) => c.id === activeChatId);

    if (isCommunityChat(targetChat)) {
      startTyping("community", activeChatId);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping("community", activeChatId);
      }, 2000);
      return;
    }

    if (targetChat?.type !== "chat") return; // ለ demo private chat ብቻ

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    setChats((prev) =>
      prev.map((c) =>
        c.id === activeChatId ? { ...c, typingUsers: [targetChat.name] } : c,
      ),
    );
    typingTimeoutRef.current = setTimeout(() => {
      setChats((prev) =>
        prev.map((c) =>
          c.id === activeChatId ? { ...c, typingUsers: [] } : c,
        ),
      );
    }, 2000);
  };

  // Chat/Room selection handler
  const handleSelectChat = async (chatId: string) => {
    setActiveChatId(chatId);
    setChats((prev) =>
      prev.map((c) => (c.id === chatId ? { ...c, unreadCount: 0 } : c)),
    );

    const target = chats.find((c) => c.id === chatId);
    if (!isCommunityChat(target) || !accessToken || !user) return;

    try {
      await joinRoom("community", chatId);
    } catch (err) {
      console.error("Failed to join realtime room:", err);
    }

    if (messagesDb[chatId]) return; // already loaded this session

    try {
      const result = await listMessagesRequest(accessToken, chatId);
      const mapped = result.items
        .map((m) => mapCommunityMessageToMessage(m, user.id))
        .reverse();
      setMessagesDb((prev) => ({ ...prev, [chatId]: mapped }));
    } catch (err) {
      console.error("Failed to load messages:", err);
      triggerToast("⚠️ Could not load messages.");
    }
  };

  const handleSendMessage = (
    text: string,
    mediaUrl?: string,
    mediaType?: "image" | "video" | "audio" | "pdf",
  ) => {
    if (!activeChatId) return;
    const targetChat = chats.find((c) => c.id === activeChatId);

    if (isCommunityChat(targetChat)) {
      sendMessage({
        scope: "community",
        targetId: activeChatId,
        text: text || undefined,
        mediaUrl,
        mediaType: mediaType
          ? (mediaType.toUpperCase() as BackendMessageMediaType)
          : undefined,
      }).catch((err) => {
        console.error("Failed to send message:", err);
        triggerToast("⚠️ Failed to send message.");
      });
      return;
    }

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
      seen: false,
    };

    // 1. Update message store (Messages DB Update)
    setMessagesDb((prev) => ({
      ...prev,
      [activeChatId]: [...(prev[activeChatId] || []), newMsg],
    }));

    // DEMO ONLY: 1:1 chat ላይ "ተነባቢ" simulation — real backend ሲመጣ ይህ ጨርሶ ይጠፋል፣
    // Socket.IO 'message:read' event ብቻ msg.seen ን ያዘምናል
    if (targetChat?.type === "chat") {
      const sentMsgId = newMsg.id;
      setTimeout(() => {
        setMessagesDb((prev) => ({
          ...prev,
          [activeChatId]: (prev[activeChatId] || []).map((m) =>
            m.id === sentMsgId ? { ...m, seen: true } : m,
          ),
        }));
      }, 1500);
    }
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

  const handleEditMessage = async (messageId: string, newText: string) => {
    if (!activeChatId) return;
    const targetChat = chats.find((c) => c.id === activeChatId);

    if (isCommunityChat(targetChat)) {
      if (!accessToken) return;
      try {
        await editMessageRequest(accessToken, activeChatId, messageId, newText);
      } catch (err) {
        console.error("Failed to edit message:", err);
        triggerToast("⚠️ Failed to edit message.");
        return;
      }
    }

    setMessagesDb((prev) => ({
      ...prev,
      [activeChatId]: (prev[activeChatId] || []).map((msg) =>
        msg.id === messageId ? { ...msg, text: newText, isEdited: true } : msg,
      ),
    }));

    setChats((prev) =>
      prev.map((c) =>
        c.id === activeChatId ? { ...c, lastMsgText: newText } : c,
      ),
    );
  };
  // Delete message logic (removes message and dynamically recalculates sidebar preview)
  const handleDeleteMessage = async (messageId: string) => {
    if (!activeChatId) return;
    const targetChat = chats.find((c) => c.id === activeChatId);

    if (isCommunityChat(targetChat)) {
      if (!accessToken) return;
      try {
        await deleteMessageRequest(accessToken, activeChatId, messageId);
      } catch (err) {
        console.error("Failed to delete message:", err);
        triggerToast("⚠️ Failed to delete message.");
        return;
      }
    }

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
  // Pin/Unpin message toggle (Group/Channel ብቻ)
  const handlePinMessage = async (messageId: string) => {
    if (!activeChatId) return;
    const targetChat = chats.find((c) => c.id === activeChatId);
    if (!isCommunityChat(targetChat) || !accessToken) return;

    try {
      await togglePinMessageRequest(accessToken, activeChatId, messageId);
    } catch (err) {
      console.error("Failed to toggle pin:", err);
      triggerToast("⚠️ Failed to update pin.");
      return;
    }

    setMessagesDb((prev) => ({
      ...prev,
      [activeChatId]: (prev[activeChatId] || []).map((msg) =>
        msg.id === messageId ? { ...msg, isPinned: !msg.isPinned } : msg,
      ),
    }));
  };

  // Reaction logic (Allows at most one selected reaction per message per user)
  const handleReactMessage = async (messageId: string, emoji: string) => {
    if (!activeChatId || !accessToken || !user) return;
    const targetChat = chats.find((c) => c.id === activeChatId);
    if (!isCommunityChat(targetChat)) return;

    try {
      await reactToMessageRequest(accessToken, activeChatId, messageId, emoji);
    } catch (err) {
      console.error("Failed to react:", err);
      triggerToast("⚠️ Failed to react.");
      return;
    }

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

  //Communities/Suggested view ውስጥ Join -- cancel toggle (card ራሱ ከ list አይጠፋም: button ብቻ ይከያየራል)
  const handleToggleJoin = (chatId: string) => {
    const targetChat = chats.find((c) => c.id === chatId);
    if (!targetChat) return;
    if (targetChat.isJoined) {
      handleLeaveGroup(chatId);
    } else {
      handleJoinChat(chatId);
    }
  };

  // Join community group room handler
  const handleJoinChat = async (chatId: string) => {
    const targetChat = chats.find((c) => c.id === chatId);
    if (!isCommunityChat(targetChat) || !accessToken) return;

    try {
      await joinCommunityRequest(accessToken, chatId);
    } catch (err) {
      console.error("Failed to join community:", err);
      triggerToast("⚠️ Failed to join. Please try again.");
      return;
    }

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

    setMessagesDb((prev) => (prev[chatId] ? prev : { ...prev, [chatId]: [] }));
  };
  // Existing group ላይ አዲስ members መጨመሪያ (Invite Members flow)
  const handleInviteMembers = (
    chatId: string,
    invitedUsers: SelectableUser[],
  ) => {
    if (invitedUsers.length === 0) return;

    setChats((prev) =>
      prev.map((c) =>
        c.id === chatId
          ? { ...c, membersCount: c.membersCount + invitedUsers.length }
          : c,
      ),
    );

    const names = invitedUsers.map((u) => u.name).join(", ");
    const systemMsg: Message = {
      id: `sys-invite-${Date.now()}`,
      senderName: "System",
      text: `👋 ${names} ${invitedUsers.length > 1 ? "have" : "has"} been added to the group.`,
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

    triggerToast(
      `✅ Added ${invitedUsers.length} member${invitedUsers.length > 1 ? "s" : ""}!`,
    );
  };

  // Create new group logic
  const handleCreateGroup = async (
    newChat: Chat,
    initialMembers: SelectableUser[],
  ) => {
    if (!accessToken) return;
    try {
      const created = await createCommunityRequest(accessToken, {
        type: "GROUP",
        name: newChat.name,
        description: newChat.description,
        avatar: newChat.avatarUrl,
        cover: newChat.cover,
        themeColor: newChat.bgGradient,
      });

      const mapped = mapCommunitySuggestedToChat({
        ...created,
        membersCount: 1,
      });
      const finalChat: Chat = {
        ...mapped,
        isJoined: true,
        isCreatedByMe: true,
      };

      setChats((prev) => [finalChat, ...prev]);
      setMessagesDb((prev) => ({ ...prev, [finalChat.id]: [] }));
      setActiveChatId(finalChat.id);
      setPickedMembers([]);

      const memberNote =
        initialMembers.length > 0
          ? ` (${initialMembers.length} member${initialMembers.length > 1 ? "s" : ""} selected locally — real invites need the Profile domain)`
          : "";
      triggerToast(
        `🚀 Group "${finalChat.name}" created successfully${memberNote}!`,
      );
    } catch (err) {
      console.error("Failed to create group:", err);
      triggerToast("⚠️ Failed to create group. Please try again.");
    }
  };

  // Create new channel logic
  const handleCreateChannel = async (newChat: Chat) => {
    if (!accessToken) return;
    try {
      const created = await createCommunityRequest(accessToken, {
        type: "CHANNEL",
        name: newChat.name,
        description: newChat.description,
        avatar: newChat.avatarUrl,
        cover: newChat.cover,
        themeColor: newChat.bgGradient,
      });

      const mapped = mapCommunitySuggestedToChat({
        ...created,
        membersCount: 1,
      });
      const finalChat: Chat = {
        ...mapped,
        isJoined: true,
        isCreatedByMe: true,
      };

      setChats((prev) => [finalChat, ...prev]);
      setMessagesDb((prev) => ({ ...prev, [finalChat.id]: [] }));
      setActiveChatId(finalChat.id);
      triggerToast(`📢 Channel "${finalChat.name}" created successfully!`);
    } catch (err) {
      console.error("Failed to create channel:", err);
      triggerToast("⚠️ Failed to create channel. Please try again.");
    }
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
                onJoinChat={handleJoinChat}
                onToggleJoin={handleToggleJoin}
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
                onUserTyping={handleUserTyping}
                onInviteMembers={handleInviteMembers}
                availableUsersForInvite={availableMembersForPicker}
                onEditMessage={handleEditMessage}
                onDeleteMessage={handleDeleteMessage}
                onReactMessage={handleReactMessage}
                onPinMessage={handlePinMessage}
                onJoinChat={handleJoinChat}
                onLeaveGroup={handleLeaveGroup}
                onDeleteGroup={handleDeleteChat}
                onUpdateGroupInfo={handleUpdateGroupInfo}
                onUnsubscribeChannel={handleLeaveGroup}
                onDeleteChannel={handleDeleteChat}
                onUpdateChannelInfo={handleUpdateGroupInfo}
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
