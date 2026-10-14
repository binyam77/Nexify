/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useFeed } from "../context/FeedContext";
import { fetchProfile } from "../api/profile.api";
import { followUser, unfollowUser } from "../api/follow.api";
import { ApiError } from "../lib/api-client";
import OfflineState from "../components/OfflineState";
import { useOnlineStatus } from "../hooks/useOnlineStatus";
import {
  fetchUserPosts,
  likePost,
  unlikePost,
  sharePost,
} from "../api/posts.api";
import type { FeedPost } from "../types";
import ProfileVideo from "../components/ProfileVideo";
import ViewVideo from "../components/ViewVideo";
import ShareModal from "../components/ShareModal";
import { Trash2, Grid } from "lucide-react";
import FollowListModal from "../components/FollowListModal";
import LinkifiedText from "../components/LinkifiedText";
import { useUI } from "../context/UIContext";
interface OtherProfileData {
  userId: string;
  username: string;
  name: string;
  bio: string;
  photo: string;
  cover: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isFollowedByMe: boolean | null;
}

export default function UserProfile() {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    commentsMap,
    isLoadingComments,
    commentsError,
    loadComments,
    loadMoreComments,
    hasMoreComments,
    isLoadingMoreComments,
    incrementView,
    toggleSave,
    addComment,
    deleteComment,
    deleteReply,
    addReply,
    editComment,
  } = useFeed();
  const [otherProfile, setOtherProfile] = useState<OtherProfileData | null>(
    null,
  );
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [hasMorePosts, setHasMorePosts] = useState(false);
  const postsCursorRef = useRef<string | null>(null);
  const [isLoadingMorePosts, setIsLoadingMorePosts] = useState(false);
  const [loadMorePostsError, setLoadMorePostsError] = useState(false);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [postsError, setPostsError] = useState<string | null>(null);
  const [isFollowPending, setIsFollowPending] = useState(false);
  const [followError, setFollowError] = useState<string | null>(null);
  const [shareModalPost, setShareModalPost] = useState<FeedPost | null>(null);
  const [followListModal, setFollowListModal] = useState<
    "followers" | "following" | null
  >(null);
  const [deleteConfirmState, setDeleteConfirmState] = useState<{
    isOpen: boolean;
    type: "comment" | "reply";
    postId: string;
    commentId: string;
    replyId?: string;
  } | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [selectedMediaSrc, setSelectedMediaSrc] = useState<string | null>(null);
  const { setFullscreenModalOpen } = useUI();
  useEffect(() => {
    setFullscreenModalOpen(!!selectedPostId);
    return () => setFullscreenModalOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPostId]);
  const viewedKeyRef = useRef("viewedPostIds");
  const [isDeletingComment, setIsDeletingComment] = useState(false);
  const [deleteCommentError, setDeleteCommentError] = useState<string | null>(
    null,
  );

  const [profileError, setProfileError] = useState<
    "not_found" | "network" | null
  >(null);
  const profileRequestRef = useRef(0);

  const loadProfile = useCallback(async () => {
    if (!username) return;
    const requestId = ++profileRequestRef.current;
    setIsLoadingProfile(true);
    setProfileError(null);
    try {
      const data = await fetchProfile(username);
      if (requestId !== profileRequestRef.current) return;
      setOtherProfile(data);
    } catch (e) {
      if (requestId !== profileRequestRef.current) return;
      console.error("Failed to load profile:", e);
      setOtherProfile(null);
      setProfileError(
        e instanceof ApiError && e.statusCode === 404 ? "not_found" : "network",
      );
    } finally {
      if (requestId === profileRequestRef.current) setIsLoadingProfile(false);
    }
  }, [username]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const loadPosts = useCallback(async () => {
    if (!otherProfile?.userId) return;
    setIsLoadingPosts(true);
    setPostsError(null);
    try {
      const page = await fetchUserPosts(otherProfile.userId);
      setPosts(page.items);
      setHasMorePosts(page.hasMore);
      postsCursorRef.current = page.nextCursor;
    } catch (e) {
      console.error("Failed to load user's posts:", e);
      setPostsError("ልጥፎች መጫን አልተቻለም።");
    } finally {
      setIsLoadingPosts(false);
    }
  }, [otherProfile?.userId]);

  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  const retryAll = () => {
    if (profileError) void loadProfile();
    void loadPosts();
  };
  const isOnline = useOnlineStatus(() => {
    if (profileError === "network") void loadProfile();
    if (postsError) void loadPosts();
  });

  // ራስህ ራስህ profile ውስጥ ከከፈትክ ወደ /profile (own page) ውሰድ — duplicate logic ማስወገጃ
  if (username && user?.username === username) {
    return <Navigate to="/profile" replace />;
  }

  const loadMorePosts = async () => {
    if (
      !otherProfile?.userId ||
      !hasMorePosts ||
      !postsCursorRef.current ||
      isLoadingMorePosts
    )
      return;
    setIsLoadingMorePosts(true);
    setLoadMorePostsError(false);
    try {
      const page = await fetchUserPosts(
        otherProfile.userId,
        postsCursorRef.current,
      );
      setPosts((prev) => [...prev, ...page.items]);
      setHasMorePosts(page.hasMore);
      postsCursorRef.current = page.nextCursor;
    } catch (e) {
      console.error("Failed to load more posts:", e);
      setLoadMorePostsError(true);
    } finally {
      setIsLoadingMorePosts(false);
    }
  };
  const handleToggleFollow = async () => {
    if (!otherProfile || isFollowPending) return;
    setIsFollowPending(true);
    setFollowError(null);
    const wasFollowing = otherProfile.isFollowedByMe;
    try {
      if (wasFollowing) {
        await unfollowUser(otherProfile.userId);
        setOtherProfile((prev) =>
          prev
            ? {
                ...prev,
                isFollowedByMe: false,
                followersCount: prev.followersCount - 1,
              }
            : prev,
        );
      } else {
        await followUser(otherProfile.userId);
        setOtherProfile((prev) =>
          prev
            ? {
                ...prev,
                isFollowedByMe: true,
                followersCount: prev.followersCount + 1,
              }
            : prev,
        );
      }
    } catch (e) {
      console.error("Follow toggle failed:", e);
      setFollowError("Failed try again.");
    } finally {
      setIsFollowPending(false);
    }
  };
  const handleStartChat = () => {
    if (!otherProfile) return;
    navigate("/community", {
      state: {
        openChatWith: {
          userId: otherProfile.userId,
          name: otherProfile.name,
          username: otherProfile.username,
          photo: otherProfile.photo,
          bio: otherProfile.bio,
        },
      },
    });
  };
  const handleTrackView = (postId: string) => {
    const viewedKey = "viewedPostIds";
    const viewed = JSON.parse(localStorage.getItem(viewedKey) || "[]");
    if (!viewed.includes(postId)) {
      viewed.push(postId);
      localStorage.setItem(viewedKey, JSON.stringify(viewed));
      incrementView(postId);
    }
  };

  const handleOpenPlayer = (post: FeedPost) => {
    setSelectedPostId(post.id);
    setSelectedMediaSrc(post.mediaUrls[0] || "");
    void loadComments(post.id);
    handleTrackView(post.id);
  };
  const handleDeleteComment = (postId: string, commentId: string) => {
    setDeleteConfirmState({ isOpen: true, type: "comment", postId, commentId });
  };
  const handleDeleteReply = (
    postId: string,
    commentId: string,
    replyId: string,
  ) => {
    setDeleteConfirmState({
      isOpen: true,
      type: "reply",
      postId,
      commentId,
      replyId,
    });
  };
  const executeDeleteComment = async () => {
    if (!deleteConfirmState) return;
    setIsDeletingComment(true);
    setDeleteCommentError(null);
    try {
      if (deleteConfirmState.type === "reply" && deleteConfirmState.replyId) {
        deleteReply(
          deleteConfirmState.postId,
          deleteConfirmState.commentId,
          deleteConfirmState.replyId,
        );
      } else {
        deleteComment(deleteConfirmState.postId, deleteConfirmState.commentId);
      }
      setDeleteConfirmState(null);
    } finally {
      setIsDeletingComment(false);
    }
  };
  const handleClosePlayer = () => {
    setSelectedPostId(null);
    setSelectedMediaSrc(null);
  };
  const handleNavigatePost = (direction: "next" | "prev") => {
    const idx = posts.findIndex((p) => p.id === selectedPostId);
    if (idx === -1) return;
    const nextIdx = idx + (direction === "next" ? 1 : -1);
    if (nextIdx >= 0 && nextIdx < posts.length) {
      const nextPost = posts[nextIdx];
      setSelectedPostId(nextPost.id);
      setSelectedMediaSrc(nextPost.mediaUrls[0] || "");
      void loadComments(nextPost.id);
      handleTrackView(nextPost.id);
    }
  };

  const handleSharePost = (postId: string) => {
    const found = posts.find((p) => p.id === postId) || null;
    setShareModalPost(found);
  };
  const handleToggleLike = (postId: string) => {
    const target = posts.find((p) => p.id === postId);
    if (!target) return;
    const wasLiked = target.liked;
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              liked: !wasLiked,
              likesCount: p.likesCount + (wasLiked ? -1 : 1),
            }
          : p,
      ),
    );
    const request = wasLiked ? unlikePost(postId) : likePost(postId);
    request.catch((e) => {
      console.error("Like toggle failed, reverting:", e);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                liked: wasLiked,
                likesCount: p.likesCount + (wasLiked ? 1 : -1),
              }
            : p,
        ),
      );
    });
  };

  const handleIncrementShare = (postId: string) => {
    sharePost(postId)
      .then(({ sharesCount }) =>
        setPosts((prev) =>
          prev.map((p) => (p.id === postId ? { ...p, sharesCount } : p)),
        ),
      )
      .catch((e) => console.error("Share tracking failed:", e));
  };
  const scrollToPosts = () => {
    document
      .getElementById("profile-posts-grid")
      ?.scrollIntoView({ behavior: "smooth" });
  };
  const formatCount = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const selectedPost = selectedPostId
    ? posts.find((p) => p.id === selectedPostId) || null
    : null;

  if (isLoadingProfile) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-text-muted">
        Loading...
      </div>
    );
  }
  if (profileError === "network") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-sm text-error font-semibold">
          Couldn't load this profile. Check your connection.
        </p>
        <button
          onClick={() => void loadProfile()}
          className="px-4 py-2 text-xs font-bold text-text-on-primary bg-primary hover:bg-primary-hover rounded-lg"
        >
          Retry
        </button>
      </div>
    );
  }
  if (!otherProfile) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-text-muted">
        User not found.
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-bg pb-20 md:pb-6">
      <div className="max-w-4xl w-full mx-auto px-4 md:px-8 pt-5">
        <div className="flex items-center justify-between mb-5">
          <div className="w-24 h-24 md:w-28 md:h-28 rounded-full border-4 border-bg shadow-xl overflow-hidden shrink-0 bg-primary-light flex items-center justify-center">
            {otherProfile.photo ? (
              <img
                src={otherProfile.photo}
                alt={otherProfile.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white text-3xl font-bold">
                {otherProfile.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <div className="flex gap-5 sm:gap-7">
            <button
              onClick={() => setFollowListModal("followers")}
              className="flex flex-col items-center"
            >
              <span className="text-base sm:text-lg font-black text-text-primary">
                {formatCount(otherProfile.followersCount)}
              </span>
              <span className="text-[11px] text-text-secondary font-semibold">
                Followers
              </span>
            </button>
            <button
              onClick={() => setFollowListModal("following")}
              className="flex flex-col items-center"
            >
              <span className="text-base sm:text-lg font-black text-text-primary">
                {formatCount(otherProfile.followingCount)}
              </span>
              <span className="text-[11px] text-text-secondary font-semibold">
                Following
              </span>
            </button>
            <button
              onClick={scrollToPosts}
              className="flex flex-col items-center"
            >
              <span className="text-base sm:text-lg font-black text-text-primary">
                {formatCount(otherProfile.postsCount)}
              </span>
              <span className="text-[11px] text-text-secondary font-semibold">
                Videos
              </span>
            </button>
          </div>
        </div>

        <div className="mb-3">
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-text-primary">
            {otherProfile.name}
          </h2>
          <p className="text-xs sm:text-sm font-bold text-primary mt-0.5">
            @{otherProfile.username}
          </p>
        </div>

        {otherProfile.bio && (
          <div className="mb-4">
            <p className="text-sm font-medium text-text-primary leading-relaxed break-words whitespace-pre-line">
              <LinkifiedText text={otherProfile.bio} />
            </p>
          </div>
        )}

        <div className="flex items-center gap-2.5 mb-3">
          <button
            onClick={handleToggleFollow}
            disabled={isFollowPending}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 ${
              otherProfile.isFollowedByMe
                ? "bg-surface-secondary hover:bg-surface-hover text-text-primary"
                : "bg-primary text-text-on-primary hover:opacity-90"
            }`}
          >
            {otherProfile.isFollowedByMe ? "Following" : "Follow"}
          </button>
          <button
            onClick={handleStartChat}
            className="flex-1 py-2.5 rounded-xl bg-surface-secondary hover:bg-surface-hover text-text-primary text-sm font-bold transition-all"
          >
            Message
          </button>
        </div>
        {followError && (
          <p className="text-xs font-semibold text-error mb-3">
            {followError}
          </p>
        )}

        <button
          onClick={scrollToPosts}
          className="w-full flex items-center justify-center gap-1.5 border-b border-border py-3 text-xs font-black uppercase tracking-wider text-primary"
        >
          <Grid className="w-3.5 h-3.5" />
          <span>Videos</span>
        </button>
      </div>

      <div
        id="profile-posts-grid"
        className="max-w-4xl w-full mx-auto px-4 md:px-8 mb-6"
      >
        {!isOnline ? (
          <OfflineState onRetry={retryAll} />
        ) : isLoadingPosts ? (
          <div className="text-center text-xs text-text-muted py-10">
            Loading posts...
          </div>
        ) : postsError ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <p className="text-sm text-error font-semibold">{postsError}</p>
            <button
              onClick={loadPosts}
              className="px-4 py-2 text-xs font-bold text-text-on-primary bg-primary hover:bg-primary-hover rounded-lg"
            >
              Retry
            </button>
          </div>
        ) : (
          <ProfileVideo
            filteredPosts={posts}
            viewMode="other"
            handleOpenPlayer={handleOpenPlayer}
            handleDeletePost={() => {}}
          />
        )}
        {isOnline && hasMorePosts && !isLoadingPosts && (
          <div className="flex justify-center mt-4">
            <button
              onClick={loadMorePosts}
              disabled={isLoadingMorePosts}
              className="px-4 py-2 text-xs font-bold text-link hover:bg-surface-hover rounded-lg disabled:opacity-50"
            >
              {isLoadingMorePosts
                ? "Loading..."
                : loadMorePostsError
                  ? "Couldn't load. Tap to retry"
                  : "Load more"}
            </button>
          </div>
        )}
      </div>

      {selectedPost && user && (
        <ViewVideo
          selectedPost={selectedPost}
          commentsMap={commentsMap}
          isLoadingComments={isLoadingComments}
          commentsError={commentsError}
          loadComments={loadComments}
          loadMoreComments={loadMoreComments}
          hasMoreComments={hasMoreComments[selectedPost.id] ?? false}
          isLoadingMoreComments={isLoadingMoreComments}
          profile={{
            name: user.name || user.username,
            username: user.username,
            photo: user.photo || "",
            bio: user.bio || "",
          }}
          followersCount={user.followersCount ?? 0}
          selectedMediaSrc={selectedMediaSrc}
          handleClosePlayer={handleClosePlayer}
          handleNavigatePost={handleNavigatePost}
          handleToggleLikePost={handleToggleLike}
          handleToggleSavePost={toggleSave}
          handleSharePost={handleSharePost}
          handleDeletePost={() => {}}
          handleAddComment={addComment}
          handleDeleteComment={handleDeleteComment}
          handleDeleteReply={handleDeleteReply}
          handleAddReply={addReply}
          handleEditComment={editComment}
          handleNavigateToUserProfile={() => {}}
          formatCount={formatCount}
        />
      )}
      <ShareModal
        post={shareModalPost}
        isOpen={shareModalPost !== null}
        onClose={() => setShareModalPost(null)}
        onShareIncrement={handleIncrementShare}
      />
      {followListModal && otherProfile && (
        <FollowListModal
          isOpen={true}
          onClose={() => setFollowListModal(null)}
          userId={otherProfile.userId}
          type={followListModal}
        />
      )}
      {deleteConfirmState?.isOpen && (
        <div className="fixed inset-0 bg-overlay backdrop-blur-sm flex items-center justify-center z-[110] p-4">
          <div className="bg-surface rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-border flex flex-col text-center">
            <div className="w-14 h-14 rounded-full bg-error-light flex items-center justify-center mx-auto mb-4 text-error">
              <Trash2 className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-black text-text-primary mb-2">
              {deleteConfirmState.type === "reply"
                ? "Delete Reply?"
                : "Delete Comment?"}
            </h3>
            <p className="text-xs text-text-secondary font-semibold mb-6">
              Are you sure you want to delete this permanently? This action
              cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmState(null)}
                disabled={isDeletingComment}
                className="flex-1 py-3 bg-surface-secondary hover:bg-surface-hover rounded-xl text-xs font-black text-text-secondary transition-all"
              >
                Cancel
              </button>
              <button
                onClick={executeDeleteComment}
                disabled={isDeletingComment}
                className="flex-1 py-3 bg-error hover:bg-error/90 rounded-xl text-xs font-black text-white shadow-lg transition-all"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
