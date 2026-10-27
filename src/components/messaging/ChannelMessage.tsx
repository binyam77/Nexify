import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Pin } from "lucide-react";
import type { Chat, Message } from "../../types";
import ChannelInfoModal from "./ChannelInfoModal";
import MediaViewer from "./MediaViewer";
import MessageActionBar, { QuickReactions } from "./MessageActionBar";
import MessageComposer from "./MessageComposer";
import type { ComposerMediaType } from "./MessageComposer";
import MessageMedia from "./MessageMedia";
import LoadOlderButton from "./LoadOlderButton";
import { useAutoScroll } from "./useAutoScroll";
import { useLongPress } from "./useLongPress";
import { copyToClipboard, formatRelativeTime } from "./messagingUtils";

interface ChannelMessageProps {
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
  onUnsubscribeChannel: (chatId: string) => void;
  onDeleteChannel: (chatId: string) => void;
  onUpdateChannelInfo: (
    chatId: string,
    updates: { name?: string; avatarUrl?: string; description?: string },
  ) => void;
  onBack: () => void;
  hasOlder?: boolean;
  isLoadingOlder?: boolean;
  onLoadOlder?: () => void;
}

// ሰዓቱ ("now → 5m → 2h") እንዲያድግ በየ ጊዜው ይታደሳል
function useNow(intervalMs: number): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

interface ChannelPostProps {
  msg: Message;
  nowMs: number;
  isSelected: boolean;
  canReact: boolean;
  onTap: () => void;
  onLongPress: () => void;
  onReact: (emoji: string) => void;
  onOpenImage: (url: string) => void;
  innerRef: (el: HTMLDivElement | null) => void;
}

