import { useState } from "react";
import { ArrowLeft, Check, CheckCheck } from "lucide-react";
import type { Chat, Message } from "../../types";
import ChatInfoModal from "./ChatInfoModal";
import MediaViewer from "./MediaViewer";
import MessageActionBar from "./MessageActionBar";
import MessageComposer from "./MessageComposer";
import type { ComposerMediaType } from "./MessageComposer";
import MessageMedia from "./MessageMedia";
import LoadOlderButton from "./LoadOlderButton";
import { useAutoScroll } from "./useAutoScroll";
import { useLongPress } from "./useLongPress";
import { copyToClipboard } from "./messagingUtils";

interface ChatMessageProps {
  chat: Chat;
  messages: Message[];
  onSendMessage: (
    text: string,
    mediaUrl?: string,
    mediaType?: ComposerMediaType,
  ) => void;
  onEditMessage: (messageId: string, newText: string) => void;
  onDeleteMessage: (messageId: string) => void;
  onUserTyping?: () => void;
  onBack: () => void;
  hasOlder?: boolean;
  isLoadingOlder?: boolean;
  onLoadOlder?: () => void;
}

interface ChatBubbleProps {
  msg: Message;
  isFirstOfRun: boolean;
  isSelected: boolean;
  onTap: () => void;
  onLongPress: () => void;
  onOpenImage: (url: string) => void;
}

// አንድ የ 1:1 መልዕክት — የእኔ በቀኝ፣ የሌላው በግራ (ስም/ፎቶ የለም፣ ሁለት ሰው ብቻ ስለሆነ)
function ChatBubble({
  msg,
  isFirstOfRun,
  isSelected,
  onTap,
  onLongPress,
  onOpenImage,
}: ChatBubbleProps) {
  const { bind, wasLongPress } = useLongPress(onLongPress);
  const mine = msg.isSentByMe;
  const timeLabel = msg.pending
    ? msg.time === "Waiting…"
      ? "Waiting…"
      : "Sending…"
    : msg.time;

  return (
    <div
      className={`flex w-full ${mine ? "justify-end" : "justify-start"} ${
        isFirstOfRun ? "mt-2" : "mt-0.5"
      }`}
    >
      <article
        {...bind}
        onClick={(e) => {
          e.stopPropagation();
          if (wasLongPress()) return;
          onTap();
        }}
        className={`w-fit min-w-[5rem] max-w-[80%] cursor-pointer select-none rounded-2xl px-3 py-2 shadow-sm transition-shadow md:max-w-[65%] ${
          mine
            ? "rounded-br-md bg-chat-message-sent"
            : "rounded-bl-md bg-chat-message-received"
        } ${isSelected ? "ring-2 ring-primary-border" : ""}`}
      >
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

        <div className="mt-0.5 flex items-center justify-end gap-1 text-[11px] text-text-muted">
          {msg.isEdited && <span>edited</span>}
          <time>{timeLabel}</time>
          {mine &&
            !msg.pending &&
            (msg.seen ? (
              <CheckCheck className="h-4 w-4 text-icon-active" />
            ) : (
              <Check className="h-4 w-4 text-icon-muted" />
            ))}
        </div>
      </article>
    </div>
  );
}

