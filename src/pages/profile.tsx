/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Camera, Trash2, ChevronLeft } from "lucide-react";
import ShareModal from "../components/ShareModal";
import { useFeed } from "../context/FeedContext";
import { useUI } from "../context/UIContext";
import type { FeedPost } from "../types";
import {
  fetchUserPosts,
  deletePost,
  likePost,
  unlikePost,
  sharePost,
} from "../api/posts.api";
import { fetchMyProfile } from "../api/profile.api";
import OfflineState from "../components/OfflineState";
import { useOnlineStatus } from "../hooks/useOnlineStatus";
// ንዑስ ክፍሎች ማስመጫ (Importing child components)
import UserProfile from "../components/UserProfile";
import ProfileVideo from "../components/ProfileVideo";
import ViewVideo from "../components/ViewVideo";
import FollowListModal from "../components/FollowListModal";


export default function Profile() {
  // --- መለያ ፍቃድ መቆጣጠሪያ (Auth System Hooks) ---
  const {
    user,
    updateUser,
    updateProfile,
    profileLoadError,
    retryLoadProfile,
  } = useAuth();
  const navigate = useNavigate();
  const {
    commentsMap,
    isLoadingComments,
    commentsError,
    loadComments,
    loadMoreComments,
    hasMoreComments,
    isLoadingMoreComments,
    incrementView,
    addComment,
    deleteComment,
    deleteReply,
    addReply,
    editComment,
  } = useFeed();

  const [myPosts, setMyPosts] = useState<FeedPost[]>([]);
  const [isLoadingMyPosts, setIsLoadingMyPosts] = useState(true);
  const [hasMoreMyPosts, setHasMoreMyPosts] = useState(false);
  const [myPostsError, setMyPostsError] = useState<string | null>(null);
  const myPostsCursorRef = useRef<string | null>(null);
  const [isLoadingMorePosts, setIsLoadingMorePosts] = useState(false);
  const [loadMorePostsError, setLoadMorePostsError] = useState(false);

  const loadInitialMyPosts = useCallback(async () => {
    if (!user?.id) return;
    setIsLoadingMyPosts(true);
    setMyPostsError(null);
    try {
      const page = await fetchUserPosts(user.id);
      setMyPosts(page.items);
      setHasMoreMyPosts(page.hasMore);
      myPostsCursorRef.current = page.nextCursor;
    } catch (e) {
      console.error("Failed to load my posts:", e);
      setMyPostsError("Failed to load posts.");
    } finally {
      setIsLoadingMyPosts(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void loadInitialMyPosts();
  }, [loadInitialMyPosts]);

  // ገጹ ሲከፈት ቁጥሮች ከ backend ይታደሳሉ። ዝም ብሎ ነው፣ ቢወድቅ ያለው ይቀራል
  useEffect(() => {
    let cancelled = false;
    fetchMyProfile()
      .then((d) => {
        if (cancelled) return;
        updateUser({
          followersCount: d.followersCount,
          followingCount: d.followingCount,
          postsCount: d.postsCount,
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ገጹ ሲከፈት አንድ ጊዜ ብቻ
  }, []);

  const retryAll = () => {
    void loadInitialMyPosts();
    if (profileLoadError) void retryLoadProfile();
  };
  // ኢንተርኔት ሲመለስ የወደቀ ነገር በራሱ እንደገና ይሞክራል
  const isOnline = useOnlineStatus(() => {
    if (myPostsError) void loadInitialMyPosts();
    if (profileLoadError) void retryLoadProfile();
  });

  const loadMoreMyPosts = async () => {
    if (
      !user?.id ||
      !hasMoreMyPosts ||
      !myPostsCursorRef.current ||
      isLoadingMorePosts
    )
      return;
    setIsLoadingMorePosts(true);
    setLoadMorePostsError(false);
    try {
      const page = await fetchUserPosts(user.id, myPostsCursorRef.current);
      setMyPosts((prev) => [...prev, ...page.items]);
      setHasMoreMyPosts(page.hasMore);
      myPostsCursorRef.current = page.nextCursor;
    } catch (e) {
      console.error("Failed to load more posts:", e);
      setLoadMorePostsError(true);
    } finally {
      setIsLoadingMorePosts(false);
    }
  };

  // --- የተጠቃሚ መገለጫ ሁኔታ መቆጣጠሪያ (Profile Information States) ---
  const profile: {
    userId: string;
    name: string;
    username: string;
    bio: string;
    photo: string;
  } = {
    userId: user?.id ?? "",
    name: user?.name || user?.username || "User",
    username: user?.username || "username",
    bio: user?.bio || "",
    photo: user?.photo || "",
  };

  // --- ተከታታይ እና የሚከታተሏቸው ቁጥር ሁኔታዎች (Followers & Following counts) ---
  const followersCount = user?.followersCount ?? 0;
  const starsCount = user?.followingCount ?? 0;

  // --- የልጥፎች እይታ እና የማጋሪያ ሁነታ መኮጣጠሪያዎች (Player and Share Modal states) ---
  //selectedPostId ብቻ ይይዛል፤ ራሱ post object ሁልጊዘ ከ FeedContext ትኩስ ይመጣል (single source of truth)
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [selectedMediaSrc, setSelectedMediaSrc] = useState<string | null>(null);
  const [shareModalPost, setShareModalPost] = useState<FeedPost | null>(null);
  const [followListModal, setFollowListModal] = useState<
    "followers" | "following" | null
  >(null);
  const selectedPost: FeedPost | null = selectedPostId
    ? myPosts.find((p) => p.id === selectedPostId) || null
    : null;
  const { setFullscreenModalOpen } = useUI();
  useEffect(() => {
    setFullscreenModalOpen(!!selectedPost);
    return () => setFullscreenModalOpen(false);
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPost]);
  

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isBioExpanded, setIsBioExpanded] = useState(false);

  // --- የማረጋገጫ ሞዳል ሁኔታ መቆጣጠሪያ (Custom Styled Delete Confirmation Modal state) ---
  const [deleteConfirmState, setDeleteConfirmState] = useState<{
    isOpen: boolean;
    type: "post" | "comment" | "reply";
    postId: string;
    commentId?: string;
    replyId?: string;
  } | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeletingPost, setIsDeletingPost] = useState(false);

  

  const [editName, setEditName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editPhotoPreview, setEditPhotoPreview] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [photoNotice, setPhotoNotice] = useState<string | null>(null);

  // --- የማጣቀሻ ፋይል መምረጫዎች (File Picker input refs) ---
  const photoInputRef = useRef<HTMLInputElement>(null);

  // --- በቀጥታ የሚዲያ መጫኛ ማጣቀሻዎች (Direct profile & cover upload refs) ---
  const directPhotoInputRef = useRef<HTMLInputElement>(null);



  // --- የቪዲዮ ማጫወቻ ገፅ ክፈት (Open media viewport modal) ---
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

  const handleClosePlayer = () => {
    setSelectedPostId(null);
    setSelectedMediaSrc(null);
  };

  // --- በልጥፎች መካከል ተንሸራተህ እይ (Browse Next/Prev posts easily) ---
  const handleNavigatePost = (direction: "next" | "prev") => {
    const currentList = myPosts;
    const currentIndex = currentList.findIndex(
      (p) => p.id === selectedPost?.id,
    );
    if (currentIndex === -1) return;

    const nextIndex = currentIndex + (direction === "next" ? 1 : -1);
    if (nextIndex >= 0 && nextIndex < currentList.length) {
      const nextPost = currentList[nextIndex];
      setSelectedPostId(nextPost.id);
      setSelectedMediaSrc(nextPost.mediaUrls[0] || "");
      void loadComments(nextPost.id);
      handleTrackView(nextPost.id);
    }
  };

  // Keyboard and wheel scrolling listeners
  useEffect(() => {
    if (!selectedPost) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "PageDown") {
        e.preventDefault();
        handleNavigatePost("next");
      } else if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        handleNavigatePost("prev");
      } else if (e.key === "Escape") {
        handleClosePlayer();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handleNavigatePost በየ render ስለሚፈጠር
  }, [selectedPost, myPosts]);

  // --- ላይክ ተግባራት (Toggle like actions) ---
  const handleToggleLikePost = (postId: string) => {
    const target = myPosts.find((p) => p.id === postId);
    if (!target) return;
    const wasLiked = target.liked;
    setMyPosts((prev) =>
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
      setMyPosts((prev) =>
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


  // --- አስተያየት መጨመርያ (Delegate to FeedContext) ---
  const handleAddComment = (postId: string, text: string) =>
    addComment(postId, text);

  // --- የአስተያየት ምላሽ (Delegate to FeedContext) ---
  const handleAddReply = (postId: string, commentId: string, text: string) =>
    addReply(postId, commentId, text);

  // --- የአስተያየት ማጥፊያ ማረጋገጫ (Comment deletion trigger) ---
  const handleDeleteComment = (postId: string, commentId: string) => {
    setDeleteConfirmState({
      isOpen: true,
      type: "comment",
      postId,
      commentId,
    });
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
  const handleEditComment = (
    postId: string,
    commentId: string,
    newText: string,
  ) => {
    editComment(postId, commentId, newText);
  };


  // Storage ገና ስለሌለ ፎቶ መቀየር አይቻልም። በ memory ብቻ "ተቀየረ" ማስመሰል (refresh ላይ
  // የሚጠፋ) ተወግዷል። Storage ሲመጣ እዚህ real upload ይገባል
  const handleDirectPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.target.value = "";
    setPhotoNotice("Photo upload isn't available yet. Coming soon.");
    setTimeout(() => setPhotoNotice(null), 4000);
  };



  // --- ልጥፍ እና አስተያየቶችን ማጥፊያ ማረጋገጫ (Execute deletion verified in custom modal) ---
  const executeDeleteAction = async () => {
    if (!deleteConfirmState) return;
    const { type, postId, commentId } = deleteConfirmState;
    if (type === "post") {
      setIsDeletingPost(true);
      setDeleteError(null);
      try {
        await deletePost(postId);
        setMyPosts((prev) => prev.filter((p) => p.id !== postId));
        updateUser({
          postsCount: Math.max(0, (user?.postsCount ?? myPosts.length) - 1),
        });
        if (selectedPost?.id === postId) {
          handleClosePlayer();
        }
        setDeleteConfirmState(null);
      } catch (err) {
        console.error("Failed to delete post:", err);
        setDeleteError("Failed to delete post. Please try again.");
        // Modal ክፍት ይቀራል — user "ተሳክቷል" ብሎ እንዳያምን
      } finally {
        setIsDeletingPost(false);
      }
    } else if (type === "comment" && commentId !== undefined) {
      deleteComment(postId, commentId);
      setDeleteConfirmState(null);
    } else if (
      type === "reply" &&
      commentId !== undefined &&
      deleteConfirmState.replyId
    ) {
      deleteReply(postId, commentId, deleteConfirmState.replyId);
      setDeleteConfirmState(null);
    }
  };

  // --- ፖስት ማጋሪያ መቆጣጠሪያ (Delegate to FeedContext) ---
  const handleIncrementShare = (postId: string) => {
    sharePost(postId)
      .then(({ sharesCount }) =>
        setMyPosts((prev) =>
          prev.map((p) => (p.id === postId ? { ...p, sharesCount } : p)),
        ),
      )
      .catch((e) => console.error("Share tracking failed:", e));
  };
  const handleSharePost = (postId: string) => {
    const found = myPosts.find((p) => p.id === postId) || null;
    setShareModalPost(found);
  };

  // --- መገለጫ አርትዕ አድርግ (Save user profile edits) ---
  const handleOpenEditModal = () => {
    setEditName(profile.name);
    setEditUsername(profile.username);
    setEditBio(profile.bio);
    setEditPhotoPreview(profile.photo);
    setIsEditModalOpen(true);
  };

  const handlePhotoUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.target.value = "";
    setPhotoNotice("Photo upload isn't available yet. Coming soon.");
    setTimeout(() => setPhotoNotice(null), 4000);
  };
  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      alert("Name can't be empty!");
      return;
    }
    const sanitizedUsername =
      editUsername
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "") ||
      user?.username ||
      "username";

    setIsSavingProfile(true);

    try {
      await updateProfile({
        displayName: editName.trim(),
        // username የተቀየረ ከሆነ ብቻ ይላካል
        ...(sanitizedUsername !== user?.username && {
          username: sanitizedUsername,
        }),
        bio: editBio.trim(),
      });

      setIsEditModalOpen(false);
    } catch (e) {
      console.error("Failed to save profile:", e);
      alert("Failed to save profile. Please try again.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleDeletePost = (postId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDeleteConfirmState({
      isOpen: true,
      type: "post",
      postId,
    });
  };

  const formatCount = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  return (
    <div
      className="flex-1 flex flex-col h-full overflow-y-auto bg-bg pb-20 md:pb-6"
      id="profile-container"
    >
      <input
        type="file"
        ref={directPhotoInputRef}
        onChange={handleDirectPhotoChange}
        accept="image/*"
        className="hidden"
      />

      {profileLoadError && (
        <div className="max-w-4xl w-full mx-auto px-4 md:px-8 pt-3">
          <div className="flex items-center justify-between bg-warning-light border border-warning-border rounded-xl px-4 py-2.5">
            <p className="text-xs font-semibold text-warning">
              {profileLoadError}
            </p>
            <button
              onClick={retryLoadProfile}
              className="text-xs font-bold text-warning underline shrink-0 ml-3"
            >
              Retry
            </button>
          </div>
        </div>
      )}
      {photoNotice && (
        <div className="max-w-4xl w-full mx-auto px-4 md:px-8 pt-3">
          <p className="text-xs font-semibold text-warning bg-warning-light border border-warning-border rounded-xl px-4 py-2.5">
            {photoNotice}
          </p>
        </div>
      )}

      {/* 2. Top Profile Header & bio info */}
      <UserProfile
        profile={profile}
        followersCount={followersCount}
        starsCount={starsCount}
        postsCount={user?.postsCount ?? myPosts.length}
        isBioExpanded={isBioExpanded}
        setIsBioExpanded={setIsBioExpanded}
        handleOpenEditModal={handleOpenEditModal}
        directPhotoInputRef={directPhotoInputRef}
        formatCount={formatCount}
        onOpenFollowers={() => setFollowListModal("followers")}
        onOpenFollowing={() => setFollowListModal("following")}
      />

      {/* 3. Bento-Grid of Videos and Photos (የልጥፎች መደርደሪያ) */}
      <div
        id="profile-posts-grid"
        className="max-w-4xl w-full mx-auto px-4 md:px-8 mb-6"
      >
        {!isOnline ? (
          <OfflineState onRetry={retryAll} />
        ) : isLoadingMyPosts ? (
          <div className="text-center text-xs text-text-muted py-10">
            Loading posts...
          </div>
        ) : myPostsError ? (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <p className="text-sm text-error font-semibold">{myPostsError}</p>
            <button
              onClick={loadInitialMyPosts}
              className="px-4 py-2 text-xs font-bold text-text-on-primary bg-primary hover:bg-primary-hover rounded-lg"
            >
              Retry
            </button>
          </div>
        ) : (
          <ProfileVideo
                        filteredPosts={myPosts}
            handleOpenPlayer={handleOpenPlayer}
            handleDeletePost={handleDeletePost}
          />
        )}
        {isOnline && hasMoreMyPosts && !isLoadingMyPosts && (
          <div className="flex justify-center mt-4">
            <button
              onClick={loadMoreMyPosts}
              disabled={isLoadingMorePosts}
              className="px-4 py-2 text-xs font-bold text-link hover:bg-primary-light rounded-lg disabled:opacity-50"
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

      {/* ========================================================
          MODAL: EDIT PROFILE FORM
          ======================================================== */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-surface flex flex-col">
          {/* Header */}
          <div className="flex items-center px-4 py-3 shrink-0 relative">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="p-1.5 text-text-primary rounded-full hover:bg-surface-hover z-10"
              aria-label="Back"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h3 className="absolute inset-x-0 text-center text-base font-black text-text-primary pointer-events-none">
              Edit Profile
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto px-5 pb-8">
            <div className="max-w-md w-full mx-auto">
              {/* Avatar */}
              <div className="flex flex-col items-center mt-2 mb-6">
                <div
                  onClick={() => photoInputRef.current?.click()}
                  className="relative w-36 h-36 cursor-pointer"
                >
                  <div className="w-full h-full rounded-full overflow-hidden bg-surface-secondary flex items-center justify-center">
                    {editPhotoPreview ? (
                      <img
                        src={editPhotoPreview}
                        alt="Avatar preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Camera className="w-10 h-10 text-icon-muted" />
                    )}
                  </div>
                  <div className="absolute bottom-1 right-1 w-10 h-10 rounded-full bg-white shadow-md border border-border-subtle flex items-center justify-center">
                    <Camera className="w-5 h-5 text-icon-primary" />
                  </div>
                </div>
                <button
                  onClick={() => photoInputRef.current?.click()}
                  className="mt-3 text-sm font-semibold text-link hover:underline"
                >
                  Change Photo
                </button>
                {photoNotice && (
                  <p className="mt-2 text-xs font-semibold text-warning text-center">
                    {photoNotice}
                  </p>
                )}
                <input
                  type="file"
                  ref={photoInputRef}
                  onChange={handlePhotoUploadChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              {/* Fields */}
              <div className="space-y-5">
                <div>
                  <label className="block text-sm text-text-secondary mb-1.5">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value.slice(0, 20))}
                    className="w-full px-4 py-3 bg-input-bg border border-input-border focus:border-input-focus outline-none rounded-xl text-base text-input-text"
                  />
                </div>

                <div>
                  <label className="block text-sm text-text-secondary mb-1.5">
                    Username
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base text-text-muted select-none">
                      @
                    </span>
                    <input
                      type="text"
                      value={editUsername}
                      onChange={(e) =>
                        setEditUsername(e.target.value.slice(0, 30))
                      }
                      className="w-full pl-9 pr-4 py-3 bg-input-bg border border-input-border focus:border-input-focus outline-none rounded-xl text-base text-input-text"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-text-secondary mb-1.5">
                    Bio
                  </label>
                  <textarea
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value.slice(0, 150))}
                    rows={3}
                    className="w-full px-4 py-3 bg-input-bg border border-input-border focus:border-input-focus outline-none rounded-xl text-base text-input-text resize-none"
                  />
                </div>
              </div>

              {/* Save */}
              <button
                onClick={handleSaveProfile}
                disabled={isSavingProfile}
                className="mt-8 w-full py-3.5 rounded-xl bg-primary hover:opacity-90 text-text-on-primary text-base font-bold transition-opacity disabled:opacity-50"
              >
                {isSavingProfile ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: REDESIGNED IMMERSIVE VIDEO/PHOTO PLAYER (ViewVideo.tsx)
          ======================================================== */}
      {selectedPost && (
        <ViewVideo
          selectedPost={selectedPost}
          commentsMap={commentsMap}
          isLoadingComments={isLoadingComments}
          commentsError={commentsError}
          loadComments={loadComments}
          loadMoreComments={loadMoreComments}
          hasMoreComments={hasMoreComments[selectedPost.id] ?? false}
          isLoadingMoreComments={isLoadingMoreComments}
          profile={profile}
          followersCount={followersCount}
          selectedMediaSrc={selectedMediaSrc}
          handleClosePlayer={handleClosePlayer}
          handleNavigatePost={handleNavigatePost}
          handleToggleLikePost={handleToggleLikePost}
          handleSharePost={handleSharePost}
          handleDeletePost={handleDeletePost}
          handleAddComment={handleAddComment}
          handleDeleteComment={handleDeleteComment}
          handleDeleteReply={handleDeleteReply}
          handleAddReply={handleAddReply}
          handleEditComment={handleEditComment}
          handleNavigateToUserProfile={(username) => {
            if (username !== profile.username) {
              navigate(`/profile/${username}`);
            }
          }}
          formatCount={formatCount}
        />
      )}

      {/* Social Media Share Modal */}
      <ShareModal
        post={shareModalPost}
        isOpen={shareModalPost !== null}
        onClose={() => setShareModalPost(null)}
        onShareIncrement={handleIncrementShare}
      />
      {followListModal && user?.id && (
        <FollowListModal
          isOpen={true}
          onClose={() => setFollowListModal(null)}
          userId={user.id}
          type={followListModal}
        />
      )}
      {/* Custom styled Delete Confirmation Modal */}
      {deleteConfirmState?.isOpen && (
        <div className="fixed inset-0 bg-overlay backdrop-blur-sm flex items-center justify-center z-[110] p-4">
          <div className="bg-surface rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-border-subtle flex flex-col text-center animate-fade-in">
            <div className="w-14 h-14 rounded-full bg-error-light flex items-center justify-center mx-auto mb-4 text-error animate-pulse">
              <Trash2 className="w-7 h-7" />
            </div>

            <h3 className="text-lg font-black text-text-primary mb-2">
              {deleteConfirmState.type === "post"
                ? "Delete Post?"
                : deleteConfirmState.type === "reply"
                  ? "Delete Reply?"
                  : "Delete Comment?"}
            </h3>
            <p className="text-xs text-text-secondary font-semibold mb-4">
              Are you sure you want to delete this permanently? This action
              cannot be undone.
            </p>

            {deleteError && (
              <p className="text-xs font-semibold text-error bg-error-light border border-error-border rounded-lg px-3 py-2 mb-4">
                {deleteError}
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setDeleteConfirmState(null);
                  setDeleteError(null);
                }}
                disabled={isDeletingPost}
                className="flex-1 py-3 bg-surface-secondary hover:bg-border rounded-xl text-xs font-black text-text-secondary transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={executeDeleteAction}
                disabled={isDeletingPost}
                className="flex-1 py-3 bg-error hover:opacity-90 rounded-xl text-xs font-black text-text-on-primary shadow-lg transition-all disabled:opacity-50"
              >
                {isDeletingPost ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
