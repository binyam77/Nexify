import { useState, useRef, useEffect } from "react";
import {
  Heart,
  MessageCircle,
  Share2,
  ChevronLeft,
  ChevronRight,
  Play,
  Volume2,
  Volume1,
  VolumeX,
  MoreHorizontal,
  MessagesSquare,
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

export default function PostCard({
  post,
  currentUser,
  onView,
  onMessageUser,
}: PostCardProps) {
  const {
    toggleLike: toggleLikePost,
    incrementShare,
    commentsMap,
    addComment,
    deleteComment,
    editComment,
    addReply,
    deleteReply,
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
      if (!liked) toggleLikePost(post.id);
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
  // FeedContext ማሳወቅ — backend ሲመጣ addPost ይቀራል፣ API ብቻ ይቀየራል

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
                  //eslint-disable-next-line react-hooks/immutability -- imperative video control ትክክለኛ ref pattern  ነው
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
                  // eslint-disable-next-line react-hooks/immutability -- imperative video control ትክክለኛ ref pattern ነው
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
            <span className="text-input font-bold text-sm drop-shadow md:text-ink">
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
        className="absolute bottom-20 right-3 z-10 flex flex-col items-center gap-4
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
          onClose={() => setIsCommentsOpen(false)}
          onPostComment={(text) =>
            addComment(
              post.id,
              text,
              currentUser.fullName,
              currentUser.avatarUrl ?? null,
            )
          }
          onDeleteComment={(commentId) => deleteComment(post.id, commentId)}
          onEditComment={(commentId, newText) =>
            editComment(post.id, commentId, newText)
          }
          onAddReply={(id, text) =>
            addReply(
              post.id,
              id,
              text,
              currentUser.fullName,
              currentUser.avatarUrl ?? null,
            )
          }
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
