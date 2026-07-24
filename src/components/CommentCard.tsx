import { useState } from "react";
import { Pencil, Trash2, Send } from "lucide-react";
import EmojiPicker from "./EmojiPicker";
import type { CommentItem, CommentReply } from "../types";

const REPLIES_VISIBLE_LIMIT = 2;

interface CommentCardProps {
  comment: CommentItem;
  currentUsername: string;
  onDelete: (commentId: number) => void;
  onEdit: (commentId: number, newText: string) => void;
  onAddReply: (commentId: number, text: string) => void;
  onDeleteReply: (commentId: number, replyId: number) => void;
}

export default function CommentCard({
  comment,
  currentUsername,
  onDelete,
  onEdit,
  onAddReply,
  onDeleteReply,
}: CommentCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.text);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [showAllReplies, setShowAllReplies] = useState(false);

  const isOwner = comment.username === currentUsername;
  const visibleReplies = showAllReplies
    ? comment.replies
    : comment.replies.slice(0, REPLIES_VISIBLE_LIMIT);
  const hiddenCount = comment.replies.length - REPLIES_VISIBLE_LIMIT;

  function saveEdit() {
    const trimmed = editText.trim();
    if (!trimmed) return;
    onEdit(comment.id, trimmed);
    setIsEditing(false);
  }

  function submitReply() {
    const trimmed = replyText.trim();
    if (!trimmed) return;
    onAddReply(comment.id, trimmed);
    setReplyText("");
    setShowReplyInput(false);
  }
return (
    <div className="flex items-start gap-2.5">
      <img
        src={comment.avatar ?? undefined}
        alt={comment.username}
        className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-zinc-800"
      />

      <div className="min-w-0 flex-1">
        {!isEditing ? (
          <div className="flex flex-col gap-0.5">
            <span className="text-[13px] font-semibold text-white">
              {comment.username}
            </span>
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
          <span className="text-[11px] text-zinc-500">{comment.timestamp}</span>
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
          <div className="mt-2 flex items-center gap-2 rounded-xl bg-zinc-900 p-2">
            <EmojiPicker onSelect={(emoji) => setReplyText((t) => t + emoji)} />
            <input
              value={replyText}
              maxLength={300}
              placeholder="Write a reply..."
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitReply()}
              className="flex-1 rounded-full border border-zinc-700 bg-black px-3.5 py-1.5 text-xs text-white placeholder:text-zinc-500 outline-none focus:border-zinc-500"
            />
            <button
              type="button"
              onClick={submitReply}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand text-white hover:brightness-110"
            >
              <Send size={14} />
            </button>
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
  return (
    <div className="flex items-start gap-2">
      <img
        src={reply.avatar ?? undefined}
        alt={reply.username}
        className="h-6 w-6 shrink-0 rounded-full object-cover ring-1 ring-zinc-800"
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-col gap-0.5">
          <span className="text-[12px] font-semibold text-white">
            {reply.username}
          </span>
          <p className="text-sm leading-snug text-zinc-200">
            {reply.text}
          </p>
        </div>
        <p className="mt-1 text-[11px] text-zinc-500">{reply.timestamp}</p>
      </div>
      {isOwner && (
        <button
          type="button"
          onClick={onDelete}
          className="shrink-0 text-zinc-500 hover:text-rose-400"
          aria-label="Delete reply"
        >
          <Trash2 size={13} />
        </button>
      )}
    </div>
  );
}