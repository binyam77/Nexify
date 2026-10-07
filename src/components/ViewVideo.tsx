/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from "react";
import {
  X,
  Trash2,
  Play,
  Heart,
  MessageCircle,
  Share2,
  Send,
  Pencil,
  Check,
} from "lucide-react";
import type { FeedPost, CommentItem } from "../types";
import Left from "./Left";
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
// ViewVideo.tsx የProp ዓይነቶች መግለጫ (Props Interface for ViewVideo.tsx)
interface ViewVideoProps {
  selectedPost: FeedPost;
  commentsMap: Record<string, CommentItem[]>;
  isLoadingComments: boolean;
  commentsError: string | null;
  loadMoreComments: (postId: string) => Promise<void>;
  hasMoreComments: boolean;
  isLoadingMoreComments: boolean;
  profile: {
    name: string;
    username: string;
    photo: string;
    bio: string;
  };
  followersCount: number;
  selectedMediaSrc: string | null;

  // ተፅዕኖ ፈጣሪ ተግባራት (Action callback methods)
  handleClosePlayer: () => void;
  handleNavigatePost: (direction: "next" | "prev") => void;
  handleToggleLikePost: (postId: string) => void;
  handleToggleSavePost: (postId: string) => void;
  handleSharePost: (postId: string) => void;
  handleDeletePost: (postId: string, e?: React.MouseEvent) => void;
  handleAddComment: (postId: string, text: string) => void;
  handleDeleteComment: (postId: string, commentId: string) => void;
  handleDeleteReply: (
    postId: string,
    commentId: string,
    replyId: string,
  ) => void;
  handleAddReply: (postId: string, commentId: string, text: string) => void;
  handleNavigateToUserProfile: (username: string) => void;
  handleEditComment: (
    postId: string,
    commentId: string,
    newText: string,
  ) => void;
  formatCount: (num: number) => string;
}

