import { useRef, useState } from "react";
import { ArrowLeft, CheckCheck, Pin } from "lucide-react";
import type { Chat, Message, SelectableUser } from "../../types";
import GroupInfoModal from "./GroupInfoModal";
import MediaViewer from "./MediaViewer";
import MessageActionBar, { QuickReactions } from "./MessageActionBar";
import MessageComposer from "./MessageComposer";
import type { ComposerMediaType } from "./MessageComposer";
import MessageMedia from "./MessageMedia";
import LoadOlderButton from "./LoadOlderButton";
import { useAutoScroll } from "./useAutoScroll";
import { useLongPress } from "./useLongPress";
import { copyToClipboard, isSafeMediaUrl } from "./messagingUtils";

// የላኪ ስም ቀለም — ከቀለም ፋይሉ (tokens) ብቻ፤ በስሙ ላይ ተመስርቶ ቋሚ ሆኖ ይመረጣል
const NAME_COLORS = [
  "text-primary",
  "text-success",
  "text-warning",
  "text-info",
];

function nameColor(name: string): string {
  let sum = 0;
  for (let i = 0; i < name.length; i++) {
    sum = (sum + name.charCodeAt(i)) % NAME_COLORS.length;
  }
  return NAME_COLORS[sum];
}

interface GroupMessageProps {
  /** type: "group" (Community) ወይም "privateGroup" (Conversation) */
  chat: Chat;
  messages: Message[];
  onSendMessage: (
    text: string,
    mediaUrl?: string,
    mediaType?: ComposerMediaType,
  ) => void;
  onEditMessage: (messageId: string, newText: string) => void;
  onDeleteMessage: (messageId: string) => void;
  onReactMessage: (messageId: string, emoji: string) => void;
  onPinMessage: (messageId: string) => void;
  onJoinChat: (chatId: string) => void;
  onLeaveGroup: (chatId: string) => void;
  onDeleteGroup: (chatId: string) => void;
  onUpdateGroupInfo: (
    chatId: string,
    updates: { name?: string; avatarUrl?: string; description?: string },
  ) => void;
  onInviteMembers: (chatId: string, invitedUsers: SelectableUser[]) => void;
  availableUsersForInvite: SelectableUser[];
  onUserTyping?: () => void;
  onBack: () => void;
  hasOlder?: boolean;
  isLoadingOlder?: boolean;
  onLoadOlder?: () => void;
}

interface GroupBubbleProps {
  msg: Message;
  showName: boolean;
  showAvatar: boolean;
  isFirstOfRun: boolean;
  isSelected: boolean;
  canReact: boolean;
  onTap: () => void;
  onLongPress: () => void;
  onReact: (emoji: string) => void;
  onOpenImage: (url: string) => void;
  innerRef: (el: HTMLDivElement | null) => void;
}

