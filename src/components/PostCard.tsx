import { useState, useRef, useEffect } from "react";
import {
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Play,
  Volume2,
  Volume1,
  VolumeX,
} from "lucide-react";
import { useLike } from "../hooks/useLike";
import { useSave } from "../hooks/useSave";
import { useShare } from "../hooks/useShare";
import { useComments } from "../hooks/useComments";
import CommentModal from "./CommentModal";
import { useFeed } from "../context/FeedContext";
import type { FeedPost, User } from "../types";

interface PostCardProps {
  post: FeedPost;
  currentUser: User;
  onView?: () => void;
}

export default function PostCard({ post, currentUser, onView }: PostCardProps) {
  const {
    liked,
    count: likeCount,
    toggleLike,
  } = useLike(post.id, post.likesCount);
  const {
    saved,
    count: saveCount,
    toggleSave,
  } = useSave(post.id, post.savesCount);
  const {
    comments,
    postComment,
    deleteComment,
    editComment,
    toggleLike: toggleCommentLike,
    addReply,
    deleteReply,
  } = useComments(post.id);
  const { share } = useShare({
    title: post.caption,
    text: `Check out this post by ${post.username} on Nexify!`,
    url: typeof window !== "undefined" ? window.location.href : "",
  });

  // Carousel state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isVertical, setIsVertical] = useState(true);
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [imgIsVertical, setImgVertical] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [volume, setVolume] = useState<number>(0.8);
  const [captionExpanded, setCaptionExpanded] = useState<boolean>(false);
  const isOwnPost =
    currentUser.fullName === post.username || currentUser.id === post.userId;
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
      if (!isMuted) videoRef.current.volume = volume;
    }
  }, [isMuted, volume]);
  // Video state
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
const lastTapRef = useRef<number>(0);
const tapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // View tracking
  const viewedRef = useRef(false);
  useEffect(() => {
    if (!onView || viewedRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !viewedRef.current) {
          viewedRef.current = true;
          onView();
        }
      },
      { threshold: 0.7 },
    );
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [onView]);

  const handleVideoClick = () => {
  const now = Date.now();
  const DOUBLE_TAP_DELAY = 300;

  if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
    // Double tap → Like
    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current);
      tapTimeoutRef.current = null;
    }
    if (!liked) toggleLike();
    lastTapRef.current = 0;
  } else {
    lastTapRef.current = now;
    tapTimeoutRef.current = setTimeout(() => {
      // Single tap → Play/Pause
      if (!videoRef.current) return;
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }, DOUBLE_TAP_DELAY);
  }
};

  const handlePrev = () => setCurrentIndex((i) => Math.max(0, i - 1));
  const handleNext = () =>
    setCurrentIndex((i) => Math.min(post.mediaUrls.length - 1, i + 1));

  const isMultiPhoto = post.type === "photo" && post.mediaUrls.length > 1;
  const { addPost } = useFeed();
  // FeedContext ማሳወቅ — backend ሲመጣ addPost ይቀራል፣ API ብቻ ይቀየራል

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full bg-black md:bg-[#f1f5f9]  flex items-center justify-center md:justify-center"
    >
      {/* ===== Media Area ===== */}
      {post.type === "video" ? (
        <div
          className="absolute inset-0 bg-black md:relative md:relative md:h-[92vh] md:w-auto 
        md:aspect-[9/16] md:max-w-[420px] md:rounded-2xl md:overflow-hidden"
          onClick={handleVideoClick}
        >
          <video
            ref={videoRef}
            src={post.mediaUrls[0]}
            className={`h-full w-full ${isVertical ? " object-cover" : "object-contain"}`}
            loop
            autoPlay
            muted
            playsInline
            onLoadedMetadata={(e) => {
              const v = e.currentTarget;
              setIsVertical(v.videoHeight / v.videoWidth >= 1.3);
              // Mobile browser policy >>> muted autoplay only
              // ተጠካሚ  volume button ሲነካ unmute ይደረጋል
              v.muted = true;
              v.volume = volume;
              v.play().catch(() => {});
            }}
          />
          {/* Sound toggle botton */}
          <div
            className="absolute top-3 right-3 z-20 flex items-center gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            {/*Volume slider  - unmuted ሲሆን ብቻ */}
            {!isMuted && (
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setVolume(val);
                  if (videoRef.current) videoRef.current.volume = val;
                }}
                className="w-20 h-1 accent-white cursor-pointer"
              />
            )}
            <button
              onClick={async (e) => {
                e.stopPropagation();
                const next = !isMuted;
                setIsMuted(next);
                if (!videoRef.current) return;
                try {
                  videoRef.current.muted = next;
                  videoRef.current.volume = next ? 0 : volume;
                  if (!videoRef.current.paused) {
                    return;
                  }
                  await videoRef.current.play();
                } catch {
                  videoRef.current.muted = true;
                  setIsMuted(true);
                }
              }}
              className="bg-black/50 rounded-full p-2 backdrop-blur-sm"
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5 text-input" />
              ) : volume > 0.5 ? (
                <Volume2 className="w-5 h-5 text-input" />
              ) : (
                <Volume1 className="w-5 h-5 text-input" />
              )}
            </button>
          </div>

          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-black/40 rounded-full p-4">
                <Play className="w-10 h-10 text-white" fill="white" />
              </div>
            </div>
          )}
        </div>
      ) : (
        <div
          className="absolute inset-0 bg-black overflow-hidden md:relative md:h-[92vh] md:w-auto 
        md:aspect-[9/16] md:max-w-[420px] md:rounded-2xl"
        >
          {/* Carousel or single photo */}
          <div
            className="flex h-full transition-transform duration-300 ease-out"
            style={{
              transform: `translateX(-${currentIndex * 100}%)`,
              width: `${post.mediaUrls.length * 100}%`,
            }}
          >
            {post.mediaUrls.map((url, i) => (
              <div
                key={i}
                className="h-full shrink-0"
                style={{ width: `${100 / post.mediaUrls.length}%` }}
              >
                {url ? (
                  <img
                    src={url}
                    alt={`post-${i}`}
                    onLoad={(e) => {
                      const img = e.currentTarget;
                      setImgVertical(
                        img.naturalHeight / img.naturalWidth >= 1.3,
                      );
                    }}
                    className={`h-full w-full ${imgIsVertical ? "object-cover" : "object-contain bg-black"}`}
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700">
                    <span className="text-white text-lg font-bold opacity-60">
                      No Media
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Carousel arrows */}
          {isMultiPhoto && (
            <>
              {currentIndex > 0 && (
                <button
                  onClick={handlePrev}
                  className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 rounded-full p-1.5 text-white z-10"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              {currentIndex < post.mediaUrls.length - 1 && (
                <button
                  onClick={handleNext}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 rounded-full p-1.5 text-white z-10"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
              {/* Dots indicator */}
              <div className="absolute bottom-32 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                {post.mediaUrls.map((_, i) => (
                  <div
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentIndex ? "bg-white w-3" : "bg-white/50"}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ===== User Info (bottom left) ===== */}
      <div className="absolute bottom-20 left-3 right-16 z-10 md:bottom-8">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-white bg-gray-400 shrink-0">
            {post.userAvatar ? (
              <img
                src={post.userAvatar}
                alt={post.username}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                {post.username[0]?.toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex item-center gap-2 ">
            <span className="text-input font-bold text-sm drop-shadow md:text-slate-900">
              {post.username}
            </span>
            {!isOwnPost && (
              <button
                onClick={() => setIsFollowing((f) => !f)}
                className={`text-[11px] font-bold px-2.5 py-0.5  rounded-full border transition-colors
            ${
              isFollowing
                ? "border border-input-border text-input  md:border-input-border md:text-input-text"
                : "border-brand-light bg-brand text-input w-15  md:border-brand-light md:text-input md:bg-brand"
            }`}
              >
                {isFollowing ? "Following" : "Follow"}
              </button>
            )}
          </div>
        </div>
        {post.caption && (
          <div>
            <p
              className={`text-white text-xs leading-relaxed drop-shadow md:text-slate-700 
            transition-all ${captionExpanded ? "" : "line-clamp-2"}`}
            >
              {post.caption}
            </p>
            {post.caption.length > 80 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCaptionExpanded((c) => !c);
                }}
                className="text-white/70 text-[11px] font-semibold mt-0.5 md:text-slate-500"
              >
                {captionExpanded ? "less" : "more"}
              </button>
            )}
          </div>
        )}
      </div>

      {/* ===== Action Buttons (right side) ===== */}
      <div
        className="absolute bottom-20 right-3 z-10 flex flex-col items-center gap-3
      md:static md:ml-5 md:bottom-auto md:right-auto md:pb-10"
      >
        {/* Like */}
        <ActionBtn
          icon={<Heart size={24} fill={liked ? "currentColor" : "none"} />}
          label={likeCount}
          active={liked}
          activeColor="text-rose-500"
          onClick={toggleLike}
        />
        {/* Comment */}
        <ActionBtn
          icon={<MessageCircle size={22} />}
          label={comments.length || post.commentsCount}
          active={isCommentsOpen}
          activeColor="text-blue-400"
          onClick={() => setIsCommentsOpen(true)}
        />
        {/* Save */}
        <ActionBtn
          icon={<Bookmark size={22} fill={saved ? "currentColor" : "none"} />}
          label={saveCount}
          active={saved}
          activeColor="text-yellow-400"
          onClick={toggleSave}
        />
        {/* Share */}
        <button onClick={share} className="flex flex-col items-center gap-1">
          <div
            className="w-12 h-11 rounded-full flex items-center justify-center
          drop-shadow-lg  text-white 
           md:bg-slate-200 md:shadow-none md:text-slate-700"
          >
            <Share2 size={20} />
          </div>
          <span className="text-white text-xs font-medium  drop-shadow md:text-slate-700 md:drop-shadow-none">
            {post.sharesCount}
          </span>
        </button>
      </div>

      {/* ===== Comments Modal ===== */}
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
    </div>
  );
}

// Action Button Component
function ActionBtn({
  icon,
  label,
  active,
  activeColor,
  onClick,
}: {
  icon: React.ReactNode;
  label: number;
  active: boolean;
  activeColor: string;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1">
      <div
        className={`w-12 h-11 rounded-full  flex items-center justify-center transition-colors
          drop-shadow-lg  md:bg-slate-200 md:shadow-none
           ${active ? activeColor : "text-white md:text-slate-700"}`}
      >
        {icon}
      </div>
      <span className="text-white text-xs font-medium  drop-shadow md:text-slate-700 md:drop-shadow-none">
        {label}
      </span>
    </button>
  );
}
