import { useState } from "react";
import { X, Send } from "lucide-react";
import EmojiPicker from "./EmojiPicker";
import CommentCard from "./CommentCard";
import type { CommentItem, CommentSort } from "../types";

interface CommentModalProps {
  comments: CommentItem[];
  currentUsername: string;
  onClose: () => void;
  onPostComment: (text: string) => void;
  onDeleteComment: (id: string) => void;
  onEditComment: (id: string, text: string) => void;
  onAddReply: (id: string, text: string) => void;
  onDeleteReply: (commentId: string, replyId: string) => void;
}

export default function CommentModal({
  comments,
  currentUsername,
  onClose,
  onPostComment,
  onDeleteComment,
  onEditComment,
  onAddReply,
  onDeleteReply,
}: CommentModalProps) {
  const [sort, setSort] = useState<CommentSort>("newest");
  const [newCommentText, setNewCommentText] = useState("");
  const sortedComments = [...comments].sort((a, b) => {
    const diff =
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    return sort === "newest" ? -diff : diff;
  });
  function handlePost() {
    const trimmed = newCommentText.trim();
    if (!trimmed) return;
    onPostComment(trimmed);
    setNewCommentText("");
  }
  return (
    <>
      {/* Mobile dim backdrop — Instagram bottom sheets ስር ያለውን feed ያደበዝዛሉ */}
      <div
        className="fixed inset-0 z-[9998] bg-black/40 md:hidden"
        onClick={onClose}
      />

      <div className="animate-slide-up fixed inset-x-0 bottom-0 z-[9999] flex h-[80vh] w-full flex-col overflow-hidden rounded-t-[20px] bg-surface shadow-2xl md:inset-x-auto md:inset-y-4 md:bottom-auto md:right-4 md:h-[calc(100vh-2rem)] md:max-h-none md:w-[420px] md:rounded-[18px]">
        <div className="flex shrink-0 items-center justify-between border-b border-zinc-800 bg-surface px-4 py-3.5">
          <div className="w-8" />
          <h3 className="text-[15px] font-semibold text-white">
            {comments.length} comments
          </h3>
          <div className="flex items-center gap-2">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as CommentSort)}
              className="rounded-md border-none bg-zinc-800 px-1.5 py-1 text-[10px] font-semibold text-zinc-300 outline-none"
            >
              <option value="newest">⬇ Newest</option>
              <option value="oldest">⬆ Oldest</option>
            </select>
            <button
              type="button"
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-full text-zinc-400 hover:text-white"
              aria-label="Close comments"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="scrollbar-thin flex min-h-[200px] flex-1 flex-col gap-4 overflow-y-auto bg-surface px-4 py-4">
          {sortedComments.length === 0 ? (
            <div className="m-auto px-4 py-6 text-center text-sm leading-relaxed text-zinc-500">
              <span className="mb-2 block text-3xl">💬</span>
              No comments yet. Be the first!
            </div>
          ) : (
            sortedComments.map((comment) => (
              <CommentCard
                key={comment.id}
                comment={comment}
                currentUsername={currentUsername}
                onDelete={onDeleteComment}
                onEdit={onEditComment}
                onAddReply={onAddReply}
                onDeleteReply={onDeleteReply}
              />
            ))
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2 border-t border-zinc-800 bg-surface px-3 py-2.5">
          <EmojiPicker
            onSelect={(emoji) => setNewCommentText((t) => t + emoji)}
          />
          <textarea
            value={newCommentText}
            maxLength={300}
            placeholder="Add a comment..."
            onChange={(e) => setNewCommentText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handlePost()}
            className="flex-1 rounded-full border border-input-border resize-none bg-surface-raised px-3.5 py-1.5 text-[13px] text-text placeholder-placeholder outline-none focus:border-zinc-500"
          />
          <button
            type="button"
            onClick={handlePost}
            disabled={!newCommentText.trim()}
            className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-brand text-white disabled:opacity-40 hover:brightness-110 active:scale-95"
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </>
  );
}
