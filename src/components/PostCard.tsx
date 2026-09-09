import { useState, useRef, useEffect } from "react";
import {
  Heart,
  MessageCircle,
  Share2,
  ChevronLeft,
  ChevronRight,
  Play,
  Volume2,
  VolumeX,
  MoreHorizontal,
  MessagesSquare,
  WifiOff,
  RotateCw,
} from "lucide-react";
import { useShare } from "../hooks/useShare";
import CommentModal from "./CommentModal";
import { useFeed } from "../context/FeedContext";
import type { FeedPost, User } from "../types";

interface PostCardProps {
  post: FeedPost;
  currentUser: User;
  onView?: () => void;
  onMessageUser?: (user: {
    name: string;
    username: string;
    photo: string;
  }) => void;
}

// Tap ≠ Hold detection tuning:
// - Under DOUBLE_TAP_DELAY between two releases → treated as a double-tap (like)
// - Held down longer than HOLD_ACTIVATION_MS without releasing → 2x speed
// HOLD_ACTIVATION_MS is deliberately > DOUBLE_TAP_DELAY so a quick
// double-tap can never be misread as the start of a hold.
const DOUBLE_TAP_DELAY = 300;
const HOLD_ACTIVATION_MS = 400;

export default function PostCard({
  post,
  currentUser,
  onView,
  onMessageUser,
}: PostCardProps) {
  const {
    toggleLike: toggleLikePost,
    toggleFollow,
    incrementShare,
    commentsMap,
    isLoadingComments,
    commentsError,
    addComment,
    deleteComment,
    editComment,
    addReply,
    deleteReply,
    loadComments,
  } = useFeed();
  //"post"prop በከትታ FeedContext array element  ስለሆነ(Home.tsx ካስተላለፈው):
  // toggle ሰደረግ context ራሱ ይከየራል: re-render ይህን በራሱ ያንተባርካል
  const liked = post.liked;
  const likeCount = post.likesCount;
  const comments = commentsMap[post.id] || [];

  const { share, toastMessage, toastVisible } = useShare({
    title: post.caption,
    text: `Check out this post by ${post.username} on Nexify!`,
    url: typeof window !== "undefined" ? window.location.href : "",
  });

  // Carousel state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isVertical, setIsVertical] = useState(true);
  const [imgIsVertical, setImgVertical] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [captionExpanded, setCaptionExpanded] = useState<boolean>(false);

  // Media load failure (e.g. dropped network mid-scroll/mid-watch) — shows
  // a Retry overlay instead of a blank/broken video or image. Only the
  // media itself is blacked out — chrome (mute, like/comment/save/share,
  // username/follow) stays visible and functional (see z-index notes below).
  const [mediaError, setMediaError] = useState(false);
  const [retryNonce, setRetryNonce] = useState(0);

  // Swiping to a different carousel slide should reset any previous
  // slide's error — each slide gets a clean attempt. Compared during
  // render (React's recommended "adjusting state on a value change"
  // pattern) instead of a useEffect, so no extra render cycle and no
  // "synchronous setState in an effect" warning.
  const [lastIndexForError, setLastIndexForError] = useState(currentIndex);
  if (currentIndex !== lastIndexForError) {
    setLastIndexForError(currentIndex);
    setMediaError(false);
  }

  function handleRetryMedia() {
    setMediaError(false);
    setRetryNonce((n) => n + 1);
  }

  // Comments modal ሲከፈት ብቻ ነው ከ backend የምንጭነው (Comments unbounded list ስለሆነ
  // ሁልጊዜ preload አናደርግም — database-design.md Section 19)
  useEffect(() => {
    if (isCommentsOpen) {
      void loadComments(post.id);
    }
  }, [isCommentsOpen, post.id, loadComments]);

  const isOwnPost =
    currentUser.fullName === post.username || currentUser.id === post.userId;

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
      // ድምጽ ደረጃ ራሱ ከዚህ በኋላ በተጠቃሚው device (hardware) volume buttons ብቻ
      // ነው የሚቆጣጠረው — in-app percentage slider ተወግዷል።
      if (!isMuted) videoRef.current.volume = 1;
    }
  }, [isMuted]);

  // Video state
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isFastForwarding, setIsFastForwarding] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastTapRef = useRef<number>(0);
  const tapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Press-and-hold → 2x playback (video only). Kept as refs (not state)
  // since they're pure bookkeeping read inside pointer handlers, not
  // something the render needs to react to.
  const holdTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isHoldingRef = useRef(false);

  function clearHoldTimer() {
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }
  }

  // Ends an active hold (if any) and reports whether one was ending, so
  // the caller (pointer-up) knows whether to also run tap-detection.
  function endHold(): boolean {
    clearHoldTimer();
    if (isHoldingRef.current) {
      isHoldingRef.current = false;
      setIsFastForwarding(false);
      if (videoRef.current) videoRef.current.playbackRate = 1;
      return true;
    }
    return false;
  }

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

  // Tap-classification (single = play/pause on video, double = like).
  // Works for both video and photo — the play/pause branch is a no-op
  // when there's no videoRef (photos).
  function handleMediaTap() {
    const now = Date.now();

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double tap → Like (Instagram-style: only likes, never unlikes)
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
        tapTimeoutRef.current = null;
      }
      if (!liked) toggleLikePost(post.id);
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
      tapTimeoutRef.current = setTimeout(() => {
        // Single tap → Play/Pause (video only; no-op for photos)
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
  }

  // Video-only: pointerdown starts the hold timer; pointerup either
  // finishes a hold (revert to 1x, skip tap-detection) or — if released
  // before HOLD_ACTIVATION_MS — runs normal tap-detection instead.
  function handleVideoPointerDown() {
    isHoldingRef.current = false;
    holdTimeoutRef.current = setTimeout(() => {
      isHoldingRef.current = true;
      setIsFastForwarding(true);
      if (videoRef.current) videoRef.current.playbackRate = 2;
    }, HOLD_ACTIVATION_MS);
  }

  function handleVideoPointerUp() {
    const wasHold = endHold();
    if (wasHold) return; // hold just ended — not a tap
    handleMediaTap();
  }

  function handleVideoPointerLeave() {
    // Finger dragged off mid-press — cancel the hold without treating it
    // as a tap (matches TikTok/Instagram: dragging off cancels, doesn't
    // trigger pause/like).
    endHold();
  }

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((i) => Math.max(0, i - 1));
  };
  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((i) => Math.min(post.mediaUrls.length - 1, i + 1));
  };

  const isMultiPhoto = post.type === "photo" && post.mediaUrls.length > 1;

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full bg-black md:bg-surface  flex items-center justify-center md:justify-center"
    >
      {/*Share feedback toast - clipboard success/failure ተተካሚው እንዲያውክ */}
      {toastVisible && (
        <div
          className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30 bg-black/80 text-white text-xs
        font-medium py-2 px-4 rounded-full backdrop-blur-sm shadow-lg animate-fade-in
        pointer-events-none"
        >
          {toastMessage}
        </div>
      )}

      {/* ===== Media Area ===== */}
      {post.type === "video" ? (
        <div
          className="absolute inset-0 bg-black md:relative md:relative md:h-[92vh] md:w-auto 
        md:aspect-[9/16] md:max-w-[420px] md:rounded-2xl md:overflow-hidden"
          onPointerDown={handleVideoPointerDown}
          onPointerUp={handleVideoPointerUp}
          onPointerLeave={handleVideoPointerLeave}
          onPointerCancel={handleVideoPointerLeave}
        >
          <video
            key={`video-${retryNonce}`}
            ref={videoRef}
            src={post.mediaUrls[0]}
            className={`h-full w-full ${isVertical ? " object-cover" : "object-contain"}`}
            loop
            autoPlay
            muted
            playsInline
            onError={() => setMediaError(true)}
            onLoadedMetadata={(e) => {
              const v = e.currentTarget;
              setIsVertical(v.videoHeight / v.videoWidth >= 1.3);
              // Mobile browser policy >>> muted autoplay only
              // ተጠካሚ  volume button ሲነካ unmute ይደረጋል
              v.muted = true;
              v.volume = 1;
              v.play().catch(() => {});
            }}
          />

          {/* 2x speed indicator — visible only while actively holding */}
          {isFastForwarding && (
            <div className="absolute top-3 left-3 z-20 bg-black/60 text-white text-xs font-bold px-2.5 py-1 rounded-full pointer-events-none">
              2×
            </div>
          )}

          {/* Mute/unmute toggle — volume LEVEL itself is device-hardware
              only, this only controls muted vs unmuted. z-30 so it stays
              above the media-error overlay (z-10) regardless of nesting. */}
          <div
            className="absolute top-3 right-3 z-30"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={async (e) => {
                e.stopPropagation();
                const next = !isMuted;
                setIsMuted(next);
                if (!videoRef.current) return;
                try {
                  // eslint-disable-next-line react-hooks/immutability -- imperative video control ትክክለኛ ref pattern ነው
                  videoRef.current.muted = next;
                  videoRef.current.volume = next ? 0 : 1;
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
              ) : (
                <Volume2 className="w-5 h-5 text-input" />
              )}
            </button>
          </div>

          {!isPlaying && !isFastForwarding && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
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
          onClick={handleMediaTap}
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
                    src={
                      i === currentIndex && retryNonce > 0
                        ? `${url}${url.includes("?") ? "&" : "?"}retry=${retryNonce}`
                        : url
                    }
                    alt={`post-${i}`}
                    onLoad={(e) => {
                      const img = e.currentTarget;
                      setImgVertical(
                        img.naturalHeight / img.naturalWidth >= 1.3,
                      );
                    }}
                    onError={() => {
                      if (i === currentIndex) setMediaError(true);
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

      {/* Media load failure overlay — z-10: above the raw media (z-auto/0)
          so it blacks it out, but BELOW every piece of persistent chrome
          (mute z-30, user-info/action-bar z-20 below) so those stay
          visible and fully functional while this shows. */}
      {mediaError && (
        <div className="absolute inset-0 z-10 bg-black flex flex-col items-center justify-center gap-3 text-white">
          <WifiOff className="w-10 h-10 opacity-70" />
          <p className="text-sm opacity-80">ግንኙነት ችግር ገጥሟል</p>
          <button
            onClick={handleRetryMedia}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/15 text-sm font-semibold active:scale-95 transition-transform"
          >
            <RotateCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      )}

      {/* ===== User Info (bottom left) ===== */}
      <div className="absolute bottom-20 left-3 right-16 z-20 md:bottom-8">
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
            <span className="text-input font-bold text-sm drop-shadow md:text-ink">
              {post.username}
            </span>
            {!isOwnPost && (
              <button
                onClick={() => toggleFollow(post.userId)}
                className={`text-[11px] font-bold px-2.5 py-0.5  rounded-full border transition-colors
            ${
              post.isFollowing
                ? "border border-input-border text-input  md:border-input-border md:text-input-text"
                : "border-brand-light bg-brand text-input w-15  md:border-brand-light md:text-input md:bg-brand"
            }`}
              >
                {post.isFollowing ? "Following" : "Follow"}
              </button>
            )}
          </div>
        </div>
        {post.caption && (
          <div>
            <p
              className={`text-white text-xs leading-relaxed drop-shadow md:text-input-text 
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
                className="mt-1 text-white/80 hover:text-white transition-colors md:text-input-placeholder"
                aria-label={captionExpanded ? "Show less" : "Show more"}
              >
                <MoreHorizontal size={16} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* ===== Action Buttons (right side) ===== */}
      <div
        className="absolute bottom-20 right-3 z-20 flex flex-col items-center gap-4
md:static md:ml-5 md:bottom-auto md:right-auto md:pb-10"
      >
        {/* Like */}
        <ActionBtn
          icon={<Heart size={26} fill={liked ? "currentColor" : "none"} />}
          label={likeCount}
          active={liked}
          activeColor="text-rose-500"
          onClick={() => toggleLikePost(post.id)}
        />
        {/* Comment */}
        <ActionBtn
          icon={<MessageCircle size={25} />}
          label={comments.length || post.commentsCount}
          active={isCommentsOpen}
          activeColor="text-blue-400"
          onClick={() => setIsCommentsOpen(true)}
        />
        {/* Chat — የራስ ፖስት ላይ አይታይም (ራስን መልእክት መላክ ትርጉም የለውም) */}
        {!isOwnPost && (
          <button
            onClick={() =>
              onMessageUser?.({
                name: post.username,
                username: post.username,
                photo: post.userAvatar,
              })
            }
            className="flex flex-col items-center gap-0.5"
            type="button"
          >
            <div className="w-12 h-11 rounded-full flex items-center justify-center shadow-lg drop-shadow-lg text-white transition-transform active:scale-90 md:bg-surface md:shadow-md md:drop-shadow-none md:text-input-text">
              <MessagesSquare size={22} />
            </div>
            <span className="text-white text-xs font-medium leading-none drop-shadow md:text-input-text md:drop-shadow-none">
              Chat
            </span>
          </button>
        )}
        {/* Share */}
        <button
          onClick={async () => {
            const success = await share();
            if (success) incrementShare(post.id);
          }}
          className="flex flex-col items-center gap-0.5"
          type="button"
        >
          <div
            className="w-12 h-11 rounded-full flex items-center justify-center
    shadow-lg drop-shadow-lg text-white transition-transform active:scale-90
     md:bg-surface md:shadow-md md:drop-shadow-none md:text-input-text"
          >
            <Share2 size={23} />
          </div>
          <span className="text-white text-xs font-semibold leading-none drop-shadow md:text-input-text md:drop-shadow-none md:dark:text-neutral-300">
            {post.sharesCount}
          </span>
        </button>
      </div>

      {/* ===== Comments Modal ===== */}
      {isCommentsOpen && (
        <CommentModal
          comments={comments}
          currentUsername={currentUser.fullName}
          isLoading={isLoadingComments}
          error={commentsError}
          onRetry={() => void loadComments(post.id)}
          onClose={() => setIsCommentsOpen(false)}
          onPostComment={(text) => addComment(post.id, text)}
          onDeleteComment={(commentId) => deleteComment(post.id, commentId)}
          onEditComment={(commentId, newText) =>
            editComment(post.id, commentId, newText)
          }
          onAddReply={(id, text) => addReply(post.id, id, text)}
          onDeleteReply={(commentId, replyId) =>
            deleteReply(post.id, commentId, replyId)
          }
        />
      )}
    </div>
  );
}

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
    <button onClick={onClick} className="flex flex-col items-center gap-0.5">
      <div
        className={`w-12 h-11 rounded-full flex items-center justify-center transition-colors
          shadow-lg drop-shadow-lg md:bg-surface md:shadow-md
           ${active ? activeColor : "text-white md:text-input-text"}`}
      >
        {icon}
      </div>
      <span className="text-white text-xs font-medium leading-none drop-shadow md:text-input-text md:drop-shadow-none md:dark:text-neutral-300">
        {label}
      </span>
    </button>
  );
}
