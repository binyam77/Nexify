import type { Chat, Message } from "../types";
import type {
  CommunityListItem,
  CommunityResponse,
  CommunityDetailResponse,
  CommunityMessageResponse,
  CommunityMessageReaction,
} from "../api/community.api";
import type {
  ConversationListItem,
  ConversationDetailResponse,
  ChatMessageResponse,
} from "../api/chat.api";

// ============================================================================
// Backend -> Frontend data mapping.
//
// The backend has TWO domains (Community: Channel/Group, Chat: Direct/Group
// Conversation); the frontend has ONE unified `Chat[]` list with a `type`
// discriminator. This file is the single place that bridges them — no
// component should reach into the raw API response shapes directly.
//
// Chat.type mapping:
//   Community(CHANNEL)     -> 'channel'
//   Community(GROUP)       -> 'group'        (public, discoverable)
//   Conversation(DIRECT)   -> 'chat'
//   Conversation(GROUP)    -> 'privateGroup' (private, invite-only —
//                              deliberately NOT merged with 'group', see
//                              the architecture discussion: these are two
//                              different concepts that happen to share the
//                              English word "group")
// ============================================================================

function getInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  const words = trimmed.split(/\s+/);
  return words.length > 1
    ? (words[0][0] + words[1][0]).toUpperCase()
    : trimmed.slice(0, 2).toUpperCase();
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function mediaTypeToLower(
  type:
    | CommunityMessageResponse["mediaType"]
    | ChatMessageResponse["mediaType"],
): Message["mediaType"] {
  if (!type) return undefined;
  return type.toLowerCase() as Message["mediaType"];
}

function mediaPreviewLabel(
  type:
    | CommunityMessageResponse["mediaType"]
    | ChatMessageResponse["mediaType"],
): string {
  if (type === "VIDEO") return "🎥 Video Post";
  if (type === "IMAGE") return "📷 Photo Post";
  if (type === "AUDIO") return "🎵 Audio message";
  if (type === "PDF") return "📄 Document";
  return "";
}

/** A message's text-or-media summary, used for sidebar previews (lastMsgText). */
function previewText(
  msg: CommunityMessageResponse | ChatMessageResponse | null,
): string {
  if (!msg) return "No messages here yet.";
  if (msg.text) return msg.text;
  return mediaPreviewLabel(msg.mediaType);
}

function senderLabel(
  msg: CommunityMessageResponse | ChatMessageResponse,
  currentUserId: string,
  fallbackUsername?: string,
): string {
  if (msg.userId === currentUserId) return "Me";
  return msg.user.profile?.username ?? fallbackUsername ?? "Unknown";
}

/**
 * Groups individual MessageReaction rows (one per user per emoji, from the
 * backend) into the frontend's { emoji, count, users } shape. The current
 * user's own reaction is labeled "Me" — MessageArea.tsx already checks
 * `r.users.includes("Me")` to decide bubble highlighting, a convention
 * from the original demo data that this mapping preserves rather than
 * requiring a component-level change.
 */
export function aggregateReactions(
  reactions: CommunityMessageReaction[],
  currentUserId: string,
): { emoji: string; count: number; users: string[] }[] {
  const byEmoji = new Map<string, string[]>();
  for (const r of reactions) {
    const label =
      r.userId === currentUserId
        ? "Me"
        : (r.user.profile?.username ?? "Someone");
    byEmoji.set(r.emoji, [...(byEmoji.get(r.emoji) ?? []), label]);
  }
  return [...byEmoji.entries()].map(([emoji, users]) => ({
    emoji,
    count: users.length,
    users,
  }));
}

// ================= MESSAGES =================

export function mapCommunityMessageToMessage(
  msg: CommunityMessageResponse,
  currentUserId: string,
): Message {
  return {
    id: msg.id,
    senderName: senderLabel(msg, currentUserId),
    text: msg.text ?? "",
    time: formatTime(msg.createdAt),
    isSentByMe: msg.userId === currentUserId,
    mediaUrl: msg.mediaUrl ?? undefined,
    mediaType: mediaTypeToLower(msg.mediaType),
    isEdited: msg.isEdited,
    reactions: aggregateReactions(msg.reactions, currentUserId),
    isPinned: msg.isPinned,
  };
}

export function mapChatMessageToMessage(
  msg: ChatMessageResponse,
  currentUserId: string,
): Message {
  return {
    id: msg.id,
    senderName: senderLabel(msg, currentUserId),
    text: msg.text ?? "",
    time: formatTime(msg.createdAt),
    isSentByMe: msg.userId === currentUserId,
    mediaUrl: msg.mediaUrl ?? undefined,
    mediaType: mediaTypeToLower(msg.mediaType),
    isEdited: msg.isEdited,
    // Chat's Message model has no reactions concept — MessageArea.tsx
    // only ever renders reactions for chat.type === "channel", so an
    // absent field here is never actually read for Conversation messages.
  };
}

// ================= COMMUNITIES ("Chats" tab — already joined) =================

