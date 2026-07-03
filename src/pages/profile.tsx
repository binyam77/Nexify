/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { FeedPost } from "../types";
import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../routes";
import {
  Camera,
  Trash2,
  Heart,
  Eye,
  X,
  Plus,
  ArrowLeft,
  Star,
  Sparkles,
  Users,
  Video,
  Grid,
  HeartIcon,
  MessageCircle,
  Clock,
  User as UserIcon,
  ChevronDown,
  ChevronUp,
  UploadCloud,
  Edit,
  Bookmark,
  Send,
  Music,
  Share2,
  Play,
  Pause,
} from "lucide-react";
import { saveMediaFile, getMediaFile, deleteMediaFile } from "../lib/db";
import ShareModal from "../components/ShareModal";
import { useFeed } from "../context/FeedContext";

const compressImage = (
  base64Str: string,
  quality: number,
  maxWidth: number,
): Promise<string> => {
  return new Promise<string>((resolve) => {
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

interface ProfileProps {
  onBackToCommunity?: () => void;
  triggerGlobalUpload?: boolean;
  onClearGlobalUpload?: () => void;
  onStartChat?: (user: {
    name: string;
    username: string;
    photo: string;
  }) => void;
}

interface PostMeta {
  id: number;
  title: string;
  isVideo: boolean;
  fileName?: string;
  description: string;
  hashtags?: string[];
  username: string;
  avatar?: string | null;
  views: number;
  likes: number;
  liked: boolean;
  saves: number;
  saved: boolean;
  timestamp: string;
  thumbnail?: string;
}

interface CommentReply {
  id: number;
  username: string;
  avatar: string | null;
  text: string;
  timestamp: string;
}

interface CommentItem {
  id: number;
  username: string;
  avatar: string | null;
  text: string;
  timestamp: string;
  liked?: boolean;
  likesCount?: number;
  replies?: CommentReply[];
}

export default function Profile({
  onBackToCommunity,
  triggerGlobalUpload,
  onClearGlobalUpload,
  onStartChat,
}: ProfileProps) {
  // --- Profile State ---
  const { user, login, updateFollowCount } = useAuth();
  const [profile, setProfile] = useState({
    name: user?.username || "User",
    username: user?.username || "username",
    bio: "",
    photo: "/default_avatar.jpg",
    cover: "",
  });

  const navigate = useNavigate();
  const handleMessageUser = (otherUsers: {
    name: string;
    username: string;
    photo: string;
  }) => {
    if (onStartChat) {
      // Community ውስጥ embedded ሲሆን
      onStartChat(otherUsers);
    } else {
      // Direct /profile route  ሲሆን
      navigate(ROUTES.community, {
        state: { openChatWith: otherUsers },
      });
    }
  };

  // --- View Mode ('me' = My profile, 'other' = Other developer) ---
  const [viewMode, setViewMode] = useState<"me" | "other">("me");

  const [selectedOtherUser, setSelectedOtherUser] = useState<number>(0);
  const [isOthersModalOpen, setIsOthersModalOpen] = useState(false);
  const [otherUsers, setOtherUsers] = useState<any[]>([]);
  const otherProfile = otherUsers[selectedOtherUser] || null;
  const { posts: feedPosts } = useFeed();

  // --- Followers & Following ---
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [starsCount, setStarsCount] = useState(); // starsCount is now the "Following" stat!

  const toggleFollowUser = (index: number) => {
    setOtherUsers((prev) =>
      prev.map((u, idx) => {
        if (idx === index) {
          const isFollowing = !u.isFollowing;
          return {
            ...u,
            isFollowing,
            followersCount: isFollowing
              ? u.followersCount + 1
              : u.followersCount - 1,
          };
        }
        return u;
      }),
    );
  };

  // --- UI/Modal States ---
  const [activeTab, setActiveTab] = useState<"posts" | "video" | "likes">(
    "posts",
  );
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isBioExpanded, setIsBioExpanded] = useState(false);

  // --- Selected Post Player Modal ---
  const [selectedPost, setSelectedPost] = useState<PostMeta | null>(null);
  const [selectedMediaSrc, setSelectedMediaSrc] = useState<string | null>(null);

  // --- Comments & Engagement States ---
  const [commentsMap, setCommentsMap] = useState<Record<number, CommentItem[]>>(
    () => {
      try {
        const saved = localStorage.getItem("postCommentsMap");
        return saved ? JSON.parse(saved) : {};
      } catch (e) {
        return {};
      }
    },
  );

  const [shareCounts, setShareCounts] = useState<Record<number, number>>(() => {
    try {
      const saved = localStorage.getItem("postShareCounts");
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  const [activeReplyTo, setActiveReplyTo] = useState<number | null>(null);
  const [replyInputText, setReplyInputText] = useState("");
  const [commentInputText, setCommentInputText] = useState("");
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const [mobileCommentsOpen, setMobileCommentsOpen] = useState(false);
  const [shareModalPost, setShareModalPost] = useState<PostMeta | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // --- Custom Video Player State ---
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoPlaying, setVideoPlaying] = useState(true);
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoCurrentTime, setVideoCurrentTime] = useState(0);

  const handleVideoClick = (e?: React.MouseEvent) => {
    if (e) {
      if ((e.target as HTMLElement).closest("#closeBtn")) return;
    }
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch((err) => console.log(err));
      setVideoPlaying(true);
    } else {
      videoRef.current.pause();
      setVideoPlaying(false);
    }
  };

  // --- Upload Form State ---
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreviewUrl, setUploadPreviewUrl] = useState<string>("");
  const [uploadIsVideo, setUploadIsVideo] = useState(false);
  const [uploadDescription, setUploadDescription] = useState("");
  const [uploadThumbnail, setUploadThumbnail] = useState<string>("");

  // --- Edit Form State ---
  const [editName, setEditName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editPhotoPreview, setEditPhotoPreview] = useState("");
  const [editCoverPreview, setEditCoverPreview] = useState("");

  // --- Posts Data ---
  const [posts, setPosts] = useState<PostMeta[]>([]);
  const [mediaUrls, setMediaUrls] = useState<Record<number, string>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  // --- ውጫዊ የፊት ፎቶ እና የCover ፎቶ በቀጥታ መቀየሪያ Refs (Refs for direct external photo and cover banner upload) ---
  const directPhotoInputRef = useRef<HTMLInputElement>(null);
  const directCoverInputRef = useRef<HTMLInputElement>(null);

  // --- የፖስት እና ኮሜንት ማጥፊያ ድጋሚ ማረጋገጫ የሞዳል ስቴት (Custom Delete Confirmation Dialog State) ---
  // ለወደፊቱ ከ Node.js + Express + PostgreSQL ጋር ሲያያዝ፡-
  // - ይህንን የድጋሚ ማረጋገጫ (confirmation dialog) ተጠቃሚው ሲያጸድቀው ወደ backend API የ'DELETE' ጥሪ ማድረግ ይቻላል (ለምሳሌ፡ '/api/posts/:id' ወይም '/api/comments/:id')።
  const [deleteConfirmState, setDeleteConfirmState] = useState<{
    isOpen: boolean;
    type: "post" | "comment";
    postId: number;
    commentId?: number;
  } | null>(null);

  // --- Mock Posts for Other User ---
  const otherPosts: PostMeta[] = otherProfile?.posts;

  // --- Load Saved Profile Data ---
  useEffect(() => {
    // 1. Profile information
    const savedProfile = localStorage.getItem("userProfile");
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        setProfile({
          name: parsed.username || user?.username || "User",
          username: parsed.username || user?.username || "username",
          bio: parsed.bio || user?.bio || "",
          photo: parsed.photo || user?.photo || "/default_avatar.jpg",
          cover: parsed.cover || "",
        });
      } catch (e) {
        console.error("Error loading saved profile:", e);
      }
    } else {
      const defaultData = {
        name: user?.username || "User",
        username: user?.username || "username",
        bio: "",
        photo: "/default_avatar.jpg",
        cover: "",
      };
      setProfile(defaultData);
      localStorage.setItem("userProfile", JSON.stringify(defaultData));
    }

    // 2. Followers system
    const savedIsFollowing = localStorage.getItem("isFollowing") === "true";
    const savedCountF = localStorage.getItem("countF");
    setIsFollowing(savedIsFollowing);
    if (savedCountF !== null) {
      setFollowersCount(parseInt(savedCountF, 0));
    } else {
      setFollowersCount(0);
    }

    // 3. Load posts metadata
    const savedPosts = localStorage.getItem("userPostsMeta");
    if (savedPosts) {
      try {
        setPosts(JSON.parse(savedPosts));
      } catch (e) {
        console.error("Error parsing posts:", e);
        setPosts([]);
      }
    } else {
      // Initialize with an empty library for new users
      setPosts([]);
      localStorage.setItem("userPostsMeta", JSON.stringify([]));
    }
  }, [feedPosts.length]);

  // --- Trigger Upload from Outside (e.g. Sidebar + click) ---
  useEffect(() => {
    if (triggerGlobalUpload && fileInputRef.current) {
      fileInputRef.current.click();
      if (onClearGlobalUpload) {
        onClearGlobalUpload();
      }
    }
  }, [triggerGlobalUpload, onClearGlobalUpload]);

  // --- Fetch Blobs from IndexedDB for custom uploads ---
  useEffect(() => {
    async function loadMediaBlobs() {
      const urls: Record<number, string> = {};
      for (const post of posts) {
        // Skip default mock posts which use placeholder designs
        if (post.id > 2000) {
          try {
            const fileOrBlob = await getMediaFile(post.id);
            if (fileOrBlob) {
              urls[post.id] = URL.createObjectURL(fileOrBlob);
            }
          } catch (e) {
            console.error(`Failed to get media for post ${post.id}:`, e);
          }
        }
      }
      setMediaUrls(urls);
    }
    loadMediaBlobs();

    // Cleanup URLs on unmount/re-run
    return () => {
      Object.values(mediaUrls).forEach((url) =>
        URL.revokeObjectURL(url as string),
      );
    };
  }, [posts]);

  // --- Open Media Player Modal ---
  const handleOpenPlayer = async (post: PostMeta) => {
    setSelectedPost(post);
    setVideoPlaying(true);
    setVideoCurrentTime(0);
    setVideoDuration(0);
    if (post.id <= 2000) {
      // Mock posts use elegant SVG placeholders based on id
      setSelectedMediaSrc("");
    } else {
      const src = mediaUrls[post.id] || "";
      setSelectedMediaSrc(src);
    }

    // Increment views only if user hasn't viewed it yet
    const viewedKey = "viewedPostIds";
    const viewed = JSON.parse(localStorage.getItem(viewedKey) || "[]");
    if (!viewed.includes(post.id)) {
      viewed.push(post.id);
      localStorage.setItem(viewedKey, JSON.stringify(viewed));

      const updatedPosts = posts.map((p) =>
        p.id === post.id ? { ...p, views: p.views + 1 } : p,
      );
      setPosts(updatedPosts);
      localStorage.setItem("userPostsMeta", JSON.stringify(updatedPosts));
    }
  };

  // --- Close Player Modal ---
  const handleClosePlayer = () => {
    setSelectedPost(null);
    setSelectedMediaSrc(null);
    setMobileCommentsOpen(false);
    setVideoPlaying(true);
    setVideoCurrentTime(0);
    setVideoDuration(0);
  };

  // --- Navigate between posts inside the player modal (Next/Prev) ---
  const handleNavigatePost = (direction: "next" | "prev") => {
    setSelectedPost((currentPost) => {
      if (!currentPost) return null;
      const currentList = viewMode === "me" ? posts : otherProfile.posts;
      const currentIndex = currentList.findIndex(
        (p: any) => p.id === currentPost.id,
      );
      if (currentIndex === -1) return currentPost;

      let nextIndex = currentIndex;
      if (direction === "next") {
        nextIndex = currentIndex + 1;
      } else {
        nextIndex = currentIndex - 1;
      }

      if (nextIndex >= 0 && nextIndex < currentList.length) {
        const nextPost = currentList[nextIndex];

        // Update selectedMediaSrc immediately
        if (nextPost.id <= 2000) {
          setSelectedMediaSrc("");
        } else {
          const src = mediaUrls[nextPost.id] || "";
          setSelectedMediaSrc(src);
        }
        setVideoCurrentTime(0);
        setVideoPlaying(true);
        return nextPost;
      }
      return currentPost;
    });
  };

  // Keyboard, wheel scroll, and swipe navigation between posts in the immersive player
  useEffect(() => {
    if (!selectedPost) return;

    let timeoutId: number | undefined = undefined;
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

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      // Debounce wheel scroll to prevent rapid scrolling
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (e.deltaY > 30) {
          handleNavigatePost("next");
        } else if (e.deltaY < -30) {
          handleNavigatePost("prev");
        }
      }, 150);
    };

    // Mobile swipe gestures
    let touchStartY = 0;
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touchEndY = e.changedTouches[0].clientY;
      const diffY = touchStartY - touchEndY;
      if (Math.abs(diffY) > 50) {
        if (diffY > 0) {
          handleNavigatePost("next");
        } else {
          handleNavigatePost("prev");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown, { passive: false });
    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [selectedPost, viewMode, posts, otherUsers]);

  // --- Toggle Like on Player Modal ---
  const handleToggleLikePost = (postId: number) => {
    const updated = posts.map((p) => {
      if (p.id === postId) {
        const liked = !p.liked;
        return {
          ...p,
          liked,
          likes: liked ? p.likes + 1 : p.likes - 1,
        };
      }
      return p;
    });
    setPosts(updated);
    localStorage.setItem("userPostsMeta", JSON.stringify(updated));

    if (selectedPost && selectedPost.id === postId) {
      setSelectedPost((prev) =>
        prev
          ? {
              ...prev,
              liked: !prev.liked,
              likes: !prev.liked ? prev.likes + 1 : prev.likes - 1,
            }
          : null,
      );
    }
  };

  // --- Toggle Save on Player Modal ---
  const handleToggleSavePost = (postId: number) => {
    const updated = posts.map((p) => {
      if (p.id === postId) {
        const saved = !p.saved;
        return {
          ...p,
          saved,
          saves: saved ? p.saves + 1 : p.saves - 1,
        };
      }
      return p;
    });
    setPosts(updated);
    localStorage.setItem("userPostsMeta", JSON.stringify(updated));

    if (selectedPost && selectedPost.id === postId) {
      setSelectedPost((prev) =>
        prev
          ? {
              ...prev,
              saved: !prev.saved,
              saves: !prev.saved ? prev.saves + 1 : prev.saves - 1,
            }
          : null,
      );
    }
  };

  // --- Add Comment Handler ---
  const handleAddComment = (postId: number, text: string) => {
    if (!text.trim()) return;
    const newComment: CommentItem = {
      id: Date.now(),
      username: profile.username,
      avatar: profile.photo || null,
      text: text.trim(),
      timestamp: new Date().toISOString(),
      liked: false,
      likesCount: 0,
      replies: [],
    };

    const updated = {
      ...commentsMap,
      [postId]: [...(commentsMap[postId] || []), newComment],
    };
    setCommentsMap(updated);
    localStorage.setItem("postCommentsMap", JSON.stringify(updated));
    setCommentInputText("");
  };

  // --- Toggle Comment Like ---
  const handleToggleCommentLike = (postId: number, commentId: number) => {
    const currentComments = commentsMap[postId] || [];
    const updatedComments = currentComments.map((c) => {
      if (c.id === commentId) {
        const liked = !c.liked;
        return {
          ...c,
          liked,
          likesCount: liked
            ? (c.likesCount || 0) + 1
            : Math.max(0, (c.likesCount || 0) - 1),
        };
      }
      return c;
    });

    const updated = {
      ...commentsMap,
      [postId]: updatedComments,
    };
    setCommentsMap(updated);
    localStorage.setItem("postCommentsMap", JSON.stringify(updated));
  };

  // --- Add Reply Handler ---
  const handleAddReply = (postId: number, commentId: number, text: string) => {
    if (!text.trim()) return;
    const currentComments = commentsMap[postId] || [];
    const updatedComments = currentComments.map((c) => {
      if (c.id === commentId) {
        const newReply: CommentReply = {
          id: Date.now(),
          username: profile.username,
          avatar: profile.photo || null,
          text: text.trim(),
          timestamp: new Date().toISOString(),
        };
        return {
          ...c,
          replies: [...(c.replies || []), newReply],
        };
      }
      return c;
    });

    const updated = {
      ...commentsMap,
      [postId]: updatedComments,
    };
    setCommentsMap(updated);
    localStorage.setItem("postCommentsMap", JSON.stringify(updated));
    setReplyInputText("");
    setActiveReplyTo(null);
  };

  // --- የኮሜንት ማጥፊያ ማስጀመሪያ (Trigger custom comment delete confirmation instead of standard confirm) ---
  const handleDeleteComment = (postId: number, commentId: number) => {
    setDeleteConfirmState({
      isOpen: true,
      type: "comment",
      postId,
      commentId,
    });
  };

  // --- ውጫዊ የፊት ፎቶ እና የCover ፎቶ በቀጥታ መቀየሪያ (Direct external avatar and cover photo changer) ---
  // ለወደፊቱ ከ Node.js + Express + PostgreSQL ጋር ሲያያዝ፡-
  // - እነዚህ ሚዲያ ፋይሎች በቀጥታ ወደ Cloud Storage (ለምሳሌ፡ S3, Firebase Storage) የሚሰቀሉበት እና አዲሱ URL ወደ PostgreSQL 'users' ሠንጠረዥ በ 'photo' እና 'cover' አምዶች (columns) ውስጥ 'UPDATE' የሚደረጉበት API endpoints ይፈጠራሉ (/api/users/me/photo)።
  const handleDirectPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        if (event.target?.result) {
          const compressed = await compressImage(
            event.target.result as string,
            0.6,
            400,
          );
          const updatedProfile = { ...profile, photo: compressed };
          setProfile(updatedProfile);
          setEditPhotoPreview(compressed);
          localStorage.setItem("userProfile", JSON.stringify(updatedProfile));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDirectCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        if (event.target?.result) {
          const compressed = await compressImage(
            event.target.result as string,
            0.6,
            800,
          );
          const updatedProfile = { ...profile, cover: compressed };
          setProfile(updatedProfile);
          setEditCoverPreview(compressed);
          localStorage.setItem("userProfile", JSON.stringify(updatedProfile));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // --- ተጠቃሚው ሲነካ ወደ ሌላ ፕሮፋይል መሸጋገሪያ (Navigate to a profile when username/avatar is clicked inside the player) ---
  // ይህ ተግባር በተጫዋቹ (video player/modal) ውስጥ የኮሜንት ሰጪውን ወይም የባለቤቱን ፕሮፋይል ስም ወይም ፎቶ ሲነካ ወደ እሱ ፕሮፋይል ለመሸጋገር ያገለግላል።
  // ለወደፊቱ ከ PostgreSQL ዳታቤዝ ጋር ሲያያዝ፡ የተመረጠውን ተጠቃሚ ID በመጠቀም 'GET /api/users/:id' ጥሪ በማድረግ አጠቃላይ ዳታውን በቅጽበት መሳብ ይቻላል።
  const handleNavigateToUserProfile = (username: string) => {
    if (username === profile.username || username === "developer") {
      setViewMode("me");
      handleClosePlayer();
    } else {
      const userIdx = otherUsers.findIndex((u) => u.username === username);
      if (userIdx !== -1) {
        setSelectedOtherUser(userIdx);
        setViewMode("other");
        handleClosePlayer();
      }
    }
  };

  // --- የፖስት ማጥፊያ ማረጋገጫ ማስፈጸሚያ (Execute the actual post/comment deletion after user confirms in the custom dialog) ---
  // ለወደፊቱ ከ PostgreSQL ጋር ሲገናኝ፡ እዚህ ቦታ ላይ 'DELETE /api/posts/:id' ወይም 'DELETE /api/comments/:id' API ጥሪዎችን ማካሄድ ይቻላል።
  const executeDeleteAction = async () => {
    if (!deleteConfirmState) return;
    const { type, postId, commentId } = deleteConfirmState;
    if (type === "post") {
      try {
        await deleteMediaFile(postId);
        if (mediaUrls[postId]) {
          URL.revokeObjectURL(mediaUrls[postId]);
          const updatedUrls = { ...mediaUrls };
          delete updatedUrls[postId];
          setMediaUrls(updatedUrls);
        }
        const updated = posts.filter((p) => p.id !== postId);
        setPosts(updated);
        localStorage.setItem("userPostsMeta", JSON.stringify(updated));
        if (selectedPost && selectedPost.id === postId) {
          handleClosePlayer();
        }
      } catch (err) {
        console.error("Delete post error:", err);
      }
    } else if (type === "comment" && commentId !== undefined) {
      const currentComments = commentsMap[postId] || [];
      const updatedComments = currentComments.filter((c) => c.id !== commentId);
      const updated = {
        ...commentsMap,
        [postId]: updatedComments,
      };
      setCommentsMap(updated);
      localStorage.setItem("postCommentsMap", JSON.stringify(updated));
    }
    setDeleteConfirmState(null);
  };

  // --- Share Post Handler ---
  const handleIncrementShare = (postId: number) => {
    const currentShareCount = shareCounts[postId] || 0;
    const nextShareCount = currentShareCount + 1;
    const updated = {
      ...shareCounts,
      [postId]: nextShareCount,
    };
    setShareCounts(updated);
    localStorage.setItem("postShareCounts", JSON.stringify(updated));
  };

  const handleSharePost = (postId: number) => {
    // Find the post details to show in the share modal
    let foundPost: PostMeta | null = null;
    if (selectedPost && selectedPost.id === postId) {
      foundPost = selectedPost;
    } else {
      foundPost = posts.find((p) => p.id === postId) || null;
      if (!foundPost) {
        for (const user of otherUsers) {
          const match = user.posts.find((p: any) => p.id === postId);
          if (match) {
            foundPost = match as unknown as PostMeta;
            break;
          }
        }
      }
    }

    if (foundPost) {
      setShareModalPost(foundPost);
    } else {
      setShareModalPost({
        id: postId,
        isVideo: false,
        fileName: "",
        description: "Check out this awesome post!",
        hashtags: [],
        username: "developer",
        avatar: null,
        title: "Developer Workspace Post",
        views: 0,
        likes: 0,
        saves: 0,
        liked: false,
        saved: false,
        timestamp: new Date().toISOString(),
      } as any);
    }
  };

  // --- Toggle Follower Status ---

  const handleFollowToggle = () => {
    const nextFollowing = !isFollowing;
    const nextCount = nextFollowing ? followersCount + 1 : followersCount - 1;
    setIsFollowing(nextFollowing);
    setFollowersCount(nextCount);
    updateFollowCount("followers", nextFollowing);
    localStorage.setItem("isFollowing", String(nextFollowing));
    localStorage.setItem("countF", String(nextCount));
  };

  // --- Edit Profile Handler ---
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
      alert("Display Name cannot be empty!");
      return;
    }
    if (
      !editUsername.trim() ||
      !/^[a-z0-9_]{1,30}$/.test(editUsername.trim().toLowerCase())
    ) {
      alert(
        "Username must be 1-30 alphanumeric characters or underscores only!",
      );
      return;
    }

    const updatedProfile = {
      name: editName.slice(0, 10).trim(),
      username: editUsername.slice(0, 30).trim().toLowerCase(),
      bio: editBio.slice(0, 150).trim(),
      photo: editPhotoPreview,
      cover: editCoverPreview,
    };

    setProfile(updatedProfile);
    localStorage.setItem("userProfile", JSON.stringify(updatedProfile));
    login({ username: updatedProfile.username, email: user?.email || "" });
    setIsEditModalOpen(false);
  };

  // --- File Compression Handler (Base64 for LocalStorage safety) ---
  const compressImage = (
    base64String: string,
    quality = 0.7,
    maxWidth = 800,
  ): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxWidth) {
            width = Math.round((width * maxWidth) / height);
            height = maxWidth;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", quality));
        } else {
          resolve(base64String);
        }
      };
      img.src = base64String;
    });
  };

  const handlePhotoUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        if (event.target?.result) {
          const compressed = await compressImage(
            event.target.result as string,
            0.6,
            400,
          );
          setEditPhotoPreview(compressed);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCoverUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        if (event.target?.result) {
          const compressed = await compressImage(
            event.target.result as string,
            0.6,
            800,
          );
          setEditCoverPreview(compressed);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleThumbnailUploadChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        alert("Thumbnail cover must be an image file!");
        return;
      }
      const reader = new FileReader();
      reader.onload = async (event) => {
        if (event.target?.result) {
          const compressed = await compressImage(
            event.target.result as string,
            0.5,
            300,
          );
          setUploadThumbnail(compressed);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // --- Video/Photo Posting System ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");

    if (!isVideo && !isImage) {
      alert("Only Video or Image files are permitted!");
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      // 100MB
      alert("File size exceeds the 100MB maximum limit!");
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

    const postId = Date.now(); // Unique temporary ID also used for IndexedDB key

    try {
      // Save full file directly into IndexedDB safely bypassing 5MB localStorage limits
      await saveMediaFile(postId, uploadFile);

      const hashtags = uploadDescription.match(/#\w+/g) || [];
      const newPost: PostMeta = {
        id: postId,
        isVideo: uploadIsVideo,
        fileName: uploadFile.name,
        title: uploadFile.name.split(".")[0],
        description: uploadDescription.trim(),
        hashtags,
        username: profile.username,
        avatar: profile.photo || null,
        views: 0,
        likes: 0,
        liked: false,
        saves: 0,
        saved: false,
        timestamp: new Date().toISOString(),
        thumbnail: uploadThumbnail || undefined,
      };
      const { addPost } = useFeed();
      const resolvedUrl = uploadFile
        ? URL.createObjectURL(uploadFile)
        : uploadPreviewUrl || "";
      const feedPost: FeedPost = {
        id: String(postId),
        userId: user?.username || "me",
        username: profile.username,
        userAvatar: profile.photo || "",
        type: uploadIsVideo ? "video" : "photo",
        mediaUrls: [resolvedUrl],
        caption: uploadDescription,
        hashtags: uploadDescription.match(/#\w+/g) || [],
        likesCount: 0,
        commentsCount: 0,
        sharesCount: 0,
        savesCount: 0,
        viewsCount: 0,
        createdAt: new Date().toISOString(),
      };
      addPost(feedPost);
      const updatedPosts = [newPost, ...posts];
      setPosts(updatedPosts);
      localStorage.setItem("userPostsMeta", JSON.stringify(updatedPosts));

      // Reset states
      setIsUploadModalOpen(false);
      setUploadFile(null);
      URL.revokeObjectURL(uploadPreviewUrl);
      setUploadPreviewUrl("");
      setUploadDescription("");
      setUploadThumbnail("");
    } catch (e) {
      console.error("Error saving media post:", e);
      alert(
        "Unable to publish post. Please check available disk space or try another file.",
      );
    }
  };

  // --- Delete Post Handler (Now triggers the beautiful React confirmation modal instead of standard confirm) ---
  const handleDeletePost = (postId: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDeleteConfirmState({
      isOpen: true,
      type: "post",
      postId,
    });
  };

  // --- Format counts helper (e.g. 1500 to 1.5K) ---
  const formatCount = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num;
  };

  // --- Posts to display based on selected view mode ---
  const activePostsToRender = viewMode === "me" ? posts : otherPosts;

  // --- Filter posts based on active sub-tab/filter ---
  const filteredPosts = activePostsToRender.filter((post) => {
    if (activeTab === "posts") return true;
    if (activeTab === "video") return post.isVideo;
    if (activeTab === "likes") return post.liked;
    return true;
  });

  return (
    <div
      className="flex-1 flex flex-col h-full overflow-y-auto bg-gray-50 pb-20 md:pb-6"
      id="profile-workspace"
    >
      {/* ========================================================
          አጠቃላይ የገፅ መዋቅር መግለጫ (GENERAL PAGE ARCHITECTURE GUIDE)
          
          ይህ ገፅ (Profile.tsx) በሁለት ዋና ዋና ክፍሎች የተከፈለ ነው፡-
          1) የተጠቃሚው ገፅ ወይም ፕሮፋይል (USER PROFILE HEADER & BIO) - ከታች '2. Banner' እና '3. Profile Info' በሚሉ ኮሜንቶች ስር ይገኛል።
          2) የልጥፎች መደርደሪያ ኮንቲነር (POSTS GRID & CONTENT VIEW) - ከታች '5. Uploaded Content' ስር ያሉት ፎቶዎች እና ቪዲዮዎች የሚደረደሩበት ሳጥን ነው።
          
          ለወደፊቱ ከ Node.js + Express + PostgreSQL ጋር ለማገናኘት መመሪያ (BACKEND INTEGRATION GUIDE):
          - የተጠቃሚውን መረጃ (ስም፣ ፎቶ፣ ባዮ) ከ PostgreSQL 'users' ሠንጠረዥ (table) ለመጫን 'GET /api/profile' API መጥራት ይችላሉ።
          - አዳዲስ ፎቶ/ቪዲዮዎችን ለመለጠፍ 'POST /api/posts' በመጠቀም ሚዲያዎችን ወደ ደመና ማከማቻ (Cloud Storage) በመስቀል ሊንኩን PostgreSQL 'posts' ሠንጠረዥ ላይ ማስቀመጥ ይችላሉ።
          - ኮሜንቶችን፣ ላይኮችን እና ሼሮችን ለማንበብና ለመጻፍ 'GET/POST /api/posts/:id/comments' ወይም '/api/posts/:id/likes' የሚሉ endpoints መፍጠር ይችላሉ።
          ======================================================== */}

      {/* 1. Header with logo and search box */}
      <header
        className="sticky top-0 left-0 right-0 h-16 bg-gradient-to-r 
     hidden md:block bg-brand shadow-md z-40 flex items-center justify-between px-4 md:px-8 shrink-0"
      >
        <div className="flex items-center gap-3">
          {onBackToCommunity && (
            <button
              onClick={onBackToCommunity}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors mr-1"
              title="Back to Community"
            >
              <ArrowLeft className="w-5 h-5 text-white" />
            </button>
          )}
        </div>

        {/* Display Title or Stats Indicator */}
      </header>

      {/* Hidden File Upload Triggers */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="video/*,image/*"
        className="hidden"
      />

      {/* ውጫዊ የፊት ፎቶ እና የCover ፎቶ በቀጥታ መቀየሪያ input ኤለመንቶች (Hidden inputs for direct profile & cover upload) */}
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

      {/* 2. Banner/Cover Photo Area */}
      <div className="w-full relative shrink-0">
        {viewMode === "me" ? (
          profile.cover ? (
            <div
              onClick={() => directCoverInputRef.current?.click()}
              className="w-full h-40 md:h-52 bg-cover bg-center transition-all duration-300 border-b border-gray-100 cursor-pointer relative group"
              style={{ backgroundImage: `url(${profile.cover})` }}
            >
              {/* Cover hover overlay */}
              <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-black gap-2 backdrop-blur-[1px]">
                <Camera className="w-5 h-5 text-white animate-bounce" />
                <span>Change Banner Cover</span>
              </div>
            </div>
          ) : (
            <div
              onClick={() => directCoverInputRef.current?.click()}
              className="w-full h-40 md:h-52 bg-slate-900 relative overflow-hidden flex flex-col justify-center items-center px-4 border-b border-gray-200/60 cursor-pointer group"
            >
              {/* Abstract grid pattern background */}
              <div className="absolute inset-0 opacity-15 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:14px_24px]" />
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-blue-500 rounded-full blur-3xl opacity-25" />
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-500 rounded-full blur-3xl opacity-25" />

              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center mb-1.5 backdrop-blur-sm border border-white/20 group-hover:scale-110 transition-transform duration-200">
                  <Camera className="w-4.5 h-4.5 text-white/90" />
                </div>
                <span className="text-white font-black tracking-tight text-xs sm:text-sm">
                  Personalize Your Cover Space
                </span>
                <span className="text-white/60 text-[10px] font-bold mt-0.5 max-w-xs">
                  Click here to select and upload your custom brand banner.
                </span>
              </div>
            </div>
          )
        ) : (
          /* Abel T. Cover space */
          <div className="w-full h-40 md:h-52 bg-slate-900 relative overflow-hidden flex flex-col justify-center items-center px-4 border-b border-gray-200/60">
            <div className="absolute inset-0 opacity-15 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:14px_24px]" />
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-emerald-500 rounded-full blur-3xl opacity-25" />
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-teal-500 rounded-full blur-3xl opacity-25" />

            <div className="relative z-10 flex flex-col items-center text-center">
              <span className="text-white/20 font-mono tracking-widest text-xs select-none uppercase font-black">
                ABEL CODES WORKSPACE
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 3. Profile Information Layout */}
      <div className="max-w-4xl w-full mx-auto px-4 md:px-8 relative -mt-4 sm:-mt-12 mb-6">
        {/* Profile row header container */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-5">
          {/* Avatar and Info Block */}
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3.5 sm:gap-4.5">
            <div
              onClick={() =>
                viewMode === "me" && directPhotoInputRef.current?.click()
              }
              className={`w-24 h-24 md:w-28 md:h-28 rounded-full border-4 border-white shadow-xl overflow-hidden shrink-0 bg-blue-100 flex items-center justify-center relative group ${viewMode === "me" ? "cursor-pointer" : ""}`}
            >
              {viewMode === "me" ? (
                profile.photo ? (
                  <img
                    src={profile.photo}
                    alt={profile.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold tracking-wider">
                    {profile.name
                      ? profile.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)
                      : "NX"}
                  </div>
                )
              ) : otherProfile.photo ? (
                <img
                  src={otherProfile.photo}
                  alt={otherProfile.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white text-3xl font-bold tracking-wider">
                  AT
                </div>
              )}
              {/* Avatar upload overlay */}
              {viewMode === "me" && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                  <Camera className="w-6 h-6 text-white animate-pulse" />
                </div>
              )}
            </div>

            <div className="pt-4 sm:pt-0 sm:pb-1 flex flex-col justify-end">
              <h2
                className="text-2xl sm:text-3xl font-black tracking-tight text-gray-950 flex items-center gap-1.5 leading-tight"
                id="profile-display-name"
              >
                {viewMode === "me" ? profile.name : otherProfile.name}
              </h2>
              <p className="text-xs sm:text-sm font-black text-blue-600 mt-1 tracking-wide">
                @{viewMode === "me" ? profile.username : otherProfile.username}
              </p>
            </div>
          </div>

          {/* Stats Counters */}
          <div className="flex gap-6 md:gap-8 self-start sm:self-end bg-white border border-gray-100 shadow-md shadow-gray-100/30 px-5 py-3 rounded-2xl">
            <div className="flex flex-col items-center">
              <span className="text-lg font-black text-gray-900 tracking-tight">
                {viewMode === "me"
                  ? formatCount(followersCount)
                  : formatCount(otherProfile.followersCount)}
              </span>
              <span className="text-xs text-gray-400 font-bold tracking-wide uppercase">
                Followers
              </span>
            </div>
            <div className="flex flex-col items-center border-x border-gray-100 px-6 md:px-8">
              <span className="text-lg font-black text-gray-900 tracking-tight">
                {viewMode === "me"
                  ? formatCount(posts.length)
                  : formatCount(otherPosts?.length ?? 0)}
              </span>
              <span className="text-xs text-gray-400 font-bold tracking-wide uppercase">
                Posts
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-1">
                {viewMode === "me"
                  ? formatCount(starsCount ?? 0)
                  : formatCount(otherProfile?.followingCount ?? 0)}
              </span>
              <span className="text-xs text-gray-400 font-bold tracking-wide uppercase">
                Following
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="flex flex-wrap items-center gap-2.5 mb-6">
          {viewMode === "me" ? (
            <>
              {/* Sleek Pencil Icon button for Edit Profile */}
              <button
                onClick={handleOpenEditModal}
                className="p-2.5 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 hover:text-blue-600 text-gray-750 font-black transition-all shadow-sm flex items-center justify-center shrink-0"
                title="Edit Profile"
              >
                <Edit className="w-10 h-5 text-gray-500 " /> Edit
              </button>

              {/* Toggle switch to Abel T. (Others) next to edit button */}
              <button
                onClick={() => setIsOthersModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 hover:text-blue-600 text-gray-750 font-black text-xs uppercase tracking-wider transition-all shadow-sm flex items-center gap-2 shrink-0"
                title="View Other Developers"
              >
                <Users className="w-4 h-4 text-gray-500" />
                <span>others</span>
              </button>
            </>
          ) : (
            <>
              {/* Message button: takes the user directly to Community Chat with this user */}
              <button
                onClick={() =>
                  handleMessageUser({
                    name: otherProfile.name,
                    username: otherProfile.username,
                    photo: otherProfile.photo,
                  })
                }
                className="px-4 py-2.5 rounded-xl bg-[#2481cc] hover:bg-[#2075b8] text-white hover:scale-105 active:scale-95 font-black text-xs uppercase tracking-wider transition-all shadow-md flex items-center gap-2 shrink-0"
                title="Message this developer"
              >
                <MessageCircle className="w-4 h-4 text-white" />
                <span>Message</span>
              </button>

              {/* --- የተጠቃሚ መከታተያ ቁልፍ (Follow/Following user Button) --- */}
              {/* ለወደፊቱ፡ ይህ Follow ቁልፍ በ Express backend አማካኝነት ተከታታዮችን በ PostgreSQL "follows" ሠንጠረዥ ውስጥ ያስቀምጣል። */}
              <button
                onClick={() => {
                  toggleFollowUser(selectedOtherUser);
                }}
                className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-all duration-200 ${
                  otherProfile.isFollowing
                    ? "bg-gray-100 hover:bg-gray-200 text-gray-800"
                    : "bg-gradient-to-b from-[#019BE5] via-[#0185E5] to-[#0071E3] text-white hover:opacity-95 shadow-sm shadow-blue-200/20"
                }`}
              >
                {otherProfile.isFollowing ? "Following" : "Follow"}
              </button>

              {/* Switch/Browse others button */}
              <button
                onClick={() => setIsOthersModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 hover:text-blue-600 text-gray-750 font-black text-xs uppercase tracking-wider transition-all shadow-sm flex items-center gap-2 shrink-0"
                title="View Other Developers"
              >
                <Users className="w-4 h-4 text-gray-500" />
                <span>others</span>
              </button>
            </>
          )}
        </div>

        {/* Bio Section with Read More toggle capability */}
        {(viewMode === "me" ? profile.bio : otherProfile.bio) && (
          <div className="bg-white border border-gray-100/80 rounded-2xl p-4.5 shadow-sm shadow-gray-100/10 mb-6">
            <h4 className="text-xs font-black tracking-widest text-blue-600 uppercase mb-2 flex items-center gap-1.5">
              <span>BIO</span>
            </h4>

            <p className="text-sm font-medium text-gray-700 leading-relaxed break-words whitespace-pre-line">
              {viewMode === "me"
                ? profile.bio.length > 80 && !isBioExpanded
                  ? `${profile.bio.slice(0, 80)}...`
                  : profile.bio
                : otherProfile.bio.length > 80 && !isBioExpanded
                  ? `${otherProfile.bio.slice(0, 80)}...`
                  : otherProfile.bio}
            </p>

            {(viewMode === "me"
              ? profile.bio.length
              : otherProfile.bio.length) > 80 && (
              <button
                onClick={() => setIsBioExpanded(!isBioExpanded)}
                className="mt-2 text-xs font-extrabold text-blue-600 hover:text-indigo-600 flex items-center gap-1 transition-colors"
              >
                {isBioExpanded ? (
                  <>
                    <span>Less</span>
                    <ChevronUp className="w-3 h-3 text-blue-600" />
                  </>
                ) : (
                  <>
                    <span>More</span>
                    <ChevronDown className="w-3 h-3 text-blue-600" />
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* 4. Segmented Filter Switchers (Centered, clean, only Posts is kept) */}
        <div className="flex justify-center border-b border-gray-200/60 pb-4 mb-6">
          {/* Segmented Filter Pills (Only Posts) */}
          <div className="flex bg-gray-100/80 p-1 rounded-xl select-none border border-gray-200/30">
            <button
              onClick={() => setActiveTab("posts")}
              className="px-5 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 bg-white text-blue-600 shadow-sm"
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Posts</span>
            </button>
          </div>
        </div>

        {/* 5. Uploaded Content Video/Image Grid */}
        <div className="min-h-48">
          {filteredPosts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 bg-white border border-gray-100 rounded-3xl text-center px-4">
              <span className="text-4xl mb-3">🎬</span>
              <h3 className="text-base font-extrabold text-gray-800 mb-1">
                No content published in Posts
              </h3>
              <p className="text-xs text-gray-400 max-w-xs mb-5">
                Select a file and publish your very first picture or video
                stream with hashtags!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
              {filteredPosts.map((post) => {
                const mediaSrc = mediaUrls[post.id];

                return (
                  <div
                    key={post.id}
                    onClick={() => handleOpenPlayer(post)}
                    className="aspect-[9/16] bg-gray-900 rounded-2xl overflow-hidden relative cursor-pointer group shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100/50"
                  >
                    {/* Media Display preview element */}
                    {post.thumbnail || mediaSrc ? (
                      post.thumbnail ? (
                        <>
                          <img
                            src={post.thumbnail}
                            alt="Post cover thumbnail"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                          {post.isVideo && (
                            <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider z-10">
                              🎬 VIDEO
                            </div>
                          )}
                        </>
                      ) : post.isVideo ? (
                        <>
                          <video
                            src={mediaSrc}
                            className="w-full h-full object-cover"
                            muted
                            preload="metadata"
                          />
                          <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider z-10">
                            🎬 VIDEO
                          </div>
                        </>
                      ) : (
                        <img
                          src={mediaSrc}
                          alt="Post preview"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      )
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-800 text-white/50 text-xs">
                        Loading file...
                      </div>
                    )}
                    <p className="text-sm text-brand font-semibold mt-2">
                      Use the + button below to post your first content
                    </p>
                    {/* Always visible views & likes stats badge on the outside preview */}
                    <div className="absolute bottom-2.5 right-2.5 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-2.5 shadow-sm z-10 group-hover:opacity-0 transition-opacity duration-200 border border-white/5">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5 text-white/95" />
                        <span>{formatCount(post.views)}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart
                          className={`w-3.5 h-3.5 ${post.liked ? "fill-rose-500 text-rose-500" : "text-white/95"}`}
                        />
                        <span>{formatCount(post.likes)}</span>
                      </span>
                    </div>

                    {/* Likes & Views Overlay on Hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent flex flex-col justify-end p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <p className="text-xs text-white/90 font-medium line-clamp-2 leading-relaxed mb-3">
                        {post.description}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 text-white text-xs font-bold">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3.5 h-3.5 text-white/80" />{" "}
                            {formatCount(post.views)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Heart
                              className={`w-3.5 h-3.5 ${post.liked ? "fill-rose-500 text-rose-500" : "text-white/80"}`}
                            />{" "}
                            {formatCount(post.likes)}
                          </span>
                        </div>

                        {viewMode === "me" && (
                          <button
                            onClick={(e) => handleDeletePost(post.id, e)}
                            className="p-1.5 bg-rose-600/90 hover:bg-rose-700 text-white rounded-lg transition-colors shadow-sm"
                            title="Delete Post"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================
          MODAL: EDIT PROFILE FORM
          ======================================================== */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/65 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto border border-gray-100 flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10 shrink-0">
              <h3 className="text-lg font-black tracking-tight text-gray-900">
                Edit Profile
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 hover:bg-gray-100 text-gray-400 hover:text-gray-700 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto">
              {/* Cover Photo Customizer */}
              <div>
                <span className="block text-xs font-extrabold tracking-wider text-gray-400 uppercase mb-2">
                  Cover Photo Banner
                </span>
                <div
                  onClick={() => coverInputRef.current?.click()}
                  className="w-full h-28 rounded-xl bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer overflow-hidden relative group"
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

              {/* Photo Avatar Row */}
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
                  <span className="block text-xs font-extrabold tracking-wider text-gray-400 uppercase mb-1">
                    Avatar
                  </span>
                  <button
                    onClick={() => photoInputRef.current?.click()}
                    className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-xs font-bold rounded-lg transition-colors text-gray-700"
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

              {/* Form Input fields */}
              <div className="space-y-4">
                {/* Display Name */}
                <div>
                  <label className="block text-xs font-extrabold tracking-wider text-gray-400 uppercase mb-1.5">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value.slice(0, 10))}
                    placeholder="Your name"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-transparent hover:border-gray-100 focus:border-blue-500 focus:bg-white rounded-xl text-sm font-semibold text-gray-800 placeholder-gray-400 outline-none transition-all"
                  />
                  <span className="block text-[10px] text-right font-semibold text-gray-400 mt-1">
                    {editName.length}/10
                  </span>
                </div>

                {/* Username */}
                <div>
                  <label className="block text-xs font-extrabold tracking-wider text-gray-400 uppercase mb-1.5">
                    Username
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400 select-none">
                      @
                    </span>
                    <input
                      type="text"
                      value={editUsername}
                      onChange={(e) =>
                        setEditUsername(e.target.value.slice(0, 30))
                      }
                      placeholder="username"
                      className="w-full pl-8 pr-4 py-2.5 bg-gray-50 border border-transparent hover:border-gray-100 focus:border-blue-500 focus:bg-white rounded-xl text-sm font-semibold text-gray-800 placeholder-gray-400 outline-none transition-all"
                    />
                  </div>
                  <span className="block text-[10px] text-right font-semibold text-gray-400 mt-1">
                    {editUsername.length}/30
                  </span>
                </div>

                {/* Bio text area */}
                <div>
                  <label className="block text-xs font-extrabold tracking-wider text-gray-400 uppercase mb-1.5">
                    Professional Bio
                  </label>
                  <textarea
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value.slice(0, 150))}
                    placeholder="Write something about yourself..."
                    rows={3}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-transparent hover:border-gray-100 focus:border-blue-500 focus:bg-white rounded-xl text-sm font-semibold text-gray-800 placeholder-gray-400 outline-none transition-all resize-none"
                  />
                  <span className="block text-[10px] text-right font-semibold text-gray-400 mt-1">
                    {editBio.length}/150
                  </span>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="px-6 py-4.5 border-t border-gray-100 flex items-center gap-3 justify-end bg-white shrink-0">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-700 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-xs font-bold text-white rounded-xl shadow-md shadow-blue-100 transition-all"
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
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10 shrink-0">
              <h3 className="text-lg font-black tracking-tight text-gray-900">
                {uploadIsVideo
                  ? "🎬 Compose New Video Post"
                  : "🖼 Compose New Photo Post"}
              </h3>
              <button
                onClick={() => {
                  setIsUploadModalOpen(false);
                  URL.revokeObjectURL(uploadPreviewUrl);
                }}
                className="p-1.5 hover:bg-gray-100 text-gray-400 hover:text-gray-700 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto">
              {/* Media Preview Box */}
              <div className="w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-inner flex items-center justify-center">
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

              {/* Optional Cover Thumbnail Selection */}
              <div className="bg-gray-50 border border-gray-100 p-4 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold tracking-wider text-gray-400 uppercase">
                    Cover Thumbnail (Optional)
                  </span>
                  {uploadThumbnail && (
                    <button
                      onClick={() => setUploadThumbnail("")}
                      className="text-[10px] font-black text-rose-600 hover:text-rose-700 uppercase tracking-widest bg-rose-50 px-2 py-0.5 rounded"
                    >
                      Remove Cover
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-4">
                  <div
                    onClick={() => thumbnailInputRef.current?.click()}
                    className="w-16 h-24 rounded-xl bg-gray-200 border border-dashed border-gray-300 flex items-center justify-center cursor-pointer overflow-hidden relative group shrink-0"
                  >
                    {uploadThumbnail ? (
                      <>
                        <img
                          src={uploadThumbnail}
                          alt="Thumbnail preview"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Camera className="w-4 h-4 text-white" />
                        </div>
                      </>
                    ) : (
                      <div className="text-center p-1 flex flex-col items-center">
                        <Camera className="w-4 h-4 text-gray-400 mb-0.5" />
                        <span className="text-[8px] text-gray-400 font-bold leading-tight">
                          Choose Photo
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-1">
                    <p className="text-xs font-semibold text-gray-600 leading-normal">
                      {uploadThumbnail
                        ? "Custom cover thumbnail selected! It will display as the card preview in the grid."
                        : uploadIsVideo
                          ? "Optional. If not selected, the first frame of the video itself will be the preview thumbnail."
                          : "Optional. If not selected, the full photo itself will be the preview thumbnail."}
                    </p>
                    <button
                      onClick={() => thumbnailInputRef.current?.click()}
                      className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-50 text-[11px] font-black rounded-lg transition-colors text-gray-700 shadow-sm"
                    >
                      {uploadThumbnail ? "Change Image" : "Select Cover Photo"}
                    </button>
                    <input
                      type="file"
                      ref={thumbnailInputRef}
                      onChange={handleThumbnailUploadChange}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Description Input */}
              <div className="space-y-2">
                <label className="block text-xs font-extrabold tracking-wider text-gray-400 uppercase">
                  Write Caption Description
                </label>
                <textarea
                  value={uploadDescription}
                  onChange={(e) =>
                    setUploadDescription(e.target.value.slice(0, 500))
                  }
                  placeholder="Enter a cool caption. Include #hashtags like #programming, #vlog, #nextgen..."
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-50 border border-transparent focus:border-blue-500 focus:bg-white rounded-2xl text-sm font-semibold text-gray-800 placeholder-gray-400 outline-none transition-all resize-none"
                />

                <div className="flex items-center justify-between text-[11px] font-bold">
                  {/* Live Hashtag list */}
                  <div className="flex flex-wrap gap-1.5 max-w-[70%]">
                    {(uploadDescription.match(/#\w+/g) || []).map(
                      (tag, idx) => (
                        <span
                          key={idx}
                          className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full"
                        >
                          {tag}
                        </span>
                      ),
                    )}
                  </div>
                  <span className="text-gray-400 shrink-0">
                    {uploadDescription.length}/500
                  </span>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="px-6 py-4.5 border-t border-gray-100 flex items-center gap-3 justify-end bg-white shrink-0">
              <button
                onClick={() => {
                  setIsUploadModalOpen(false);
                  URL.revokeObjectURL(uploadPreviewUrl);
                }}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-700 rounded-xl transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handlePostMedia}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white rounded-xl shadow-md shadow-emerald-100 transition-all"
              >
                Post Now ➤
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: REDESIGNED IMMERSIVE VIDEO/PHOTO PLAYER WITH INTERACTIVE SIDEBAR
          ======================================================== */}
      {selectedPost &&
        (() => {
          const comments = commentsMap[selectedPost.id] || [];
          const shares = shareCounts[selectedPost.id] || 0;

          // Find if the author is the current logged in user (profile) or one of the other users
          const isOwnPost = selectedPost.username === profile.username;
          const authorIndex = otherUsers.findIndex(
            (u) => u.username === selectedPost.username,
          );

          // Setup postAuthor object dynamically based on who actually created the post
          const postAuthor = isOwnPost
            ? {
                name: profile.name,
                username: profile.username,
                photo: profile.photo,
                isFollowing: false,
                followersCount: followersCount,
                bio: profile.bio,
              }
            : authorIndex !== -1
              ? otherUsers[authorIndex]
              : {
                  name: "Other Creator",
                  username: selectedPost.username || "creator",
                  photo: "",
                  isFollowing: false,
                  followersCount: 150,
                  bio: "",
                };

          return (
            <div className="fixed inset-0 bg-[#0f172a]/95 backdrop-blur-md flex items-center justify-center z-50 p-0 sm:p-4">
              <div className="bg-black md:bg-white rounded-none sm:rounded-3xl w-full max-w-[1200px] h-full sm:h-[90vh] md:h-[88vh] overflow-hidden shadow-2xl border border-transparent sm:border-gray-200/50 flex flex-col md:flex-row relative">
                {/* ===== Left Side: Video/Image Section ===== */}
                <div className="w-full h-full md:flex-1 bg-black flex items-center justify-center relative">
                  {/* Close Button top-left */}
                  <button
                    onClick={handleClosePlayer}
                    className="absolute top-[18px] left-[18px] w-9 h-9 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center transition-all backdrop-blur-md z-30 shadow-md pointer-events-auto"
                    id="closeBtn"
                    title="Close Player"
                  >
                    <X className="w-5 h-5" />
                  </button>

                  {/* የራስን ፖስት ማጥፊያ ቁልፍ በሞባይል ብቻ (Delete button for own post on mobile) */}
                  {isOwnPost && (
                    <button
                      onClick={(e) => {
                        handleDeletePost(selectedPost.id, e);
                        handleClosePlayer();
                      }}
                      className="absolute top-[18px] right-[18px] px-3.5 py-2 rounded-full
                       bg-rose-600 hover:bg-rose-700 text-white 
                       flex items-center gap-1.5 text-xs font-black tracking-wide
                        transition-all backdrop-blur-md z-30 shadow-lg
                         pointer-events-auto md:hidden "
                      title="Delete Post"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-white" />
                      <span>Delete</span>
                    </button>
                  )}

                  {/* Floating Navigation Arrows to Scroll/Browse Posts (ChevronUp / ChevronDown) */}
                  <div className="absolute left-[18px] top-1/2 -translate-y-1/2 flex flex-col gap-3 z-30 pointer-events-auto">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNavigatePost("prev");
                      }}
                      className="w-9 h-9 rounded-full bg-black/55 hover:bg-black/80 border border-white/15 flex items-center justify-center text-white/90 hover:text-white hover:scale-110 active:scale-95 transition-all shadow-md group backdrop-blur-sm"
                      title="Previous Post (Scroll Up)"
                    >
                      <ChevronUp className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNavigatePost("next");
                      }}
                      className="w-9 h-9 rounded-full bg-black/55 hover:bg-black/80 border border-white/15 flex items-center justify-center text-white/90 hover:text-white hover:scale-110 active:scale-95 transition-all shadow-md group backdrop-blur-sm"
                      title="Next Post (Scroll Down)"
                    >
                      <ChevronDown className="w-5 h-5 group-hover:translate-y-0.5 transition-transform" />
                    </button>
                  </div>

                  {selectedPost.thumbnail || selectedMediaSrc ? (
                    selectedPost.isVideo ? (
                      <div
                        onClick={handleVideoClick}
                        className="w-full h-full cursor-pointer relative flex items-center justify-center group select-none"
                      >
                        <video
                          ref={videoRef}
                          src={selectedMediaSrc || undefined}
                          className="w-full h-full object-contain block bg-black"
                          playsInline
                          loop
                          autoPlay
                          id="videoPlayer"
                          onPlay={() => setVideoPlaying(true)}
                          onPause={() => setVideoPlaying(false)}
                          onTimeUpdate={(e) =>
                            setVideoCurrentTime(e.currentTarget.currentTime)
                          }
                          onLoadedMetadata={(e) =>
                            setVideoDuration(e.currentTarget.duration)
                          }
                        />

                        {/* Giant Play overlay button when paused */}
                        {!videoPlaying && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/15 pointer-events-none transition-all duration-300">
                            <div className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white scale-110 animate-ping absolute opacity-25"></div>
                            <div className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white z-10 shadow-lg relative animate-[pulse_0.3s_ease-out-in]">
                              <Play className="w-7 h-7 text-white fill-white ml-1" />
                            </div>
                          </div>
                        )}

                        {/* Thin Progress bar at the bottom of the video */}
                        {videoDuration > 0 && (
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-10 pointer-events-none">
                            <div
                              className="h-full bg-blue-500 transition-all duration-100"
                              style={{
                                width: `${(videoCurrentTime / videoDuration) * 100}%`,
                              }}
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      <img
                        src={
                          selectedPost.thumbnail ||
                          selectedMediaSrc ||
                          undefined
                        }
                        alt="Post media viewer"
                        className="w-full h-full object-contain block bg-black"
                      />
                    )
                  ) : (
                    <div className="text-white/40 text-sm">
                      Media asset loading...
                    </div>
                  )}
                </div>

                {/* ===== Right Side: Sidebar Panel ===== */}
                <aside className="hidden md:flex md:w-[420px] flex-col h-full overflow-hidden bg-white border-l border-gray-200">
                  {/* Header with User Info */}
                  <header className="flex items-center justify-between p-5 pb-3.5 border-b border-gray-100 shrink-0">
                    <div
                      onClick={() =>
                        handleNavigateToUserProfile(postAuthor.username)
                      }
                      className="flex items-center gap-3 cursor-pointer group hover:opacity-85 transition-opacity"
                      title="View Profile"
                    >
                      <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-blue-600 bg-blue-50 flex items-center justify-center text-blue-600 text-sm font-bold shrink-0 group-hover:scale-105 transition-transform">
                        {postAuthor.photo ? (
                          <img
                            src={postAuthor.photo}
                            alt={postAuthor.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          postAuthor.name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <h2 className="text-[15px] font-bold text-slate-800 leading-none group-hover:text-blue-600 transition-colors">
                            {postAuthor.name}
                          </h2>
                          <span className="text-[12px] text-slate-400 font-medium">
                            @{postAuthor.username}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400 mt-1">
                          {new Date(selectedPost.timestamp).toLocaleDateString(
                            undefined,
                            { month: "short", day: "numeric", year: "numeric" },
                          )}
                        </span>
                      </div>
                    </div>

                    {isOwnPost ? (
                      <button
                        onClick={(e) => handleDeletePost(selectedPost.id, e)}
                        className="px-3.5 py-1.5 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 flex items-center gap-1.5 text-xs font-black transition-all"
                        title="Delete Post"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        <span>Delete</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => toggleFollowUser(authorIndex)}
                        className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
                          postAuthor.isFollowing
                            ? "bg-slate-100 text-slate-500 border border-slate-200"
                            : "bg-gradient-to-b from-[#019BE5] via-[#0185E5] to-[#0071E3] text-white hover:opacity-95 shadow-sm"
                        }`}
                      >
                        {/* --- የፖስት ፈጣሪ መከታተያ ቁልፍ (Post Author Follow Button) --- */}
                        {postAuthor.isFollowing ? "Following" : "Follow"}
                      </button>
                    )}
                  </header>

                  {/* Description */}
                  <section className="px-5 py-3 text-sm text-slate-700 leading-relaxed shrink-0 break-words max-h-24 overflow-y-auto">
                    {selectedPost.description.split(/(\s+)/).map((word, i) => {
                      if (word.startsWith("#")) {
                        return (
                          <span
                            key={i}
                            className="text-blue-600 font-bold hover:underline cursor-pointer"
                          >
                            {word}
                          </span>
                        );
                      }
                      return <span key={i}>{word}</span>;
                    })}
                  </section>

                  {/* Stats Row */}
                  <section className="flex items-center gap-1 px-5 pb-4 shrink-0 border-b border-gray-100">
                    {/* Like stat */}
                    <button
                      onClick={() => handleToggleLikePost(selectedPost.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        selectedPost.liked
                          ? "bg-rose-50 text-rose-600"
                          : "text-slate-500 hover:bg-slate-50 hover:text-blue-600"
                      }`}
                    >
                      <Heart
                        className={`w-5 h-5 ${selectedPost.liked ? "fill-rose-500 text-rose-500" : ""}`}
                      />
                      <span>{formatCount(selectedPost.likes)}</span>
                    </button>

                    {/* Comment stat count link */}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500 select-none">
                      <MessageCircle className="w-5 h-5" />
                      <span>{formatCount(comments.length)}</span>
                    </div>

                    {/* Save stat */}
                    <button
                      onClick={() => handleToggleSavePost(selectedPost.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        selectedPost.saved
                          ? "bg-amber-50 text-amber-600"
                          : "text-slate-500 hover:bg-slate-50 hover:text-blue-600"
                      }`}
                    >
                      <Bookmark
                        className={`w-5 h-5 ${selectedPost.saved ? "fill-amber-500 text-amber-500" : ""}`}
                      />
                      <span>{formatCount(selectedPost.saves)}</span>
                    </button>

                    {/* Share stat */}
                    <button
                      onClick={() => handleSharePost(selectedPost.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-slate-500 hover:bg-slate-50 hover:text-blue-600 transition-all ml-auto"
                    >
                      <Share2 className="w-5 h-5" />
                      <span>{shares > 0 ? formatCount(shares) : "Share"}</span>
                    </button>
                  </section>

                  {/* Comments Section */}
                  <section className="flex-1 flex flex-col overflow-hidden px-5 pt-3">
                    <h3 className="text-[14px] font-bold text-slate-800 mb-3 flex items-center gap-1.5 shrink-0">
                      Comments{" "}
                      <span className="text-xs text-slate-400 font-semibold">
                        {comments.length}
                      </span>
                    </h3>

                    <div className="flex-1 overflow-y-auto space-y-4 pb-4 pr-1 scrollbar-thin">
                      {comments.length === 0 ? (
                        <div className="text-center text-slate-400 text-sm py-12 flex flex-col items-center justify-center">
                          <span className="text-3xl mb-2">💬</span>
                          <p className="font-bold text-slate-500">
                            No comments yet
                          </p>
                          <p className="text-xs text-slate-400 mt-1">
                            Be the first to share what you think!
                          </p>
                        </div>
                      ) : (
                        comments.map((comment) => (
                          <div key={comment.id} className="space-y-2">
                            {/* Parent Comment Card */}
                            <div className="flex gap-2.5 items-start">
                              <div
                                onClick={() =>
                                  handleNavigateToUserProfile(comment.username)
                                }
                                className="w-8 h-8 rounded-full overflow-hidden bg-blue-50 flex items-center justify-center text-blue-600 text-xs font-bold shrink-0 border border-slate-100 cursor-pointer hover:opacity-85 transition-opacity"
                                title={`View ${comment.username}'s profile`}
                              >
                                {comment.avatar ? (
                                  <img
                                    src={comment.avatar}
                                    alt={comment.username}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  comment.username.charAt(0).toUpperCase()
                                )}
                              </div>
                              {/* --- የኮሜንት ካርድ ኮንቲነር (Comment Card Container - Expanded and styled) --- */}
                              <div className="flex-1 bg-slate-50/90 hover:bg-slate-100 rounded-2xl p-4 border-l-2 border-blue-500 shadow-sm transition-all">
                                <h4
                                  onClick={() =>
                                    handleNavigateToUserProfile(
                                      comment.username,
                                    )
                                  }
                                  className="text-xs font-bold text-blue-600 mb-1 cursor-pointer hover:underline"
                                >
                                  @{comment.username}
                                </h4>
                                <p className="text-[13.5px] text-slate-800 leading-relaxed break-words font-medium">
                                  {comment.text}
                                </p>

                                <div className="flex items-center gap-4 mt-2 text.5 text-[10px] font-bold text-slate-400">
                                  <span>
                                    {new Date(
                                      comment.timestamp,
                                    ).toLocaleTimeString(undefined, {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>

                                  {/* --- የልብ ቅርጽ ኮሜንት ላይክ ማድረጊያ (Heart Icon Comment Like button with count starting from 0) --- */}
                                  <button
                                    onClick={() =>
                                      handleToggleCommentLike(
                                        selectedPost.id,
                                        comment.id,
                                      )
                                    }
                                    className={`flex items-center gap-1 hover:text-rose-600 transition-all ${comment.liked ? "text-rose-500 scale-105" : "text-slate-400"}`}
                                    title="Like comment"
                                  >
                                    <Heart
                                      className={`w-3.5 h-3.5 ${comment.liked ? "fill-rose-500 text-rose-500" : ""}`}
                                    />
                                    <span>{comment.likesCount || 0}</span>
                                  </button>

                                  <button
                                    onClick={() => {
                                      if (activeReplyTo === comment.id) {
                                        setActiveReplyTo(null);
                                      } else {
                                        setActiveReplyTo(comment.id);
                                      }
                                    }}
                                    className="text-blue-500 hover:underline"
                                  >
                                    Reply
                                  </button>

                                  {comment.username === profile.username && (
                                    <button
                                      onClick={() =>
                                        handleDeleteComment(
                                          selectedPost.id,
                                          comment.id,
                                        )
                                      }
                                      className="text-slate-400 hover:text-rose-600 ml-auto transition-colors"
                                    >
                                      Delete
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Sub-Replies List */}
                            {comment.replies &&
                              comment.replies.map((reply) => (
                                <div
                                  key={reply.id}
                                  className="flex gap-2.5 items-start pl-8"
                                >
                                  <div
                                    onClick={() =>
                                      handleNavigateToUserProfile(
                                        reply.username,
                                      )
                                    }
                                    className="w-6.5 h-6.5 rounded-full overflow-hidden bg-teal-50 flex items-center justify-center text-teal-600 text-[10px] font-bold shrink-0 border border-slate-100 cursor-pointer hover:opacity-85 transition-opacity"
                                    title={`View ${reply.username}'s profile`}
                                  >
                                    {reply.avatar ? (
                                      <img
                                        src={reply.avatar}
                                        alt={reply.username}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      reply.username.charAt(0).toUpperCase()
                                    )}
                                  </div>
                                  <div className="flex-1 bg-slate-100/50 rounded-xl p-2.5">
                                    <h5
                                      onClick={() =>
                                        handleNavigateToUserProfile(
                                          reply.username,
                                        )
                                      }
                                      className="text-[11px] font-bold text-teal-600 mb-0.5 cursor-pointer hover:underline"
                                    >
                                      @{reply.username}
                                    </h5>
                                    <p className="text-xs text-slate-600 leading-normal break-words">
                                      {reply.text}
                                    </p>
                                    <span className="text-[9px] text-slate-400 font-medium block mt-1">
                                      {new Date(
                                        reply.timestamp,
                                      ).toLocaleTimeString(undefined, {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </span>
                                  </div>
                                </div>
                              ))}

                            {/* Inline Reply Input Field */}
                            {activeReplyTo === comment.id && (
                              <form
                                onSubmit={(e) => {
                                  e.preventDefault();
                                  handleAddReply(
                                    selectedPost.id,
                                    comment.id,
                                    replyInputText,
                                  );
                                }}
                                className="flex gap-2 pl-8 mt-2"
                              >
                                <input
                                  type="text"
                                  value={replyInputText}
                                  onChange={(e) =>
                                    setReplyInputText(e.target.value)
                                  }
                                  placeholder="Reply text..."
                                  maxLength={200}
                                  className="flex-1 bg-white border border-slate-200 rounded-full px-3.5 py-1.5 text-xs text-slate-700 outline-none focus:border-blue-500 transition-all"
                                />
                                <button
                                  type="submit"
                                  className="w-7 h-7 bg-teal-500 hover:bg-teal-600 text-white rounded-full flex items-center justify-center shadow-sm transition-all"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                </button>
                              </form>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </section>

                  {/* Comment Input Section */}
                  <section className="border-t border-gray-100 p-4 pb-5 -translate-y-2 md:translate-y-0 shrink-0 bg-white relative">
                    <div className="flex items-center gap-2 mb-2 select-none ">
                      <div
                        className="w-7 h-7 rounded-full overflow-hidden bg-blue-50 flex items-center
                       justify-center text-blue-600 text-[10px] font-black shrink-0 border border-slate-100"
                      >
                        {profile.photo ? (
                          <img
                            src={profile.photo}
                            alt={profile.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          profile.name.charAt(0)
                        )}
                      </div>
                      <span className="text-[11px] font-bold text-slate-500">
                        Add comment as you
                      </span>
                    </div>

                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleAddComment(selectedPost.id, commentInputText);
                      }}
                      className="flex items-center gap-2.5"
                    >
                      <button
                        type="button"
                        onClick={() => setEmojiPickerOpen(!emojiPickerOpen)}
                        className="text-xl hover:scale-110 active:scale-95 transition-all p-1"
                        title="Add emoji"
                      >
                        😊
                      </button>

                      {/* --- የኮሜንት መጻፊያ ሳጥን (Comment Input Textarea that wraps) --- */}
                      <textarea
                        value={commentInputText}
                        onChange={(e) => setCommentInputText(e.target.value)}
                        placeholder="Add comment..."
                        maxLength={300}
                        rows={1}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            if (commentInputText.trim()) {
                              handleAddComment(
                                selectedPost.id,
                                commentInputText,
                              );
                            }
                          }
                        }}
                        className="flex-1 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-slate-700 outline-none transition-all placeholder:text-slate-400 resize-none min-h-[38px] max-h-[90px] overflow-y-auto scrollbar-thin"
                      />

                      <button
                        type="submit"
                        disabled={!commentInputText.trim()}
                        className="w-10 h-10 bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-md transition-all shrink-0"
                      >
                        <Send className="w-4 h-4 text-white" />
                      </button>
                    </form>

                    {/* Emoji Picker Panel overlay */}
                    {emojiPickerOpen && (
                      <div className="absolute bottom-[72px] left-4 bg-white border border-gray-200 rounded-2xl shadow-xl p-2.5 grid grid-cols-8 gap-1.5 w-72 max-h-52 overflow-y-auto z-40 scrollbar-thin">
                        {[
                          "😊",
                          "😂",
                          "🔥",
                          "❤️",
                          "🙌",
                          "😍",
                          "👏",
                          "🎉",
                          "👍",
                          "😢",
                          "😮",
                          "🤔",
                          "💯",
                          "✨",
                          "💻",
                          "🚀",
                          "⭐",
                          "🎬",
                          "😜",
                          "💖",
                          "💡",
                          "🌈",
                          "⚡",
                          "🍿",
                          "🤣",
                          "🥰",
                          "🤩",
                          "😘",
                          "😋",
                          "😎",
                          "🤓",
                          "🧐",
                          "😏",
                          "🥳",
                          "😭",
                          "🥺",
                          "😤",
                          "😡",
                          "😱",
                          "😰",
                          "🤫",
                          "😑",
                          "💝",
                          "💕",
                          "💘",
                          "💜",
                          "💙",
                          "💚",
                          "💛",
                          "🧡",
                          "🤍",
                          "🤎",
                          "🖤",
                          "💔",
                          "❣️",
                          "💌",
                          "👎",
                          "🙏",
                          "🤝",
                          "👊",
                          "✊",
                          "🤛",
                          "🤜",
                          "✌️",
                          "🤟",
                          "🤘",
                          "👉",
                          "👈",
                          "👆",
                          "👇",
                          "☝️",
                          "✍️",
                          
                          "💪",
                          "🌟",
                          "💥",
                          "🌍",
                          "☕",
                          "🍕",
                          "🍻",
                          "📷",
                          "🎨",
                          "🎙️",
                          "🎧",
                        ].map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => {
                              setCommentInputText((prev) => prev + emoji);
                              setEmojiPickerOpen(false);
                            }}
                            className="text-lg hover:bg-blue-50 p-1.5 rounded-lg transition-colors flex items-center justify-center"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </section>
                </aside>

                {/* ===== Mobile Overlay HUD (Only on Mobile) ===== */}
                <div className="absolute inset-0 z-20 pointer-events-none md:hidden flex flex-col justify-between">
                  {/* Right Side Vertically Stacked Engagement Buttons */}
                  <div className="absolute right-4 bottom-28 flex flex-col gap-4 items-center pointer-events-auto z-30">
                    {/* Like Button */}
                    <button
                      onClick={() => handleToggleLikePost(selectedPost.id)}
                      className="flex flex-col items-center justify-center active:scale-90 transition-all focus:outline-none"
                    >
                      <div
                        className={`w-11 h-11 rounded-full bg-black/20 shadow-input backdrop-blur-md flex items-center justify-center border border-white/10 ${
                          selectedPost.liked ? "text-rose-500" : "text-white"
                        }`}
                      >
                        <Heart
                          className={`w-5.5 h-5.5 ${selectedPost.liked ? "fill-rose-500 text-rose-500" : ""}`}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-white mt-1 drop-shadow-md bg-black/25 px-1.5 py-0.5 rounded-full select-none">
                        {formatCount(selectedPost.likes)}
                      </span>
                    </button>

                    {/* Comment Button (Toggles Bottom Sheet) */}
                    <button
                      onClick={() => setMobileCommentsOpen(true)}
                      className="flex flex-col items-center justify-center active:scale-90 transition-all focus:outline-none"
                    >
                      <div className="w-11 h-11 rounded-full bg-black/20 shadow-input backdrop-blur-md flex items-center justify-center border border-white/10 text-white">
                        <MessageCircle className="w-5.5 h-5.5" />
                      </div>
                      <span className="text-[10px] font-bold text-white mt-1 drop-shadow-md bg-black/25 px-1.5 py-0.5 rounded-full select-none">
                        {formatCount(comments.length)}
                      </span>
                    </button>

                    {/* Save/Bookmark Button */}
                    <button
                      onClick={() => handleToggleSavePost(selectedPost.id)}
                      className="flex flex-col items-center justify-center active:scale-90 transition-all focus:outline-none"
                    >
                      <div
                        className={`w-11 h-11 rounded-full bg-black/20 shadow-input backdrop-blur-md flex items-center justify-center border border-white/10 ${
                          selectedPost.saved ? "text-amber-400" : "text-white"
                        }`}
                      >
                        <Bookmark
                          className={`w-5.5 h-5.5 ${selectedPost.saved ? "fill-amber-400 text-amber-400" : ""}`}
                        />
                      </div>
                      <span className="text-[10px] font-bold text-white mt-1 drop-shadow-md bg-black/25 px-1.5 py-0.5 rounded-full select-none">
                        {formatCount(selectedPost.saves)}
                      </span>
                    </button>

                    {/* Share Button */}
                    <button
                      onClick={() => handleSharePost(selectedPost.id)}
                      className="flex flex-col items-center justify-center active:scale-90 transition-all focus:outline-none"
                    >
                      <div className="w-11 h-11 rounded-full bg-black/20 shadow-input backdrop-blur-md flex items-center justify-center border border-white/10 text-white">
                        <Share2 className="w-5.5 h-5.5" />
                      </div>
                      <span className="text-[10px] font-bold text-white mt-1 drop-shadow-md bg-black/25 px-1.5 py-0.5 rounded-full select-none">
                        {shares > 0 ? formatCount(shares) : "Share"}
                      </span>
                    </button>
                  </div>

                  {/* Bottom Overlays: User info, desc, input form */}
                  <div className="absolute bottom-0 left-0 right-0 p-4 pb-5 bg-gradient-to-t from-black/90 via-black/55 to-transparent pointer-events-auto z-20 flex flex-col gap-2.5">
                    {/* User Details */}
                    <div className="flex items-center justify-between">
                      <div
                        onClick={() =>
                          handleNavigateToUserProfile(postAuthor.username)
                        }
                        className="flex items-center gap-2.5 cursor-pointer hover:opacity-85 active:scale-95 transition-all max-w-[85%]"
                      >
                        <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-white bg-slate-800 flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {postAuthor.photo ? (
                            <img
                              src={postAuthor.photo}
                              alt={postAuthor.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            postAuthor.name.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[13px] font-bold text-white drop-shadow-md truncate">
                              {postAuthor.name}
                            </span>
                            <span className="text-[10px] text-white/70 font-medium truncate">
                              @{postAuthor.username}
                            </span>

                            {/* --- የፖስት ፈጣሪ መከታተያ ቁልፍ በቪዲዮ ማጫወቻው ላይ (Overlay Post Author Follow Button) --- */}
                            {!isOwnPost && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFollowUser(authorIndex);
                                }}
                                className={`px-2.5 py-1 text-[10px] font-black rounded-lg transition-all ml-1.5 ${
                                  postAuthor.isFollowing
                                    ? "bg-white/20 text-white border border-white/20 backdrop-blur-sm"
                                    : "bg-gradient-to-b from-[#019BE5] via-[#0185E5] to-[#0071E3] text-white hover:opacity-95 shadow-sm"
                                }`}
                              >
                                {postAuthor.isFollowing
                                  ? "Following"
                                  : "Follow"}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-[12px] text-white/95 leading-relaxed break-words line-clamp-2 max-h-16 overflow-y-auto pr-2">
                      {selectedPost.description
                        .split(/(\s+)/)
                        .map((word, i) => {
                          if (word.startsWith("#")) {
                            return (
                              <span
                                key={i}
                                className="text-blue-400 font-bold hover:underline cursor-pointer"
                              >
                                {word}
                              </span>
                            );
                          }
                          return <span key={i}>{word}</span>;
                        })}
                    </p>

                    {/* Comment Input Container */}
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleAddComment(selectedPost.id, commentInputText);
                      }}
                      className="flex items-center gap-3 mb-10 md:mb-0 relative"
                    >
                      <button
                        type="button"
                        onClick={() => setEmojiPickerOpen(!emojiPickerOpen)}
                        className="text-2xl  active:scale-90 transition-all p-1"
                        title="Add emoji"
                      >
                        😊
                      </button>

                      {/* --- የኮሜንት መጻፊያ ሳጥን (Comment Input Textarea that wraps) --- */}
                      <textarea
                        value={commentInputText}
                        onChange={(e) => setCommentInputText(e.target.value)}
                        placeholder="Add comment..."
                        maxLength={300}
                        rows={1}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            if (commentInputText.trim()) {
                              handleAddComment(
                                selectedPost.id,
                                commentInputText,
                              );
                            }
                          }
                        }}
                        className="flex-1 bg-input border border-input-border focus:border-input-focus
                        shadow-input rounded-2xl px-4.5 py-3 text-[14px] text-white placeholder:text-input-placeholder
                         outline-none backdrop-blur-md resize-none min-h-[46px] max-h-[100px] overflow-y-auto scrollbar-thin
                          font-medium"
                      />

                      <button
                        type="submit"
                        disabled={!commentInputText.trim()}
                        className="w-10 h-10 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-white
                         rounded-full flex items-center justify-center shadow-md transition-all shrink-0 active:scale-90"
                      >
                        <Send className="w-4 h-4 text-white" />
                      </button>

                      {/* Emoji Picker Panel overlay for mobile overlay input */}
                      {emojiPickerOpen && (
                        <div
                          className="absolute bottom-[60px] left-0 bg-input border border-gray-200
                         rounded-2xl shadow-xl p-2.5 grid grid-cols-8 gap-1.5 w-72 max-h-48
                          overflow-y-auto z-50 scrollbar-thin"
                        >
                          {[
                            "😊",
                            "😂",
                            "🔥",
                            "❤️",
                            "🙌",
                            "😍",
                            "👏",
                            "🎉",
                            "👍",
                            "😢",
                            "😮",
                            "🤔",
                            "💯",
                            "✨",
                            "💻",
                            "🚀",
                            "⭐",
                            "🎬",
                            "😜",
                            "💖",
                            "💡",
                            "🌈",
                            "🤣",
                            "🥰",
                            "🤩",
                            "😘",
                            "😋",
                            "😎",
                            "🤓",
                            "🧐",
                            "😏",
                            "🥳",
                            "😭",
                            "🥺",
                            "😤",
                            "😡",
                            "😱",
                            "😰",
                            "🤫",
                            "😑",
                            "👎",
                            "🙏",
                            "🤝",
                            "👊",
                            "✊",
                            "🤛",
                            "🤜",
                            "✌️",
                            "🤟",
                            "🤘",
                            "👉",
                            "👈",
                            "👆",
                            "👇",
                            "☝️",
                            "✍️",
                            "💪",
                          ].map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => {
                                setCommentInputText((prev) => prev + emoji);
                                setEmojiPickerOpen(false);
                              }}
                              className="text-lg hover:bg-blue-50 p-1.5 rounded-lg transition-colors flex items-center justify-center"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}
                    </form>
                  </div>
                </div>

                {/* ===== Mobile Comments Bottom-Drawer (Only on Mobile) ===== */}
                {mobileCommentsOpen && (
                  <>
                    {/* Translucent backdrop */}
                    <div
                      className="fixed inset-0 bg-black/60 z-40 md:hidden"
                      onClick={() => setMobileCommentsOpen(false)}
                    />

                    {/* Slide-up Container */}
                    <div className="fixed inset-x-0 bottom-0 h-[82vh] max-h-[82vh] bg-white rounded-t-[32px] shadow-2xl z-50 flex flex-col transition-all duration-300 md:hidden overflow-hidden pointer-events-auto">
                      {/* Drawer Handle & Header */}
                      <div className="p-4 border-b border-gray-100 flex items-center justify-between shrink-0 bg-slate-50/50">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-800">
                            Comments
                          </h3>
                          <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {comments.length}
                          </span>
                        </div>

                        {/* Close comments drawer */}
                        <button
                          onClick={() => setMobileCommentsOpen(false)}
                          className="text-slate-400 hover:text-slate-600 text-xs font-bold px-2 py-1"
                        >
                          Close
                        </button>
                      </div>

                      {/* Drawer Scrollable Comments List */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {comments.length === 0 ? (
                          <div className="text-center text-slate-400 text-sm py-12 flex flex-col items-center justify-center">
                            <span className="text-2xl mb-1">💬</span>
                            <p className="font-bold text-slate-500">
                              No comments yet
                            </p>
                            <p className="text-xs text-slate-400">
                              Be the first to share your thoughts!
                            </p>
                          </div>
                        ) : (
                          comments.map((comment) => (
                            <div key={comment.id} className="space-y-2.5">
                              <div className="flex gap-2.5 items-start">
                                <div
                                  onClick={() => {
                                    setMobileCommentsOpen(false);
                                    handleNavigateToUserProfile(
                                      comment.username,
                                    );
                                  }}
                                  className="w-9 h-9 rounded-full overflow-hidden bg-blue-50 flex items-center justify-center text-blue-600 text-xs font-bold shrink-0 border border-slate-100 cursor-pointer active:scale-95 transition-transform"
                                  title={`View ${comment.username}'s profile`}
                                >
                                  {comment.avatar ? (
                                    <img
                                      src={comment.avatar}
                                      alt={comment.username}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    comment.username.charAt(0).toUpperCase()
                                  )}
                                </div>
                                {/* --- የሞባይል ኮሜንት ካርድ ኮንቲነር (Mobile Comment Container - Expanded and styled) --- */}
                                <div
                                  className="flex-1 bg-slate-50 rounded-2xl py-3.5 px-4.5 border-l-3
                                  border-blue-400 shadow-sm transition-all hover:bg-slate-100/70"
                                >
                                  <h4
                                    onClick={() => {
                                      setMobileCommentsOpen(false);
                                      handleNavigateToUserProfile(
                                        comment.username,
                                      );
                                    }}
                                    className="text-[12px] font-bold text-blue-600 mb-1 cursor-pointer hover:underline"
                                  >
                                    @{comment.username}
                                  </h4>
                                  <p className="text-[13.5px] text-slate-800 leading-relaxed break-words font-medium">
                                    {comment.text}
                                  </p>

                                  <div className="flex items-center gap-4 mt-2 text-[10px] font-bold text-slate-400">
                                    <span>
                                      {new Date(
                                        comment.timestamp,
                                      ).toLocaleTimeString(undefined, {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </span>

                                    {/* --- የልብ ቅርጽ ኮሜንት ላይክ ማድረጊያ በሞባይል (Mobile Heart Icon Comment Like button) --- */}
                                    <button
                                      onClick={() =>
                                        handleToggleCommentLike(
                                          selectedPost.id,
                                          comment.id,
                                        )
                                      }
                                      className={`flex items-center gap-1 hover:text-rose-600 ${comment.liked ? "text-rose-500" : "text-slate-400"}`}
                                      title="Like comment"
                                    >
                                      <Heart
                                        className={`w-3.5 h-3.5 ${comment.liked ? "fill-rose-500 text-rose-500" : ""}`}
                                      />
                                      <span>{comment.likesCount || 0}</span>
                                    </button>

                                    <button
                                      onClick={() => {
                                        if (activeReplyTo === comment.id) {
                                          setActiveReplyTo(null);
                                        } else {
                                          setActiveReplyTo(comment.id);
                                        }
                                      }}
                                      className="text-blue-500 hover:underline"
                                    >
                                      Reply
                                    </button>

                                    {comment.username === profile.username && (
                                      <button
                                        onClick={() =>
                                          handleDeleteComment(
                                            selectedPost.id,
                                            comment.id,
                                          )
                                        }
                                        className="text-slate-400 hover:text-rose-600 ml-auto"
                                      >
                                        Delete
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Sub-Replies */}
                              {comment.replies &&
                                comment.replies.map((reply) => (
                                  <div
                                    key={reply.id}
                                    className="flex gap-2 items-start pl-6"
                                  >
                                    <div
                                      onClick={() => {
                                        setMobileCommentsOpen(false);
                                        handleNavigateToUserProfile(
                                          reply.username,
                                        );
                                      }}
                                      className="w-5.5 h-5.5 rounded-full overflow-hidden bg-teal-50 flex items-center justify-center text-teal-600 text-[8px] font-bold shrink-0 border border-slate-100 cursor-pointer active:scale-95 transition-transform"
                                      title={`View ${reply.username}'s profile`}
                                    >
                                      {reply.avatar ? (
                                        <img
                                          src={reply.avatar}
                                          alt={reply.username}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        reply.username.charAt(0).toUpperCase()
                                      )}
                                    </div>
                                    <div className="flex-1 bg-slate-100/70 rounded-xl py-2 px-3 border-l border-teal-500/20">
                                      <h5
                                        onClick={() => {
                                          setMobileCommentsOpen(false);
                                          handleNavigateToUserProfile(
                                            reply.username,
                                          );
                                        }}
                                        className="text-[11px] font-bold text-teal-600 mb-0.5 cursor-pointer hover:underline"
                                      >
                                        @{reply.username}
                                      </h5>
                                      <p className="text-[12px] text-slate-700 leading-relaxed break-words font-medium">
                                        {reply.text}
                                      </p>
                                      <span className="text-[8px] text-slate-400 block mt-0.5">
                                        {new Date(
                                          reply.timestamp,
                                        ).toLocaleTimeString(undefined, {
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })}
                                      </span>
                                    </div>
                                  </div>
                                ))}

                              {/* Inline Reply Form */}
                              {activeReplyTo === comment.id && (
                                <form
                                  onSubmit={(e) => {
                                    e.preventDefault();
                                    handleAddReply(
                                      selectedPost.id,
                                      comment.id,
                                      replyInputText,
                                    );
                                  }}
                                  className="flex gap-2 pl-6 mt-1.5"
                                >
                                  <input
                                    type="text"
                                    value={replyInputText}
                                    onChange={(e) =>
                                      setReplyInputText(e.target.value)
                                    }
                                    placeholder="Reply text..."
                                    maxLength={200}
                                    className="flex-1 bg-input border border-input-border rounded-xl px-4 py-2 
                                    text-[12.5px] h-9 focus:border-input-focus transition-all text-input-text
                                    placeholder:placeholder-input-placeholder shadow-input outline-none"
                                  />
                                  <button
                                    type="submit"
                                    className="w-8.5 h-8.5 bg-success text-white 
                                    rounded-xl flex items-center justify-center
                                     shadow-sm shrink-0 active:scale-90 transition-transform"
                                  >
                                    <Send className="w-3.5 h-3.5" />
                                  </button>
                                </form>
                              )}
                            </div>
                          ))
                        )}
                      </div>

                      {/* Comment Form inside the bottom sheet drawer */}
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleAddComment(selectedPost.id, commentInputText);
                        }}
                        className="border-t border-gray-100 p-4  bg-white flex items-center gap-3
                         shrink-0 mb-13 md:mb-0 pb-6 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]"
                      >
                        {/* --- የኮሜንት መጻፊያ ሳጥን (Comment Input Textarea that wraps) --- */}
                        <textarea
                          value={commentInputText}
                          onChange={(e) => setCommentInputText(e.target.value)}
                          placeholder="Add comment to this post..."
                          maxLength={300}
                          rows={1}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              if (commentInputText.trim()) {
                                handleAddComment(
                                  selectedPost.id,
                                  commentInputText,
                                );
                              }
                            }
                          }}
                          className="flex-1 bg-input border border-input-border focus:border-input-focus
                           rounded-2xl px-4.5 py-3 text-[14px] text-input-text outline-none resize-none 
                           min-h-[46px] max-h-[100px] overflow-y-auto scrollbar-thin font-medium transition-all
                            shadow-input placeholder:placeholder-input-placeholder"
                        />
                        <button
                          type="submit"
                          disabled={!commentInputText.trim()}
                          className="w-10 h-10 bg-success sabled:opacity-40 text-white
                           rounded-full flex items-center justify-center shadow-md shrink-0 active:scale-95
                             transition-transform"
                        >
                          <Send className="w-4.5 h-4.5 text-white" />
                        </button>
                      </form>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })()}

      {/* ========================================================
          MODAL: EXPLORE OTHER 
          ======================================================== */}
      {isOthersModalOpen && (
        <div className="fixed inset-0 bg-black/65 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl max-h-[80vh] overflow-hidden border border-gray-100 flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-slate-50 shrink-0">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-black tracking-tight text-gray-900">
                  Explore
                </h3>
              </div>
              <button
                onClick={() => setIsOthersModalOpen(false)}
                className="p-1.5 hover:bg-gray-100 text-gray-400 hover:text-gray-700 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List */}
            <div className="p-4 overflow-y-auto divide-y divide-gray-100 space-y-3 flex-1">
              {otherUsers.map((user, idx) => {
                const initials = user.name
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);
                return (
                  <div
                    key={user.id}
                    className="flex items-center justify-between pt-3 pb-1 first:pt-0"
                  >
                    {/* User Info Block (clickable to navigate) */}
                    <div
                      onClick={() => {
                        setSelectedOtherUser(idx);
                        setViewMode("other");
                        setIsOthersModalOpen(false);
                      }}
                      className="flex items-center gap-3 cursor-pointer group flex-1 mr-4 min-w-0"
                    >
                      {/* Beautiful Gradient Initials Avatar */}
                      <div
                        className={`w-11 h-11 rounded-full bg-gradient-to-tr ${user.gradient} flex items-center justify-center text-white text-sm font-black shadow-inner shrink-0 group-hover:scale-105 transition-transform duration-200`}
                      >
                        {initials}
                      </div>

                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-black text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                          {user.name}
                        </span>
                        <span className="text-xs text-gray-400 font-bold tracking-wide">
                          @{user.username}
                        </span>
                        {/* Visits/Logins Count info */}
                        <span className="text-[10px] text-emerald-600 font-extrabold bg-emerald-50 self-start px-1.5 py-0.5 rounded-full mt-1">
                          Logins: {user.loginsCount} • {user.posts.length} posts
                        </span>
                      </div>
                    </div>

                    {/* --- በሌሎች ተጠቃሚዎች ዝርዝር ላይ ያለ መከታተያ ቁልፍ (Other Developers List Follow Button) --- */}
                    <button
                      onClick={() => toggleFollowUser(idx)}
                      className={`px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider transition-all shrink-0 ${
                        user.isFollowing
                          ? "bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-200"
                          : "bg-gradient-to-b from-[#019BE5] via-[#0185E5] to-[#0071E3] text-white hover:opacity-95 shadow-sm shadow-blue-100"
                      }`}
                    >
                      {user.isFollowing ? "Following" : "Follow"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
      {/* ሱሻል ሚዲያ ማጋሪያ ሞዳል (Social Media Share Modal) */}
      <ShareModal
        post={shareModalPost}
        isOpen={shareModalPost !== null}
        onClose={() => setShareModalPost(null)}
        onShareIncrement={handleIncrementShare}
      />

      {/* ቆንጆ የተጠቃሚ ማረጋገጫ ሞዳል (Custom styled Confirm Delete Dialog) */}
      {/* ለወደፊቱ ከ PostgreSQL ዳታቤዝ ጋር ሲያያዝ፡ ተጠቃሚው 'Delete' ሲጫን እዚህ ላይ የነበረው 'executeDeleteAction' የ 'DELETE' ጥያቄ ወደ backend API (ለምሳሌ: fetch('/api/posts/' + id, {method: 'DELETE'})) ያደርጋል። */}
      {deleteConfirmState?.isOpen && (
        <div className="fixed inset-0 bg-black/65 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-gray-100 flex flex-col text-center">
            <div className="w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-4 text-rose-500 animate-pulse">
              <Trash2 className="w-7 h-7 stroke-[2]" />
            </div>

            <h3 className="text-lg font-black text-slate-800 tracking-tight mb-2">
              {deleteConfirmState.type === "post"
                ? "Delete Post?"
                : "Delete Comment?"}
            </h3>

            <p className="text-xs text-slate-500 font-semibold mb-6 leading-relaxed">
              {deleteConfirmState.type === "post"
                ? "Are you sure you want to delete this post permanently? This action cannot be undone."
                : "Are you sure you want to delete this comment? This action cannot be undone."}
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirmState(null)}
                className="flex-1 py-3 px-4 rounded-xl text-xs font-black text-slate-500 bg-slate-100 hover:bg-slate-200 transition-all active:scale-95 outline-none"
              >
                Cancel
              </button>
              <button
                onClick={executeDeleteAction}
                className="flex-1 py-3 px-4 rounded-xl text-xs font-black text-white bg-rose-600 hover:bg-rose-700 shadow-lg shadow-rose-200 transition-all active:scale-95 outline-none"
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
