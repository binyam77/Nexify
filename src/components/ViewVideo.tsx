/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from "react";
import {
  X,
  Trash2,
  ChevronUp,
  ChevronDown,
  Play,
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  Send,
} from "lucide-react";
import type { PostMeta, CommentItem } from "../types";
import Left from "./Left";

// ViewVideo.tsx የProp ዓይነቶች መግለጫ (Props Interface for ViewVideo.tsx)
interface ViewVideoProps {
  selectedPost: PostMeta;
  commentsMap: Record<number, CommentItem[]>;
  shareCounts: Record<number, number>;
  profile: {
    name: string;
    username: string;
    photo: string;
    bio: string;
  };
  otherUsers: any[];
  viewMode: "me" | "other";
  followersCount: number;
  selectedMediaSrc: string | null;

  // ተፅዕኖ ፈጣሪ ተግባራት (Action callback methods)
  handleClosePlayer: () => void;
  handleNavigatePost: (direction: "next" | "prev") => void;
  handleToggleLikePost: (postId: number) => void;
  handleToggleSavePost: (postId: number) => void;
  handleSharePost: (postId: number) => void;
  handleDeletePost: (postId: number, e?: React.MouseEvent) => void;
  handleToggleCommentLike: (postId: number, commentId: number) => void;
  handleAddComment: (postId: number, text: string) => void;
  handleDeleteComment: (postId: number, commentId: number) => void;
  handleAddReply: (postId: number, commentId: number, text: string) => void;
  handleNavigateToUserProfile: (username: string) => void;
  toggleFollowUser: (index: number) => void;
  formatCount: (num: number) => string;
}

