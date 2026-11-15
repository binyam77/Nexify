/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { CheckCircle } from "lucide-react";

import ChatsSidebar from "../components/messaging/ChatsSidebar";
import WelcomePane from "../components/messaging/WelcomePane";
import ChannelMessage from "../components/messaging/ChannelMessage";

import GroupMessage from "../components/messaging/GroupMessage";
import ChatMessage from "../components/messaging/ChatMessage";
import NewChannelModal from "../components/messaging/NewChannelModal";
import NewGroupModal from "../components/messaging/NewGroupModal";
import { useAuth } from "../context/AuthContext";
import type { Chat, Message } from "../types";
import { useLocation } from "react-router-dom";
import { useUI } from "../context/UIContext";
import CreateChoiceModal from "../components/messaging/CreateChoiceModal";
import MemberPickerModal from "../components/messaging/MemberPickerModal";
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
  inviteMembersRequest,
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
  setQueueOwner,
  generateClientMessageId,
} from "../lib/offline-queue";
import {
  listMyConversationsRequest,
  createConversationRequest,
  listChatMessagesRequest,
  editChatMessageRequest,
  deleteChatMessageRequest,
  leaveConversationRequest,
} from "../api/chat.api";
import {
  mapConversationListItemToChat,
  mapChatMessageToMessage,
} from "../lib/realtime.mappers";
import { useRealtime } from "../context/RealtimeContext";
import { useConnectionGate } from "../hooks/useConnectionGate";
import { isServerReachable } from "../lib/connection-check";
import { fetchFollowers, fetchFollowing } from "../api/follow.api";

// ስህተቱን ለተጠቃሚ (እና ለ debug) የሚታይ አጭር ጽሑፍ ማድረግ
function describeError(err: unknown): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === "object" && err !== null && "message" in err) {
    return String((err as { message: unknown }).message);
  }
  return "Unknown error";
}

// ሁሉንም ገጾች (cursor) ያመጣል — ከ 20 በላይ chat ካለ የተቀሩት እንዳይጠፉ።
// ጣሪያ: 10 ገጽ × 50 = 500 (ከዚያ በላይ ቢኖር ሌላ ንድፍ ያስፈልጋል)
async function fetchAllPages<T>(
  fetchPage: (
    cursor?: string,
  ) => Promise<{ items: T[]; nextCursor: string | null; hasMore: boolean }>,
  maxPages = 10,
): Promise<T[]> {
  const all: T[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < maxPages; page++) {
    const result = await fetchPage(cursor);
    all.push(...result.items);
    if (!result.hasMore || !result.nextCursor) break;
    cursor = result.nextCursor;
  }
  return all;
}

// አባላትን በ 50 እየከፈለ ይጋብዛል (backend: በአንድ ጥያቄ እስከ 50)፤ የተጨመሩትን ጠቅላላ ይመልሳል
async function inviteInChunks(
  token: string,
  communityId: string,
  userIds: string[],
): Promise<number> {
  let total = 0;
  for (let i = 0; i < userIds.length; i += 50) {
    const { invitedCount } = await inviteMembersRequest(
      token,
      communityId,
      userIds.slice(i, i + 50),
    );
    total += invitedCount;
  }
  return total;
}

// በ outbox (localStorage) የቆዩ "Waiting…" መልዕክቶችን ወደ Message መቀየር
function pendingMessagesFor(chatId: string): Message[] {
  return getQueue()
    .filter((q) => q.targetId === chatId)
    .map((q) => ({
      id: `pending-${q.clientMessageId}`,
      senderName: "Me",
      text: q.text ?? "",
      time: "Waiting…",
      isSentByMe: true,
      mediaUrl: q.mediaUrl,
      mediaType: q.mediaType
        ? (q.mediaType.toLowerCase() as Message["mediaType"])
        : undefined,
      pending: true,
      createdAt: q.createdAt,
      clientMessageId: q.clientMessageId,
    }));
}