export function mapCommunityListItemToChat(
  item: CommunityListItem,
  currentUserId: string,
): Chat {
  return {
    id: item.id,
    name: item.name,
    lastMsgText: previewText(item.lastMessage),
    lastMsgSender: item.lastMessage
      ? senderLabel(item.lastMessage, currentUserId)
      : "",
    lastMsgTime: item.lastMessage ? formatTime(item.lastMessage.createdAt) : "",
    unreadCount: item.unreadCount,
    avatarLabel: getInitials(item.name),
    bgGradient: item.themeColor || "bg-gradient-1",
    avatarUrl: item.avatar ?? undefined,
    membersCount: item.membersCount,
    onlineCount: 0, // wired at the component layer via useRealtime/PresenceService, not part of this static mapping
    isJoined: true,
    type: item.type === "CHANNEL" ? "channel" : "group",
    isCreatedByMe: item.userId === currentUserId,
    cover: item.cover ?? undefined,
    description: item.description ?? undefined,
  };
}

// ================= COMMUNITIES ("Communities" tab — Suggested/discovery) =================

export function mapCommunitySuggestedToChat(item: CommunityResponse): Chat {
  return {
    id: item.id,
    name: item.name,
    lastMsgText: "",
    lastMsgSender: "",
    lastMsgTime: "",
    unreadCount: 0,
    avatarLabel: getInitials(item.name),
    bgGradient: item.themeColor || "bg-gradient-1",
    avatarUrl: item.avatar ?? undefined,
    membersCount: item.membersCount,
    onlineCount: 0,
    isJoined: false,
    type: item.type === "CHANNEL" ? "channel" : "group",
    isCreatedByMe: false,
    cover: item.cover ?? undefined,
    description: item.description ?? undefined,
  };
}

// ================= COMMUNITY DETAIL (GET /communities/:id) =================

export function mapCommunityDetailToChat(
  item: CommunityDetailResponse,
  currentUserId: string,
): Chat {
  return {
    id: item.id,
    name: item.name,
    lastMsgText: "",
    lastMsgSender: "",
    lastMsgTime: "",
    unreadCount: 0,
    avatarLabel: getInitials(item.name),
    bgGradient: item.themeColor || "bg-gradient-1",
    avatarUrl: item.avatar ?? undefined,
    membersCount: item.membersCount,
    onlineCount: 0,
    isJoined: item.isJoined,
    type: item.type === "CHANNEL" ? "channel" : "group",
    isCreatedByMe: item.userId === currentUserId,
    cover: item.cover ?? undefined,
    description: item.description ?? undefined,
  };
}

// ================= CONVERSATIONS (DIRECT + private GROUP) =================

export function mapConversationListItemToChat(
  item: ConversationListItem,
  currentUserId: string,
): Chat {
  if (item.type === "DIRECT") {
    const other = item.otherParticipants[0];
    const name = other?.profile?.username ?? "Unknown";
    return {
      id: item.id,
      name,
      participantUsername: other?.profile?.username,
      lastMsgText: previewText(item.lastMessage),
      lastMsgSender: item.lastMessage
        ? senderLabel(item.lastMessage, currentUserId, name)
        : "",
      lastMsgTime: item.lastMessage
        ? formatTime(item.lastMessage.createdAt)
        : "",
      unreadCount: item.unreadCount,
      avatarLabel: getInitials(name),
      bgGradient: "bg-gradient-3",
      avatarUrl: other?.profile?.avatar ?? undefined,
      membersCount: 2,
      onlineCount: 0, // presence for a 1:1 chat is read via useRealtime at the component layer
      isJoined: true,
      type: "chat",
    };
  }

  // Conversation(GROUP) — private, invite-only. Deliberately mapped to
  // 'privateGroup', NOT 'group' — see this file's header comment.
  const groupName = item.name ?? "Group";
  return {
    id: item.id,
    name: groupName,
    lastMsgText: previewText(item.lastMessage),
    lastMsgSender: item.lastMessage
      ? senderLabel(item.lastMessage, currentUserId)
      : "",
    lastMsgTime: item.lastMessage ? formatTime(item.lastMessage.createdAt) : "",
    unreadCount: item.unreadCount,
    avatarLabel: getInitials(groupName),
    bgGradient: "bg-gradient-4",
    avatarUrl: item.avatar ?? undefined,
    membersCount: item.otherParticipants.length + 1,
    onlineCount: 0,
    isJoined: true,
    type: "privateGroup",
  };
}

export function mapConversationDetailToChat(
  item: ConversationDetailResponse,
  currentUserId: string,
): Chat {
  if (item.type === "DIRECT") {
    const other = item.members.find((m) => m.user.id !== currentUserId)?.user;
    const name = other?.profile?.username ?? "Unknown";
    return {
      id: item.id,
      name,
      participantUsername: other?.profile?.username,
      lastMsgText: "",
      lastMsgSender: "",
      lastMsgTime: "",
      unreadCount: 0,
      avatarLabel: getInitials(name),
      bgGradient: "bg-gradient-3",
      avatarUrl: other?.profile?.avatar ?? undefined,
      membersCount: 2,
      onlineCount: 0,
      isJoined: true,
      type: "chat",
    };
  }

  const groupName = item.name ?? "Group";
  return {
    id: item.id,
    name: groupName,
    lastMsgText: "",
    lastMsgSender: "",
    lastMsgTime: "",
    unreadCount: 0,
    avatarLabel: getInitials(groupName),
    bgGradient: "bg-gradient-4",
    avatarUrl: item.avatar ?? undefined,
    membersCount: item.members.length,
    onlineCount: 0,
    isJoined: true,
    type: "privateGroup",
  };
}
