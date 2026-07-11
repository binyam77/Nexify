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
  X,
} from "lucide-react";
import type { FeedPost, CommentItem } from "../types";

// Left.tsx የProp ዓይነቶች መግለጫ (Props Interface for Left.tsx)
interface LeftProps {
  selectedPost: FeedPost;
  comments: CommentItem[];
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
  activeReplyTo: number | null;
  setActiveReplyTo: (id: number | null) => void;
  replyInputText: string;
  setReplyInputText: (text: string) => void;
  
  // ተፅዕኖ ፈጣሪ ተግባራት (Interactive event handlers)
  handleToggleLikePost: (postId: string) => void;
  handleToggleSavePost: (postId: string) => void;
  handleSharePost: (postId: string) => void;
  handleDeletePost: (postId: string, e?: React.MouseEvent) => void;
  handleToggleCommentLike: (postId: string, commentId: number) => void;
  handleAddComment: (postId: string, text: string) => void;
  handleDeleteComment: (postId: string, commentId: number) => void;
  handleAddReply: (postId: string, commentId: number, text: string) => void;

  handleNavigateToUserProfile: (username: string) => void;
  toggleFollowUser: (index: number) => void;
  authorIndex: number;
  formatCount: (num: number) => string;
}

export default function Left({
  selectedPost,
  comments,
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
  handleToggleCommentLike,
  handleAddComment,
  handleDeleteComment,
  handleAddReply,
  handleNavigateToUserProfile,
  toggleFollowUser,
  authorIndex,
  formatCount,
}: LeftProps) {
  return (
    <aside className="hidden md:flex md:w-[420px] flex-col h-full overflow-hidden bg-white border-l border-gray-200">
      {/* 1. Header with Post Author info */}
      <header className="flex items-center justify-between p-5 pb-3.5 border-b border-gray-100 shrink-0">
        <div
          onClick={() => handleNavigateToUserProfile(postAuthor.username)}
          className="flex items-center gap-3 cursor-pointer group hover:opacity-85 transition-opacity"
          title="View Profile"
        >
          <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-blue-600 bg-blue-50 flex items-center justify-center text-blue-600 text-sm font-bold shrink-0 group-hover:scale-105 transition-transform">
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
              <h2 className="text-[15px] font-bold text-slate-800 leading-none group-hover:text-blue-600 transition-colors">
                {postAuthor.name}
              </h2>
              <span className="text-[12px] text-slate-400 font-medium">
                @{postAuthor.username}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 mt-1">
              {new Date(selectedPost.createdAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
        </div>

        {isOwnPost ? (
          <button
            onClick={(e) => handleDeletePost(selectedPost.id, e)}
            className="px-3.5 py-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 flex items-center gap-1.5 text-xs font-black transition-all"
            title="Delete Post"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            <span>Delete</span>
          </button>
        ) : (
          <button
            onClick={() => toggleFollowUser(authorIndex)}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              postAuthor.isFollowing
                ? "bg-slate-100 text-slate-500 border border-slate-200"
                : "bg-gradient-to-b from-[#019BE5] via-[#0185E5] to-[#0071E3] text-white hover:opacity-95 shadow-sm"
            }`}
          >
            {postAuthor.isFollowing ? "Following" : "Follow"}
          </button>
        )}
      </header>

      {/* 2. Caption/Description Area */}
      <section className="px-5 py-3 text-sm text-slate-700 leading-relaxed shrink-0 break-words max-h-24 overflow-y-auto">
        {selectedPost.caption.split(/(\s+)/).map((word, i) => {
          if (word.startsWith("#")) {
            return (
              <span
                key={i}
                className="text-blue-600 font-bold hover:underline cursor-pointer"
              >
                {word}
              </span>
            );
          }
          return <span key={i}>{word}</span>;
        })}
      </section>

      {/* 3. Engagement Action Buttons Panel */}
      <section className="flex items-center gap-1 px-5 pb-4 shrink-0 border-b border-gray-100">
        <button
          onClick={() => handleToggleLikePost(selectedPost.id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            selectedPost.liked
              ? "bg-rose-50 text-rose-600"
              : "text-slate-500 hover:bg-slate-50 hover:text-blue-600"
          }`}
        >
          <Heart
            className={`w-5 h-5 ${selectedPost.liked ? "fill-rose-500 text-rose-500" : ""}`}
          />
          <span>{formatCount(selectedPost.likesCount)}</span>
        </button>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500 select-none">
          <MessageCircle className="w-5 h-5" />
          <span>{formatCount(comments.length)}</span>
        </div>

        <button
          onClick={() => handleToggleSavePost(selectedPost.id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
            selectedPost.saved
              ? "bg-amber-50 text-amber-600"
              : "text-slate-500 hover:bg-slate-50 hover:text-blue-600"
          }`}
        >
          <Bookmark
            className={`w-5 h-5 ${selectedPost.saved ? "fill-amber-500 text-amber-500" : ""}`}
          />
          <span>{formatCount(selectedPost.savesCount)}</span>
        </button>

        <button
          onClick={() => handleSharePost(selectedPost.id)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-50 hover:text-blue-600 transition-all ml-auto"
        >
          <Share2 className="w-5 h-5" />
          <span>{shares > 0 ? formatCount(shares) : "Share"}</span>
        </button>
      </section>

      {/* 4. Comments List Container */}
      <section className="flex-1 flex flex-col overflow-hidden px-5 pt-3">
        <h3 className="text-[14px] font-bold text-slate-800 mb-3 flex items-center gap-1.5 shrink-0">
          Comments{" "}
          <span className="text-xs text-slate-400 font-semibold">
            {comments.length}
          </span>
        </h3>

        <div className="flex-1 overflow-y-auto space-y-4 pb-4 pr-1 scrollbar-thin">
          {comments.length === 0 ? (
            <div className="text-center text-slate-400 text-sm py-12 flex flex-col items-center justify-center">
              <span className="text-3xl mb-2">💬</span>
              <p className="font-bold text-slate-500">No comments yet</p>
              <p className="text-xs text-slate-400 mt-1">
                Be the first to share what you think!
              </p>
            </div>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="space-y-2">
                {/* Parent comment */}
                <div className="flex gap-2.5 items-start">
                  <div
                    onClick={() => handleNavigateToUserProfile(comment.username)}
                    className="w-8 h-8 rounded-full overflow-hidden bg-blue-50 flex items-center justify-center text-blue-600 text-xs font-bold shrink-0 border border-slate-100 cursor-pointer hover:opacity-85 transition-opacity"
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
                  <div className="flex-1 bg-slate-50/90 hover:bg-slate-100 rounded-2xl p-4 border-l-2 border-blue-500 shadow-sm transition-all">
                    <h4
                      onClick={() => handleNavigateToUserProfile(comment.username)}
                      className="text-xs font-bold text-blue-600 mb-1 cursor-pointer hover:underline"
                    >
                      @{comment.username}
                    </h4>
                    <p className="text-[13.5px] text-slate-800 leading-relaxed break-words font-medium">
                      {comment.text}
                    </p>

                    <div className="flex items-center gap-4 mt-2 text-[10px] font-bold text-slate-400">
                      <span>
                        {new Date(comment.timestamp).toLocaleTimeString(undefined, {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>

                      <button
                        onClick={() =>
                          handleToggleCommentLike(selectedPost.id, comment.id)
                        }
                        className={`flex items-center gap-1 hover:text-rose-600 transition-all ${
                          comment.liked ? "text-rose-500 scale-105" : "text-slate-400"
                        }`}
                        title="Like comment"
                      >
                        <Heart
                          className={`w-3.5 h-3.5 ${comment.liked ? "fill-rose-500 text-rose-500" : ""}`}
                        />
                        <span>{comment.likesCount || 0}</span>
                      </button>

                      <button
                        onClick={() => {
                          if (activeReplyTo === comment.id) {
                            setActiveReplyTo(null);
                          } else {
                            setActiveReplyTo(comment.id);
                          }
                        }}
                        className="text-blue-500 hover:underline"
                      >
                        Reply
                      </button>

                      {comment.username === profile.username && (
                        <button
                          onClick={() =>
                            handleDeleteComment(selectedPost.id, comment.id)
                          }
                          className="text-slate-400 hover:text-rose-600 ml-auto transition-colors"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sub-Replies list */}
                {comment.replies &&
                  comment.replies.map((reply) => (
                    <div key={reply.id} className="flex gap-2.5 items-start pl-8">
                      <div
                        onClick={() => handleNavigateToUserProfile(reply.username)}
                        className="w-6.5 h-6.5 rounded-full overflow-hidden bg-teal-50 flex items-center justify-center text-teal-600 text-[10px] font-bold shrink-0 border border-slate-100 cursor-pointer hover:opacity-85 transition-opacity"
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
                      <div className="flex-1 bg-slate-100/50 rounded-xl p-2.5">
                        <h5
                          onClick={() => handleNavigateToUserProfile(reply.username)}
                          className="text-[11px] font-bold text-teal-600 mb-0.5 cursor-pointer hover:underline"
                        >
                          @{reply.username}
                        </h5>
                        <p className="text-xs text-slate-600 leading-normal break-words">
                          {reply.text}
                        </p>
                        <span className="text-[9px] text-slate-400 font-medium block mt-1">
                          {new Date(reply.timestamp).toLocaleTimeString(undefined, {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>
                  ))}

                {/* Inline reply comment box */}
                {activeReplyTo === comment.id && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleAddReply(selectedPost.id, comment.id, replyInputText);
                    }}
                    className="flex gap-2 pl-8 mt-2"
                  >
                    <input
                      type="text"
                      value={replyInputText}
                      onChange={(e) => setReplyInputText(e.target.value)}
                      placeholder="Reply text..."
                      maxLength={200}
                      className="flex-1 bg-white border border-slate-200 rounded-full px-3.5 py-1.5 text-xs text-slate-700 outline-none focus:border-blue-500 transition-all"
                    />
                    <button
                      type="submit"
                      className="w-7 h-7 bg-teal-500 hover:bg-teal-600 text-white rounded-full flex items-center justify-center shadow-sm transition-all"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </form>
                )}
              </div>
            ))
          )}
        </div>
      </section>

      {/* 5. Add Comment Form with Emoji picker */}
      <section className="border-t border-gray-100 p-4 pb-5 shrink-0 bg-white relative">
        <div className="flex items-center gap-2 mb-2 select-none">
          <div className="w-7 h-7 rounded-full overflow-hidden bg-blue-50 flex items-center justify-center text-blue-600 text-[10px] font-black shrink-0 border border-slate-100">
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
          <span className="text-[11px] font-bold text-slate-500">
            Add comment as you
          </span>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAddComment(selectedPost.id, commentInputText);
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
                if (commentInputText.trim()) {
                  handleAddComment(selectedPost.id, commentInputText);
                }
              }
            }}
            className="flex-1 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 resize-none min-h-[38px] max-h-[90px] overflow-y-auto scrollbar-thin"
          />

          <button
            type="submit"
            disabled={!commentInputText.trim()}
            className="w-10 h-10 bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-md transition-all shrink-0 animate-fade-in"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </form>

        {/* Emoji picker overlays */}
        {emojiPickerOpen && (
          <div className="absolute bottom-[72px] left-4 bg-white border border-gray-200 rounded-2xl shadow-xl p-2.5 grid grid-cols-8 gap-1.5 w-72 max-h-52 overflow-y-auto z-40 scrollbar-thin">
            {[
              "😊", "😂", "🔥", "❤️", "🙌", "😍", "👏", "🎉", "👍", "😢", "😮", "🤔", "💯", "✨",
              "💻", "🚀", "⭐", "🎬", "😜", "💖", "💡", "🌈", "⚡", "🍿", "🤣", "🥰", "🤩", "😘",
              "😋", "😎", "🤓", "🧐", "😏", "🥳", "😭", "🥺", "😤", "😡", "😱", "😰", "🤫", "😑",
              "💝", "💕", "💘", "💜", "💙", "💚", "💛", "🧡", "🤍", "👎", "🙏", "🤝", "💪"
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