// አንድ የ Group መልዕክት — እንደ Telegram: የሌሎች በግራ (ከፎቶ ጋር)፣ የእኔ በቀኝ
function GroupBubble({
  msg,
  showName,
  showAvatar,
  isFirstOfRun,
  isSelected,
  canReact,
  onTap,
  onLongPress,
  onReact,
  onOpenImage,
  innerRef,
}: GroupBubbleProps) {
  const { bind, wasLongPress } = useLongPress(onLongPress);
  const mine = msg.isSentByMe;
  const reactions = msg.reactions ?? [];
  const myEmoji = reactions.find((r) => r.mine)?.emoji ?? null;
  const avatarUrl = isSafeMediaUrl(msg.senderAvatar)
    ? msg.senderAvatar
    : undefined;
  const timeLabel = msg.pending
    ? msg.time === "Waiting…"
      ? "Waiting…"
      : "Sending…"
    : msg.time;

  return (
    <div
      ref={innerRef}
      className={`flex w-full flex-col ${isFirstOfRun ? "mt-2" : "mt-0.5"}`}
    >
      {isSelected && canReact && !msg.pending && (
        <div className={`mb-1.5 ${mine ? "self-end" : "self-start pl-11"}`}>
          <QuickReactions onPick={onReact} activeEmoji={myEmoji} />
        </div>
      )}

      <div
        className={`flex w-full items-end gap-2 ${
          mine ? "justify-end" : "justify-start"
        }`}
      >
        {!mine &&
          (showAvatar ? (
            avatarUrl ? (
              <img
                src={avatarUrl}
                alt={msg.senderName}
                referrerPolicy="no-referrer"
                className="h-9 w-9 shrink-0 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-light text-xs font-bold text-primary">
                {(msg.senderName || "?").charAt(0).toUpperCase()}
              </div>
            )
          ) : (
            <div className="w-9 shrink-0" />
          ))}

        <article
          {...bind}
          onClick={(e) => {
            e.stopPropagation();
            if (wasLongPress()) return;
            onTap();
          }}
          className={`w-fit min-w-[6rem] max-w-[80%] cursor-pointer select-none rounded-2xl px-3 py-2 shadow-sm transition-shadow md:max-w-[65%] ${
            mine
              ? "rounded-br-md bg-chat-message-sent"
              : "rounded-bl-md bg-chat-message-received"
          } ${isSelected ? "ring-2 ring-primary-border" : ""}`}
        >
          {!mine && showName && (
            <span
              className={`mb-0.5 block text-[13px] font-bold ${nameColor(msg.senderName)}`}
            >
              {msg.senderName}
            </span>
          )}

          <MessageMedia
            msg={msg}
            onOpenImage={onOpenImage}
            wasLongPress={wasLongPress}
          />

          {msg.text && (
            <p className="whitespace-pre-wrap break-words text-[15px] leading-snug text-text-primary">
              {msg.text}
            </p>
          )}

          {reactions.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {reactions.map((r) => {
                const isMine = r.mine;
                return (
                  <button
                    key={r.emoji}
                    type="button"
                    disabled={!canReact || msg.pending}
                    onClick={(e) => {
                      e.stopPropagation();
                      onReact(r.emoji);
                    }}
                    className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-sm transition-colors ${
                      isMine
                        ? "border-primary-border bg-primary-light text-primary"
                        : "border-border bg-surface text-text-secondary hover:bg-surface-hover"
                    }`}
                  >
                    <span>{r.emoji}</span>
                    <span className="text-xs font-semibold">{r.count}</span>
                  </button>
                );
              })}
            </div>
          )}

          <div className="mt-0.5 flex items-center justify-end gap-1 text-[11px] text-text-muted">
            {msg.isPinned && <Pin className="h-3 w-3" />}
            {msg.isEdited && <span>edited</span>}
            <time>{timeLabel}</time>
            {mine && !msg.pending && (
              <CheckCheck
                className={`h-4 w-4 ${msg.seen ? "text-icon-active" : "text-icon-muted"}`}
              />
            )}
          </div>
        </article>
      </div>
    </div>
  );
}

// የ Group ማያ (Community group እና private group)
export default function GroupMessage({
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
  onInviteMembers,
  availableUsersForInvite,
  onUserTyping,
  onBack,
  hasOlder = false,
  isLoadingOlder = false,
  onLoadOlder = () => undefined,
}: GroupMessageProps) {
  const [selected, setSelected] = useState<{
    id: string;
    mode: "react" | "select";
  } | null>(null);
  const [editing, setEditing] = useState<{ id: string; text: string } | null>(
    null,
  );
  const [viewer, setViewer] = useState<{
    url: string;
    type: "image" | "video";
  } | null>(null);
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  const { scrollRef, endRef, onScroll } = useAutoScroll(chat.id, messages);
  const postRefs = useRef(new Map<string, HTMLDivElement>());

  // reactions እና pin የ Community group ብቻ ናቸው (የ private group backend የለውም)
  const isCommunityGroup = chat.type === "group";
  const isOwner = !!chat.isCreatedByMe;
  const canReact = isCommunityGroup && chat.isJoined;
  const selectedMessage = selected
    ? messages.find((m) => m.id === selected.id)
    : undefined;
  const pinnedMessages = isCommunityGroup
    ? messages.filter((m) => m.isPinned)
    : [];
  const latestPinned = pinnedMessages[pinnedMessages.length - 1];
  const isTyping = (chat.typingUsers?.length ?? 0) > 0;

  const isSelectMode = selected?.mode === "select" && !!selectedMessage;
  const selectedIsPending = !!selectedMessage?.pending;
  const canEditSelected = !!selectedMessage?.isSentByMe && !selectedIsPending;
  // ማጥፋት: የራሴን፤ ባለቤት ከሆንኩ (Community group) የማንንም
  const canDeleteSelected =
    !selectedIsPending &&
    (!!selectedMessage?.isSentByMe || (isCommunityGroup && isOwner));
  const canPinSelected = isCommunityGroup && isOwner && !selectedIsPending;

  const scrollToPost = (id: string) => {
    postRefs.current
      .get(id)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <section
      className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-chat-bg"
      aria-label="Group conversation"
    >
      {isSelectMode && selectedMessage ? (
        <MessageActionBar
          canEdit={canEditSelected}
          canCopy={!!selectedMessage.text}
          canPin={canPinSelected}
          isPinned={!!selectedMessage.isPinned}
          canDelete={canDeleteSelected}
          onEdit={() => {
            setEditing({ id: selectedMessage.id, text: selectedMessage.text });
            setSelected(null);
          }}
          onCopy={() => {
            void copyToClipboard(selectedMessage.text);
            setSelected(null);
          }}
          onPin={() => {
            onPinMessage(selectedMessage.id);
            setSelected(null);
          }}
          onDelete={() => {
            onDeleteMessage(selectedMessage.id);
            setSelected(null);
          }}
          onClose={() => setSelected(null)}
        />
      ) : (
        <header className="z-10 flex min-h-[68px] shrink-0 items-center gap-2 border-b border-border bg-surface px-4 py-3">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to chat list"
            className="-ml-1 rounded-full p-1.5 text-icon-primary hover:bg-surface-hover md:hidden"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={() => isCommunityGroup && setIsInfoOpen(true)}
            disabled={!isCommunityGroup}
            className="flex min-w-0 items-center gap-3 text-left disabled:cursor-default"
          >
            {chat.avatarUrl ? (
              <img
                src={chat.avatarUrl}
                alt={chat.name}
                referrerPolicy="no-referrer"
                className="h-11 w-11 shrink-0 rounded-full object-cover"
              />
            ) : (
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${chat.bgGradient}`}
              >
                {chat.avatarLabel}
              </div>
            )}
            <div className="min-w-0">
              <h2 className="truncate text-base font-bold leading-tight text-text-primary">
                {chat.name}
              </h2>
              <p className="text-sm leading-tight text-text-secondary">
                {chat.membersCount} members
              </p>
            </div>
          </button>
        </header>
      )}

      {latestPinned && (
        <button
          type="button"
          onClick={() => scrollToPost(latestPinned.id)}
          className="flex shrink-0 items-center gap-2 border-b border-border bg-surface px-4 py-2 text-left transition-colors hover:bg-surface-hover"
        >
          <Pin className="h-4 w-4 shrink-0 text-icon-secondary" />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-primary">Pinned message</p>
            <p className="truncate text-sm text-text-secondary">
              {latestPinned.text || "Media"}
            </p>
          </div>
        </button>
      )}

      <div
        ref={scrollRef}
        onScroll={onScroll}
        onClick={() => setSelected(null)}
        className="min-h-0 flex-1 overflow-y-auto px-3 py-3"
      >
        {hasOlder && messages.length > 0 && (
          <LoadOlderButton loading={isLoadingOlder} onClick={onLoadOlder} />
        )}
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-text-muted">
              No messages yet — say hi 👋
            </p>
          </div>
        ) : (
          <div className="flex flex-col">
            {messages.map((msg, i) => {
              const prev = messages[i - 1];
              const next = messages[i + 1];
              const sameSender = (other?: Message) =>
                !!other &&
                other.isSentByMe === msg.isSentByMe &&
                other.senderName === msg.senderName;
              const sameAsPrev = sameSender(prev);
              const sameAsNext = sameSender(next);
              return (
                <GroupBubble
                  key={msg.id}
                  msg={msg}
                  showName={!msg.isSentByMe && !sameAsPrev}
                  showAvatar={!msg.isSentByMe && !sameAsNext}
                  isFirstOfRun={!sameAsPrev}
                  isSelected={selected?.id === msg.id}
                  canReact={canReact}
                  onTap={() =>
                    setSelected((cur) =>
                      cur?.id === msg.id ? null : { id: msg.id, mode: "react" },
                    )
                  }
                  onLongPress={() =>
                    setSelected({ id: msg.id, mode: "select" })
                  }
                  onReact={(emoji) => {
                    onReactMessage(msg.id, emoji);
                    setSelected(null);
                  }}
                  onOpenImage={(url) => setViewer({ url, type: "image" })}
                  innerRef={(el) => {
                    if (el) postRefs.current.set(msg.id, el);
                    else postRefs.current.delete(msg.id);
                  }}
                />
              );
            })}
          </div>
        )}

        {isTyping && (
          <div className="mt-2 flex w-fit items-center gap-1.5 rounded-2xl rounded-bl-md bg-chat-message-received px-4 py-3 shadow-sm">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-icon-muted [animation-delay:-0.3s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-icon-muted [animation-delay:-0.15s]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-icon-muted" />
          </div>
        )}
        <div ref={endRef} />
      </div>

      {chat.isJoined ? (
        <MessageComposer
          key={editing?.id ?? "compose"}
          placeholder="Message"
          initialText={editing?.text ?? ""}
          editing={!!editing}
          onSend={onSendMessage}
          onSubmitEdit={(text) => {
            if (editing) onEditMessage(editing.id, text);
            setEditing(null);
          }}
          onCancelEdit={() => setEditing(null)}
          onTyping={onUserTyping}
        />
      ) : (
        <div className="flex shrink-0 items-center justify-between gap-4 border-t border-border bg-surface px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <p className="text-sm text-text-secondary">
            Join this group to send messages.
          </p>
          <button
            type="button"
            onClick={() => onJoinChat(chat.id)}
            className="shrink-0 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-text-on-primary transition-colors hover:bg-primary-hover"
          >
            Join group
          </button>
        </div>
      )}

      <MediaViewer media={viewer} onClose={() => setViewer(null)} />

      {isInfoOpen && isCommunityGroup && (
        <GroupInfoModal
          chat={chat}
          // የሐሰት (demo) አባላት ተወግደዋል፤ ባለፈ አባላት ዝርዝር ሲመጣ እዚህ ይገባል።
          // invite ጊዜ ቀድሞ አባል የሆነን backend ራሱ ይዘለዋል።
          members={[]}
          messages={messages}
          availableUsersForInvite={availableUsersForInvite}
          onInviteMembers={onInviteMembers}
          onViewMedia={(url) => setViewer({ url, type: "image" })}
          onLeaveGroup={onLeaveGroup}
          onDeleteGroup={onDeleteGroup}
          onUpdateGroupInfo={onUpdateGroupInfo}
          onClose={() => setIsInfoOpen(false)}
        />
      )}
    </section>
  );
}