// አንድ የ Channel post — እንደ Telegram: በመካከላቸው ክፍተት ያላቸው ክብ ሳጥኖች
function ChannelPost({
  msg,
  nowMs,
  isSelected,
  canReact,
  onTap,
  onLongPress,
  onReact,
  onOpenImage,
  innerRef,
}: ChannelPostProps) {
  const { bind, wasLongPress } = useLongPress(onLongPress);
  const reactions = msg.reactions ?? [];
  const myEmoji = reactions.find((r) => r.mine)?.emoji ?? null;
  const timeLabel = msg.pending
    ? msg.time === "Waiting…"
      ? "Waiting…"
      : "Sending…"
    : formatRelativeTime(msg.createdAt, nowMs, msg.time);

  return (
    <div ref={innerRef} className="flex w-full flex-col items-start">
      {isSelected && canReact && !msg.pending && (
        <div className="mb-1.5">
          <QuickReactions onPick={onReact} activeEmoji={myEmoji} />
        </div>
      )}

      <article
        {...bind}
        onClick={(e) => {
          e.stopPropagation();
          if (wasLongPress()) return;
          onTap();
        }}
        className={`w-fit min-w-[10rem] max-w-[92%] cursor-pointer select-none overflow-hidden rounded-2xl bg-chat-message-received shadow-sm transition-shadow md:max-w-lg ${
          isSelected ? "ring-2 ring-primary-border" : ""
        }`}
      >
        <MessageMedia
          msg={msg}
          variant="bleed"
          onOpenImage={onOpenImage}
          wasLongPress={wasLongPress}
        />

        {msg.text && (
          <p className="whitespace-pre-wrap break-words px-3 pt-2 text-[15px] leading-relaxed text-text-primary">
            {msg.text}
          </p>
        )}

        <div className="px-3 pb-2 pt-1">
          {reactions.length > 0 && (
            <div className="mb-1.5 flex flex-wrap gap-1.5">
              {reactions.map((r) => {
                const mine = r.mine;
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
                      mine
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

          <div className="flex items-center justify-end gap-1.5 text-xs text-text-muted">
            {msg.isPinned && <Pin className="h-3 w-3" />}
            {msg.isEdited && <span>edited</span>}
            <time>{timeLabel}</time>
          </div>
        </div>
      </article>
    </div>
  );
}

// የ Channel ማያ (ራስጌ፣ የተሰኩ፣ ልጥፎች፣ ባለቤት ብቻ የሚጽፍበት)
export default function ChannelMessage({
  chat,
  messages,
  onSendMessage,
  onEditMessage,
  onDeleteMessage,
  onReactMessage,
  onPinMessage,
  onJoinChat,
  onUnsubscribeChannel,
  onDeleteChannel,
  onUpdateChannelInfo,
  onBack,
  hasOlder = false,
  isLoadingOlder = false,
  onLoadOlder = () => undefined,
}: ChannelMessageProps) {
  // tap → emoji ረድፍ ብቻ ("react")፣ ረዘም ብሎ መያዝ → የድርጊት መስመር + emoji ("select")
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
  const nowMs = useNow(30_000);

  const { scrollRef, endRef, onScroll } = useAutoScroll(chat.id, messages);
  const postRefs = useRef(new Map<string, HTMLDivElement>());

  const isOwner = !!chat.isCreatedByMe;
  const canReact = chat.isJoined;
  const selectedMessage = selected
    ? messages.find((m) => m.id === selected.id)
    : undefined;
  const pinnedMessages = messages.filter((m) => m.isPinned);
  const latestPinned = pinnedMessages[pinnedMessages.length - 1];

  const scrollToPost = (id: string) => {
    postRefs.current
      .get(id)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const isSelectMode = selected?.mode === "select" && !!selectedMessage;
  const canEditSelected =
    isOwner && !!selectedMessage?.isSentByMe && !selectedMessage?.pending;
  const canManageSelected = isOwner && !selectedMessage?.pending;

  return (
    <section
      className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-chat-bg"
      aria-label="Channel"
    >
      {isSelectMode && selectedMessage ? (
        <MessageActionBar
          canEdit={canEditSelected}
          canCopy={!!selectedMessage.text}
          canPin={canManageSelected}
          isPinned={!!selectedMessage.isPinned}
          canDelete={canManageSelected}
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
            onClick={() => setIsInfoOpen(true)}
            className="flex min-w-0 items-center gap-3 text-left"
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
                {chat.membersCount} subscribers
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
            <p className="text-sm text-text-muted">No messages yet</p>
          </div>
        ) : (
          <div className="flex flex-col items-start gap-2">
            {messages.map((msg) => (
              <ChannelPost
                key={msg.id}
                msg={msg}
                nowMs={nowMs}
                isSelected={selected?.id === msg.id}
                canReact={canReact}
                onTap={() =>
                  setSelected((cur) =>
                    cur?.id === msg.id ? null : { id: msg.id, mode: "react" },
                  )
                }
                onLongPress={() => setSelected({ id: msg.id, mode: "select" })}
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
            ))}
          </div>
        )}
        <div ref={endRef} />
      </div>

      {isOwner ? (
        <MessageComposer
          key={editing?.id ?? "compose"}
          placeholder={editing ? "Edit post" : "Write a post..."}
          initialText={editing?.text ?? ""}
          editing={!!editing}
          onSend={onSendMessage}
          onSubmitEdit={(text) => {
            if (editing) onEditMessage(editing.id, text);
            setEditing(null);
          }}
          onCancelEdit={() => setEditing(null)}
        />
      ) : chat.isJoined ? (
        <div className="shrink-0 border-t border-border bg-surface px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] text-center text-sm text-text-muted">
          Only the channel owner can post here.
        </div>
      ) : (
        <div className="flex shrink-0 items-center justify-between gap-4 border-t border-border bg-surface px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <p className="text-sm text-text-secondary">
            Subscribe to receive updates from this channel.
          </p>
          <button
            type="button"
            onClick={() => onJoinChat(chat.id)}
            className="shrink-0 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-text-on-primary transition-colors hover:bg-primary-hover"
          >
            Subscribe
          </button>
        </div>
      )}

      <MediaViewer media={viewer} onClose={() => setViewer(null)} />

      {isInfoOpen && (
        <ChannelInfoModal
          chat={chat}
          messages={messages}
          onViewMedia={(url) => setViewer({ url, type: "image" })}
          onUnsubscribe={onUnsubscribeChannel}
          onDeleteChannel={onDeleteChannel}
          onUpdateChannelInfo={onUpdateChannelInfo}
          onClose={() => setIsInfoOpen(false)}
        />
      )}
    </section>
  );
}
