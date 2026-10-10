import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Heart,
  MessageCircle,
  Share2,
  ChevronLeft,
  ChevronRight,
  Play,
  Volume2,
  VolumeX,
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

const DOUBLE_TAP_DELAY = 300;
const HOLD_ACTIVATION_MS = 400;
const HEART_SIZE = 96;

// "0:07", "1:23" style formatting
function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${mins}:${secs}`;
}

export default function PostCard({
  post,
  currentUser,
  onView,
  onMessageUser,
}: PostCardProps) {
  const navigate = useNavigate();
  const {
    toggleLike: toggleLikePost,
    toggleFollow,
    incrementShare,
    commentsMap,
    isLoadingComments,
    isLoadingMoreComments,
    hasMoreComments,
    commentsError,
    addComment,
    deleteComment,
    editComment,
    addReply,
    deleteReply,
    loadComments,
    loadMoreComments,
  } = useFeed();

  const liked = post.liked;
  const likeCount = post.likesCount;
  const comments = commentsMap[post.id] || [];

  const { share, toastMessage, toastVisible } = useShare({
    title: post.caption,
    text: `Check out this post by ${post.username} on Nexify!`,
    url: typeof window !== "undefined" ? window.location.href : "",
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isVertical, setIsVertical] = useState(true);
  const [imgIsVertical, setImgVertical] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [captionExpanded, setCaptionExpanded] = useState<boolean>(false);

  const [mediaError, setMediaError] = useState(false);
  const [retryNonce, setRetryNonce] = useState(0);
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(0);

  const progressPercent =
    videoDuration && videoDuration > 0
      ? Math.min(100, (currentTime / videoDuration) * 100)
      : 0;

  // Swiping to a different carousel slide resets any previous slide's error
  // (render-time comparison — no useEffect needed).
  const [lastIndexForError, setLastIndexForError] = useState(currentIndex);
  if (currentIndex !== lastIndexForError) {
    setLastIndexForError(currentIndex);
    setMediaError(false);
  }

  function handleRetryMedia() {
    setMediaError(false);
    setRetryNonce((n) => n + 1);
  }

  // TikTok-style heart burst — each double-tap spawns one floating heart at
  // the tap position, removed after its animation finishes.
  const [hearts, setHearts] = useState<{ id: number; x: number; y: number }[]>(
    [],
  );
  const heartIdRef = useRef(0);

  function spawnHeart(x: number, y: number) {
    const id = heartIdRef.current++;
    setHearts((prev) => [...prev, { id, x, y }]);
    setTimeout(() => setHearts((prev) => prev.filter((h) => h.id !== id)), 900);
  }

  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isFastForwarding, setIsFastForwarding] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastTapRef = useRef<number>(0);
  const tapTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const holdTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isHoldingRef = useRef(false);

  // Comments modal ሲከፈት ብቻ ነው ከ backend የምንጭነው
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
      // ድምጽ ደረጃ በተጠቃሚው device (hardware) volume buttons ብቻ ነው የሚቆጣጠረው
      if (!isMuted) videoRef.current.volume = 1;
    }
  }, [isMuted]);

  function clearHoldTimer() {
    if (holdTimeoutRef.current) {
      clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }
  }

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

  // Single tap = play/pause (video only), double tap = like + heart burst.
  function handleMediaTap(clientX: number, clientY: number, rect: DOMRect) {
    const now = Date.now();
    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
        tapTimeoutRef.current = null;
      }
      // ልቡ በእያንዳንዱ double-tap ይታያል (አስቀድሞ like ቢሆንም — TikTok እንደሚያደርገው)፣
      // ግን ይህ gesture ሁልጊዜ like ብቻ ያደርጋል፣ unlike አያደርግም።
      spawnHeart(clientX - rect.left, clientY - rect.top);
      if (!liked) toggleLikePost(post.id);
      lastTapRef.current = 0;
    } else {
      lastTapRef.current = now;
      tapTimeoutRef.current = setTimeout(() => {
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

  function handleVideoPointerDown() {
    isHoldingRef.current = false;
    holdTimeoutRef.current = setTimeout(() => {
      isHoldingRef.current = true;
      setIsFastForwarding(true);
      if (videoRef.current) videoRef.current.playbackRate = 2;
    }, HOLD_ACTIVATION_MS);
  }

  function handleVideoPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    const wasHold = endHold();
    if (wasHold) return;
    handleMediaTap(
      e.clientX,
      e.clientY,
      e.currentTarget.getBoundingClientRect(),
    );
  }

  function handleVideoPointerLeave() {
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

  function goToProfile() {
    navigate(`/profile/${post.username}`);
  }

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full bg-black md:bg-surface  flex items-center justify-center md:justify-center"
    >
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
            onError={(e) => {
              const mediaErr = e.currentTarget.error;
              console.error("Video load failed:", {
                code: mediaErr?.code, // 1=ABORTED 2=NETWORK 3=DECODE 4=SRC_NOT_SUPPORTED
                message: mediaErr?.message,
                src: post.mediaUrls[0],
              });
              setMediaError(true);
            }}
            onLoadedMetadata={(e) => {
              const v = e.currentTarget;
              setIsVertical(v.videoHeight / v.videoWidth >= 1.3);
              setVideoDuration(v.duration);
              v.muted = true;
              v.volume = 1;
              v.play().catch(() => {});
            }}
            onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          />

          {isFastForwarding && (
            <div className="absolute top-3 left-3 z-20 bg-black/60 text-white text-xs font-bold px-2.5 py-1 rounded-full pointer-events-none">
              2×
            </div>
          )}

          {/* Mute/unmute toggle — volume LEVEL ራሱ device-hardware ብቻ */}
          <div
            className="absolute top-14 right-3 md:top-3 z-30"
            onPointerDown={(e) => e.stopPropagation()}
            onPointerUp={(e) => e.stopPropagation()}
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

          {/* Progress line + ጊዜ በቀኝ ጫፍ — በሞባይል bottom nav በላይ (4.75rem)፣
              በ desktop ደግሞ card ግርጌ። Nav ከፍታ ከተለየ ይሄን ቁጥር አስተካክል። */}
          {videoDuration !== null && (
            <div className="absolute left-3 right-3 bottom-[4.75rem] md:bottom-3 z-20 flex items-center gap-2.5 pointer-events-none">
              <div className="relative h-1 flex-1 rounded-full bg-white/25">
                <div
                  className="h-full rounded-full bg-white"
                  style={{ width: `${progressPercent}%` }}
                />
                <div
                  className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow"
                  style={{ left: `${progressPercent}%` }}
                />
              </div>
              <span className="text-[11px] font-semibold text-white tabular-nums drop-shadow">
                {formatDuration(currentTime)} / {formatDuration(videoDuration)}
              </span>
            </div>
          )}

          {hearts.map((h) => (
            <FloatingHeart key={h.id} x={h.x} y={h.y} />
          ))}
        </div>
      ) : (
        <div
          className="absolute inset-0 bg-black overflow-hidden md:relative md:h-[92vh] md:w-auto 
        md:aspect-[9/16] md:max-w-[420px] md:rounded-2xl"
          onClick={(e) =>
            handleMediaTap(
              e.clientX,
              e.clientY,
              e.currentTarget.getBoundingClientRect(),
            )
          }
        >
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

          {hearts.map((h) => (
            <FloatingHeart key={h.id} x={h.x} y={h.y} />
          ))}
        </div>
      )}

      {/* Media load failure overlay — z-10: ከ media በላይ፣ ከሁሉም chrome (z-20/30) በታች */}
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
      <div className="absolute bottom-24 left-3 right-16 z-20 md:bottom-8">
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
            <button
              type="button"
              onClick={goToProfile}
              className="text-input font-bold text-sm drop-shadow md:text-ink hover:underline"
            >
              @{post.username}
            </button>
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
                className="mt-0.5 text-xs font-semibold text-white/70 hover:text-white transition-colors md:text-input-placeholder"
              >
                {captionExpanded ? "less" : "more"}
              </button>
            )}
          </div>
        )}
      </div>

      {/* ===== Action Buttons (right side) ===== */}
      <div
        className="absolute bottom-24 right-3 z-20 flex flex-col items-center gap-4
md:static md:ml-5 md:bottom-auto md:right-auto md:pb-10"
      >
        <ActionBtn
          icon={<Heart size={26} fill={liked ? "currentColor" : "none"} />}
          label={likeCount}
          active={liked}
          activeColor="text-rose-500"
          popOnActivate
          onClick={() => toggleLikePost(post.id)}
        />
        <ActionBtn
          icon={<MessageCircle size={25} />}
          label={post.commentsCount}
          active={isCommentsOpen}
          activeColor="text-blue-400"
          onClick={() => setIsCommentsOpen(true)}
        />
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
          totalCount={post.commentsCount}
          currentUsername={currentUser.fullName}
          isLoading={isLoadingComments}
          error={commentsError}
          onRetry={() => void loadComments(post.id)}
          hasMore={hasMoreComments[post.id] ?? false}
          isLoadingMore={isLoadingMoreComments}
          onLoadMore={() => void loadMoreComments(post.id)}
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

// Double-tap ላይ በመንካት ቦታ ብቅ ብሎ የሚጠፋ ትልቅ ልብ። Web Animations API በ mount
// ላይ 1 ጊዜ ብቻ ነው የሚሰራው፣ ስለዚህ CSS keyframes ፋይል መንካት አያስፈልግም።
function FloatingHeart({ x, y }: { x: number; y: number }) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    ref.current?.animate(
      [
        { transform: "scale(0.3) rotate(-12deg)", opacity: 0 },
        { transform: "scale(1.25) rotate(-8deg)", opacity: 1, offset: 0.3 },
        { transform: "scale(1) rotate(-8deg)", opacity: 1, offset: 0.65 },
        { transform: "scale(1.1) translateY(-40px) rotate(-8deg)", opacity: 0 },
      ],
      { duration: 850, easing: "ease-out", fill: "forwards" },
    );
  }, []);

  return (
    <Heart
      ref={ref}
      size={HEART_SIZE}
      fill="currentColor"
      className="absolute z-20 pointer-events-none text-rose-500 drop-shadow-lg"
      style={{ left: x - HEART_SIZE / 2, top: y - HEART_SIZE / 2 }}
    />
  );
}

function ActionBtn({
  icon,
  label,
  active,
  activeColor,
  onClick,
  popOnActivate = false,
}: {
  icon: React.ReactNode;
  label: number;
  active: boolean;
  activeColor: string;
  onClick: () => void;
  popOnActivate?: boolean;
}) {
  const iconRef = useRef<HTMLDivElement>(null);
  const wasActive = useRef(active);

  // ከ false → true ሲቀየር ብቻ (Like ሲነቃ) አንድ ጊዜ pop ያደርጋል፤ ገጹ ሲጫን
  // አስቀድሞ liked የሆኑ ፖስቶች ላይ አይነሳም።
  useEffect(() => {
    if (popOnActivate && active && !wasActive.current) {
      iconRef.current?.animate(
        [
          { transform: "scale(1)" },
          { transform: "scale(1.4)" },
          { transform: "scale(1)" },
        ],
        { duration: 300, easing: "ease-out" },
      );
    }
    wasActive.current = active;
  }, [active, popOnActivate]);

  return (
    <button onClick={onClick} className="flex flex-col items-center gap-0.5">
      <div
        ref={iconRef}
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