// የ 1:1 ማያ
export default function ChatMessage({
  chat,
  messages,
  onSendMessage,
  onEditMessage,
  onDeleteMessage,
  onUserTyping,
  onBack,
  hasOlder = false,
  isLoadingOlder = false,
  onLoadOlder = () => undefined,
}: ChatMessageProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ id: string; text: string } | null>(
    null,
  );
  // "Say Hi" ሲነካ composer በ "👋 Hi!" ተሞልቶ እንደገና ይፈጠራል (ትኩረት ያገኛል)
  const [seed, setSeed] = useState({ key: 0, text: "" });
  const [viewer, setViewer] = useState<{
    url: string;
    type: "image" | "video";
  } | null>(null);
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  const { scrollRef, endRef, onScroll } = useAutoScroll(chat.id, messages);

  const selectedMessage = selectedId
    ? messages.find((m) => m.id === selectedId)
    : undefined;
  // ማስተካከል እና ማጥፋት የራስን መልዕክት ብቻ (backend ደግሞ ይከለክላል)
  const canManageSelected =
    !!selectedMessage?.isSentByMe && !selectedMessage?.pending;

  const isTyping = (chat.typingUsers?.length ?? 0) > 0;
  const isOnline = chat.isOnline === true;
  const statusText = isTyping ? "typing…" : isOnline ? "online" : "offline";
  const statusClass = isTyping || isOnline ? "text-online" : "text-text-muted";

  return (
    <section
      className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-chat-bg"
      aria-label="Private conversation"
    >
      {selectedMessage ? (
        <MessageActionBar
          canEdit={canManageSelected}
          canCopy={!!selectedMessage.text}
          canPin={false}
          isPinned={false}
          canDelete={canManageSelected}
          onEdit={() => {
            setEditing({ id: selectedMessage.id, text: selectedMessage.text });
            setSelectedId(null);
          }}
          onCopy={() => {
            void copyToClipboard(selectedMessage.text);
            setSelectedId(null);
          }}
          onPin={() => undefined}
          onDelete={() => {
            onDeleteMessage(selectedMessage.id);
            setSelectedId(null);
          }}
          onClose={() => setSelectedId(null)}
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
              <p className={`text-sm leading-tight ${statusClass}`}>
                {statusText}
              </p>
            </div>
          </button>
        </header>
      )}

      <div
        ref={scrollRef}
        onScroll={onScroll}
        onClick={() => setSelectedId(null)}
        className="min-h-0 flex-1 overflow-y-auto px-3 py-3"
      >
        {hasOlder && messages.length > 0 && (
          <LoadOlderButton loading={isLoadingOlder} onClick={onLoadOlder} />
        )}
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
            <style>{`
              @keyframes nexify-wave {
                0%, 60%, 100% { transform: rotate(0deg); }
                10%, 30% { transform: rotate(14deg); }
                20% { transform: rotate(-8deg); }
                40% { transform: rotate(14deg); }
                50% { transform: rotate(-4deg); }
              }
              .nexify-wave-emoji {
                animation: nexify-wave 1.8s ease-in-out infinite;
                transform-origin: 70% 70%;
                display: inline-block;
              }
              @media (prefers-reduced-motion: reduce) {
                .nexify-wave-emoji { animation: none; }
              }
            `}</style>
            <span className="nexify-wave-emoji select-none text-6xl">👋</span>
            <p className="max-w-[220px] text-sm text-text-muted">
              This is the start of your conversation.
            </p>
            <button
              type="button"
              onClick={() =>
                setSeed((s) => ({ key: s.key + 1, text: "👋 Hi!" }))
              }
              className="rounded-full bg-primary-light px-5 py-2 text-xs font-semibold text-primary transition-all hover:bg-surface-active active:scale-95"
            >
              👋 Say Hi
            </button>
          </div>
        ) : (
          <div className="flex flex-col">
            {messages.map((msg, i) => {
              const prev = messages[i - 1];
              return (
                <ChatBubble
                  key={msg.id}
                  msg={msg}
                  isFirstOfRun={!prev || prev.isSentByMe !== msg.isSentByMe}
                  isSelected={selectedId === msg.id}
                  onTap={() => setSelectedId(null)}
                  onLongPress={() => setSelectedId(msg.id)}
                  onOpenImage={(url) => setViewer({ url, type: "image" })}
                />
              );
            })}
          </div>
        )}
        <div ref={endRef} />
      </div>

      <MessageComposer
        key={editing ? `edit-${editing.id}` : `compose-${seed.key}`}
        placeholder="Message"
        initialText={editing ? editing.text : seed.text}
        autoFocus={!!editing || seed.text !== ""}
        editing={!!editing}
        onSend={onSendMessage}
        onSubmitEdit={(text) => {
          if (editing) onEditMessage(editing.id, text);
          setEditing(null);
        }}
        onCancelEdit={() => setEditing(null)}
        onTyping={onUserTyping}
      />

      <MediaViewer media={viewer} onClose={() => setViewer(null)} />

      {isInfoOpen && (
        <ChatInfoModal chat={chat} onClose={() => setIsInfoOpen(false)} />
      )}
    </section>
  );
}
