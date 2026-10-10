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
import {
  enqueue,
  dequeue,
  getQueue,
  generateClientMessageId,
} from "../lib/offline-queue";
import {
  listMyConversationsRequest,
  createConversationRequest,
  listChatMessagesRequest,
  editChatMessageRequest,
  deleteChatMessageRequest,
} from "../api/chat.api";
import {
  mapConversationListItemToChat,
  mapChatMessageToMessage,
} from "../lib/realtime.mappers";
import { useRealtime } from "../context/RealtimeContext";
import { useConnectionGate } from "../hooks/useConnectionGate";
import { isServerReachable } from "../lib/connection-check";

// ስህተቱን ለተጠቃሚ (እና ለ debug) የሚታይ አጭር ጽሑፍ ማድረግ
function describeError(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === "object" && err !== null && "message" in err) {
    return String((err as { message: unknown }).message);
  }
  return "Unknown error";
}
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
  // ፍሰቱ ሲሰረዝ New Group ፎርም እንዲጸዳ (key ሲቀየር ዳግም ይፈጠራል)
  const [groupFlowKey, setGroupFlowKey] = useState(0);

  // Group member-picker's data source — ወደፊት real follow/follower data ብቻ ይተካዋል፣ MemberPickerModal ራሱ አይቀየርም
  // ⏳ ለጊዜው Profile's demo otherUsers — backend ሲመጣ: GET /api/users/me/following ን ይተካል
  const availableMembersForPicker: SelectableUser[] = [
    { id: "abel_dj", name: "Abel T.", username: "abel_dj", photo: "" },
    { id: "betty_dev", name: "Betty Dev", username: "betty_dev", photo: "" },
  ];

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isLoadingSuggested, setIsLoadingSuggested] = useState(false);
  const [suggestedError, setSuggestedError] = useState<string | null>(null);
  const [suggestedSearchQuery, setSuggestedSearchQuery] = useState("");
  // የመጨረሻው (trimmed) የ search ጽሑፍ — ያረጀ response ዝርዝሩን እንዳይበክል
  const latestSearchRef = useRef("");
  // የተቀላቀልናቸው realtime rooms — ግንኙነት ተመልሶ socket አዲስ ሲሆን ዳግም ለመቀላቀል
  const joinedRoomsRef = useRef<Set<string>>(new Set());
  // ዝርዝር መጫን ሲወድቅ — በዝርዝሩ ላይ በቋሚነት ይታያል (ከ toast በተለየ አይጠፋም)
  const [listErrors, setListErrors] = useState<{
    mine?: string;
    chats?: string;
  }>({});
  // የ server መድረስ ፍተሻ ሁለቴ እንዳይጀመር
  const checkingConnectionRef = useRef(false);

  // User profile details (Current member profile loaded dynamically from localStorage)
  const { user, accessToken } = useAuth();
  const {
    socket,
    isConnected,
    joinRoom,
    sendMessage,
    markRead,
    startTyping,
    stopTyping,
    getOnlineUsers,
  } = useRealtime();
  // ግንኙነት ደካማ/የለም ከሆነ Community አይሰራም
  const { isUsable: canUseCommunity, browserOnline } =
    useConnectionGate(isConnected);
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
  // Chat list. Community entries (channel/group) and Conversation entries
  // (chat/privateGroup) are both loaded from the real backend — see the
  // effects further down. No demo/local seed data remains.
  const [chats, setChats] = useState<Chat[]>([]);

  // Message store indexed by chat id. For Community chats this is
  // populated from the backend (listMessagesRequest + live 'message:new'
  // events); for the demo "chat-2" entry it stays local-only, unchanged.
  const [messagesDb, setMessagesDb] = useState<Record<string, Message[]>>({});
  const location = useLocation();

  // Trigger toast notification
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // ግንኙነት ከሌለ ለ server ድርጊቶች አጭር መልእክት ብቻ (ምንም አይቀየርም)
  // ለ edit/delete/pin/react: browser offline ከሆነ አጭር መልእክት (socket ሁኔታ አይመለከትም)
  const requireConnection = (): boolean => {
    if (browserOnline) return true;
    triggerToast("No connection — try again when you're back online.");
    return false;
  };

  // "+" ካርድ ውስጥ Create ከመግባት በፊት: server በ 4 ሰከንድ ውስጥ ይደረሳል?
  // (ደካማ/የለም → አይገባም፣ ካርዱ ክፍት ይቆያል)
  const ensureReachable = async (): Promise<boolean> => {
    if (!accessToken || checkingConnectionRef.current) return false;
    checkingConnectionRef.current = true;
    try {
      const ok = await isServerReachable(accessToken);
      if (!ok) {
        triggerToast("Weak or no connection — can't create right now.");
      }
      return ok;
    } finally {
      checkingConnectionRef.current = false;
    }
  };

  // ================= LOAD COMMUNITIES: "Mine" (joined) =================
  const loadMine = async (token: string, currentUserId: string) => {
    try {
      const mine = await listMyCommunitiesRequest(token);
      const mineChats = mine.items.map((item) =>
        mapCommunityListItemToChat(item, currentUserId),
      );
      setListErrors((p) => ({ ...p, mine: undefined }));
      setChats((prev) => {
        // ቀድሞ የነበሩ "mine" community entries ብቻ ይተካሉ — suggested communities
        // እና ሁሉም conversation entries (chat/privateGroup) አይነኩም
        const withoutMine = prev.filter(
          (c) => !(c.isJoined && (c.type === "channel" || c.type === "group")),
        );
        return [...mineChats, ...withoutMine];
      });
    } catch (err) {
      console.error("Failed to load your communities:", err);
      setListErrors((p) => ({ ...p, mine: describeError(err) }));
    }
  };

  // ================= LOAD CONVERSATIONS (Chat domain — 1:1 + private group) =================
  const loadConversations = async (token: string, currentUserId: string) => {
    try {
      const result = await listMyConversationsRequest(token);
      const conversationChats = result.items.map((item) =>
        mapConversationListItemToChat(item, currentUserId),
      );
      setListErrors((p) => ({ ...p, chats: undefined }));
      setChats((prev) => {
        const withoutConversations = prev.filter(
          (c) => c.type !== "chat" && c.type !== "privateGroup",
        );
        const withPresence = conversationChats.map((c) => ({
          ...c,
          isOnline: prev.find((p) => p.id === c.id)?.isOnline,
        }));
        return [...withoutConversations, ...withPresence];
      });
    } catch (err) {
      console.error("Failed to load your chats:", err);
      setListErrors((p) => ({ ...p, chats: describeError(err) }));
    }
  };

  // ================= LOAD COMMUNITIES: "Suggested" (discovery) =================
  const loadSuggested = async (token: string, search?: string) => {
    setIsLoadingSuggested(true);
    setSuggestedError(null);
    try {
      const suggested = await listSuggestedCommunitiesRequest(token, {
        search,
      });
      // ተጠቃሚው ጽሑፉን ከቀየረ/ካጠፋ ይህ response ያረጀ ነው — ችላ በለው
      if ((search ?? "") !== latestSearchRef.current) return;
      const suggestedChats = suggested.items.map(mapCommunitySuggestedToChat);
      setChats((prev) => {
        const withoutSuggested = prev.filter(
          (c) => c.isJoined || c.type === "chat",
        );
        return [...withoutSuggested, ...suggestedChats];
      });
    } catch (err) {
      console.error("Failed to load suggested communities:", err);
      setSuggestedError(
        "Could not load suggested communities. Check your connection and try again.",
      );
    } finally {
      setIsLoadingSuggested(false);
    }
  };

  const retryLists = () => {
    if (!accessToken || !user) return;
    void loadMine(accessToken, user.id);
    void loadConversations(accessToken, user.id);
  };

  const handleRetrySuggested = () => {
    const query = suggestedSearchQuery.trim();
    if (!accessToken || !query) return;
    void loadSuggested(accessToken, query);
  };

  useEffect(() => {
    if (!accessToken || !user) return;
    const token = accessToken;
    const currentUserId = user.id;
    void loadMine(token, currentUserId);
    void loadConversations(token, currentUserId);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loadMine/loadConversations are recreated every render but called synchronously here with this render's values
  }, [accessToken, user]);

  // Suggested list re-fetches whenever the search query changes, debounced
  // by 400ms so we don't fire a request on every keystroke.
  useEffect(() => {
    if (!accessToken) return;
    const token = accessToken;
    const query = suggestedSearchQuery.trim();
    latestSearchRef.current = query;

    // ባዶ ፍለጋ → backend አይጠራም፤ የ public ውጤቶች ይጸዳሉ (የተቀላቀሉት ይቀራሉ)
    if (!query) {
      setSuggestedError(null);
      setIsLoadingSuggested(false);
      setChats((prev) => prev.filter((c) => c.isJoined));
      return;
    }

    const handle = setTimeout(() => {
      void loadSuggested(token, query);
    }, 400);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loadSuggested is recreated every render but called synchronously here with this render's values
  }, [accessToken, suggestedSearchQuery]);

  // ================= REALTIME: incoming messages =================
  useEffect(() => {
    if (!socket || !user) return;

    function handleMessageNew(payload: {
      scope: string;
      targetId: string;
      message: unknown;
    }) {
      if (payload.scope !== "community" && payload.scope !== "conversation")
        return;

      const mapped =
        payload.scope === "community"
          ? mapCommunityMessageToMessage(
              payload.message as Parameters<
                typeof mapCommunityMessageToMessage
              >[0],
              user!.id,
            )
          : mapChatMessageToMessage(
              payload.message as Parameters<typeof mapChatMessageToMessage>[0],
              user!.id,
            );

      if (mapped.clientMessageId) {
        dequeue(mapped.clientMessageId); // no-op if this send was never queued
      }

      setMessagesDb((prev) => {
        const existing = prev[payload.targetId] || [];
        const hadPending = mapped.clientMessageId
          ? existing.some(
              (m) => m.clientMessageId === mapped.clientMessageId && m.pending,
            )
          : false;
        const nextMessages = hadPending
          ? existing.map((m) =>
              m.clientMessageId === mapped.clientMessageId && m.pending
                ? mapped
                : m,
            )
          : [...existing, mapped];
        return { ...prev, [payload.targetId]: nextMessages };
      });

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
        markRead(
          payload.scope as "community" | "conversation",
          payload.targetId,
        ).catch(() => {
          /* best-effort — an occasional missed read receipt is harmless */
        });
      }
    }
    function handleTypingStart(payload: {
      scope: string;
      targetId: string;
      userId: string;
    }) {
      if (
        (payload.scope !== "community" && payload.scope !== "conversation") ||
        payload.userId === user!.id
      )
        return;
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
      if (payload.scope !== "community" && payload.scope !== "conversation")
        return;
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
  // ================= PRESENCE (1:1 chats ብቻ) =================
  // Live updates: አንድ ተጠቃሚ online/offline ሲሆን
  useEffect(() => {
    if (!socket) return;

    function handlePresenceUpdate(payload: {
      userId: string;
      online: boolean;
    }) {
      setChats((prev) =>
        prev.map((c) =>
          c.type === "chat" && c.participantUserId === payload.userId
            ? { ...c, isOnline: payload.online }
            : c,
        ),
      );
    }

    socket.on("presence:update", handlePresenceUpdate);
    return () => {
      socket.off("presence:update", handlePresenceUpdate);
    };
  }, [socket]);

  // Snapshot: ሲገናኝ/እንደገና ሲገናኝ እና 1:1 chat ዝርዝር ሲቀየር አሁን ማን online እንደሆነ ጠይቅ
  const directUserIdsKey = chats
    .filter((c) => c.type === "chat" && c.participantUserId)
    .map((c) => c.participantUserId as string)
    .sort()
    .join(",");

  useEffect(() => {
    if (!isConnected || !directUserIdsKey) return;
    let cancelled = false;

    getOnlineUsers(directUserIdsKey.split(","))
      .then((onlineIds) => {
        if (cancelled) return;
        const online = new Set(onlineIds);
        setChats((prev) =>
          prev.map((c) =>
            c.type === "chat" && c.participantUserId
              ? { ...c, isOnline: online.has(c.participantUserId) }
              : c,
          ),
        );
      })
      .catch(() => {
        /* best-effort — live presence:update ክስተቶች ይቀጥላሉ */
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- getOnlineUsers is recreated every render; the key + connection state are the real triggers
  }, [isConnected, directUserIdsKey]);

  // ================= OFFLINE QUEUE: flush on (re)connect =================
  useEffect(() => {
    if (!socket) return;
    const flushQueue = async () => {
      // ገና አልተገናኘም → ቆይ፤ socket "connect" ሲል ዳግም ይጠራል
      if (!socket.connected) return;

      // 1) rooms ን ዳግም ተቀላቀል — አዲስ socket ከ rooms ውጪ ነው፤ ካልተቀላቀለ
      //    የላክነው መልዕክት ተመልሶ አይደርስም ("Waiting…" አይጠፋም) እና live መልዕክት ይቆማል
      const roomKeys = new Set(joinedRoomsRef.current);
      getQueue().forEach((m) => roomKeys.add(`${m.scope}:${m.targetId}`));
      await Promise.allSettled(
        [...roomKeys].map((key) => {
          const [scope, targetId] = key.split(":");
          return joinRoom(scope as "community" | "conversation", targetId);
        }),
      );

      // 2) "Waiting…" መልዕክቶችን ላክ — clientMessageId idempotent ስለሆነ ሁለቴ አይፈጠርም
      getQueue().forEach((m) => {
        sendMessage({
          scope: m.scope,
          targetId: m.targetId,
          text: m.text,
          mediaUrl: m.mediaUrl,
          mediaType: m.mediaType,
          clientMessageId: m.clientMessageId,
        }).catch((err) => {
          console.error(
            "Retry from offline queue failed, will retry again later:",
            err,
          );
        });
        // Not dequeued here — handleMessageNew dequeues once the server
        // actually confirms the message (persisted or already-was).
      });
    };

    const onReconnect = () => {
      void flushQueue();
    };

    socket.on("connect", onReconnect);
    window.addEventListener("online", onReconnect);
    onReconnect(); // already connected on mount? (ያልተገናኘ ከሆነ ራሱ ይወጣል)

    return () => {
      socket.off("connect", onReconnect);
      window.removeEventListener("online", onReconnect);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps -- sendMessage is recreated every render; flushQueue reads current values via closure each time this effect re-runs on socket identity change
  }, [socket]);
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
  const isCommunityChat = (chat: Chat | undefined | null) =>
    chat?.type === "channel" || chat?.type === "group";

  const isConversationChat = (chat: Chat | undefined | null) =>
    chat?.type === "chat" || chat?.type === "privateGroup";

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
    const scope = isCommunityChat(targetChat)
      ? "community"
      : isConversationChat(targetChat)
        ? "conversation"
        : null;
    if (!scope) return;

    startTyping(scope, activeChatId);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping(scope, activeChatId);
    }, 2000);
  };

  const handleSelectChat = async (chatId: string) => {
    setActiveChatId(chatId);
    setChats((prev) =>
      prev.map((c) => (c.id === chatId ? { ...c, unreadCount: 0 } : c)),
    );

    const target = chats.find((c) => c.id === chatId);
    if (!accessToken || !user) return;

    if (isCommunityChat(target)) {
      try {
        await joinRoom("community", chatId);
        joinedRoomsRef.current.add(`community:${chatId}`);
      } catch (err) {
        console.error("Failed to join realtime room:", err);
      }
      if (messagesDb[chatId]) return;
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
      return;
    }

    if (isConversationChat(target)) {
      try {
        await joinRoom("conversation", chatId);
        joinedRoomsRef.current.add(`conversation:${chatId}`);
      } catch (err) {
        console.error("Failed to join realtime room:", err);
      }
      if (messagesDb[chatId]) return;
      try {
        const result = await listChatMessagesRequest(accessToken, chatId);
        const mapped = result.items
          .map((m) => mapChatMessageToMessage(m, user.id))
          .reverse();
        setMessagesDb((prev) => ({ ...prev, [chatId]: mapped }));
      } catch (err) {
        console.error("Failed to load messages:", err);
        triggerToast("⚠️ Could not load messages.");
      }
    }
  };

  const handleSendMessage = (
    text: string,
    mediaUrl?: string,
    mediaType?: "image" | "video" | "audio" | "pdf",
  ) => {
    if (!activeChatId) return;
    const targetChat = chats.find((c) => c.id === activeChatId);
    const scope = isCommunityChat(targetChat)
      ? "community"
      : isConversationChat(targetChat)
        ? "conversation"
        : null;
    if (!scope) return;

    const clientMessageId = generateClientMessageId();
    const backendMediaType = mediaType
      ? (mediaType.toUpperCase() as BackendMessageMediaType)
      : undefined;

    // Optimistic local entry — visible immediately; reconciled (replaced)
    // once the real message arrives via 'message:new' (Patch 4 above).
    const optimisticMsg: Message = {
      id: `pending-${clientMessageId}`,
      senderName: "Me",
      text,
      time: canUseCommunity ? getFormattedDateTime() : "Waiting…",
      isSentByMe: true,
      mediaUrl,
      mediaType,
      pending: true,
      createdAt: new Date().toISOString(),
      clientMessageId,
    };
    setMessagesDb((prev) => ({
      ...prev,
      [activeChatId]: [...(prev[activeChatId] || []), optimisticMsg],
    }));

    const queued = {
      clientMessageId,
      scope,
      targetId: activeChatId,
      text: text || undefined,
      mediaUrl,
      mediaType: backendMediaType,
      createdAt: new Date().toISOString(),
    };

    // ግንኙነት የለም/ደካማ → መልዕክቱ "Waiting…" ሆኖ ይቆያል፤ ሲመለስ በራሱ ይላካል
    if (!canUseCommunity) {
      enqueue(queued);
      return;
    }

    Promise.resolve()
      .then(() =>
        sendMessage({
          scope,
          targetId: activeChatId,
          text: text || undefined,
          mediaUrl,
          mediaType: backendMediaType,
          clientMessageId,
        }),
      )
      .catch((err) => {
        console.error("Failed to send message, queuing for retry:", err);
        enqueue(queued); // ጸጥ ብሎ "Waiting…" ሆኖ ይቆያል
      });
  };
  const handleEditMessage = async (messageId: string, newText: string) => {
    if (!activeChatId || !requireConnection()) return;
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
    } else if (isConversationChat(targetChat)) {
      if (!accessToken) return;
      try {
        await editChatMessageRequest(
          accessToken,
          activeChatId,
          messageId,
          newText,
        );
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
    if (!activeChatId || !requireConnection()) return;
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
    } else if (isConversationChat(targetChat)) {
      if (!accessToken) return;
      try {
        await deleteChatMessageRequest(accessToken, activeChatId, messageId);
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
    if (!activeChatId || !requireConnection()) return;
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
    if (!activeChatId || !accessToken || !user || !requireConnection()) return;
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
  ): Promise<boolean> => {
    if (!requireConnection()) return false;
    if (!accessToken) return false;
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
      return true;
    } catch (err) {
      console.error("Failed to create group:", err);
      triggerToast("⚠️ Failed to create group. Please try again.");
      return false;
    }
  };

  // Create new channel logic
  const handleCreateChannel = async (newChat: Chat): Promise<boolean> => {
    if (!requireConnection()) return false;
    if (!accessToken) return false;
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
      return true;
    } catch (err) {
      console.error("Failed to create channel:", err);
      triggerToast("⚠️ Failed to create channel. Please try again.");
      return false;
    }
  };

  // Start or open a chat with another developer
  // Profile AI's confirmed contract: openChatWith carries a real userId
  // (UUID) alongside display-only name/username/photo/bio.
  const handleStartChat = async (otherUser: {
    userId: string;
    name: string;
    username: string;
    photo: string;
    bio?: string;
  }) => {
    if (!accessToken) return;

    // Already-open check — by username, matching the existing local list.
    const existingChat = chats.find(
      (c) => c.type === "chat" && c.participantUsername === otherUser.username,
    );
    if (existingChat) {
      setActiveChatId(existingChat.id);
      setActiveTab("community");
      triggerToast(`💬 Chat opened with ${otherUser.name}`);
      return;
    }

    try {
      // ConversationsService.create() itself returns the EXISTING
      // conversation if one already exists between these two users — no
      // duplicate is ever created, even if our local `chats` list was
      // somehow stale.
      const created = await createConversationRequest(accessToken, {
        type: "DIRECT",
        participantUserIds: [otherUser.userId],
      });

      const initials = otherUser.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

      const newChat: Chat = {
        id: created.id,
        name: otherUser.name,
        participantUsername: otherUser.username,
        bio: otherUser.bio,
        lastMsgText: "Welcome! Start your conversation here.",
        lastMsgSender: otherUser.name,
        lastMsgTime: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        unreadCount: 0,
        avatarLabel: initials,
        avatarUrl: otherUser.photo || undefined,
        bgGradient: "bg-gradient-3",
        membersCount: 2,
        onlineCount: 0,
        isJoined: true,
        type: "chat",
      };

      setChats((prev) => [newChat, ...prev]);
      setMessagesDb((prev) => ({ ...prev, [newChat.id]: [] }));
      setActiveChatId(newChat.id);
      setActiveTab("community");
      triggerToast(`💬 Secure conversation started with ${otherUser.name}`);
    } catch (err) {
      console.error("Failed to start chat:", err);
      triggerToast("⚠️ Failed to start chat. Please try again.");
    }
  };
  // Profile >> Community chat redirect  +  Notifications >> Community redirect
  useEffect(() => {
    const state = location.state as {
      openChatWith?: {
        userId: string;
        name: string;
        username: string;
        photo: string;
        bio?: string;
      };
      openCommunityId?: string;
    };
    /*eslint-disable react-hooks/set-state-in-effect -- location.state ን redirect trigger አድርገን መጠከም ትክክለኛ  pattern ነው*/
    if (state?.openChatWith) {
      void handleStartChat(state.openChatWith);
      window.history.replaceState({}, "");
    }
    if (state?.openCommunityId) {
      void handleSelectChat(state.openCommunityId);
      window.history.replaceState({}, "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handleStartChat/handleSelectChat በየ render ስለሚፈጠሩ dependency ማድረግ loop ይፈጥራል
  }, [location.state]);
  // Active selected room details
  const activeChat = chats.find((c) => c.id === activeChatId) || null;
  const activeMessages = activeChatId ? messagesDb[activeChatId] || [] : [];

  // Channel/ Group/Chat  ውስጥ ሲገባ BottomNav መደበክ
  const { setFullscreenModalOpen } = useUI();
  // Create Channel / Create Group / Member picker ሙሉ ስክሪን ሲሆኑም BottomNav ይደበቃል
  const isCreateFlowOpen =
    isNewChannelOpen || isNewGroupOpen || isMemberPickerOpen;
  useEffect(() => {
    setFullscreenModalOpen(!!activeChatId || isCreateFlowOpen);
    return () => setFullscreenModalOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeChatId, isCreateFlowOpen]);
  return (
    <div className="flex w-full h-screen overflow-hidden bg-gray-50 text-gray-900 font-sans relative">
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
                isLoadingSuggested={isLoadingSuggested}
                suggestedError={suggestedError}
                onRetrySuggested={handleRetrySuggested}
                suggestedSearchQuery={suggestedSearchQuery}
                onSuggestedSearchChange={setSuggestedSearchQuery}
                listError={listErrors.mine ?? listErrors.chats ?? null}
                onRetryList={retryLists}
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
        onSelectChannel={async () => {
          if (!(await ensureReachable())) return; // ካርዱ ክፍት ይቆያል
          setIsCreateChoiceOpen(false);
          setIsNewChannelOpen(true);
        }}
        onSelectGroup={async () => {
          if (!(await ensureReachable())) return; // ካርዱ ክፍት ይቆያል
          setIsCreateChoiceOpen(false);
          setIsMemberPickerOpen(true); // ደረጃ 1: Add Members
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
        key={groupFlowKey}
        isOpen={isNewGroupOpen}
        onClose={() => setIsNewGroupOpen(false)}
        onBack={() => {
          // ← ከ New Group ወደ Add Members (የተመረጡት እና የተጻፈው ይቆያል)
          setIsNewGroupOpen(false);
          setIsMemberPickerOpen(true);
        }}
        onCreateGroup={handleCreateGroup}
        onOpenMemberPicker={() => setIsMemberPickerOpen(true)}
        pickedMembers={pickedMembers}
      />

      {/* 5. ADD MEMBERS (ደረጃ 1 — ወይም ከ New Group "Add Members" ሲነካ) */}
      <MemberPickerModal
        key={isMemberPickerOpen ? "open" : "closed"}
        isOpen={isMemberPickerOpen}
        availableUsers={availableMembersForPicker}
        initialSelected={pickedMembers}
        confirmLabel="Next"
        onClose={() => {
          setIsMemberPickerOpen(false);
          if (!isNewGroupOpen) {
            // ደረጃ 1 ላይ ← → ሙሉ ፍሰቱ ተሰርዟል
            setPickedMembers([]);
            setGroupFlowKey((k) => k + 1);
          }
        }}
        onConfirm={(selected) => {
          setPickedMembers(selected);
          setIsMemberPickerOpen(false);
          setIsNewGroupOpen(true); // ደረጃ 2: New Group
        }}
      />
    </div>
  );
}