// የ server ታሪክ + እስካሁን ያሉ local (live/pending) + outbox — ሳይደገሙ፣ ምንም ሳይጠፉ
function mergeHistory(
  server: Message[],
  local: Message[],
  queued: Message[],
): Message[] {
  const ids = new Set(server.map((m) => m.id));
  const clientIds = new Set(
    server.map((m) => m.clientMessageId).filter(Boolean) as string[],
  );
  const extras: Message[] = [];
  for (const m of [...local, ...queued]) {
    if (ids.has(m.id)) continue;
    if (m.clientMessageId && clientIds.has(m.clientMessageId)) continue;
    ids.add(m.id);
    if (m.clientMessageId) clientIds.add(m.clientMessageId);
    extras.push(m);
  }
  return [...server, ...extras];
}
// ==========================================
// Title: This is the primary Community.tsx file
// ==========================================
// This is the main workspace component managing the Nexify Community features.
// Features a mobile-responsive, Telegram-style layout, and an elegant desktop dual-pane view.
// Users can create new communities/groups and join existing ones.
export default function Community() {
  const [activeChatId, setActiveChatId] = useState<string | null>(null); // መጀመሪያ ላይ Rooms list ብቻ ይታይ፤ ምንም chat auto-select አይደረግም

  const [isNewChannelOpen, setIsNewChannelOpen] = useState(false);
  const [isNewGroupOpen, setIsNewGroupOpen] = useState(false);
  const [isCreateChoiceOpen, setIsCreateChoiceOpen] = useState(false);
  const [isMemberPickerOpen, setIsMemberPickerOpen] = useState(false);
  const [pickedMembers, setPickedMembers] = useState<SelectableUser[]>([]);
  // ፍሰቱ ሲሰረዝ New Group ፎርም እንዲጸዳ (key ሲቀየር ዳግም ይፈጠራል)
  const [groupFlowKey, setGroupFlowKey] = useState(0);

  // Add Members ዝርዝር: የምከተላቸው + የሚከተሉኝ ሰዎች (ከ Profile ጎራ ይጫናል)
  const [people, setPeople] = useState<SelectableUser[]>([]);
  const [peopleStatus, setPeopleStatus] = useState<
    "idle" | "loading" | "error"
  >("idle");

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isLoadingSuggested, setIsLoadingSuggested] = useState(false);
  const [suggestedError, setSuggestedError] = useState<string | null>(null);
  const [suggestedSearchQuery, setSuggestedSearchQuery] = useState("");
  // የመጨረሻው (trimmed) የ search ጽሑፍ — ያረጀ response ዝርዝሩን እንዳይበክል
  const latestSearchRef = useRef("");
  // የተቀላቀልናቸው realtime rooms — ግንኙነት ተመልሶ socket አዲስ ሲሆን ዳግም ለመቀላቀል
  const joinedRoomsRef = useRef<Set<string>>(new Set());

  // የ server መድረስ ፍተሻ ሁለቴ እንዳይጀመር
  const checkingConnectionRef = useRef(false);
  // ታሪካቸው ከ server የተጫነ chats (live መልዕክት ብቻ ያለው ግቤት "ተጭኗል" እንዳይመስል)
  const loadedChatsRef = useRef<Set<string>>(new Set());
  // የቆዩ መልዕክቶች: ቀጣዩ cursor በ chat፣ እና የ UI ሁኔታ (ተጨማሪ አለ? / እየጫነ?)
  const historyCursorRef = useRef<Record<string, string | null>>({});
  const [olderByChat, setOlderByChat] = useState<
    Record<string, { hasMore: boolean; loading: boolean }>
  >({});

  // User profile details (Current member profile loaded dynamically from localStorage)
  const { user, accessToken } = useAuth();
  // የ outbox ባለቤት = የገባው ተጠቃሚ። ከማንኛውም effect በፊት መቀመጥ አለበት፤ ተመሳሳይ
  // እሴት ደጋግሞ መመደብ ጉዳት የለውም (module ተለዋዋጭ ነው፣ ማንም አይከታተለውም)
  setQueueOwner(user?.id ?? null);
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
  // browserOnline: ለ server ድርጊቶች (አጥፋ/ፍጠር/...) ግንኙነት ከሌለ አጭር መልእክት ለማሳየት
  const { browserOnline } = useConnectionGate(isConnected);

  // Chat list: Community (channel/group) እና Conversation (chat/privateGroup)
  // ሁለቱም ከ backend ይጫናሉ — ከታች ያሉትን effects ይመልከቱ።
  const [chats, setChats] = useState<Chat[]>([]);

  // የመልዕክት ማከማቻ በ chat id: ከ backend (list + ቀጥታ 'message:new') እና
  // ገና ያልተላኩ ("Waiting…") መልዕክቶች ይዋሃዱበታል።
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

  // ከ realtime room ጋር መቀላቀል (እና ግንኙነት ከተቋረጠ በኋላ ዳግም ለመቀላቀል መመዝገብ)
  const joinRoomTracked = (
    scope: "community" | "conversation",
    targetId: string,
  ) =>
    joinRoom(scope, targetId)
      .then(() => {
        joinedRoomsRef.current.add(`${scope}:${targetId}`);
      })
      .catch((err) => console.error("Failed to join realtime room:", err));

  // የምከተላቸው + የሚከተሉኝ (ድግግሞሽ እና ራሴ ተወግደው፣ በስም ተደርድረው)
  const loadPeople = async () => {
    if (!user) return;
    setPeopleStatus("loading");
    try {
      const [following, followers] = await Promise.all([
        fetchAllPages((cursor) => fetchFollowing(user.id, cursor, 50), 4),
        fetchAllPages((cursor) => fetchFollowers(user.id, cursor, 50), 4),
      ]);
      const byId = new Map<string, SelectableUser>();
      for (const p of [...following, ...followers]) {
        if (p.userId === user.id || byId.has(p.userId)) continue;
        byId.set(p.userId, {
          id: p.userId,
          name: p.displayName || p.username,
          username: p.username,
          photo: p.avatar ?? "",
        });
      }
      setPeople(
        [...byId.values()].sort((a, b) => a.name.localeCompare(b.name)),
      );
      setPeopleStatus("idle");
    } catch (err) {
      console.error("Failed to load people:", err);
      setPeopleStatus("error");
    }
  };

  useEffect(() => {
    if (!accessToken || !user) return;
    void loadPeople();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- loadPeople በየ render ይፈጠራል፤ የተጠቃሚ id ሲቀየር ብቻ እንጫናለን
  }, [accessToken, user?.id]);

  // ================= LOAD COMMUNITIES: "Mine" (joined) =================
  const loadMine = async (token: string, currentUserId: string) => {
    try {
      const items = await fetchAllPages((cursor) =>
        listMyCommunitiesRequest(token, { cursor, limit: 50 }),
      );
      const mineChats = items.map((item) => ({
        ...mapCommunityListItemToChat(item, currentUserId),
        lastActivityAt: item.lastMessage?.createdAt ?? item.createdAt,
      }));
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
      if (browserOnline) triggerToast("Could not load your communities.");
    }
  };

  // ================= LOAD CONVERSATIONS (Chat domain — 1:1 + private group) =================
  const loadConversations = async (token: string, currentUserId: string) => {
    try {
      const items = await fetchAllPages((cursor) =>
        listMyConversationsRequest(token, { cursor, limit: 50 }),
      );
      const conversationChats = items.map((item) => ({
        ...mapConversationListItemToChat(item, currentUserId),
        lastActivityAt: item.lastMessage?.createdAt ?? item.createdAt,
      }));
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
      if (browserOnline) triggerToast("Could not load your chats.");
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
            lastActivityAt: mapped.createdAt ?? c.lastActivityAt,
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

  // እኔ ከተቋረጥኩ የሌሎች presence አይታወቅም → የድሮው "online" መታየት የለበትም
  useEffect(() => {
    if (isConnected) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- UI ን ከ socket ሁኔታ ጋር ማመሳሰል
    setChats((prev) =>
      prev.map((c) =>
        c.type === "chat" && c.isOnline ? { ...c, isOnline: false } : c,
      ),
    );
  }, [isConnected]);

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

    // ደካማ ግንኙነት ላይ ያልተላኩ መልዕክቶች በየ 15 ሰከንድ እንደገና ይሞከራሉ
    // (clientMessageId idempotent ስለሆነ ሁለቴ አይፈጠርም)
    const retryTimer = setInterval(() => {
      if (getQueue().length > 0) onReconnect();
    }, 15_000);

    return () => {
      clearInterval(retryTimer);
      socket.off("connect", onReconnect);
      window.removeEventListener("online", onReconnect);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps -- sendMessage is recreated every render; flushQueue reads current values via closure each time this effect re-runs on socket identity change
  }, [socket]);

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
      if (!accessToken || !requireConnection()) return;
      try {
        await leaveCommunityRequest(accessToken, chatId);
      } catch (err) {
        console.error("Failed to leave community:", err);
        triggerToast(" Failed to leave. Please try again.");
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
    },
  ) => {
    const target = chats.find((c) => c.id === chatId);

    if (isCommunityChat(target)) {
      if (!accessToken || !requireConnection()) return;
      try {
        await updateCommunityRequest(accessToken, chatId, {
          name: updates.name,
          avatar: updates.avatarUrl,
          description: updates.description,
        });
      } catch (err) {
        console.error("Failed to update community:", err);
        triggerToast(" Failed to update. Please try again.");
        return;
      }
    }

    setChats((prev) =>
      prev.map((c) => (c.id === chatId ? { ...c, ...updates } : c)),
    );
    triggerToast("✅ Group updated!");
  };

  // ማጥፋት — ትርጉሙ በ chat ዓይነት ይለያል፦
  //  • የራሴ ቻናል/ግሩፕ → ለሁሉም ይሰረዛል
  //  • የሌላ ሰው ቻናል/ግሩፕ → መውጣት (ማጥፋት አይደለም፤ ከዚህ በፊት 403 ይመልስ ነበር)
  //  • private group → መውጣት
  //  • 1:1 → ገና አይቻልም ("ለእኔ ብቻ አጥፋ" backend ያስፈልገዋል)፤
  //    ከዚህ በፊት የሐሰት "ተሰረዘ" ይል ነበር (Refresh ሲደረግ ይመለስ ነበር)
  const handleDeleteChat = async (chatId: string) => {
    const target = chats.find((c) => c.id === chatId);
    if (!target) return;

    if (target.type === "chat") {
      triggerToast("Private chats can't be deleted yet.");
      return;
    }
    if (!accessToken || !requireConnection()) return;

    if (isCommunityChat(target) && !target.isCreatedByMe) {
      await handleLeaveGroup(chatId);
      return;
    }

    try {
      if (isCommunityChat(target)) {
        await deleteCommunityRequest(accessToken, chatId);
      } else {
        // private group — መውጣት (የመጨረሻው አባል ሲወጣ server ውይይቱን ያጠፋል)
        await leaveConversationRequest(accessToken, chatId);
      }
    } catch (err) {
      console.error("Failed to delete/leave chat:", err);
      triggerToast("Failed to complete this action. Please try again.");
      return;
    }

    setChats((prev) => prev.filter((c) => c.id !== chatId));
    setMessagesDb((prev) => {
      const updated = { ...prev };
      delete updated[chatId];
      return updated;
    });
    loadedChatsRef.current.delete(chatId);
    joinedRoomsRef.current.delete(`community:${chatId}`);
    joinedRoomsRef.current.delete(`conversation:${chatId}`);
    if (activeChatId === chatId) setActiveChatId(null);
    triggerToast(
      isCommunityChat(target) ? "Deleted successfully!" : "You left the group.",
    );
  };

  // "እየጻፈ ነው" ምልክት ለሌሎች ይላካል (Socket.IO)፤ ከ 2 ሰከንድ ጸጥታ በኋላ ይቆማል
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
      if (loadedChatsRef.current.has(chatId)) return;
      try {
        const result = await listMessagesRequest(accessToken, chatId);
        const mapped = result.items
          .map((m) => mapCommunityMessageToMessage(m, user.id))
          .reverse();
        loadedChatsRef.current.add(chatId);
        historyCursorRef.current[chatId] = result.nextCursor;
        setOlderByChat((prev) => ({
          ...prev,
          [chatId]: { hasMore: result.hasMore, loading: false },
        }));
        setMessagesDb((prev) => ({
          ...prev,
          [chatId]: mergeHistory(
            mapped,
            prev[chatId] ?? [],
            pendingMessagesFor(chatId),
          ),
        }));
      } catch (err) {
        console.error("Failed to load messages:", err);
        // ግንኙነት ከሌለ እንኳ በ outbox ያሉ ("Waiting…") መልዕክቶች ይታያሉ
        setMessagesDb((prev) => ({
          ...prev,
          [chatId]: mergeHistory(
            [],
            prev[chatId] ?? [],
            pendingMessagesFor(chatId),
          ),
        }));
        if (browserOnline) triggerToast(" Could not load messages.");
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
      if (loadedChatsRef.current.has(chatId)) return;
      try {
        const result = await listChatMessagesRequest(accessToken, chatId);
        const mapped = result.items
          .map((m) => mapChatMessageToMessage(m, user.id))
          .reverse();
        loadedChatsRef.current.add(chatId);
        historyCursorRef.current[chatId] = result.nextCursor;
        setOlderByChat((prev) => ({
          ...prev,
          [chatId]: { hasMore: result.hasMore, loading: false },
        }));
        setMessagesDb((prev) => ({
          ...prev,
          [chatId]: mergeHistory(
            mapped,
            prev[chatId] ?? [],
            pendingMessagesFor(chatId),
          ),
        }));
      } catch (err) {
        console.error("Failed to load messages:", err);
        setMessagesDb((prev) => ({
          ...prev,
          [chatId]: mergeHistory(
            [],
            prev[chatId] ?? [],
            pendingMessagesFor(chatId),
          ),
        }));
        if (browserOnline) triggerToast(" Could not load messages.");
      }
    }
  };

  // የቆዩ መልዕክቶችን መጫን (cursor ገጽ) — "Load earlier messages" ሲነካ
  const loadOlderMessages = async (chatId: string) => {
    const cursor = historyCursorRef.current[chatId];
    const target = chats.find((c) => c.id === chatId);
    if (!accessToken || !user || !cursor || !target) return;
    if (olderByChat[chatId]?.loading) return;
    if (!requireConnection()) return;

    setOlderByChat((prev) => ({
      ...prev,
      [chatId]: { hasMore: true, loading: true },
    }));
    try {
      let older: Message[];
      let nextCursor: string | null;
      let hasMore: boolean;
      if (isCommunityChat(target)) {
        const result = await listMessagesRequest(accessToken, chatId, {
          cursor,
        });
        older = result.items
          .map((m) => mapCommunityMessageToMessage(m, user.id))
          .reverse();
        nextCursor = result.nextCursor;
        hasMore = result.hasMore;
      } else {
        const result = await listChatMessagesRequest(accessToken, chatId, {
          cursor,
        });
        older = result.items
          .map((m) => mapChatMessageToMessage(m, user.id))
          .reverse();
        nextCursor = result.nextCursor;
        hasMore = result.hasMore;
      }

      historyCursorRef.current[chatId] = nextCursor;
      setMessagesDb((prev) => {
        const existing = prev[chatId] ?? [];
        const known = new Set(existing.map((m) => m.id));
        return {
          ...prev,
          [chatId]: [...older.filter((m) => !known.has(m.id)), ...existing],
        };
      });
      setOlderByChat((prev) => ({
        ...prev,
        [chatId]: { hasMore, loading: false },
      }));
    } catch (err) {
      console.error("Failed to load older messages:", err);
      setOlderByChat((prev) => ({
        ...prev,
        [chatId]: { hasMore: true, loading: false },
      }));
      if (browserOnline) triggerToast("Could not load earlier messages.");
    }
  };

  // server የላከውን (ack) መልዕክት ወደ UI ማስገባት — `message:new` ወደኛ ባይደርስም
  // ("Sending" ላይ እንዳይቀር). message:new ቀድሞ ከደረሰ ምንም አያደርግም።
  const reconcileSent = (
    scope: "community" | "conversation",
    targetId: string,
    raw: unknown,
  ) => {
    if (!user || !raw) return;
    const mapped =
      scope === "community"
        ? mapCommunityMessageToMessage(
            raw as Parameters<typeof mapCommunityMessageToMessage>[0],
            user.id,
          )
        : mapChatMessageToMessage(
            raw as Parameters<typeof mapChatMessageToMessage>[0],
            user.id,
          );

    setMessagesDb((prev) => {
      const existing = prev[targetId] || [];
      if (existing.some((m) => m.id === mapped.id)) return prev;
      const isMyPending = (m: Message) =>
        !!m.pending &&
        !!m.clientMessageId &&
        m.clientMessageId === mapped.clientMessageId;
      const next = existing.some(isMyPending)
        ? existing.map((m) => (isMyPending(m) ? mapped : m))
        : [...existing, mapped];
      return { ...prev, [targetId]: next };
    });

    setChats((prev) =>
      prev.map((c) =>
        c.id === targetId
          ? {
              ...c,
              lastMsgText: mapped.mediaUrl
                ? mapped.text || "📷 Media"
                : mapped.text,
              lastMsgSender: mapped.senderName,
                            lastMsgTime: mapped.time,
              lastActivityAt: mapped.createdAt ?? c.lastActivityAt,
            }
          : c,
      ),
    );
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
      time: isConnected ? getFormattedDateTime() : "Sending…",
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

    const savedToOutbox = enqueue(queued);
    // ግንኙነት የለም/ደካማ → "Waiting…" ሆኖ ይቆያል፤ ሲመለስ በራሱ ይላካል
    if (!isConnected) {
      if (!savedToOutbox) {
        triggerToast(" Couldn't keep this message while offline.");
      }
      return;
    }

    const sendTargetId = activeChatId;
    const roomKey = `${scope}:${sendTargetId}`;

    Promise.resolve()
      .then(async () => {
        // ከ room ውጭ ከሆንን አስቀድመን እንቀላቀል (ያለዚያ የ server echo አይደርስም)
        if (!joinedRoomsRef.current.has(roomKey)) {
          await joinRoom(scope, sendTargetId);
          joinedRoomsRef.current.add(roomKey);
        }
        return sendMessage({
          scope,
          targetId: sendTargetId,
          text: text || undefined,
          mediaUrl,
          mediaType: backendMediaType,
          clientMessageId,
        });
      })
      .then((saved) => {
        dequeue(clientMessageId); // server አረጋግጧል → ከ outbox ውጣ
        reconcileSent(scope, sendTargetId, saved); // "Sending" ወደ እውነተኛ መልዕክት
      })
      .catch((err) => {
        // outbox ውስጥ ይቆያል፤ በየ 15 ሰከንድ/ግንኙነት ሲመለስ እንደገና ይሞከራል
        console.error("Failed to send message — kept in outbox:", err);
        const reason = describeError(err);
        // ጊዜ ማለፍ (ደካማ ግንኙነት) ጸጥ ይላል፤ server ሲከለክል (ለምሳሌ "Not a member…") ምክንያቱ ይታያል
        if (!/timed out|not available yet/i.test(reason)) {
          triggerToast(` Not sent: ${reason}`);
        }
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
        triggerToast(" Failed to edit message.");
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
        triggerToast(" Failed to edit message.");
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
        triggerToast(" Failed to delete message.");
        return;
      }
    } else if (isConversationChat(targetChat)) {
      if (!accessToken) return;
      try {
        await deleteChatMessageRequest(accessToken, activeChatId, messageId);
      } catch (err) {
        console.error("Failed to delete message:", err);
        triggerToast(" Failed to delete message.");
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

    triggerToast(" Message deleted successfully!");
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
      triggerToast(" Failed to update pin.");
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
      triggerToast(" Failed to react.");
      return;
    }

    setMessagesDb((prev) => ({
      ...prev,
      [activeChatId]: (prev[activeChatId] || []).map((msg) => {
        if (msg.id !== messageId) return msg;

        // አንድ ሰው በአንድ መልዕክት አንድ reaction ብቻ ነው (backend ደግሞ እንዲሁ)፤
        // የእኔን የምንለየው በ `mine` ባንዲራ እንጂ በ "Me" ጽሑፍ አይደለም
        const current = msg.reactions ?? [];
        const prior = current.find((r) => r.mine);

        // የቀድሞውን የእኔን ማንሳት
        let next = current
          .map((r) =>
            r.mine
              ? {
                  ...r,
                  count: r.count - 1,
                  mine: false,
                  users: r.users.filter((u) => u !== "Me"),
                }
              : r,
          )
          .filter((r) => r.count > 0);

        // ተመሳሳዩን ከመረጥኩ ማንሳት ብቻ ነው፤ ሌላ ከሆነ መጨመር
        if (prior?.emoji !== emoji) {
          const existing = next.find((r) => r.emoji === emoji);
          next = existing
            ? next.map((r) =>
                r.emoji === emoji
                  ? {
                      ...r,
                      count: r.count + 1,
                      mine: true,
                      users: [...r.users, "Me"],
                    }
                  : r,
              )
            : [...next, { emoji, count: 1, mine: true, users: ["Me"] }];
        }

        return { ...msg, reactions: next };
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
    if (!isCommunityChat(targetChat) || !accessToken || !requireConnection())
      return;

    try {
      await joinCommunityRequest(accessToken, chatId);
    } catch (err) {
      console.error("Failed to join community:", err);
      triggerToast(" Failed to join. Please try again.");
      return;
    }

    setChats((prev) =>
      prev.map((c) => {
        if (c.id === chatId) {
          triggerToast(` You have successfully joined "${c.name}"!`);
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

    // ይህ chat አሁን ክፍት ከሆነ ታሪኩ እና room ወዲያው ይጫናሉ፤ አለዚያ ሲከፈት ይጫናሉ
    // (ከዚህ በፊት ባዶ [] ተቀምጦ ታሪኩ ሳይጫን ይቀር ነበር)
    if (activeChatId === chatId) void handleSelectChat(chatId);
  };

  // Group ላይ አዲስ አባላት መጨመር — ባለቤት ብቻ (backend ደግሞ ያረጋግጣል)።
  // ከዚህ በፊት በ local ብቻ ይቆጥር እና የሐሰት "ተጨመሩ" መልዕክት ያሳይ ነበር።
  const handleInviteMembers = async (
    chatId: string,
    invitedUsers: SelectableUser[],
  ) => {
    if (invitedUsers.length === 0 || !accessToken || !requireConnection())
      return;
    try {
      const added = await inviteInChunks(
        accessToken,
        chatId,
        invitedUsers.map((u) => u.id),
      );
      if (added > 0) {
        setChats((prev) =>
          prev.map((c) =>
            c.id === chatId
              ? { ...c, membersCount: c.membersCount + added }
              : c,
          ),
        );
        triggerToast(`Added ${added} member${added > 1 ? "s" : ""}.`);
      } else {
        triggerToast("They are already members.");
      }
    } catch (err) {
      console.error("Failed to invite members:", err);
      triggerToast("Couldn't add members. Please try again.");
    }
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
        themeColor: newChat.bgGradient,
      });

      // የተመረጡ አባላት በእውነተኛ ጥሪ ይጋበዛሉ (ከዚህ በፊት በ local ብቻ ይመስሉ ነበር)
      let addedCount = 0;
      let inviteFailed = false;
      if (initialMembers.length > 0) {
        try {
          addedCount = await inviteInChunks(
            accessToken,
            created.id,
            initialMembers.map((u) => u.id),
          );
        } catch (err) {
          console.error("Failed to add initial members:", err);
          inviteFailed = true;
        }
      }

      const mapped = mapCommunitySuggestedToChat({
        ...created,
        membersCount: 1 + addedCount,
      });
      const finalChat: Chat = {
        ...mapped,
        isJoined: true,
        isCreatedByMe: true,
      };

      setChats((prev) => [finalChat, ...prev]);
      setMessagesDb((prev) => ({ ...prev, [finalChat.id]: [] }));
      setActiveChatId(finalChat.id);
      void joinRoomTracked("community", finalChat.id);
      setPickedMembers([]);

      triggerToast(
        inviteFailed
          ? `Group "${finalChat.name}" created, but members couldn't be added.`
          : `Group "${finalChat.name}" created successfully!`,
      );
      return true;
    } catch (err) {
      console.error("Failed to create group:", err);
      triggerToast(" Failed to create group. Please try again.");
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
      void joinRoomTracked("community", finalChat.id);
      triggerToast(` Channel "${finalChat.name}" created successfully!`);
      return true;
    } catch (err) {
      console.error("Failed to create channel:", err);
      triggerToast(" Failed to create channel. Please try again.");
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

    // Already-open check — በ User.id (በ username ማዛመድ የደህንነት ችግር ነበረው)
    const existingChat = chats.find(
      (c) => c.type === "chat" && c.participantUserId === otherUser.userId,
    );
    if (existingChat) {
      void handleSelectChat(existingChat.id); // ታሪክ ይጭናል፣ room ይገባል
      triggerToast(` Chat opened with ${otherUser.name}`);
      return;
    }

    // አዲስ ውይይት server ይፈልጋል — ግንኙነት ከሌለ አጭር መልእክት
    if (!requireConnection()) return;

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
        participantUserId: otherUser.userId,
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
      // ከ room ጋር መቀላቀል — ያለዚያ የሌላው ሰው live መልዕክት አይደርስም
      joinRoom("conversation", newChat.id)
        .then(() => joinedRoomsRef.current.add(`conversation:${newChat.id}`))
        .catch((err) => console.error("Failed to join realtime room:", err));
      triggerToast(`Secure conversation started with ${otherUser.name}`);
    } catch (err) {
      console.error("Failed to start chat:", err);
      triggerToast(" Failed to start chat. Please try again.");
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

      {/* Workspace View (Community Workspace Card) */}
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
            />
          </div>

          {/* Active messaging workspace
                Hidden on mobile screen if no active chat is selected */}
          <div
            className={`flex-1 h-full relative min-h-0 overflow-hidden ${!activeChatId ? "hidden md:block" : "block"}`}
          >
            {activeChat?.type === "channel" ? (
              <ChannelMessage
                key={activeChat.id}
                chat={activeChat}
                messages={activeMessages}
                onSendMessage={handleSendMessage}
                onEditMessage={handleEditMessage}
                onDeleteMessage={handleDeleteMessage}
                onReactMessage={handleReactMessage}
                onPinMessage={handlePinMessage}
                onJoinChat={handleJoinChat}
                onUnsubscribeChannel={handleLeaveGroup}
                hasOlder={olderByChat[activeChat.id]?.hasMore ?? false}
                isLoadingOlder={olderByChat[activeChat.id]?.loading ?? false}
                onLoadOlder={() => void loadOlderMessages(activeChat.id)}
                onDeleteChannel={handleDeleteChat}
                onUpdateChannelInfo={handleUpdateGroupInfo}
                onBack={() => setActiveChatId(null)}
              />
            ) : activeChat?.type === "group" ||
              activeChat?.type === "privateGroup" ? (
              <GroupMessage
                key={activeChat.id}
                chat={activeChat}
                messages={activeMessages}
                onSendMessage={handleSendMessage}
                onEditMessage={handleEditMessage}
                onDeleteMessage={handleDeleteMessage}
                onReactMessage={handleReactMessage}
                onPinMessage={handlePinMessage}
                onJoinChat={handleJoinChat}
                onLeaveGroup={handleLeaveGroup}
                onDeleteGroup={handleDeleteChat}
                onUpdateGroupInfo={handleUpdateGroupInfo}
                onInviteMembers={handleInviteMembers}
                hasOlder={olderByChat[activeChat.id]?.hasMore ?? false}
                isLoadingOlder={olderByChat[activeChat.id]?.loading ?? false}
                onLoadOlder={() => void loadOlderMessages(activeChat.id)}
                availableUsersForInvite={people}
                onUserTyping={handleUserTyping}
                onBack={() => setActiveChatId(null)}
              />
            ) : activeChat?.type === "chat" ? (
              <ChatMessage
                key={activeChat.id}
                chat={activeChat}
                messages={activeMessages}
                onSendMessage={handleSendMessage}
                onEditMessage={handleEditMessage}
                onDeleteMessage={handleDeleteMessage}
                onUserTyping={handleUserTyping}
                hasOlder={olderByChat[activeChat.id]?.hasMore ?? false}
                isLoadingOlder={olderByChat[activeChat.id]?.loading ?? false}
                onLoadOlder={() => void loadOlderMessages(activeChat.id)}
                onBack={() => setActiveChatId(null)}
              />
            ) : (
              <WelcomePane />
            )}
          </div>
        </div>
      </main>

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
          void loadPeople(); // ከዚህ በፊት የተከተሉት አዲስ ሰዎች እንዲታዩ
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
        availableUsers={people}
        isLoading={peopleStatus === "loading"}
        errorText={
          peopleStatus === "error" ? "Couldn't load your people." : null
        }
        onRetry={() => void loadPeople()}
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
