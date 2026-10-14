/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import {
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  Trash2,
  Send,
  Pencil,
  Check,
  X as CloseIcon,
} from "lucide-react";
import { useState } from "react";
import type { FeedPost, CommentItem } from "../types";

function formatRelativeTime(timestamp: string): string {
  const diffMs = Date.now() - new Date(timestamp).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "now";
  if (diffMin < 60) return `${diffMin}m`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay}d`;
  const diffWeek = Math.floor(diffDay / 7);
  if (diffWeek < 4) return `${diffWeek}w`;
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

// Left.tsx የProp ዓይነቶች መግለጫ (Props Interface for Left.tsx)
interface LeftProps {
  selectedPost: FeedPost;
  comments: CommentItem[];
  totalComments: number;
  isLoadingComments: boolean;
  commentsError: string | null;
  loadMoreComments: (postId: string) => Promise<void>;
  onRetryComments: () => void;
  onSubmitComment: () => void;
  onSubmitReply: (commentId: string) => void;
  isSubmitting: boolean;
  commentError: string | null;
  hasMoreComments: boolean;
  isLoadingMoreComments: boolean;
  shares: number;
  isOwnPost: boolean;
  postAuthor: {
    name: string;
    username: string;
    photo: string;
    isFollowing: boolean;
    followersCount: number;
    bio: string;
  };
  profile: {
    name: string;
    username: string;
    photo: string;
    bio: string;
  };
  commentInputText: string;
  setCommentInputText: (text: string) => void;
  emojiPickerOpen: boolean;
  setEmojiPickerOpen: (open: boolean) => void;
  activeReplyTo: string | null;
  setActiveReplyTo: (id: string | null) => void;

  replyInputText: string;
  setReplyInputText: (text: string) => void;

  // ተፅዕኖ ፈጣሪ ተግባራት (Interactive event handlers)
  handleToggleLikePost: (postId: string) => void;
  handleToggleSavePost: (postId: string) => void;
  handleSharePost: (postId: string) => void;
  handleDeletePost: (postId: string, e?: React.MouseEvent) => void;
  handleDeleteComment: (postId: string, commentId: string) => void;
  handleDeleteReply: (
    postId: string,
    commentId: string,
    replyId: string,
  ) => void;
  handleEditComment: (
    postId: string,
    commentId: string,
    newText: string,
  ) => void;

  handleNavigateToUserProfile: (username: string) => void;
  formatCount: (num: number) => string;
}

export default function Left({
  selectedPost,
  comments,
  totalComments,
  isLoadingComments,
  commentsError,
  loadMoreComments,
  hasMoreComments,
  isLoadingMoreComments,
  shares,
  isOwnPost,
  postAuthor,
  profile,
  commentInputText,
  setCommentInputText,
  emojiPickerOpen,
  setEmojiPickerOpen,
  activeReplyTo,
  setActiveReplyTo,
  replyInputText,
  setReplyInputText,
  handleToggleLikePost,
  handleToggleSavePost,
  handleSharePost,
  handleDeletePost,
  onRetryComments,
  onSubmitComment,
  onSubmitReply,
  isSubmitting,
  commentError,
  handleDeleteComment,
  handleDeleteReply,
  handleEditComment,
  handleNavigateToUserProfile,
  formatCount,
}: LeftProps) {
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editInputText, setEditInputText] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  // Backend ደግሞ oldest-first (createdAt asc) ነው የሚመልሰው — "newest" ማለት reverse ማለት ነው
  const sortedComments =
    sortOrder === "newest" ? [...comments].reverse() : comments;

  const startEditing = (item: { id: string; text: string }) => {
    setEditingCommentId(item.id);
    setEditInputText(item.text);
  };

  const confirmEdit = (commentId: string) => {
    const trimmed = editInputText.trim();
    if (trimmed) {
      handleEditComment(selectedPost.id, commentId, trimmed);
    }
    setEditingCommentId(null);
    setEditInputText("");
  };
  return (
    <aside className="hidden md:flex md:w-[420px] flex-col h-full overflow-hidden bg-surface border-l border-border">
      {/* 1. Header with Post Author info */}
      <header className="flex items-center justify-between p-5 pb-3.5 border-b border-border shrink-0">
        <div
          onClick={() => handleNavigateToUserProfile(postAuthor.username)}
          className="flex items-center gap-3 cursor-pointer group hover:opacity-85 transition-opacity"
          title="View Profile"
        >
          <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-primary bg-primary-light flex items-center justify-center text-primary text-sm font-bold shrink-0 group-hover:scale-105 transition-transform">
            {postAuthor.photo ? (
              <img
                src={postAuthor.photo}
                alt={postAuthor.name}
                className="w-full h-full object-cover"
              />
            ) : (
              postAuthor.name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <h2 className="text-[15px] font-bold text-text-primary leading-none group-hover:text-link transition-colors">
                {postAuthor.name}
              </h2>
              <span className="text-[12px] text-text-muted font-medium">
                @{postAuthor.username}
              </span>
            </div>
            <span className="text-[11px] text-text-muted mt-1">
              {new Date(selectedPost.createdAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
        </div>

        {isOwnPost && (
          <button
            onClick={(e) => handleDeletePost(selectedPost.id, e)}
            className="px-3.5 py-1.5 rounded-lg bg-error-light text-error hover:bg-error-light/80 flex items-center gap-1.5 text-xs font-black transition-all"
            title="Delete Post"
          >
            <Trash2 className="w-3.5 h-3.5 text-error" />
            <span>Delete</span>
          </button>
        )}
      </header>

      {/* 2. Caption/Description Area */}
      <section className="px-5 py-3 text-sm text-text-primary leading-relaxed shrink-0 break-words max-h-24 overflow-y-auto">
        {selectedPost.caption.split(/(\s+)/).map((word, i) => {
          if (word.startsWith("#")) {
            return (
              <span
                key={i}
                className="text-link font-bold hover:underline cursor-pointer"
              >
                {word}
              </span>
            );
          }
          return <span key={i}>{word}</span>;
        })}
      </section>

      {/* 3. Engagement Action Buttons Panel */}
      <section className="flex items-center gap-1 px-5 pb-4 shrink-0 border-b border-border">
        <button
          onClick={() => handleToggleLikePost(selectedPost.id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            selectedPost.liked
              ? "bg-error-light text-error"
              : "text-text-secondary hover:bg-surface-hover hover:text-link"
          }`}
        >
          <Heart
            className={`w-5 h-5 ${selectedPost.liked ? "fill-error text-error" : ""}`}
          />
          <span>{formatCount(selectedPost.likesCount)}</span>
        </button>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-text-secondary select-none">
          <MessageCircle className="w-5 h-5" />
          <span>{formatCount(totalComments)}</span>
        </div>

        <button
          onClick={() => handleToggleSavePost(selectedPost.id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            selectedPost.saved
              ? "bg-warning-light text-warning"
              : "text-text-secondary hover:bg-surface-hover hover:text-link"
          }`}
        >
          <Bookmark
            className={`w-5 h-5 ${selectedPost.saved ? "fill-warning text-warning" : ""}`}
          />
          <span>{formatCount(selectedPost.savesCount)}</span>
        </button>

        <button
          onClick={() => handleSharePost(selectedPost.id)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-text-secondary hover:bg-surface-hover hover:text-link transition-all ml-auto"
        >
          <Share2 className="w-5 h-5" />
          <span>{shares > 0 ? formatCount(shares) : "Share"}</span>
        </button>
      </section>

      {/* 4. Comments List Container */}
      <section className="flex-1 flex flex-col overflow-hidden px-5 pt-3">
        <div className="flex items-center justify-between mb-3 shrink-0">
          <h3 className="text-[14px] font-bold text-text-primary">
            {totalComments} comments
          </h3>
          <button
            onClick={() =>
              setSortOrder(sortOrder === "newest" ? "oldest" : "newest")
            }
            className="flex items-center gap-1 text-xs font-semibold text-text-secondary hover:text-text-primary"
          >
            <span>{sortOrder === "newest" ? "Newest" : "Oldest"}</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pb-4 pr-1 scrollbar-thin">
          {isLoadingComments ? (
            <div className="text-center text-text-muted text-sm py-12">
              Loading comments...
            </div>
          ) : commentsError ? (
            <div className="flex flex-col items-center gap-2 py-12">
              <p className="text-sm text-error font-semibold">
                {commentsError}
              </p>
              <button
                onClick={onRetryComments}
                className="text-xs font-bold text-link underline"
              >
                Retry
              </button>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center text-text-muted text-sm py-12 flex flex-col items-center justify-center">
              <span className="text-3xl mb-2">💬</span>
              <p className="font-bold text-text-secondary">No comments yet</p>
              <p className="text-xs text-text-muted mt-1">
                Be the first to share what you think!
              </p>
            </div>
          ) : (
            <>
              {sortedComments.map((comment) => (
                <div key={comment.id} className="space-y-2">
                  {/* Parent comment */}
                  <div className="flex gap-3 items-start">
                    <div
                      onClick={() =>
                        handleNavigateToUserProfile(comment.username)
                      }
                      className="w-9 h-9 rounded-full overflow-hidden bg-primary flex items-center justify-center text-text-on-primary text-xs font-bold shrink-0 cursor-pointer hover:opacity-85 transition-opacity"
                      title={`View ${comment.username}'s profile`}
                    >
                      {comment.avatar ? (
                        <img
                          src={comment.avatar}
                          alt={comment.username}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        comment.username.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <span
                          onClick={() =>
                            handleNavigateToUserProfile(comment.username)
                          }
                          className="text-sm font-bold text-text-primary cursor-pointer hover:underline"
                        >
                          {comment.username}
                        </span>
                        <span className="text-xs text-text-muted">
                          {formatRelativeTime(comment.timestamp)}
                        </span>
                      </div>

                      {editingCommentId === comment.id ? (
                        <div className="flex items-center gap-2 mt-1">
                          <input
                            type="text"
                            value={editInputText}
                            onChange={(e) => setEditInputText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") confirmEdit(comment.id);
                              if (e.key === "Escape") setEditingCommentId(null);
                            }}
                            autoFocus
                            maxLength={500}
                            className="flex-1 bg-input-bg text-input-text border border-input-border rounded-lg px-3 py-1.5 text-[13px] outline-none focus:border-input-focus"
                          />
                          <button
                            onClick={() => confirmEdit(comment.id)}
                            className="w-7 h-7 bg-success hover:bg-success/90 text-text-on-primary rounded-full flex items-center justify-center shrink-0"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingCommentId(null)}
                            className="w-7 h-7 bg-surface-secondary hover:bg-surface-hover text-icon-secondary rounded-full flex items-center justify-center shrink-0"
                          >
                            <CloseIcon className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <p className="text-sm text-text-primary leading-relaxed break-words mt-0.5">
                          {comment.text}
                        </p>
                      )}

                      <div className="flex items-center gap-3.5 mt-1.5">
                        <button
                          onClick={() => {
                            if (activeReplyTo === comment.id) {
                              setActiveReplyTo(null);
                            } else {
                              setActiveReplyTo(comment.id);
                            }
                          }}
                          className="text-xs font-semibold text-text-secondary hover:text-text-primary"
                        >
                          Reply
                        </button>

                        {comment.username === profile.username &&
                          editingCommentId !== comment.id && (
                            <>
                              <button
                                onClick={() => startEditing(comment)}
                                className="text-text-muted hover:text-link"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() =>
                                  handleDeleteComment(
                                    selectedPost.id,
                                    comment.id,
                                  )
                                }
                                className="text-text-muted hover:text-error"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                      </div>
                    </div>
                  </div>



 {/* Sub-Replies list */}
                  {comment.replies &&
                    comment.replies.map((reply) => (
                      <div
                        key={reply.id}
                        className="flex gap-3 items-start pl-12"
                      >
                        <div
                          onClick={() =>
                            handleNavigateToUserProfile(reply.username)
                          }
                          className="w-7 h-7 rounded-full overflow-hidden bg-primary-border flex items-center justify-center text-text-on-primary text-[10px] font-bold shrink-0 cursor-pointer hover:opacity-85 transition-opacity"
                          title={`View ${reply.username}'s profile`}
                        >
                          {reply.avatar ? (
                            <img
                              src={reply.avatar}
                              alt={reply.username}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            reply.username.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2">
                            <span
                              onClick={() =>
                                handleNavigateToUserProfile(reply.username)
                              }
                              className="text-sm font-bold text-text-primary cursor-pointer hover:underline"
                            >
                              {reply.username}
                            </span>
                            <span className="text-xs text-text-muted">
                              {formatRelativeTime(reply.timestamp)}
                            </span>
                          </div>

                          {editingCommentId === reply.id ? (
                            <div className="flex items-center gap-2 mt-1">
                              <input
                                type="text"
                                value={editInputText}
                                onChange={(e) =>
                                  setEditInputText(e.target.value)
                                }
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") confirmEdit(reply.id);
                                  if (e.key === "Escape")
                                    setEditingCommentId(null);
                                }}
                                autoFocus
                                maxLength={500}
                                className="flex-1 bg-input-bg text-input-text border border-input-border rounded-lg px-2.5 py-1 text-xs outline-none focus:border-input-focus"
                              />
                              <button
                                onClick={() => confirmEdit(reply.id)}
                                className="w-6 h-6 bg-success hover:bg-success/90 text-text-on-primary rounded-full flex items-center justify-center shrink-0"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <p className="text-sm text-text-primary leading-relaxed break-words mt-0.5">
                              {reply.text}
                            </p>
                          )}

                          {reply.username === profile.username &&
                            editingCommentId !== reply.id && (
                              <div className="flex items-center gap-3.5 mt-1.5">
                                <button
                                  onClick={() => startEditing(reply)}
                                  className="text-text-muted hover:text-link"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteReply(
                                      selectedPost.id,
                                      comment.id,
                                      reply.id,
                                    )
                                  }
                                  className="text-text-muted hover:text-error"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                        </div>
                      </div>
                    ))}

                  {/* Inline reply comment box */}
                  {activeReplyTo === comment.id && (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        onSubmitReply(comment.id);
                      }}
                      className="flex gap-2 pl-8 mt-2"
                    >
                      <input
                        type="text"
                        value={replyInputText}
                        onChange={(e) => setReplyInputText(e.target.value)}
                        placeholder="Reply text..."
                        maxLength={200}
                        className="flex-1 bg-input-bg border border-input-border rounded-full px-3.5 py-1.5 text-xs text-input-text placeholder-input-placeholder outline-none focus:border-input-focus transition-all"
                      />
                      <button
                        type="submit"
                        className="w-7 h-7 bg-primary hover:bg-primary-hover text-text-on-primary rounded-full flex items-center justify-center shadow-sm transition-all"
                      >
                        <Send className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  )}
                </div>
              ))}

              {hasMoreComments && (
                <div className="flex justify-center pt-2">
                  <button
                    onClick={() => loadMoreComments(selectedPost.id)}
                    disabled={isLoadingMoreComments}
                    className="text-xs font-bold text-link hover:underline disabled:opacity-50"
                  >
                    {isLoadingMoreComments
                      ? "Loading..."
                      : "Load more comments"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* 5. Add Comment Form with Emoji picker */}
      <section className="border-t border-border p-4 pb-5 shrink-0 bg-surface relative">
        <div className="flex items-center gap-2 mb-2 select-none">
          <div className="w-7 h-7 rounded-full overflow-hidden bg-primary-light flex items-center justify-center text-primary text-[10px] font-black shrink-0 border border-border">
            {profile.photo ? (
              <img
                src={profile.photo}
                alt={profile.name}
                className="w-full h-full object-cover"
              />
            ) : (
              profile.name.charAt(0)
            )}
          </div>
          <span className="text-[11px] font-bold text-text-secondary">
            Add comment as you
          </span>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmitComment();
          }}
          className="flex items-center gap-2.5"
        >
          <button
            type="button"
            onClick={() => setEmojiPickerOpen(!emojiPickerOpen)}
            className="text-xl hover:scale-110 active:scale-95 transition-all p-1"
            title="Add emoji"
          >
            😊
          </button>

          <textarea
            value={commentInputText}
            onChange={(e) => setCommentInputText(e.target.value)}
            placeholder="Add comment..."
            maxLength={300}
            rows={1}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSubmitComment();
              }
            }}
            className="flex-1 bg-input-bg border-2 border-transparent focus:border-input-focus rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-input-text outline-none transition-all placeholder:text-input-placeholder resize-none min-h-[38px] max-h-[90px] overflow-y-auto scrollbar-thin"
          />

          <button
            type="submit"
            disabled={!commentInputText.trim() || isSubmitting}
            className="w-10 h-10 bg-primary disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-hover text-text-on-primary rounded-full flex items-center justify-center shadow-md transition-all shrink-0 animate-fade-in"
          >
            <Send className="w-4 h-4 text-text-on-primary" />
          </button>
        </form>
        {commentError && (
          <p className="text-xs font-semibold text-error mt-2">
            {commentError}
          </p>
        )}
                 
        {/* Emoji picker overlays */}
        {emojiPickerOpen && (
          <div className="absolute bottom-[72px] left-4 bg-white border border-gray-200 rounded-2xl shadow-xl p-2.5 grid grid-cols-8 gap-1.5 w-72 max-h-52 overflow-y-auto z-40 scrollbar-thin">
            {[
              "😊",
              "😂",
              "🔥",
              "❤️",
              "🙌",
              "😍",
              "👏",
              "🎉",
              "👍",
              "😢",
              "😮",
              "🤔",
              "💯",
              "✨",
              "💻",
              "🚀",
              "⭐",
              "🎬",
              "😜",
              "💖",
              "💡",
              "🌈",
              "⚡",
              "🍿",
              "🤣",
              "🥰",
              "🤩",
              "😘",
              "😋",
              "😎",
              "🤓",
              "🧐",
              "😏",
              "🥳",
              "😭",
              "🥺",
              "😤",
              "😡",
              "😱",
              "😰",
              "🤫",
              "😑",
              "💝",
              "💕",
              "💘",
              "💜",
              "💙",
              "💚",
              "💛",
              "🧡",
              "🤍",
              "👎",
              "🙏",
              "🤝",
              "💪",
            ].map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  setCommentInputText(commentInputText + emoji);
                  setEmojiPickerOpen(false);
                }}
                className="text-lg hover:bg-blue-50 p-1.5 rounded-lg transition-colors flex items-center justify-center"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </section>
    </aside>
  );
}