export default function ViewVideo({
  selectedPost,
  commentsMap,
  isLoadingComments,
  commentsError,
  loadMoreComments,
  hasMoreComments,
  isLoadingMoreComments,
  profile,
  followersCount,
  selectedMediaSrc,
  handleClosePlayer,
  handleToggleLikePost,
  handleToggleSavePost,
  handleSharePost,
  handleDeletePost,
  handleAddComment,
  handleDeleteComment,
  handleDeleteReply,
  handleAddReply,
  handleNavigateToUserProfile,
  handleEditComment,
  formatCount,
}: ViewVideoProps) {
  const comments = commentsMap[selectedPost.id] || [];
  const shares = selectedPost.sharesCount;

  // የልጥፉ ባለቤት ማነው? (Detect who is the author of this post)
  const isOwnPost = selectedPost.username === profile.username;

  const postAuthor = isOwnPost
    ? {
        name: profile.name,
        username: profile.username,
        photo: profile.photo,
        isFollowing: false,
        followersCount: followersCount,
        bio: profile.bio,
      }
    : {
        name: selectedPost.username || "Creator",
        username: selectedPost.username || "creator",
        photo: selectedPost.userAvatar || "",
        isFollowing: false,
        followersCount: 0,
        bio: "",
      };
  // የቪዲዮ ማጫወቻው ሁኔታ መቆጣጠሪያዎች (Video Player refs and state variables)
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoPlaying, setVideoPlaying] = useState(true);
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoCurrentTime, setVideoCurrentTime] = useState(0);

  const [commentInputText, setCommentInputText] = useState("");
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [mobileCommentsOpen, setMobileCommentsOpen] = useState(false);

  const [activeReplyTo, setActiveReplyTo] = useState<string | null>(null);
  const [replyInputText, setReplyInputText] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editInputText, setEditInputText] = useState("");
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const sortedComments =
    sortOrder === "newest" ? [...comments].reverse() : comments;

  const startEditing = (item: { id: string; text: string }) => {
    setEditingCommentId(item.id);
    setEditInputText(item.text);
  };

  const confirmEdit = (commentId: string) => {
    const trimmed = editInputText.trim();
    if (trimmed) handleEditComment(selectedPost.id, commentId, trimmed);
    setEditingCommentId(null);
    setEditInputText("");
  };

  const handleVideoClick = (e?: React.MouseEvent) => {
    if (e && (e.target as HTMLElement).closest("#closeBtn")) return;
    if (!videoRef.current) return;

    if (videoRef.current.paused) {
      videoRef.current.play().catch((err) => console.log(err));
      setVideoPlaying(true);
    } else {
      videoRef.current.pause();
      setVideoPlaying(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- post ሲከየር UI ሁነታ reset ማድረግ ትክክለኛ pattern ነው
    setVideoPlaying(true);
    setVideoCurrentTime(0);
    setVideoDuration(0);
  }, [selectedPost]);

  return (
    <div className="fixed inset-0 bg-surface backdrop-blur-md flex items-center justify-center z-50 p-0 sm:p-4 animate-fade-in">
      <div className="bg-black md:bg-white rounded-none sm:rounded-3xl w-full max-w-[1200px] h-full sm:h-[90vh] md:h-[88vh] overflow-hidden shadow-2xl border border-transparent sm:border-gray-200/50 flex flex-col md:flex-row relative">
        {/* ===== Left Side: Video/Image Container ===== */}
        <div className="w-full h-full md:flex-1 bg-black flex items-center justify-center relative">
          {/* Close Button (ላይኛው የግራ ጥግ ዝጋ ቁልፍ) */}
          <button
            onClick={handleClosePlayer}
            className="absolute top-[18px] left-[18px] w-9 h-9 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center transition-all backdrop-blur-md z-30 shadow-md pointer-events-auto"
            id="closeBtn"
            title="Close Player"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Delete Button (የራስን ልጥፍ ማጥፊያ በሞባይል) */}
          {isOwnPost && (
            <button
              onClick={(e) => {
                handleDeletePost(selectedPost.id, e);
                handleClosePlayer();
              }}
              className="absolute top-[18px] right-[18px] px-3.5 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5 text-xs font-black tracking-wide transition-all backdrop-blur-md z-30 shadow-lg pointer-events-auto md:hidden"
              title="Delete Post"
            >
              <Trash2 className="w-3.5 h-3.5 text-white" />
              <span>Delete</span>
            </button>
          )}

          {/* Media Player element */}
          {selectedMediaSrc ? (
            selectedPost.type === "video" ? (
              <div
                onClick={handleVideoClick}
                className="w-full h-full cursor-pointer relative flex items-center justify-center group select-none"
              >
                <video
                  ref={videoRef}
                  src={selectedMediaSrc || undefined}
                  className="w-full h-full object-contain block bg-black"
                  playsInline
                  loop
                  autoPlay
                  onPlay={() => setVideoPlaying(true)}
                  onPause={() => setVideoPlaying(false)}
                  onTimeUpdate={(e) =>
                    setVideoCurrentTime(e.currentTarget.currentTime)
                  }
                  onLoadedMetadata={(e) =>
                    setVideoDuration(e.currentTarget.duration)
                  }
                />

                {/* Play/Pause center overlay indicator */}
                {!videoPlaying && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/15 pointer-events-none transition-all duration-300">
                    <div className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white scale-110 animate-ping absolute opacity-25"></div>
                    <div className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white z-10 shadow-lg relative">
                      <Play className="w-7 h-7 text-white fill-white ml-1" />
                    </div>
                  </div>
                )}

                {/* Progress bar line */}
                {videoDuration > 0 && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-10 pointer-events-none">
                    <div
                      className="h-full bg-blue-500 transition-all duration-100"
                      style={{
                        width: `${(videoCurrentTime / videoDuration) * 100}%`,
                      }}
                    />
                  </div>
                )}
              </div>
            ) : (
              <img
                src={selectedMediaSrc || undefined}
                alt="Post photo content"
                className="w-full h-full object-contain block bg-black"
              />
            )
          ) : (
            <div className="text-white/40 text-sm">Media asset loading...</div>
          )}
        </div>

        {/* ===== Right Side: Sidebar Panel (Left.tsx component) ===== */}
        <Left
          selectedPost={selectedPost}
          comments={comments}
          isLoadingComments={isLoadingComments}
          commentsError={commentsError}
          loadMoreComments={loadMoreComments}
          hasMoreComments={hasMoreComments}
          isLoadingMoreComments={isLoadingMoreComments}
          shares={shares}
          isOwnPost={isOwnPost}
          postAuthor={postAuthor}
          profile={profile}
          commentInputText={commentInputText}
          setCommentInputText={setCommentInputText}
          emojiPickerOpen={emojiPickerOpen}
          setEmojiPickerOpen={setEmojiPickerOpen}
          activeReplyTo={activeReplyTo}
          setActiveReplyTo={setActiveReplyTo}
          replyInputText={replyInputText}
          setReplyInputText={setReplyInputText}
          handleToggleLikePost={handleToggleLikePost}
          handleToggleSavePost={handleToggleSavePost}
          handleSharePost={handleSharePost}
          handleDeletePost={handleDeletePost}
          handleAddComment={handleAddComment}
          handleDeleteComment={handleDeleteComment}
          handleDeleteReply={handleDeleteReply}
          handleAddReply={handleAddReply}
          handleEditComment={handleEditComment}
          handleNavigateToUserProfile={handleNavigateToUserProfile}
          formatCount={formatCount}
        />

        {/* ===== Mobile Overlay HUD HUD (በሞባይል ብቻ የሚታይ የላይ ፈጣን መቆጣጠሪያ) ===== */}
        <div className="absolute inset-0 z-20 pointer-events-none md:hidden flex flex-col justify-between">
          <div className="absolute right-3 bottom-32 flex flex-col gap-5 items-center pointer-events-auto z-30">
            {/* Likes */}
            <button
              onClick={() => handleToggleLikePost(selectedPost.id)}
              className="flex flex-col items-center justify-center gap-1 active:scale-90 transition-all focus:outline-none"
            >
              <Heart
                className={`w-[26px] h-[26px] drop-shadow-md ${
                  selectedPost.liked
                    ? "fill-rose-500 text-rose-500"
                    : "text-white"
                }`}
              />
              <span className="text-[11px] font-bold text-white drop-shadow-md select-none">
                {formatCount(selectedPost.likesCount)}
              </span>
            </button>

            {/* Comments toggle drawer */}
            <button
              onClick={() => setMobileCommentsOpen(true)}
              className="flex flex-col items-center justify-center gap-1 active:scale-90 transition-all focus:outline-none"
            >
              <MessageCircle className="w-[26px] h-[26px] text-white drop-shadow-md" />
              <span className="text-[11px] font-bold text-white drop-shadow-md select-none">
                {formatCount(comments.length)}
              </span>
            </button>

            {/* Shares */}
            <button
              onClick={() => handleSharePost(selectedPost.id)}
              className="flex flex-col items-center justify-center gap-1 active:scale-90 transition-all focus:outline-none"
            >
              <Share2 className="w-[26px] h-[26px] text-white drop-shadow-md" />
              <span className="text-[11px] font-bold text-white drop-shadow-md select-none">
                {shares > 0 ? formatCount(shares) : "Share"}
              </span>
            </button>
          </div>

          {/* Bottom user details & caption overlays */}
          <div className="absolute bottom-0 left-0 right-0 p-4 pb-5 bg-gradient-to-t from-black/90 via-black/55 to-transparent pointer-events-auto z-20 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div
                onClick={() => handleNavigateToUserProfile(postAuthor.username)}
                className="flex items-center gap-2.5 cursor-pointer hover:opacity-85 active:scale-95 transition-all max-w-[85%]"
              >
                <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-white bg-slate-800 flex items-center justify-center text-white text-xs font-bold shrink-0">
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
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[13px] font-bold text-white drop-shadow-md truncate">
                      @{postAuthor.username}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-[12px] text-white/95 leading-relaxed break-words line-clamp-2 max-h-16 overflow-y-auto pr-2">
              {selectedPost.caption.split(/(\s+)/).map((word, i) => {
                if (word.startsWith("#")) {
                  return (
                    <span
                      key={i}
                      className="text-blue-400 font-bold hover:underline cursor-pointer"
                    >
                      {word}
                    </span>
                  );
                }
                return <span key={i}>{word}</span>;
              })}
            </p>

            {/* Mobile quick comment writing */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleAddComment(selectedPost.id, commentInputText);
              }}
              className="flex items-center gap-2 relative"
            >
              <div className="flex-1 relative">
                <button
                  type="button"
                  onClick={() => setEmojiPickerOpen(!emojiPickerOpen)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-lg active:scale-90 transition-all z-10"
                  title="Add emoji"
                >
                  😊
                </button>
                <input
                  type="text"
                  value={commentInputText}
                  onChange={(e) => setCommentInputText(e.target.value)}
                  placeholder="Add comment..."
                  maxLength={300}
                  className="w-full bg-black/40 border border-white/20 focus:border-blue-500 rounded-full pl-10 pr-4 py-2.5 text-sm text-white outline-none transition-all placeholder:text-gray-400"
                />
              </div>

              <button
                type="submit"
                disabled={!commentInputText.trim()}
                className="w-10 h-10 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white rounded-full flex items-center justify-center shadow-md shrink-0 active:scale-90 transition-transform"
              >
                <Send className="w-4 h-4 text-white" />
              </button>
            </form>
          </div>
        </div>

        {/* ===== Mobile Comments Drawer Sheet ===== */}
        {mobileCommentsOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/60 z-40 md:hidden"
              onClick={() => setMobileCommentsOpen(false)}
            />
            <div className="fixed inset-x-0 bottom-0 h-[82vh] max-h-[82vh] bg-bodey-bg rounded-t-[32px] shadow-2xl z-50 flex flex-col transition-all duration-300 md:hidden overflow-hidden pointer-events-auto">
              <div className="p-4 border-b border-input-border flex items-center justify-between shrink-0 bg-bodey-bg">
                <h3 className="text-sm font-bold text-text-h2">
                  {comments.length} comments
                </h3>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() =>
                      setSortOrder(sortOrder === "newest" ? "oldest" : "newest")
                    }
                    className="text-xs font-semibold text-slate-500 hover:text-slate-700"
                  >
                    {sortOrder === "newest" ? "Newest" : "Oldest"}
                  </button>
                  <button
                    onClick={() => setMobileCommentsOpen(false)}
                    className="text-small-text hover:text-slate-800 text-xs font-bold"
                  >
                    Close
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {comments.length === 0 ? (
                  <div className="text-center text-slate-400 text-sm py-12 flex flex-col items-center justify-center">
                    <span className="text-2xl mb-1">💬</span>
                    <p className="font-bold text-slate-500">No comments yet</p>
                    <p className="text-xs text-small-text">
                      Be the first to share your thoughts!
                    </p>
                  </div>
                ) : (
                  sortedComments.map((comment) => (
                    <div key={comment.id} className="space-y-2.5">
                      <div className="flex gap-3 items-start">
                        <div
                          onClick={() => {
                            setMobileCommentsOpen(false);
                            handleNavigateToUserProfile(comment.username);
                          }}
                          className="w-9 h-9 rounded-full overflow-hidden bg-blue-500 flex items-center justify-center text-white text-xs font-bold shrink-0 cursor-pointer active:scale-95 transition-transform"
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
                              onClick={() => {
                                setMobileCommentsOpen(false);
                                handleNavigateToUserProfile(comment.username);
                              }}
                              className="text-sm font-bold text-slate-900 cursor-pointer hover:underline"
                            >
                              {comment.username}
                            </span>
                            <span className="text-xs text-slate-400">
                              {formatRelativeTime(comment.timestamp)}
                            </span>
                          </div>

                          {editingCommentId === comment.id ? (
                            <div className="flex items-center gap-2 mt-1">
                              <input
                                type="text"
                                value={editInputText}
                                onChange={(e) =>
                                  setEditInputText(e.target.value)
                                }
                                autoFocus
                                maxLength={500}
                                className="flex-1 bg-input border border-input-border rounded-lg px-3 py-1.5 text-[13px] outline-none focus:border-brand-light"
                              />
                              <button
                                onClick={() => confirmEdit(comment.id)}
                                className="w-7 h-7 bg-brand text-white rounded-full flex items-center justify-center shrink-0"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <p className="text-sm text-slate-800 leading-relaxed break-words mt-0.5">
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
                              className="text-xs font-semibold text-slate-500 hover:text-slate-700"
                            >
                              Reply
                            </button>

                            {comment.username === profile.username &&
                              editingCommentId !== comment.id && (
                                <>
                                  <button
                                    onClick={() => startEditing(comment)}
                                    className="text-slate-400 hover:text-brand"
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
                                    className="text-slate-400 hover:text-rose-600"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                          </div>
                        </div>
                      </div>

                      {/* Sub-Replies listing on mobile */}
                      {comment.replies &&
                        comment.replies.map((reply) => (
                          <div
                            key={reply.id}
                            className="flex gap-3 items-start pl-11"
                          >
                            <div
                              onClick={() => {
                                setMobileCommentsOpen(false);
                                handleNavigateToUserProfile(reply.username);
                              }}
                              className="w-7 h-7 rounded-full overflow-hidden bg-teal-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0 cursor-pointer"
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
                                  onClick={() => {
                                    setMobileCommentsOpen(false);
                                    handleNavigateToUserProfile(reply.username);
                                  }}
                                  className="text-sm font-bold text-slate-900 cursor-pointer hover:underline"
                                >
                                  {reply.username}
                                </span>
                                <span className="text-xs text-slate-400">
                                  {formatRelativeTime(reply.timestamp)}
                                </span>
                              </div>
                              <p className="text-sm text-slate-800 leading-relaxed break-words mt-0.5">
                                {reply.text}
                              </p>
                              {reply.username === profile.username && (
                                <div className="flex items-center gap-3.5 mt-1.5">
                                  <button
                                    onClick={() =>
                                      handleDeleteReply(
                                        selectedPost.id,
                                        comment.id,
                                        reply.id,
                                      )
                                    }
                                    className="text-slate-400 hover:text-rose-600"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}

                      {/* Reply form inside comments list drawer */}
                      {activeReplyTo === comment.id && (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleAddReply(
                              selectedPost.id,
                              comment.id,
                              replyInputText,
                            );
                          }}
                          className="flex gap-2 pl-6 mt-1.5"
                        >
                          <input
                            type="text"
                            value={replyInputText}
                            onChange={(e) => setReplyInputText(e.target.value)}
                            placeholder="Reply text..."
                            maxLength={200}
                            className="flex-1 bg-input border border-input-border rounded-xl px-4 py-2 text-[12.5px] h-9 focus:border-brand-light outline-none transition-all"
                          />
                          <button
                            type="submit"
                            className="w-8.5 h-8.5 bg-brand text-white rounded-xl flex items-center justify-center shadow-sm shrink-0 active:scale-90"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>
                        </form>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Main Comment Box inside drawer */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleAddComment(selectedPost.id, commentInputText);
                }}
                className="border-t border-input-border p-4 bg-surface flex items-center gap-3 shrink-0 mb-10 pb-6 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]"
              >
                <textarea
                  value={commentInputText}
                  onChange={(e) => setCommentInputText(e.target.value)}
                  placeholder="Add comment..."
                  maxLength={300}
                  rows={1}
                  className="flex-1 bg-input border border-input-border focus:border-input-focus rounded-2xl px-4.5 py-3 text-[14px] text-input-text outline-none resize-none min-h-[46px] max-h-[100px] overflow-y-auto scrollbar-thin transition-all"
                />
                <button
                  type="submit"
                  disabled={!commentInputText.trim()}
                  className="w-10 h-10 bg-brand disabled:opacity-40 text-white rounded-full flex items-center justify-center shadow-md shrink-0 active:scale-95 transition-transform"
                >
                  <Send className="w-4.5 h-4.5 text-white" />
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
