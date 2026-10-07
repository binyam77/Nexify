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
import { fetchUserPosts } from "../api/posts.api";
import type { FeedPost } from "../types";
import ProfileVideo from "../components/ProfileVideo";
import ViewVideo from "../components/ViewVideo";
import ShareModal from "../components/ShareModal";
import { Trash2 } from "lucide-react";
import FollowListModal from "../components/FollowListModal";
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
    toggleLike,
    toggleSave,
    incrementShare,
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
  const viewedKeyRef = useRef("viewedPostIds");
  const [isDeletingComment, setIsDeletingComment] = useState(false);
  const [deleteCommentError, setDeleteCommentError] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (!username) return;
    let cancelled = false;
    async function load() {
      setIsLoadingProfile(true);
      try {
        const data = await fetchProfile(username!);
        if (!cancelled) setOtherProfile(data);
      } catch (e) {
        console.error("Failed to load profile:", e);
      } finally {
        if (!cancelled) setIsLoadingProfile(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [username]);

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
  // ራስህ ራስህ profile ውስጥ ከከፈትክ ወደ /profile (own page) ውሰድ — duplicate logic ማስወገጃ
  if (username && user?.username === username) {
    return <Navigate to="/profile" replace />;
  }

  const loadMorePosts = async () => {
    if (!otherProfile?.userId || !hasMorePosts || !postsCursorRef.current)
      return;
    const page = await fetchUserPosts(
      otherProfile.userId,
      postsCursorRef.current,
    );
    setPosts((prev) => [...prev, ...page.items]);
    setHasMorePosts(page.hasMore);
    postsCursorRef.current = page.nextCursor;
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
  const handleIncrementShare = (postId: string) => {
    incrementShare(postId);
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
      <div className="flex-1 flex items-center justify-center text-sm text-slate-400">
        Loading...
      </div>
    );
  }
  if (!otherProfile) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-slate-400">
        User not found.
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-bodey-bg pb-20 md:pb-6">
      <div className="w-full flex items-center justify-center relative px-4 py-3">
        <h1 className="text-sm font-black text-text-h2">
          @{otherProfile.username}
        </h1>
      </div>

      <div className="max-w-4xl w-full mx-auto px-4 md:px-8 mb-6">
        <div className="flex items-center justify-between mb-5">
          <div className="w-24 h-24 md:w-28 md:h-28 rounded-full border-4 border-white shadow-xl overflow-hidden shrink-0 bg-blue-100 flex items-center justify-center">
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
              <span className="text-base sm:text-lg font-black text-text">
                {formatCount(otherProfile.followersCount)}
              </span>
              <span className="text-[11px] text-small-text font-semibold">
                Followers
              </span>
            </button>
            <button
              onClick={() => setFollowListModal("following")}
              className="flex flex-col items-center"
            >
              <span className="text-base sm:text-lg font-black text-text">
                {formatCount(otherProfile.followingCount)}
              </span>
              <span className="text-[11px] text-small-text font-semibold">
                Following
              </span>
            </button>
            <div className="flex flex-col items-center">
              <span className="text-base sm:text-lg font-black text-text">
                {formatCount(otherProfile.postsCount)}
              </span>
              <span className="text-[11px] text-small-text font-semibold">
                Videos
              </span>
            </div>
          </div>
        </div>

        <div className="mb-3">
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-text-h2">
            {otherProfile.name}
          </h2>
          <p className="text-xs sm:text-sm font-bold text-brand-dark mt-0.5">
            @{otherProfile.username}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 mb-6">
          <button
            onClick={handleToggleFollow}
            disabled={isFollowPending}
            className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-all disabled:opacity-50 ${
              otherProfile.isFollowedByMe
                ? "bg-gray-100 hover:bg-gray-200 text-gray-800"
                : "bg-gradient-to-b from-[#019BE5] via-[#0185E5] to-[#0071E3] text-white hover:opacity-95"
            }`}
          >
            {otherProfile.isFollowedByMe ? "Following" : "Follow"}
          </button>

          {/* TODO(chat-module): Message ቁልፍ Chat module ሲገነባ ይሰራል */}
          <button
            onClick={handleStartChat}
            className="px-4 py-2.5 rounded-xl bg-[#2481cc] hover:bg-[#2075b8] text-white font-black text-xs uppercase tracking-wider transition-all shadow-md flex items-center gap-2"
          >
            Message
          </button>

          {followError && (
            <p className="text-xs font-semibold text-rose-600 basis-full mt-1">
              {followError}
            </p>
          )}
        </div>

        {otherProfile.bio && (
          <div className="bg-surface border border-border rounded-2xl p-4.5 shadow-sm mb-6">
            <p className="text-sm font-medium text-text leading-relaxed break-words whitespace-pre-line">
              {otherProfile.bio}
            </p>
          </div>
        )}
      </div>

      <div className="max-w-4xl w-full mx-auto px-4 md:px-8 mb-6">
        {isLoadingPosts ? (
          <div className="text-center text-xs text-slate-400 py-10">
            Loading posts...
          </div>
        ) : postsError ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <p className="text-sm text-rose-500 font-semibold">{postsError}</p>
            <button
              onClick={loadPosts}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
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
        {hasMorePosts && !isLoadingPosts && (
          <div className="flex justify-center mt-4">
            <button
              onClick={loadMorePosts}
              className="px-4 py-2 text-xs font-bold text-blue-600 hover:bg-blue-50 rounded-lg"
            >
              Load more
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
          handleToggleLikePost={toggleLike}
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
        <div className="fixed inset-0 bg-black/65 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-gray-100 flex flex-col text-center">
            <div className="w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-4 text-rose-500">
              <Trash2 className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-black text-slate-800 mb-2">
              {deleteConfirmState.type === "reply"
                ? "Delete Reply?"
                : "Delete Comment?"}
            </h3>
            <p className="text-xs text-slate-500 font-semibold mb-6">
              Are you sure you want to delete this permanently? This action
              cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmState(null)}
                disabled={isDeletingComment}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-black text-slate-500 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={executeDeleteComment}
                disabled={isDeletingComment}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 rounded-xl text-xs font-black text-white shadow-lg transition-all"
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
