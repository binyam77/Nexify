/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../routes";
import { ArrowLeft, X, Camera, Trash2, Edit, Send } from "lucide-react";
import { saveMediaFile, deleteMediaFile } from "../lib/db";
import ShareModal from "../components/ShareModal";
import { useFeed } from "../context/FeedContext";
import type { FeedPost, OtherCreator } from "../types";

// ንዑስ ክፍሎች ማስመጫ (Importing child components)
import UserProfile from "../components/UserProfile";
import ProfileVideo from "../components/ProfileVideo";
import ViewVideo from "../components/ViewVideo";

// የProfile component የProp መግለጫ (Props Interface for Profile.tsx)
interface ProfileProps {
  onBackToCommunity?: () => void;
  triggerGlobalUpload?: boolean;
  onClearGlobalUpload?: () => void;
  onStartChat?: (user: {
    name: string;
    username: string;
    photo: string;
    bio?:string;
  }) => void;
}

export default function Profile({
  onBackToCommunity,
  triggerGlobalUpload,
  onClearGlobalUpload,
  onStartChat,
}: ProfileProps) {
  // --- መለያ ፍቃድ መቆጣጠሪያ (Auth System Hooks) ---
  const { user, login, updateUser, updateFollowCount } = useAuth();
  const navigate = useNavigate();
  const {
    posts: feedPosts,
    commentsMap,
    addPost,
    removePost,
    incrementView,
    toggleLike,
    toggleSave,
    incrementShare,
    addComment,
    editComment,
    deleteComment,
    toggleCommentLike,
    addReply,
    deleteReply,
  } = useFeed();
  // Single source of truth: Profile የራሱ post copy አይይዝም፤ FeedContext ን filter ብቻ ያደርጋል

  const myPosts = feedPosts.filter(
    (p) => p.userId === (user?.username || "me"),
  );

  // --- የተጠቃሚ መገለጫ ሁኔታ መቆጣጠሪያ (Profile Information States) ---
  const profile: {
    name: string;
    username: string;
    bio: string;
    photo: string;
    cover: string;
  } = {
    name: user?.name || user?.username || "User",
    username: user?.username || "username",
    bio: user?.bio || "",
    photo: user?.photo || "/default_avatar.jpg",
    cover: user?.cover || "",
  };

  // --- የእይታ ሁኔታ መቆጣጠሪያ ('me' = እኔ/My profile, 'other' = ሌላ ባለሙያ/Other developer) ---
  const [viewMode, setViewMode] = useState<"me" | "other">("me");
  const [selectedOtherUser, setSelectedOtherUser] = useState<number>(0);
  const [isOthersModalOpen, setIsOthersModalOpen] = useState(false);

  // --- የሌሎች ተጠቃሚዎች መረጃ ዳታቤዝ (Other Creators Database for browsing) ---

  const [otherUsers, setOtherUsers] = useState<OtherCreator[]>([
    {
      id: 2,
      name: "Betty Dev",
      username: "betty_dev",
      photo: "",
      gradient: "from-pink-500 to-rose-600",
      isFollowing: true,
      followersCount: 890,
      followingCount: 450,
      bio: "UI/UX Designer turned Frontend Developer. Crafting gorgeous responsive web experiences.",
      loginsCount: 34,
      posts: [
        {
          id: "mock-o-1003",
          userId: "betty_dev",
          username: "betty_dev",
          userAvatar: "",
          type: "photo",
          mediaUrls: [
            "https://images.unsplash.com/photo-1541462608143-67571c6738dd?auto=format&fit=crop&w=400&q=80",
          ],
          caption:
            "Check out these seamless custom theme setups using Tailwind CSS! #design #tailwind #coding",
          hashtags: ["#design", "#tailwind", "#coding"],
          likesCount: 310,
          commentsCount: 0,
          sharesCount: 0,
          savesCount: 45,
          viewsCount: 940,
          createdAt: new Date().toISOString(),
          liked: false,
          saved: false,
        },
      ],
    },
  ]);

  const otherProfile = otherUsers[selectedOtherUser] || null;

  // --- ተከታታይ እና የሚከታተሏቸው ቁጥር ሁኔታዎች (Followers & Following counts) ---
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [starsCount, setStarsCount] = useState(0); // starsCount represents Following count!

  // --- የልጥፎች እይታ እና የማጋሪያ ሁነታ መኮጣጠሪያዎች (Player and Share Modal states) ---
  //selectedPostId ብቻ ይይዛል፤ ራሱ post object ሁልጊዘ ከ FeedContext ትኩስ ይመጣል (single source of truth)
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [selectedMediaSrc, setSelectedMediaSrc] = useState<string | null>(null);
  const [shareModalPost, setShareModalPost] = useState<FeedPost | null>(null);

  const selectedPost: FeedPost | null = selectedPostId
    ? (viewMode === "me" ? myPosts : otherProfile?.posts || []).find(
        (p) => p.id === selectedPostId,
      ) || null
    : null;

  // --- የተጠቃሚ ገፅ ሞዳሎች መቆጣጠሪያዎች (UI Dialog / Modals display togglers) ---
  const [activeTab, setActiveTab] = useState<"posts" | "video" | "likes">(
    "posts",
  );
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isBioExpanded, setIsBioExpanded] = useState(false);

  // --- የማረጋገጫ ሞዳል ሁኔታ መቆጣጠሪያ (Custom Styled Delete Confirmation Modal state) ---
  const [deleteConfirmState, setDeleteConfirmState] = useState<{
    isOpen: boolean;
    type: "post" | "comment";
    postId: string;
    commentId?: number;
  } | null>(null);

  // --- ፎርም ሁኔታ መቆጣጠሪያዎች (Upload & Edit profile form inputs) ---
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreviewUrl, setUploadPreviewUrl] = useState<string>("");
  const [uploadIsVideo, setUploadIsVideo] = useState(false);
  const [uploadDescription, setUploadDescription] = useState("");
  const [uploadThumbnail, setUploadThumbnail] = useState<string>("");

  const [editName, setEditName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editPhotoPreview, setEditPhotoPreview] = useState("");
  const [editCoverPreview, setEditCoverPreview] = useState("");

  // --- የማጣቀሻ ፋይል መምረጫዎች (File Picker input refs) ---
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  // --- በቀጥታ የሚዲያ መጫኛ ማጣቀሻዎች (Direct profile & cover upload refs) ---
  const directPhotoInputRef = useRef<HTMLInputElement>(null);
  const directCoverInputRef = useRef<HTMLInputElement>(null);

  // --- የመልእክት መላኪያ ተግባር (Start communication with another creator) ---
  const handleMessageUser = (creator: {
    name: string;
    username: string;
    photo: string;
  }) => {
    if (onStartChat) {
      onStartChat(creator);
    } else {
      navigate(ROUTES.community, {
        state: { openChatWith: creator },
      });
    }
  };

  // --- ተከታታይ መሆን/አለመሆን መቆጣጠሪያ (Toggle follow status for current developer) ---
  const toggleFollowUser = (index: number) => {
    setOtherUsers((prev) =>
      prev.map((u, idx) => {
        if (idx === index) {
          const following = !u.isFollowing;
          return {
            ...u,
            isFollowing: following,
            followersCount: following
              ? u.followersCount + 1
              : u.followersCount - 1,
          };
        }
        return u;
      }),
    );
  };
  // --- የተጠቃሚ መገለጫ መረጃ መጫኛ (Load profile metadata from LocalStorage) ---
  useEffect(() => {
    const savedIsFollowing = localStorage.getItem("isFollowing") === "true";
    const savedCountF = localStorage.getItem("countF");
    setIsFollowing(savedIsFollowing);
    if (savedCountF !== null) {
      setFollowersCount(parseInt(savedCountF, 10));
    } else {
      setFollowersCount(0); // Default count
    }
    const savedCountS = localStorage.getItem("countS");
    if (savedCountS !== null) {
      setStarsCount(parseInt(savedCountS, 10));
    } else {
      setStarsCount(0); // Default Following count
    }
  }, []);
  // --- ውጫዊ ሚዲያ መጫኛ መቆጣጠሪያ (Manage background uploads from outside) ---
  useEffect(() => {
    if (triggerGlobalUpload && fileInputRef.current) {
      fileInputRef.current.click();
      if (onClearGlobalUpload) {
        onClearGlobalUpload();
      }
    }
  }, [triggerGlobalUpload, onClearGlobalUpload]);

  // --- የቪዲዮ ማጫወቻ ገፅ ክፈት (Open media viewport modal) ---
  const handleOpenPlayer = (post: FeedPost) => {
    setSelectedPostId(post.id);
    setSelectedMediaSrc(post.mediaUrls[0] || "");

    // view increments handler - duplicate-view guard አሁንም እንፈልጋለን
    const viewedKey = "viewedPostIds";
    const viewed = JSON.parse(localStorage.getItem(viewedKey) || "[]");
    if (!viewed.includes(post.id)) {
      viewed.push(post.id);
      localStorage.setItem(viewedKey, JSON.stringify(viewed));
      incrementView(post.id);
    }
  };

  const handleClosePlayer = () => {
    setSelectedPostId(null);
    setSelectedMediaSrc(null);
  };

  // --- በልጥፎች መካከል ተንሸራተህ እይ (Browse Next/Prev posts easily) ---
  const handleNavigatePost = (direction: "next" | "prev") => {
    const currentList = viewMode === "me" ? myPosts : otherProfile?.posts || [];
    const currentIndex = currentList.findIndex(
      (p) => p.id === selectedPost?.id,
    );
    if (currentIndex === -1) return;

    let nextIndex = currentIndex + (direction === "next" ? 1 : -1);
    if (nextIndex >= 0 && nextIndex < currentList.length) {
      const nextPost = currentList[nextIndex];
      setSelectedPostId(nextPost.id);
      setSelectedMediaSrc(nextPost.mediaUrls[0] || "");
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
  }, [selectedPost, viewMode, myPosts, otherUsers]);

  // --- ላይክ ተግባራት (Toggle like actions) ---
  const handleToggleLikePost = (postId: string) => {
    toggleLike(postId);
  };

  // --- ሴቭ ተግባራት (Toggle save actions) ---
  const handleToggleSavePost = (postId: string) => {
    toggleSave(postId);
  };

  // --- አስተያየት መጨመርያ (Delegate to FeedContext) ---
  const handleAddComment = (postId: string, text: string) => {
    addComment(postId, text, profile.username, profile.photo || null);
  };

  // --- የአስተያየት ላይክ መቆጣጠሪያ (Delegate to FeedContext) ---
  const handleToggleCommentLike = (postId: string, commentId: number) => {
    toggleCommentLike(postId, commentId);
  };

  // --- የአስተያየት ምላሽ (Delegate to FeedContext) ---
  const handleAddReply = (postId: string, commentId: number, text: string) => {
    addReply(postId, commentId, text, profile.username, profile.photo || null);
  };

  // --- የአስተያየት ማጥፊያ ማረጋገጫ (Comment deletion trigger) ---
  const handleDeleteComment = (postId: string, commentId: number) => {
    setDeleteConfirmState({
      isOpen: true,
      type: "comment",
      postId,
      commentId,
    });
  };

  // --- በቀጥታ መገለጫዎችን መቀየሪያ (Direct external banners upload) ---
  const compressImage = (
    base64Str: string,
    quality: number,
    maxWidth: number,
  ): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const scale = maxWidth / img.width;
        canvas.width = maxWidth;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = base64Str;
    });
  };
  const handleDirectPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        if (ev.target?.result) {
          const compressed = await compressImage(
            ev.target.result as string,
            0.6,
            400,
          );
          updateUser({ photo: compressed });
        }
      };
      reader.readAsDataURL(file);
    }
  };
  const handleDirectCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        if (ev.target?.result) {
          const compressed = await compressImage(
            ev.target.result as string,
            0.6,
            800,
          );
          updateUser({ cover: compressed });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // --- ልጥፍ እና አስተያየቶችን ማጥፊያ ማረጋገጫ (Execute deletion verified in custom modal) ---
  const executeDeleteAction = async () => {
    if (!deleteConfirmState) return;
    const { type, postId, commentId } = deleteConfirmState;
    if (type === "post") {
      try {
        // Legacy numeric IndexedDB keys ብቻ ናቸው blob ያላቸው (mock posts string id ላይ ይዘለላል)
        const numericId = Number(postId);
        if (!Number.isNaN(numericId)) {
          await deleteMediaFile(numericId);
        }
        removePost(postId);
        if (selectedPost?.id === postId) {
          handleClosePlayer();
        }
      } catch (err) {
        console.error("Failed to delete post:", err);
      }
    } else if (type === "comment" && commentId !== undefined) {
      deleteComment(postId, commentId);
    }
    setDeleteConfirmState(null);
  };

  // --- ፖስት ማጋሪያ መቆጣጠሪያ (Delegate to FeedContext) ---
  const handleIncrementShare = (postId: string) => {
    incrementShare(postId);
  };
  const handleSharePost = (postId: string) => {
    const found = feedPosts.find((p) => p.id === postId) || null;
    setShareModalPost(found);
  };

  // --- መገለጫ አርትዕ አድርግ (Save user profile edits) ---
  const handleOpenEditModal = () => {
    setEditName(profile.name);
    setEditUsername(profile.username);
    setEditBio(profile.bio);
    setEditPhotoPreview(profile.photo);
    setEditCoverPreview(profile.cover);
    setIsEditModalOpen(true);
  };

  const handleSaveProfile = () => {
    if (!editName.trim()) {
      alert("Name can't be empty!");
      return;
    }
    // Security: username ን lowercase/alphanumeric/underscore ብቻ እናደርገዋለን- Community chat matching
    //በዚህ unique handle ልይ ስለሚመሰረት፤ ንቱህ ያልሆነ ግብዐት ቢገባ ግጥሚያ/routing ላይ ችግር ይፈጥራል
    const sanitizedUsername =
      editUsername
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "") ||
      user?.username ||
      "username";

    updateUser({
      name: editName.trim(),
      username: sanitizedUsername,
      bio: editBio.trim(),
      photo: editPhotoPreview,
      cover: editCoverPreview,
    });
    setIsEditModalOpen(false);
  };

  const handlePhotoUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const r = new FileReader();
      r.onload = async (ev) => {
        if (ev.target?.result) {
          const compressed = await compressImage(
            ev.target.result as string,
            0.6,
            400,
          );
          setEditPhotoPreview(compressed);
        }
      };
      r.readAsDataURL(file);
    }
  };

  const handleCoverUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const r = new FileReader();
      r.onload = async (ev) => {
        if (ev.target?.result) {
          const compressed = await compressImage(
            ev.target.result as string,
            0.6,
            800,
          );
          setEditCoverPreview(compressed);
        }
      };
      r.readAsDataURL(file);
    }
  };

  // --- አዲስ ቪዲዮ/ፎቶ ልጥፍ መጫኛ (Post Composer upload settings) ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");

    if (!isVideo && !isImage) {
      alert("Please select an Image or Video file only!");
      return;
    }

    setUploadFile(file);
    setUploadIsVideo(isVideo);
    setUploadPreviewUrl(URL.createObjectURL(file));
    setUploadDescription("");
    setUploadThumbnail("");
    setIsUploadModalOpen(true);
  };

  const handlePostMedia = async () => {
    if (!uploadFile) return;
    const postId = Date.now();

    try {
      await saveMediaFile(postId, uploadFile);
      const hashtags = uploadDescription.match(/#\w+/g) || [];
      const feedPost: FeedPost = {
        id: String(postId),
        userId: user?.username || "me",
        username: profile.username,
        userAvatar: profile.photo || "",
        type: uploadIsVideo ? "video" : "photo",
        mediaUrls: [URL.createObjectURL(uploadFile)],
        caption: uploadDescription.trim(),
        hashtags,
        likesCount: 0,
        commentsCount: 0,
        sharesCount: 0,
        savesCount: 0,
        viewsCount: 0,
        createdAt: new Date().toISOString(),
        liked: false,
        saved: false,
      };
      addPost(feedPost);

      setIsUploadModalOpen(false);
      setUploadFile(null);
      setUploadDescription("");
      setUploadThumbnail("");
    } catch (e) {
      console.error("Failed to post media:", e);
      alert("Failed to publish post. Try using a smaller file.");
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

  const activePostsToRender: FeedPost[] =
    viewMode === "me" ? myPosts : otherProfile?.posts || [];
  const filteredPosts = activePostsToRender.filter((post) => {
    if (activeTab === "posts") return true;
    if (activeTab === "video") return post.type === "video";
    if (activeTab === "likes") return post.liked;
    return true;
  });

  return (
    <div
      className="flex-1 flex flex-col h-full overflow-y-auto bg-bodey-bg pb-20 md:pb-6"
      id="profile-container"
    >
      {/* 1. Header Navigation banner */}
      <header className="sticky top-0 left-0 right-0 h-16 bg-gradient-to-r hidden md:block bg-bodey-bg shadow-md z-40 flex items-center justify-between px-4 md:px-8 shrink-0"></header>

      {/* Hidden File inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="video/*,image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={directPhotoInputRef}
        onChange={handleDirectPhotoChange}
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={directCoverInputRef}
        onChange={handleDirectCoverChange}
        accept="image/*"
        className="hidden"
      />

      {/* 2. Top Profile Header & bio info */}
      <UserProfile
        profile={profile}
        otherProfile={viewMode === "other" ? otherProfile : null}
        viewMode={viewMode}
        followersCount={followersCount}
        starsCount={starsCount}
        postsCount={myPosts.length}
        otherPostsCount={otherProfile?.posts?.length || 0}
        isBioExpanded={isBioExpanded}
        setIsBioExpanded={setIsBioExpanded}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        handleOpenEditModal={handleOpenEditModal}
        setIsOthersModalOpen={setIsOthersModalOpen}
        handleMessageUser={handleMessageUser}
        toggleFollowUser={toggleFollowUser}
        selectedOtherUser={selectedOtherUser}
        directPhotoInputRef={directPhotoInputRef}
        directCoverInputRef={directCoverInputRef}
        formatCount={formatCount}
      />

      {/* 3. Bento-Grid of Videos and Photos (የልጥፎች መደርደሪያ) */}
      <div className="max-w-4xl w-full mx-auto px-4 md:px-8 mb-6">
        <ProfileVideo
          filteredPosts={filteredPosts}
          viewMode={viewMode}
          handleOpenPlayer={handleOpenPlayer}
          handleDeletePost={handleDeletePost}
          formatCount={formatCount}
        />
      </div>

      {/* ========================================================
          MODAL: EDIT PROFILE FORM
          ======================================================== */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-3xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto border border-border flex flex-col">
            <div className="px-6 py-4 border border-border flex items-center justify-between sticky top-0 bg-surface z-10">
              <h3 className="text-lg font-black tracking-tight text-text-h2">
                Edit Profile
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 hover:bg-danger-hover text-one-text rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <span className="block text-xs font-extrabold tracking-wider text-text uppercase mb-2">
                  Cover Photo Banner
                </span>
                <div
                  onClick={() => coverInputRef.current?.click()}
                  className="w-full h-28 rounded-xl bg-surface-raised border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer overflow-hidden relative group"
                >
                  {editCoverPreview ? (
                    <>
                      <img
                        src={editCoverPreview}
                        alt="Cover preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="w-6 h-6 text-white" />
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center text-gray-400">
                      <Camera className="w-6 h-6 mb-1 text-gray-300" />
                      <span className="text-xs font-semibold">
                        Change Banner Cover
                      </span>
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  ref={coverInputRef}
                  onChange={handleCoverUploadChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              <div className="flex items-center gap-4">
                <div
                  onClick={() => photoInputRef.current?.click()}
                  className="w-16 h-16 rounded-full bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer overflow-hidden relative group shrink-0"
                >
                  {editPhotoPreview ? (
                    <>
                      <img
                        src={editPhotoPreview}
                        alt="Avatar preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="w-4 h-4 text-white" />
                      </div>
                    </>
                  ) : (
                    <Camera className="w-5 h-5 text-gray-300" />
                  )}
                </div>
                <div className="flex-1">
                  <span className="block text-xs font-extrabold tracking-wider text-text uppercase mb-1">
                    Avatar
                  </span>
                  <button
                    onClick={() => photoInputRef.current?.click()}
                    className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-xs font-bold rounded-lg text-gray-700"
                  >
                    Select New Picture
                  </button>
                  <input
                    type="file"
                    ref={photoInputRef}
                    onChange={handlePhotoUploadChange}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-extrabold tracking-wider text-text uppercase mb-1.5">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value.slice(0, 20))}
                    className="w-full px-4 py-2.5 bg-input border border-input-border focus:border-input-focus focus:bg-surface-raised rounded-xl text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold tracking-wider text-text uppercase mb-1.5">
                    Username
                  </label>
                  <input
                    type="text"
                    value={editUsername}
                    onChange={(e) =>
                      setEditUsername(e.target.value.slice(0, 30))
                    }
                    className="w-full px-4 py-2.5 bg-input border border-input-border focus:border-input-focus focus:bg-surface-raised rounded-xl text-sm font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold tracking-wider text-text uppercase mb-1.5">
                    Professional Bio
                  </label>
                  <textarea
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value.slice(0, 150))}
                    rows={3}
                    className="w-full px-4 py-2.5 bg-surface-raised border border-input-border focus:border-blue-500 focus:bg-surface-raised rounded-xl text-sm font-semibold resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end sticky bottom-0  bg-surface">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 bg-gray-100 text-xs font-bold text-gray-700 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                className="px-5 py-2 bg-blue-600 text-xs font-bold text-white rounded-xl shadow-md"
              >
                Save Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: UPLOAD WITH HASHTAGS & PREVIEW
          ======================================================== */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto border border-gray-100 flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="text-lg font-black tracking-tight text-text">
                {uploadIsVideo
                  ? "🎬 Compose New Video Post"
                  : "🖼 Compose New Photo Post"}
              </h3>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1.5 hover:bg-gray-100 text-gray-400 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="w-full aspect-video bg-black rounded-2xl overflow-hidden flex items-center justify-center">
                {uploadIsVideo ? (
                  <video
                    src={uploadPreviewUrl}
                    controls
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <img
                    src={uploadPreviewUrl}
                    alt="Upload preview"
                    className="w-full h-full object-contain"
                  />
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-extrabold tracking-wider text-gray-400 uppercase">
                  Write Caption Description
                </label>
                <textarea
                  value={uploadDescription}
                  onChange={(e) =>
                    setUploadDescription(e.target.value.slice(0, 500))
                  }
                  placeholder="Enter a cool caption. Include #hashtags like #programming, #vlog..."
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-50 border focus:border-blue-500 rounded-2xl text-sm font-semibold"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end bg-white">
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="px-4 py-2 bg-gray-100 text-xs font-bold text-gray-700 rounded-xl"
              >
                Cancel
              </button>
              <button
                onClick={handlePostMedia}
                className="px-5 py-2 bg-emerald-600 text-xs font-bold text-white rounded-xl shadow-md"
              >
                Post Now ➤
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
          profile={profile}
          otherUsers={otherUsers}
          viewMode={viewMode}
          followersCount={followersCount}
          selectedMediaSrc={selectedMediaSrc}
          handleClosePlayer={handleClosePlayer}
          handleNavigatePost={handleNavigatePost}
          handleToggleLikePost={handleToggleLikePost}
          handleToggleSavePost={handleToggleSavePost}
          handleSharePost={handleSharePost}
          handleDeletePost={handleDeletePost}
          handleToggleCommentLike={handleToggleCommentLike}
          handleAddComment={handleAddComment}
          handleDeleteComment={handleDeleteComment}
          handleAddReply={handleAddReply}
          handleNavigateToUserProfile={(username) => {
            if (username === profile.username) {
              setViewMode("me");
              handleClosePlayer();
            } else {
              const idx = otherUsers.findIndex((u) => u.username === username);
              if (idx !== -1) {
                setSelectedOtherUser(idx);
                setViewMode("other");
                handleClosePlayer();
              }
            }
          }}
          toggleFollowUser={toggleFollowUser}
          formatCount={formatCount}
        />
      )}

      {/* ========================================================
          MODAL: EXPLORE OTHER DEVELOPERS
          ======================================================== */}
      {isOthersModalOpen && (
        <div className="fixed inset-0 bg-black/65 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl max-h-[80vh] overflow-hidden border border-gray-100 flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-base font-black tracking-tight text-gray-900">
                Explore
              </h3>
              <button
                onClick={() => setIsOthersModalOpen(false)}
                className="p-1.5 hover:bg-gray-100 text-gray-400 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto divide-y divide-gray-100 space-y-3">
              {otherUsers.map((creator, idx) => (
                <div
                  key={creator.id}
                  className="flex items-center justify-between pt-3 pb-1 first:pt-0"
                >
                  <div
                    onClick={() => {
                      setSelectedOtherUser(idx);
                      setViewMode("other");
                      setIsOthersModalOpen(false);
                    }}
                    className="flex items-center gap-3 cursor-pointer group flex-1 mr-4 min-w-0"
                  >
                    <div
                      className={`w-11 h-11 rounded-full bg-gradient-to-tr ${creator.gradient} flex items-center justify-center text-white text-sm font-black`}
                    >
                      {creator.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-black text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                        {creator.name}
                      </span>
                      <span className="text-xs text-gray-400">
                        @{creator.username}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => toggleFollowUser(idx)}
                    className={`px-4 py-1.5 rounded-full text-[11px] font-black uppercase transition-all ${
                      creator.isFollowing
                        ? "bg-gray-100 text-gray-700 border"
                        : "bg-blue-600 text-white shadow-sm"
                    }`}
                  >
                    {creator.isFollowing ? "Following" : "Follow"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Social Media Share Modal */}
      <ShareModal
        post={shareModalPost}
        isOpen={shareModalPost !== null}
        onClose={() => setShareModalPost(null)}
        onShareIncrement={handleIncrementShare}
      />

      {/* Custom styled Delete Confirmation Modal */}
      {deleteConfirmState?.isOpen && (
        <div className="fixed inset-0 bg-black/65 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-gray-100 flex flex-col text-center animate-fade-in">
            <div className="w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-4 text-rose-500 animate-pulse">
              <Trash2 className="w-7 h-7" />
            </div>

            <h3 className="text-lg font-black text-slate-800 mb-2">
              {deleteConfirmState.type === "post"
                ? "Delete Post?"
                : "Delete Comment?"}
            </h3>

            <p className="text-xs text-slate-500 font-semibold mb-6">
              Are you sure you want to delete this permanently? This action
              cannot be undone.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmState(null)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-black text-slate-500 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={executeDeleteAction}
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
