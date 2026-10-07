import { useState } from "react";
import { X, Send, WifiOff, RotateCw, Loader2 } from "lucide-react";
import EmojiPicker from "./EmojiPicker";
import CommentCard from "./CommentCard";
import type { CommentItem, CommentSort } from "../types";

interface CommentModalProps {
  comments: CommentItem[];
  totalCount?:number;
  currentUsername: string;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  hasMore?: boolean;
  isLoadingMore?: boolean;
  onLoadMore?: () => void;
  onClose: () => void;
  onPostComment: (text: string) => Promise<boolean>;
  onDeleteComment: (id: string) => void;
  onEditComment: (id: string, text: string) => void;
  onAddReply: (id: string, text: string) => Promise<boolean>;
  onDeleteReply: (commentId: string, replyId: string) => void;
}

export default function CommentModal({
  comments,
  totalCount,
  currentUsername,
  isLoading = false,
  error = null,
  onRetry,
  hasMore = false,
  isLoadingMore = false,
  onLoadMore,
  onClose,
  onPostComment,
  onDeleteComment,
  onEditComment,
  onAddReply,
  onDeleteReply,
}: CommentModalProps) {
  const [sort, setSort] = useState<CommentSort>("newest");
  const [newCommentText, setNewCommentText] = useState("");
  const [postFailed, setPostFailed] = useState(false);

  const sortedComments = [...comments].sort((a, b) => {
    const diff =
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    return sort === "newest" ? -diff : diff;
  });
  async function handlePost() {
    const trimmed = newCommentText.trim();
    if (!trimmed) return;
    setPostFailed(false);
    const success = await onPostComment(trimmed);
    if (success) {
      setNewCommentText("");
    } else {
      // Network/API failure — text ራሱ አልጠፋም፣ ተጠቃሚው ደግሞ Send ሊጫን ይችላል
      setPostFailed(true);
    }
  }

  return (
    <>
      {/* Mobile dim backdrop — Instagram bottom sheets ስር ያለውን feed ያደበዝዛሉ */}
      <div
        className="fixed inset-0 z-[9998] bg-black/40 md:hidden"
        onClick={onClose}
      />

      <div className="animate-slide-up fixed inset-x-0 bottom-0 z-[9999] flex h-[80vh] w-full flex-col overflow-hidden rounded-t-[20px] bg-bodey-bg shadow-2xl md:inset-x-auto md:inset-y-4 md:bottom-auto md:right-4 md:h-[calc(100vh-2rem)] md:max-h-none md:w-[420px] md:rounded-[18px]">
        <div className="flex shrink-0 items-center justify-between border-b border-zinc-800 bg-bodey-bg px-4 py-3.5">
          <div className="w-8" />
          <h3 className="text-[15px] font-semibold text-white">
            {error ? "Comments" : `${totalCount ?? comments.length} comments`}
          </h3>
          <div className="flex items-center gap-2">
            {!error && (
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as CommentSort)}
                className="rounded-md border-none bg-zinc-800 px-1.5 py-1 text-[10px] font-semibold text-zinc-300 outline-none"
              >
                <option value="newest">⬇ Newest</option>
                <option value="oldest">⬆ Oldest</option>
              </select>
            )}
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

        {/* Network/load failure — retry-only, no composer shown at all
            (per product decision: don't let someone type a comment into a
            list that may not even be current, or post it against no
            connection). */}
        {error ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <WifiOff size={28} className="text-zinc-500" />
            <p className="text-sm text-zinc-400">{error}</p>
            <button
              type="button"
              onClick={onRetry}
              className="flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white active:scale-95 transition-transform"
            >
              <RotateCw size={14} />
              Retry
            </button>
          </div>
        ) : (
          <>
            <div className="scrollbar-thin flex min-h-[200px] flex-1 flex-col gap-4 overflow-y-auto bg-bodey-bg px-4 py-4">
              {isLoading && comments.length === 0 ? (
                <div className="m-auto flex flex-col items-center gap-2 text-zinc-500">
                  <Loader2 size={22} className="animate-spin" />
                  <span className="text-xs">Loading...</span>
                </div>
              ) : sortedComments.length === 0 ? (
                <div className="m-auto px-4 py-6 text-center text-sm leading-relaxed text-zinc-500">
                  <span className="mb-2 block text-3xl">💬</span>
                  No comments yet. Be the first!
                </div>
              ) : (
                <>
                  {sortedComments.map((comment) => (
                    <CommentCard
                      key={comment.id}
                      comment={comment}
                      currentUsername={currentUsername}
                      onDelete={onDeleteComment}
                      onEdit={onEditComment}
                      onAddReply={onAddReply}
                      onDeleteReply={onDeleteReply}
                    />
                  ))}
                  {hasMore && sort === "newest" && (
                    <button
                      type="button"
                      onClick={onLoadMore}
                      disabled={isLoadingMore}
                      className="mx-auto mt-1 rounded-full bg-zinc-800 px-4 py-1.5 text-xs font-semibold text-zinc-300 disabled:opacity-50"
                    >
                      {isLoadingMore ? "Loading..." : "See more comments"}
                    </button>
                  )}
                </>
              )}
            </div>

            <div className="flex shrink-0 flex-col border-t border-zinc-800 bg-surface">
              {postFailed && (
                <p className="px-4 pt-2 text-[11px] font-medium text-rose-400">
                  Not sent - check connection and try again
                </p>
              )}
              <div className="flex items-center gap-2 px-3 py-2.5">
                <EmojiPicker
                  onSelect={(emoji) => setNewCommentText((t) => t + emoji)}
                />
                <textarea
                  value={newCommentText}
                  maxLength={300}
                  rows={1}
                  placeholder="Add a comment..."
                  onChange={(e) => {
                    setNewCommentText(e.target.value);
                    if (postFailed) setPostFailed(false);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && void handlePost()}
                  className="flex-1 rounded-full border border-input-border resize-none bg-input px-3.5 py-1.5 text-[13px] leading-tight text-input-text placeholder-placeholder outline-none focus:border-brand-light"
                />
                <button
                  type="button"
                  onClick={() => void handlePost()}
                  disabled={!newCommentText.trim()}
                  className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-brand text-white disabled:opacity-40 hover:brightness-110 active:scale-95"
                >
                  <Send size={15} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
