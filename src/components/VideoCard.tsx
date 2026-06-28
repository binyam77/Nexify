// MOBILE: video fills the entire screen edge-to-edge; like/comment/share/more
// float ON TOP of it, pinned to the right side, above the bottom tab bar.
// DESKTOP (md:): back to the original layout — a centered, rounded video card
// with the action icons in their own column BESIDE it (not overlaid).
import { useState, type ReactNode } from "react";
import { Heart, MessageCircle, Share2, MoreVertical } from "lucide-react";
import { useLike } from "../hooks/useLike";
import { useComments } from "../hooks/useComments";
import { useShare } from "../hooks/useShare";
import CommentModal from "./CommentModal";
import Toast from "./Toast";
import { cn } from "../utils";
import type { VideoData, User } from "../types";

interface VideoCardProps {
  video: VideoData;
  currentUser: User;
  isFollowing?: boolean;
  onFollowToggle?: () => void;
}

export default function VideoCard({
  video,
  currentUser,
  isFollowing = false,
  onFollowToggle,
}: VideoCardProps) {
  const { liked, count: likeCount, toggleLike } = useLike(video.id);
  const {
    comments,
    postComment,
    deleteComment,
    editComment,
    toggleLike: toggleCommentLike,
    addReply,
    deleteReply,
  } = useComments(video.id);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const { share, toastMessage, toastVisible } = useShare({
    title: video.caption,
    text: `Check out this post by ${video.authorName} on Nexify!`,
    url: typeof window !== "undefined" ? window.location.href : "",
  });

  return (
    // Outer row: just a positioning context on mobile; becomes the
    // "video box + action column, side by side" flex row on desktop.
    <div className="relative h-full w-full md:flex md:h-full md:items-end md:justify-center md:gap-5 md:px-6 md:py-6">
      {/* ===== Video box =====
          Mobile: absolute, fills the outer row exactly (= full screen).
          Desktop: rejoins normal flow as a flex-1 rounded card. */}
      <div className="absolute inset-0 overflow-hidden bg-black md:relative md:h-[92vh] md:max-w-[450px] md:flex-1 md:rounded-xl">
        <video
          src={video.videoUrl}
          className="h-full w-full object-cover"
          loop
          autoPlay
          muted
          playsInline
        />

        {/* User info pill — anchored to the video box itself */}
        <div className="absolute bottom-28 left-3 right-20 flex items-center gap-3 rounded-full bg-white/80 px-3.5 py-2 backdrop-blur-md md:bottom-6 md:left-4 md:right-auto md:max-w-[85%]">
          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border-2 border-white">
            <img
              src={video.authorAvatarUrl}
              alt={video.authorName}
              className="h-full w-full object-cover"
            />
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="text-sm font-bold text-slate-900">
              {video.authorName}
            </span>
            <p className="mt-0.5 truncate text-[11px] text-slate-700">
              {video.caption}
            </p>
          </div>
          {/* Static in the original markup too — no follow logic exists yet */}
          <button
            type="button"
            onClick={onFollowToggle}
            className={`ml-auto shrink-0 rounder-full px-3 py-1 text-[11px] font-bold text-white transition-colors
           ${isFollowing ? "bg-gray-400 hover:bg-gray-500" : "bg-blue-600 hover:bg-blue-700"}  `}
          >
            {isFollowing ? "Following" : "Follow"}
          </button>
        </div>
      </div>

      {/* ===== Action icons =====
          Mobile: absolute, overlaid on the video, pinned right.
          Desktop (md:static): rejoins flex flow as a column beside the video. */}
      <div className="absolute bottom-32 right-3 z-20 flex flex-col items-center gap-5 md:static md:bottom-auto md:right-auto md:z-auto md:flex-shrink-0 md:gap-4 md:pb-5">
        <ActionButton
          icon={<Heart size={24} fill={liked ? "currentColor" : "none"} />}
          active={liked}
          activeColorClass="text-rose-400 md:text-rose-500"
          count={likeCount}
          onClick={toggleLike}
          label={liked ? "Unlike" : "Like"}
        />
        <ActionButton
          icon={
            <MessageCircle
              size={22}
              fill={isCommentsOpen ? "currentColor" : "none"}
            />
          }
          active={isCommentsOpen}
          activeColorClass="text-blue-300 md:text-blue-600"
          count={comments.length}
          onClick={() => setIsCommentsOpen((open) => !open)}
          label="Toggle comments"
        />
        <button
          type="button"
          onClick={share}
          className="flex h-[46px] w-[46px] items-center justify-center rounded-full bg-white/25 text-white backdrop-blur-sm transition-transform hover:scale-110 md:h-[50px] md:w-[50px] md:bg-blue-100/60 md:text-blue-600 md:backdrop-blur-none"
          aria-label="Share"
        >
          <Share2 size={20} />
        </button>
        <button
          type="button"
          className="flex h-[46px] w-[46px] items-center justify-center rounded-full bg-white/25 text-white backdrop-blur-sm md:h-[50px] md:w-[50px] md:bg-slate-300/80 md:text-slate-700 md:backdrop-blur-none"
          aria-label="More options"
        >
          <MoreVertical size={22} />
        </button>
      </div>

      {isCommentsOpen && (
        <CommentModal
          comments={comments}
          currentUsername={currentUser.fullName}
          onClose={() => setIsCommentsOpen(false)}
          onPostComment={(text) =>
            postComment(
              text,
              currentUser.fullName,
              currentUser.avatarUrl ?? null,
            )
          }
          onDeleteComment={deleteComment}
          onEditComment={editComment}
          onToggleLike={toggleCommentLike}
          onAddReply={(id, text) =>
            addReply(
              id,
              text,
              currentUser.fullName,
              currentUser.avatarUrl ?? null,
            )
          }
          onDeleteReply={deleteReply}
        />
      )}

      <Toast message={toastMessage} visible={toastVisible} />
    </div>
  );
}

interface ActionButtonProps {
  icon: ReactNode;
  active: boolean;
  activeColorClass?: string;
  count: number;
  onClick: () => void;
  label: string;
}

/** Avoids repeating the icon-circle-with-count-underneath markup 2x. */
function ActionButton({
  icon,
  active,
  activeColorClass = "text-rose-400 md:text-rose-500",
  count,
  onClick,
  label,
}: ActionButtonProps) {
  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        className={cn(
          "flex h-[46px] w-[46px] items-center justify-center rounded-full bg-white/25 backdrop-blur-sm transition-transform hover:scale-105",
          "md:h-[50px] md:w-[50px] md:bg-slate-300/80 md:backdrop-blur-none",
          active ? activeColorClass : "text-white md:text-slate-700",
        )}
      >
        {icon}
      </button>
      <span className="mt-1 text-xs font-semibold text-white drop-shadow md:text-slate-700 md:drop-shadow-none">
        {count}
      </span>
    </div>
  );
}