export default function ViewVideo({
  selectedPost,
  commentsMap,
  shareCounts,
  profile,
  otherUsers,
  viewMode,
  followersCount,
  selectedMediaSrc,
  handleClosePlayer,
  handleNavigatePost,
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
  formatCount,
}: ViewVideoProps) {
  const comments = commentsMap[selectedPost.id] || [];
  const shares = shareCounts[selectedPost.id] || 0;

  // የልጥፉ ባለቤት ማነው? (Detect who is the author of this post)
  const isOwnPost = selectedPost.username === profile.username;
  const authorIndex = otherUsers.findIndex(
    (u) => u.username === selectedPost.username,
  );

  const postAuthor = isOwnPost
    ? {
        name: profile.name,
        username: profile.username,
        photo: profile.photo,
        isFollowing: false,
        followersCount: followersCount,
        bio: profile.bio,
      }
    : authorIndex !== -1
      ? otherUsers[authorIndex]
      : {
          name: "Other Creator",
          username: selectedPost.username || "creator",
          photo: "",
          isFollowing: false,
          followersCount: 150,
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

  const [activeReplyTo, setActiveReplyTo] = useState<number | null>(null);
  const [replyInputText, setReplyInputText] = useState("");

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
    setVideoPlaying(true);
    setVideoCurrentTime(0);
    setVideoDuration(0);
  }, [selectedPost]);

  return (
    <div className="fixed inset-0 bg-[#0f172a]/95 backdrop-blur-md flex items-center justify-center z-50 p-0 sm:p-4 animate-fade-in">
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

          {/* Up and Down Navigation Arrows (ወደ ቀጣይ/ቀድሞ ልጥፍ ማሸጋገሪያ ቀስቶች) */}
          <div className="absolute left-[18px] top-1/2 -translate-y-1/2 flex flex-col gap-3 z-30 pointer-events-auto">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNavigatePost("prev");
              }}
              className="w-9 h-9 rounded-full bg-black/55 hover:bg-black/80 border border-white/15 flex items-center justify-center text-white/90 hover:text-white hover:scale-110 active:scale-95 transition-all shadow-md group backdrop-blur-sm"
              title="Previous Post"
            >
              <ChevronUp className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNavigatePost("next");
              }}
              className="w-9 h-9 rounded-full bg-black/55 hover:bg-black/80 border border-white/15 flex items-center justify-center text-white/90 hover:text-white hover:scale-110 active:scale-95 transition-all shadow-md group backdrop-blur-sm"
              title="Next Post"
            >
              <ChevronDown className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
            </button>
          </div>

          {/* Media Player element */}
          {selectedPost.thumbnail || selectedMediaSrc ? (
            selectedPost.isVideo ? (
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
                src={selectedPost.thumbnail || selectedMediaSrc || undefined}
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
          handleToggleCommentLike={handleToggleCommentLike}
          handleAddComment={handleAddComment}
          handleDeleteComment={handleDeleteComment}
          handleAddReply={handleAddReply}
          handleNavigateToUserProfile={handleNavigateToUserProfile}
          toggleFollowUser={toggleFollowUser}
          authorIndex={authorIndex}
          formatCount={formatCount}
        />

        {/* ===== Mobile Overlay HUD HUD (በሞባይል ብቻ የሚታይ የላይ ፈጣን መቆጣጠሪያ) ===== */}
        <div className="absolute inset-0 z-20 pointer-events-none md:hidden flex flex-col justify-between">
          <div className="absolute right-4 bottom-28 flex flex-col gap-4 items-center pointer-events-auto z-30">
            {/* Likes */}
            <button
              onClick={() => handleToggleLikePost(selectedPost.id)}
              className="flex flex-col items-center justify-center active:scale-90 transition-all focus:outline-none"
            >
              <div
                className={`w-11 h-11 rounded-full bg-black/20 shadow-input backdrop-blur-md flex items-center justify-center border border-white/10 ${
                  selectedPost.liked ? "text-rose-500" : "text-white"
                }`}
              >
                <Heart
                  className={`w-5.5 h-5.5 ${selectedPost.liked ? "fill-rose-500 text-rose-500" : ""}`}
                />
              </div>
              <span className="text-[10px] font-bold text-white mt-1 drop-shadow-md bg-black/25 px-1.5 py-0.5 rounded-full select-none">
                {formatCount(selectedPost.likes)}
              </span>
            </button>

            {/* Comments toggle drawer */}
            <button
              onClick={() => setMobileCommentsOpen(true)}
              className="flex flex-col items-center justify-center active:scale-90 transition-all focus:outline-none"
            >
              <div className="w-11 h-11 rounded-full bg-black/20 shadow-input backdrop-blur-md flex items-center justify-center border border-white/10 text-white">
                <MessageCircle className="w-5.5 h-5.5" />
              </div>
              <span className="text-[10px] font-bold text-white mt-1 drop-shadow-md bg-black/25 px-1.5 py-0.5 rounded-full select-none">
                {formatCount(comments.length)}
              </span>
            </button>

            {/* Saves */}
            <button
              onClick={() => handleToggleSavePost(selectedPost.id)}
              className="flex flex-col items-center justify-center active:scale-90 transition-all focus:outline-none"
            >
              <div
                className={`w-11 h-11 rounded-full bg-black/20 shadow-input backdrop-blur-md flex items-center justify-center border border-white/10 ${
                  selectedPost.saved ? "text-amber-400" : "text-white"
                }`}
              >
                <Bookmark
                  className={`w-5.5 h-5.5 ${selectedPost.saved ? "fill-amber-400 text-amber-400" : ""}`}
                />
              </div>
              <span className="text-[10px] font-bold text-white mt-1 drop-shadow-md bg-black/25 px-1.5 py-0.5 rounded-full select-none">
                {formatCount(selectedPost.saves)}
              </span>
            </button>

            {/* Shares */}
            <button
              onClick={() => handleSharePost(selectedPost.id)}
              className="flex flex-col items-center justify-center active:scale-90 transition-all focus:outline-none"
            >
              <div className="w-11 h-11 rounded-full bg-black/20 shadow-input backdrop-blur-md flex items-center justify-center border border-white/10 text-white">
                <Share2 className="w-5.5 h-5.5" />
              </div>
              <span className="text-[10px] font-bold text-white mt-1 drop-shadow-md bg-black/25 px-1.5 py-0.5 rounded-full select-none">
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
                      {postAuthor.name}
                    </span>
                    <span className="text-[10px] text-white/70 font-medium truncate">
                      @{postAuthor.username}
                    </span>

                    {!isOwnPost && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFollowUser(authorIndex);
                        }}
                        className={`px-2.5 py-1 text-[10px] font-black rounded-lg transition-all ml-1.5 ${
                          postAuthor.isFollowing
                            ? "bg-white/20 text-white border border-white/20 backdrop-blur-sm"
                            : "bg-gradient-to-b from-[#019BE5] via-[#0185E5] to-[#0071E3] text-white hover:opacity-95 shadow-sm"
                        }`}
                      >
                        {postAuthor.isFollowing ? "Following" : "Follow"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <p className="text-[12px] text-white/95 leading-relaxed break-words line-clamp-2 max-h-16 overflow-y-auto pr-2">
              {selectedPost.description.split(/(\s+)/).map((word, i) => {
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
              className="flex items-center gap-3 mb-10 md:mb-0 relative"
            >
              <button
                type="button"
                onClick={() => setEmojiPickerOpen(!emojiPickerOpen)}
                className="text-2xl active:scale-90 transition-all p-1"
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
                className="flex-1 bg-black/40 border border-white/20 focus:border-blue-500 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-white outline-none transition-all placeholder:text-gray-400 resize-none min-h-[38px] max-h-[90px] overflow-y-auto scrollbar-none"
              />

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
            <div className="fixed inset-x-0 bottom-0 h-[82vh] max-h-[82vh] bg-white rounded-t-[32px] shadow-2xl z-50 flex flex-col transition-all duration-300 md:hidden overflow-hidden pointer-events-auto">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between shrink-0 bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-800">Comments</h3>
                  <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {comments.length}
                  </span>
                </div>
                <button
                  onClick={() => setMobileCommentsOpen(false)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-bold px-2 py-1"
                >
                  Close
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {comments.length === 0 ? (
                  <div className="text-center text-slate-400 text-sm py-12 flex flex-col items-center justify-center">
                    <span className="text-2xl mb-1">💬</span>
                    <p className="font-bold text-slate-500">No comments yet</p>
                    <p className="text-xs text-slate-400">
                      Be the first to share your thoughts!
                    </p>
                  </div>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="space-y-2.5">
                      <div className="flex gap-2.5 items-start">
                        <div
                          onClick={() => {
                            setMobileCommentsOpen(false);
                            handleNavigateToUserProfile(comment.username);
                          }}
                          className="w-9 h-9 rounded-full overflow-hidden bg-blue-50 flex items-center justify-center text-blue-600 text-xs font-bold shrink-0 border border-slate-100 cursor-pointer active:scale-95 transition-transform"
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
                        <div className="flex-1 bg-slate-50 rounded-2xl py-3.5 px-4.5 border-l-3 border-blue-400 shadow-sm">
                          <h4
                            onClick={() => {
                              setMobileCommentsOpen(false);
                              handleNavigateToUserProfile(comment.username);
                            }}
                            className="text-[12px] font-bold text-blue-600 mb-1 cursor-pointer hover:underline"
                          >
                            @{comment.username}
                          </h4>
                          <p className="text-[13.5px] text-slate-800 leading-relaxed break-words font-medium">
                            {comment.text}
                          </p>

                          <div className="flex items-center gap-4 mt-2 text-[10px] font-bold text-slate-400">
                            <span>
                              {new Date(comment.timestamp).toLocaleTimeString(
                                undefined,
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )}
                            </span>

                            <button
                              onClick={() =>
                                handleToggleCommentLike(
                                  selectedPost.id,
                                  comment.id,
                                )
                              }
                              className={`flex items-center gap-1 ${comment.liked ? "text-rose-500" : "text-slate-400"}`}
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
                                  handleDeleteComment(
                                    selectedPost.id,
                                    comment.id,
                                  )
                                }
                                className="text-slate-400 hover:text-rose-600 ml-auto"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Sub-Replies listing on mobile */}
                      {comment.replies &&
                        comment.replies.map((reply) => (
                          <div
                            key={reply.id}
                            className="flex gap-2 items-start pl-6"
                          >
                            <div
                              onClick={() => {
                                setMobileCommentsOpen(false);
                                handleNavigateToUserProfile(reply.username);
                              }}
                              className="w-5.5 h-5.5 rounded-full overflow-hidden bg-teal-50 flex items-center justify-center text-teal-600 text-[8px] font-bold shrink-0 border border-slate-100 cursor-pointer"
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
                            <div className="flex-1 bg-slate-100/70 rounded-xl py-2 px-3 border-l border-teal-500/20">
                              <h5
                                onClick={() => {
                                  setMobileCommentsOpen(false);
                                  handleNavigateToUserProfile(reply.username);
                                }}
                                className="text-[11px] font-bold text-teal-600 mb-0.5 cursor-pointer hover:underline"
                              >
                                @{reply.username}
                              </h5>
                              <p className="text-[12px] text-slate-700 leading-relaxed break-words font-medium">
                                {reply.text}
                              </p>
                              <span className="text-[8px] text-slate-400 block mt-0.5">
                                {new Date(reply.timestamp).toLocaleTimeString(
                                  undefined,
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  },
                                )}
                              </span>
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
                            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2 text-[12.5px] h-9 focus:border-blue-500 outline-none transition-all"
                          />
                          <button
                            type="submit"
                            className="w-8.5 h-8.5 bg-emerald-500 text-white rounded-xl flex items-center justify-center shadow-sm shrink-0 active:scale-90"
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
                className="border-t border-gray-100 p-4 bg-white flex items-center gap-3 shrink-0 mb-10 pb-6 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]"
              >
                <textarea
                  value={commentInputText}
                  onChange={(e) => setCommentInputText(e.target.value)}
                  placeholder="Add comment..."
                  maxLength={300}
                  rows={1}
                  className="flex-1 bg-slate-50 border border-gray-200 focus:border-blue-500 rounded-2xl px-4.5 py-3 text-[14px] text-slate-700 outline-none resize-none min-h-[46px] max-h-[100px] overflow-y-auto scrollbar-thin transition-all"
                />
                <button
                  type="submit"
                  disabled={!commentInputText.trim()}
                  className="w-10 h-10 bg-emerald-500 disabled:opacity-40 text-white rounded-full flex items-center justify-center shadow-md shrink-0 active:scale-95 transition-transform"
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
