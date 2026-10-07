import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, Trash2, Send } from "lucide-react";
import { useRelativeTime } from "../hooks/useRelativeTime";
import type { CommentItem, CommentReply } from "../types";

const REPLIES_VISIBLE_LIMIT = 2;

interface CommentCardProps {
  comment: CommentItem;
  currentUsername: string;
  onDelete: (commentId: string) => void;
  onEdit: (commentId: string, newText: string) => void;
  onAddReply: (commentId: string, text: string) => Promise<boolean>;
  onDeleteReply: (commentId: string, replyId: string) => void;
}

// Shared by both CommentCard and ReplyCard — real avatar if set, otherwise
// an initial-letter gradient circle (matches PostCard's own avatar
// fallback) instead of a broken <img> icon.
function CommentAvatar({
  username,
  avatarUrl,
  size,
  onClick,
}: {
  username: string;
  avatarUrl: string | null;
  size: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="shrink-0 rounded-full overflow-hidden ring-1 ring-zinc-800"
      style={{ width: size, height: size }}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={username}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs font-bold">
          {username[0]?.toUpperCase()}
        </div>
      )}
    </button>
  );
}

export default function CommentCard({
  comment,
  currentUsername,
  onDelete,
  onEdit,
  onAddReply,
  onDeleteReply,
}: CommentCardProps) {
  const navigate = useNavigate();
  const timeAgo = useRelativeTime(comment.timestamp);

  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.text);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replyFailed, setReplyFailed] = useState(false);
  const [showAllReplies, setShowAllReplies] = useState(false);

  const isOwner = comment.username === currentUsername;
  const visibleReplies = showAllReplies
    ? comment.replies
    : comment.replies.slice(0, REPLIES_VISIBLE_LIMIT);
  const hiddenCount = comment.replies.length - REPLIES_VISIBLE_LIMIT;

  // ⚠️ Assumption: profile route is `/profile/:username` — ይህ ካልሆነ ንገረኝ
  function goToProfile() {
    navigate(`/profile/${comment.username}`);
  }

  function saveEdit() {
    const trimmed = editText.trim();
    if (!trimmed) return;
    onEdit(comment.id, trimmed);
    setIsEditing(false);
  }

  async function submitReply() {
    const trimmed = replyText.trim();
    if (!trimmed) return;
    setReplyFailed(false);
    const success = await onAddReply(comment.id, trimmed);
    if (success) {
      setReplyText("");
      setShowReplyInput(false);
    } else {
      setReplyFailed(true);
    }
  }

  return (
    <div className="flex items-start gap-2.5">
      <CommentAvatar
        username={comment.username}
        avatarUrl={comment.avatar}
        size={36}
        onClick={goToProfile}
      />

      <div className="min-w-0 flex-1">
        {!isEditing ? (
          <div className="flex flex-col gap-0.5">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={goToProfile}
                className="text-[13px] font-semibold text-white hover:underline"
              >
                @{comment.username}
              </button>
              <span className="text-[11px] text-zinc-500">· {timeAgo}</span>
            </div>
            <p className="break-words text-sm leading-snug text-zinc-100">
              {comment.text}
            </p>
          </div>
        ) : (
          <div>
            <input
              value={editText}
              maxLength={300}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveEdit();
                if (e.key === "Escape") setIsEditing(false);
              }}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-sm text-white outline-none"
              autoFocus
            />
            <div className="mt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="rounded-lg bg-zinc-800 px-4 py-1 text-xs font-bold text-zinc-300 hover:bg-zinc-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveEdit}
                className="rounded-lg bg-brand px-4 py-1 text-xs font-bold text-white hover:brightness-110"
              >
                Save
              </button>
            </div>
          </div>
        )}

        <div className="mt-1.5 flex items-center gap-3.5">
          <button
            type="button"
            onClick={() => setShowReplyInput((s) => !s)}
            className="text-xs font-semibold text-zinc-400 hover:text-white"
          >
            Reply
          </button>
          {isOwner && (
            <>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="text-zinc-500 hover:text-white"
                aria-label="Edit comment"
              >
                <Pencil size={13} />
              </button>
              <button
                type="button"
                onClick={() => onDelete(comment.id)}
                className="text-zinc-500 hover:text-rose-400"
                aria-label="Delete comment"
              >
                <Trash2 size={13} />
              </button>
            </>
          )}
        </div>

        {showReplyInput && (
          <div className="mt-2 flex flex-col gap-1">
            {replyFailed && (
              <p className="text-[11px] font-medium text-rose-400">
                አልተላከም — ግንኙነት ይፈትሹ እና እንደገና ይሞክሩ
              </p>
            )}
            {/* Emoji picker removed per product decision — reply composer
                stays plain-input-only. */}
            <div className="flex items-center gap-2 rounded-xl bg-zinc-900 p-2">
              <input
                value={replyText}
                maxLength={300}
                placeholder="Write a reply..."
                onChange={(e) => {
                  setReplyText(e.target.value);
                  if (replyFailed) setReplyFailed(false);
                }}
                onKeyDown={(e) => e.key === "Enter" && void submitReply()}
                className="flex-1 rounded-full border border-zinc-700 bg-black px-3.5 py-1.5 text-xs text-white placeholder:text-zinc-500 outline-none focus:border-zinc-500"
              />
              <button
                type="button"
                onClick={() => void submitReply()}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-white hover:brightness-110"
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        )}

        {comment.replies.length > 0 && (
          <div className="mt-2 flex flex-col gap-2 border-l-2 border-zinc-800 pl-3">
            {visibleReplies.map((reply) => (
              <ReplyCard
                key={reply.id}
                reply={reply}
                isOwner={reply.username === currentUsername}
                onDelete={() => onDeleteReply(comment.id, reply.id)}
              />
            ))}
            {!showAllReplies && hiddenCount > 0 && (
              <button
                type="button"
                onClick={() => setShowAllReplies(true)}
                className="block py-1 text-left text-xs font-semibold text-zinc-400 hover:text-white hover:underline"
              >
                Show {hiddenCount} more{" "}
                {hiddenCount === 1 ? "reply" : "replies"}
              </button>
            )}
            {showAllReplies &&
              comment.replies.length > REPLIES_VISIBLE_LIMIT && (
                <button
                  type="button"
                  onClick={() => setShowAllReplies(false)}
                  className="block py-1 text-left text-xs font-semibold text-zinc-400 hover:text-white hover:underline"
                >
                  Show less
                </button>
              )}
          </div>
        )}
      </div>
    </div>
  );
}

function ReplyCard({
  reply,
  isOwner,
  onDelete,
}: {
  reply: CommentReply;
  isOwner: boolean;
  onDelete: () => void;
}) {
  const navigate = useNavigate();
  const timeAgo = useRelativeTime(reply.timestamp);

  function goToProfile() {
    navigate(`/profile/${reply.username}`);
  }

  return (
    <div className="flex items-start gap-2">
      <CommentAvatar
        username={reply.username}
        avatarUrl={reply.avatar}
        size={24}
        onClick={goToProfile}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={goToProfile}
            className="text-[12px] font-semibold text-white hover:underline"
          >
            @{reply.username}
          </button>
          <span className="text-[10px] text-zinc-500">· {timeAgo}</span>
        </div>
        <p className="text-sm leading-snug text-zinc-200">{reply.text}</p>
        {isOwner && (
          <button
            type="button"
            onClick={onDelete}
            className="mt-1 text-[11px] font-semibold text-zinc-500 hover:text-rose-400"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
