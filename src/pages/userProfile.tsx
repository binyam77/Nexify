/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState, useEffect, useRef } from "react";
import { useParams, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useFeed } from "../context/FeedContext";
import { fetchProfile, followUser, unfollowUser } from "../api/profile.api";
import { fetchUserPosts } from "../api/posts.api";
import type { FeedPost } from "../types";
import ProfileVideo from "../components/ProfileVideo";
import ViewVideo from "../components/ViewVideo";

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
  const { user } = useAuth();
  const {
    commentsMap,
    loadComments,
    incrementView,
    toggleLike,
    toggleSave,
    incrementShare,
    addComment,
    deleteComment,
    addReply,
    editComment,
  } = useFeed();

  // ራስህ ራስህ profile ውስጥ ከከፈትክ ወደ /profile (own page) ውሰድ — duplicate logic ማስወገጃ
  if (username && user?.username === username) {
    return <Navigate to="/profile" replace />;
  }

  const [otherProfile, setOtherProfile] = useState<OtherProfileData | null>(
    null,
  );
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [isFollowPending, setIsFollowPending] = useState(false);

  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [selectedMediaSrc, setSelectedMediaSrc] = useState<string | null>(null);
  const viewedKeyRef = useRef("viewedPostIds");

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

  useEffect(() => {
    if (!otherProfile?.userId) return;
    let cancelled = false;
    async function loadPosts() {
      setIsLoadingPosts(true);
      try {
        const page = await fetchUserPosts(otherProfile!.userId);
        if (!cancelled) setPosts(page.items);
      } catch (e) {
        console.error("Failed to load user's posts:", e);
      } finally {
        if (!cancelled) setIsLoadingPosts(false);
      }
    }
    void loadPosts();
    return () => {
      cancelled = true;
    };
  }, [otherProfile?.userId]);

  const handleToggleFollow = async () => {
    if (!otherProfile || isFollowPending) return;
    setIsFollowPending(true);
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
    } finally {
      setIsFollowPending(false);
    }
  };

  const handleOpenPlayer = (post: FeedPost) => {
    setSelectedPostId(post.id);
    setSelectedMediaSrc(post.mediaUrls[0] || "");
    void loadComments(post.id);
    const viewed = JSON.parse(
      localStorage.getItem(viewedKeyRef.current) || "[]",
    );
    if (!viewed.includes(post.id)) {
      viewed.push(post.id);
      localStorage.setItem(viewedKeyRef.current, JSON.stringify(viewed));
      incrementView(post.id);
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
    }
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
      <div className="w-full h-40 md:h-52 bg-slate-900 relative overflow-hidden">
        {otherProfile.cover && (
          <img
            src={otherProfile.cover}
            alt=""
            className="w-full h-full object-cover"
          />
        )}
      </div>

      <div className="max-w-4xl w-full mx-auto px-4 md:px-8 relative -mt-4 sm:-mt-12 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3.5 sm:gap-4.5">
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
            <div className="pt-4 sm:pt-0 sm:pb-1">
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-text-h2">
                {otherProfile.name}
              </h2>
              <p className="text-xs sm:text-sm font-black text-brand-dark mt-1">
                @{otherProfile.username}
              </p>
            </div>
          </div>

          <div className="flex gap-6 md:gap-8 self-start sm:self-end bg-surface-raised border border-gray-100 shadow-md px-5 py-3 rounded-2xl">
            <div className="flex flex-col items-center">
              <span className="text-lg font-black text-text">
                {formatCount(otherProfile.followersCount)}
              </span>
              <span className="text-xs text-small-text font-bold uppercase">
                Followers
              </span>
            </div>
            <div className="flex flex-col items-center border-x border-gray-100 px-6 md:px-8">
              <span className="text-lg font-black text-text">
                {formatCount(otherProfile.postsCount)}
              </span>
              <span className="text-xs text-small-text font-bold uppercase">
                Posts
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-lg font-black text-text">
                {formatCount(otherProfile.followingCount)}
              </span>
              <span className="text-xs text-small-text font-bold uppercase">
                Following
              </span>
            </div>
          </div>
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
            disabled
            title="Coming soon"
            className="px-4 py-2.5 rounded-xl bg-surface border border-border text-text-secondary font-black text-xs uppercase tracking-wider opacity-50 cursor-not-allowed"
          >
            Message
          </button>
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
        ) : (
          <ProfileVideo
            filteredPosts={posts}
            viewMode="other"
            handleOpenPlayer={handleOpenPlayer}
            handleDeletePost={() => {}}
          />
        )}
      </div>

      {selectedPost && user && (
        <ViewVideo
          selectedPost={selectedPost}
          commentsMap={commentsMap}
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
          handleSharePost={() => {}}
          handleDeletePost={() => {}}
          handleAddComment={addComment}
          handleDeleteComment={deleteComment}
          handleAddReply={addReply}
          handleEditComment={editComment}
          handleNavigateToUserProfile={() => {}}
          formatCount={formatCount}
        />
      )}
    </div>
  );
}
