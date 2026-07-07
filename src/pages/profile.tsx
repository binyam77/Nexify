/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../routes";
import {
  ArrowLeft,
  X,
  Camera,
  Trash2,
  Edit,
  Send,
} from "lucide-react";
import { saveMediaFile, getMediaFile, deleteMediaFile } from "../lib/db";
import ShareModal from "../components/ShareModal";
import { useFeed } from "../context/FeedContext";
import type { PostMeta, CommentItem, FeedPost, OtherCreator } from "../types";

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
  }) => void;
}

export default function Profile({
  onBackToCommunity,
  triggerGlobalUpload,
  onClearGlobalUpload,
  onStartChat,
}: ProfileProps) {
  // --- መለያ ፍቃድ መቆጣጠሪያ (Auth System Hooks) ---
  const { user, login, updateFollowCount } = useAuth();
  const { posts: feedPosts, addPost } = useFeed();
  const navigate = useNavigate();

  // --- የተጠቃሚ መገለጫ ሁኔታ መቆጣጠሪያ (Profile Information States) ---
  const [profile, setProfile] = useState({
    name: user?.username || "User",
    username: user?.username || "username",
    bio: "",
    photo: "/default_avatar.jpg",
    cover: "",
  });

  // --- የእይታ ሁኔታ መቆጣጠሪያ ('me' = እኔ/My profile, 'other' = ሌላ ባለሙያ/Other developer) ---
  const [viewMode, setViewMode] = useState<"me" | "other">("me");
  const [selectedOtherUser, setSelectedOtherUser] = useState<number>(0);
  const [isOthersModalOpen, setIsOthersModalOpen] = useState(false);

  // --- የሌሎች ተጠቃሚዎች መረጃ ዳታቤዝ (Other Creators Database for browsing) ---
  const [otherUsers, setOtherUsers] = useState<OtherCreator[]>([
    {
      id: 1,
      name: "Abel T.",
      username: "abel_codes",
      photo: "",
      gradient: "from-emerald-500 to-teal-600",
      isFollowing: false,
      followersCount: 1540,
      followingCount: 320,
      bio: "Passionate Fullstack Developer at Nexify. Passionate about beautiful interfaces, responsive layouts, and cloud architectures. 🚀💻",
      loginsCount: 14,
      posts: [
        {
          id: 1001,
          title: "Focus on Goals",
          isVideo: true,
          description: "Focus on your goals, everything else is just a distraction 🎬🔥 #goals #motivation #growth",
          hashtags: ["#goals", "#motivation", "#growth"],
          username: "abel_codes",
          avatar: null,
          views: 342,
          likes: 125,
          liked: false,
          saves: 45,
          saved: false,
          timestamp: new Date().toISOString(),
          thumbnail: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80",
        },
        {
          id: 1002,
          title: "Developer Desk",
          isVideo: false,
          description: "Rate my custom multi-monitor development workspace setup! 💻🔥 #workstation #developer #desksetup",
          hashtags: ["#workstation", "#developer", "#desksetup"],
          username: "abel_codes",
          avatar: null,
          views: 1204,
          likes: 412,
          liked: false,
          saves: 85,
          saved: false,
          timestamp: new Date().toISOString(),
          thumbnail: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=400&q=80",
        }
      ]
    },
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
          id: 1003,
          title: "Tailwind Styling Tricks",
          isVideo: false,
          description: "Check out these seamless custom theme setups using Tailwind CSS! #design #tailwind #coding",
          hashtags: ["#design", "#tailwind", "#coding"],
          username: "betty_dev",
          avatar: null,
          views: 940,
          likes: 310,
          liked: false,
          saves: 45,
          saved: false,
          timestamp: new Date().toISOString(),
          thumbnail: "https://images.unsplash.com/photo-1541462608143-67571c6738dd?auto=format&fit=crop&w=400&q=80",
        }
      ]
    }
  ]);

  const otherProfile = otherUsers[selectedOtherUser] || null;

  // --- ተከታታይ እና የሚከታተሏቸው ቁጥር ሁኔታዎች (Followers & Following counts) ---
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [starsCount, setStarsCount] = useState(0); // starsCount represents Following count!

  // --- የልጥፎች መረጃ (User posts collection) ---
  const [posts, setPosts] = useState<PostMeta[]>([]);
  const [mediaUrls, setMediaUrls] = useState<Record<number, string>>({});

  // --- የልጥፍ እይታ እና የማጋሪያ ሁኔታ መቆጣጠሪያዎች (Player and Share Modal states) ---
  const [selectedPost, setSelectedPost] = useState<PostMeta | null>(null);
  const [selectedMediaSrc, setSelectedMediaSrc] = useState<string | null>(null);
  const [shareModalPost, setShareModalPost] = useState<PostMeta | null>(null);

  // --- የአስተያየት እና ሼሮች ካርታ (Engagement Comments Maps in LocalStorage) ---
  const [commentsMap, setCommentsMap] = useState<Record<number, CommentItem[]>>(() => {
    try {
      const saved = localStorage.getItem("postCommentsMap");
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  const [shareCounts, setShareCounts] = useState<Record<number, number>>(() => {
    try {
      const saved = localStorage.getItem("postShareCounts");
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  // --- የተጠቃሚ ገፅ ሞዳሎች መቆጣጠሪያዎች (UI Dialog / Modals display togglers) ---
  const [activeTab, setActiveTab] = useState<"posts" | "video" | "likes">("posts");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isBioExpanded, setIsBioExpanded] = useState(false);

  // --- የማረጋገጫ ሞዳል ሁኔታ መቆጣጠሪያ (Custom Styled Delete Confirmation Modal state) ---
  const [deleteConfirmState, setDeleteConfirmState] = useState<{
    isOpen: boolean;
    type: "post" | "comment";
    postId: number;
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
      })
    );
  };

  // --- የተጠቃሚ መገለጫ መረጃ መጫኛ (Load profile metadata from LocalStorage) ---
  useEffect(() => {
    const savedProfile = localStorage.getItem("userProfile");
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        setProfile({
          name: parsed.name || user?.username || "User",
          username: parsed.username || user?.username || "username",
          bio: parsed.bio || user?.bio || "",
          photo: parsed.photo || user?.photo || "/default_avatar.jpg",
          cover: parsed.cover || "",
        });
      } catch (e) {
        console.error("Error loading profile:", e);
      }
    } else {
      const defaultData = {
        name: user?.username || "User",
        username: user?.username || "username",
        bio: "Lead Fullstack Developer at Nexify. Passionate about beautiful interfaces, responsive layouts, and clean code architectures.",
        photo: "/default_avatar.jpg",
        cover: "",
      };
      setProfile(defaultData);
      localStorage.setItem("userProfile", JSON.stringify(defaultData));
    }

    // Followers system configuration
    const savedIsFollowing = localStorage.getItem("isFollowing") === "true";
    const savedCountF = localStorage.getItem("countF");
    setIsFollowing(savedIsFollowing);
    if (savedCountF !== null) {
      setFollowersCount(parseInt(savedCountF, 10));
    } else {
      setFollowersCount(152); // Default count
    }

    const savedCountS = localStorage.getItem("countS");
    if (savedCountS !== null) {
      setStarsCount(parseInt(savedCountS, 10));
    } else {
      setStarsCount(84); // Default Following count
    }

    // Load user published posts list metadata
    const savedPosts = localStorage.getItem("userPostsMeta");
    if (savedPosts) {
      try {
        setPosts(JSON.parse(savedPosts));
      } catch (e) {
        console.error("Error loading posts:", e);
        setPosts([]);
      }
    } else {
      // Add a default post for new users
      const initialPosts: PostMeta[] = [
        {
          id: 1005,
          title: "Focus on Goals",
          isVideo: true,
          fileName: "sample.mp4",
          description: "Focus on your goals, everything else is just a distraction 🎯🎬 #goals #motivation",
          hashtags: ["#goals", "#motivation"],
          username: "binjam",
          avatar: null,
          views: 1205,
          likes: 489,
          liked: true,
          saves: 110,
          saved: false,
          timestamp: new Date().toISOString(),
          thumbnail: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80",
        }
      ];
      setPosts(initialPosts);
      localStorage.setItem("userPostsMeta", JSON.stringify(initialPosts));
    }
  }, [feedPosts.length]);

  // --- ውጫዊ ሚዲያ መጫኛ መቆጣጠሪያ (Manage background uploads from outside) ---
  useEffect(() => {
    if (triggerGlobalUpload && fileInputRef.current) {
      fileInputRef.current.click();
      if (onClearGlobalUpload) {
        onClearGlobalUpload();
      }
    }
  }, [triggerGlobalUpload, onClearGlobalUpload]);

  // --- የሚዲያ አድራሻዎች መከታተያ (Download file binaries from IndexedDB) ---
  useEffect(() => {
    async function loadBlobs() {
      const urls: Record<number, string> = {};
      for (const post of posts) {
        if (post.id > 2000) {
          try {
            const blob = await getMediaFile(post.id);
            if (blob) {
              urls[post.id] = URL.createObjectURL(blob);
            }
          } catch (e) {
            console.error(`Failed loading blob for post ${post.id}:`, e);
          }
        }
      }
      setMediaUrls((prev) => ({ ...prev, ...urls }));
    }
    loadBlobs();

    return () => {
      Object.values(mediaUrls).forEach((url) => URL.revokeObjectURL(url as string));
    };
  }, [posts]);

  // --- የቪዲዮ ማጫወቻ ገፅ ክፈት (Open media viewport modal) ---
  const handleOpenPlayer = async (post: PostMeta) => {
    setSelectedPost(post);
    if (post.id <= 2000) {
      setSelectedMediaSrc("");
    } else {
      const src = mediaUrls[post.id] || "";
      setSelectedMediaSrc(src);
    }

    // views increments handler
    const viewedKey = "viewedPostIds";
    const viewed = JSON.parse(localStorage.getItem(viewedKey) || "[]");
    if (!viewed.includes(post.id)) {
      viewed.push(post.id);
      localStorage.setItem(viewedKey, JSON.stringify(viewed));

      const updated = posts.map((p) =>
        p.id === post.id ? { ...p, views: p.views + 1 } : p
      );
      setPosts(updated);
      localStorage.setItem("userPostsMeta", JSON.stringify(updated));
    }
  };

  const handleClosePlayer = () => {
    setSelectedPost(null);
    setSelectedMediaSrc(null);
  };

  // --- በልጥፎች መካከል ተንሸራተህ እይ (Browse Next/Prev posts easily) ---
  const handleNavigatePost = (direction: "next" | "prev") => {
    const currentList = viewMode === "me" ? posts : otherProfile.posts;
    const currentIndex = currentList.findIndex((p: any) => p.id === selectedPost?.id);
    if (currentIndex === -1) return;

    let nextIndex = currentIndex + (direction === "next" ? 1 : -1);
    if (nextIndex >= 0 && nextIndex < currentList.length) {
      const nextPost = currentList[nextIndex];
      setSelectedPost(nextPost);
      if (nextPost.id <= 2000) {
        setSelectedMediaSrc("");
      } else {
        setSelectedMediaSrc(mediaUrls[nextPost.id] || "");
      }
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
  }, [selectedPost, viewMode, posts, otherUsers]);

  // --- ላይክ ተግባራት (Toggle like actions) ---
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

    if (selectedPost?.id === postId) {
      setSelectedPost((prev) =>
        prev
          ? {
              ...prev,
              liked: !prev.liked,
              likes: !prev.liked ? prev.likes + 1 : prev.likes - 1,
            }
          : null
      );
    }
  };

  // --- ሴቭ ተግባራት (Toggle save actions) ---
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

    if (selectedPost?.id === postId) {
      setSelectedPost((prev) =>
        prev
          ? {
              ...prev,
              saved: !prev.saved,
              saves: !prev.saved ? prev.saves + 1 : prev.saves - 1,
            }
          : null
      );
    }
  };

  // --- አስተያየት መጨመርያ (Add comments on a post) ---
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
  };

  // --- የአስተያየት ላይክ መቆጣጠሪያ (Like comment toggler) ---
  const handleToggleCommentLike = (postId: number, commentId: number) => {
    const list = commentsMap[postId] || [];
    const updatedComments = list.map((c) => {
      if (c.id === commentId) {
        const liked = !c.liked;
        return {
          ...c,
          liked,
          likesCount: liked ? (c.likesCount || 0) + 1 : Math.max(0, (c.likesCount || 0) - 1),
        };
      }
      return c;
    });

    const updated = { ...commentsMap, [postId]: updatedComments };
    setCommentsMap(updated);
    localStorage.setItem("postCommentsMap", JSON.stringify(updated));
  };

  // --- የአስተያየት ምላሽ (Add replies inside a comment) ---
  const handleAddReply = (postId: number, commentId: number, text: string) => {
    if (!text.trim()) return;
    const list = commentsMap[postId] || [];
    const updatedComments = list.map((c) => {
      if (c.id === commentId) {
        const reply = {
          id: Date.now(),
          username: profile.username,
          avatar: profile.photo || null,
          text: text.trim(),
          timestamp: new Date().toISOString(),
        };
        return { ...c, replies: [...(c.replies || []), reply] };
      }
      return c;
    });

    const updated = { ...commentsMap, [postId]: updatedComments };
    setCommentsMap(updated);
    localStorage.setItem("postCommentsMap", JSON.stringify(updated));
  };

  // --- የአስተያየት ማጥፊያ ማረጋገጫ (Comment deletion trigger) ---
  const handleDeleteComment = (postId: number, commentId: number) => {
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
    maxWidth: number
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
          const compressed = await compressImage(ev.target.result as string, 0.6, 400);
          const updated = { ...profile, photo: compressed };
          setProfile(updated);
          localStorage.setItem("userProfile", JSON.stringify(updated));
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
          const compressed = await compressImage(ev.target.result as string, 0.6, 800);
          const updated = { ...profile, cover: compressed };
          setProfile(updated);
          localStorage.setItem("userProfile", JSON.stringify(updated));
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
        if (selectedPost?.id === postId) {
          handleClosePlayer();
        }
      } catch (err) {
        console.error("Failed to delete post:", err);
      }
    } else if (type === "comment" && commentId !== undefined) {
      const list = commentsMap[postId] || [];
      const updatedComments = list.filter((c) => c.id !== commentId);
      const updated = { ...commentsMap, [postId]: updatedComments };
      setCommentsMap(updated);
      localStorage.setItem("postCommentsMap", JSON.stringify(updated));
    }
    setDeleteConfirmState(null);
  };

  // --- ፖስት ማጋሪያ መቆጣጠሪያ (Increase share counts of posts) ---
  const handleIncrementShare = (postId: number) => {
    const current = shareCounts[postId] || 0;
    const updated = { ...shareCounts, [postId]: current + 1 };
    setShareCounts(updated);
    localStorage.setItem("postShareCounts", JSON.stringify(updated));
  };

  const handleSharePost = (postId: number) => {
    const found = posts.find((p) => p.id === postId) || null;
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
    const updated = {
      name: editName.trim(),
      username: editUsername.trim().toLowerCase(),
      bio: editBio.trim(),
      photo: editPhotoPreview,
      cover: editCoverPreview,
    };
    setProfile(updated);
    localStorage.setItem("userProfile", JSON.stringify(updated));
    setIsEditModalOpen(false);
  };

  const handlePhotoUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const r = new FileReader();
      r.onload = async (ev) => {
        if (ev.target?.result) {
          const compressed = await compressImage(ev.target.result as string, 0.6, 400);
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
          const compressed = await compressImage(ev.target.result as string, 0.6, 800);
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

      const feedPost: FeedPost = {
        id: String(postId),
        userId: user?.username || "me",
        username: profile.username,
        userAvatar: profile.photo || "",
        type: uploadIsVideo ? "video" : "photo",
        mediaUrls: [URL.createObjectURL(uploadFile)],
        caption: uploadDescription,
        hashtags,
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

      setIsUploadModalOpen(false);
      setUploadFile(null);
      setUploadDescription("");
      setUploadThumbnail("");
    } catch (e) {
      console.error("Failed to post media:", e);
      alert("Failed to publish post. Try using a smaller file.");
    }
  };

  const handleDeletePost = (postId: number, e?: React.MouseEvent) => {
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

  const activePostsToRender = viewMode === "me" ? posts : otherProfile?.posts || [];
  const filteredPosts = activePostsToRender.filter((post) => {
    if (activeTab === "posts") return true;
    if (activeTab === "video") return post.isVideo;
    if (activeTab === "likes") return post.liked;
    return true;
  });

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-gray-50 pb-20 md:pb-6" id="profile-container">
      
      {/* 1. Header Navigation banner */}
      <header className="sticky top-0 left-0 right-0 h-16 bg-gradient-to-r hidden md:block bg-slate-900 shadow-md z-40 flex items-center justify-between px-4 md:px-8 shrink-0">
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
      </header>

      {/* Hidden File inputs */}
      <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="video/*,image/*" className="hidden" />
      <input type="file" ref={directPhotoInputRef} onChange={handleDirectPhotoChange} accept="image/*" className="hidden" />
      <input type="file" ref={directCoverInputRef} onChange={handleDirectCoverChange} accept="image/*" className="hidden" />

      {/* 2. Top Profile Header & bio info */}
      <UserProfile
        profile={profile}
        otherProfile={viewMode === "other" ? otherProfile : null}
        viewMode={viewMode}
        followersCount={followersCount}
        starsCount={starsCount}
        postsCount={posts.length}
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
          mediaUrls={mediaUrls}
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
        <div className="fixed inset-0 bg-black/65 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto border border-gray-100 flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="text-lg font-black tracking-tight text-gray-900">Edit Profile</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="p-1.5 hover:bg-gray-100 text-gray-400 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <span className="block text-xs font-extrabold tracking-wider text-gray-400 uppercase mb-2">Cover Photo Banner</span>
                <div onClick={() => coverInputRef.current?.click()} className="w-full h-28 rounded-xl bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center cursor-pointer overflow-hidden relative group">
                  {editCoverPreview ? (
                    <>
                      <img src={editCoverPreview} alt="Cover preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="w-6 h-6 text-white" />
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center text-gray-400">
                      <Camera className="w-6 h-6 mb-1 text-gray-300" />
                      <span className="text-xs font-semibold">Change Banner Cover</span>
                    </div>
                  )}
                </div>
                <input type="file" ref={coverInputRef} onChange={handleCoverUploadChange} accept="image/*" className="hidden" />
              </div>

              <div className="flex items-center gap-4">
                <div onClick={() => photoInputRef.current?.click()} className="w-16 h-16 rounded-full bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer overflow-hidden relative group shrink-0">
                  {editPhotoPreview ? (
                    <>
                      <img src={editPhotoPreview} alt="Avatar preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="w-4 h-4 text-white" />
                      </div>
                    </>
                  ) : (
                    <Camera className="w-5 h-5 text-gray-300" />
                  )}
                </div>
                <div className="flex-1">
                  <span className="block text-xs font-extrabold tracking-wider text-gray-400 uppercase mb-1">Avatar</span>
                  <button onClick={() => photoInputRef.current?.click()} className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-xs font-bold rounded-lg text-gray-700">
                    Select New Picture
                  </button>
                  <input type="file" ref={photoInputRef} onChange={handlePhotoUploadChange} accept="image/*" className="hidden" />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-extrabold tracking-wider text-gray-400 uppercase mb-1.5">Display Name</label>
                  <input type="text" value={editName} onChange={(e) => setEditName(e.target.value.slice(0, 10))} className="w-full px-4 py-2.5 bg-gray-50 border border-transparent focus:border-blue-500 focus:bg-white rounded-xl text-sm font-semibold" />
                </div>
                <div>
                  <label className="block text-xs font-extrabold tracking-wider text-gray-400 uppercase mb-1.5">Username</label>
                  <input type="text" value={editUsername} onChange={(e) => setEditUsername(e.target.value.slice(0, 30))} className="w-full px-4 py-2.5 bg-gray-50 border border-transparent focus:border-blue-500 focus:bg-white rounded-xl text-sm font-semibold" />
                </div>
                <div>
                  <label className="block text-xs font-extrabold tracking-wider text-gray-400 uppercase mb-1.5">Professional Bio</label>
                  <textarea value={editBio} onChange={(e) => setEditBio(e.target.value.slice(0, 150))} rows={3} className="w-full px-4 py-2.5 bg-gray-50 border border-transparent focus:border-blue-500 focus:bg-white rounded-xl text-sm font-semibold resize-none" />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end sticky bottom-0 bg-white">
              <button onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 bg-gray-100 text-xs font-bold text-gray-700 rounded-xl">Cancel</button>
              <button onClick={handleSaveProfile} className="px-5 py-2 bg-blue-600 text-xs font-bold text-white rounded-xl shadow-md">Save Profile</button>
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
              <h3 className="text-lg font-black tracking-tight text-gray-900">
                {uploadIsVideo ? "🎬 Compose New Video Post" : "🖼 Compose New Photo Post"}
              </h3>
              <button onClick={() => setIsUploadModalOpen(false)} className="p-1.5 hover:bg-gray-100 text-gray-400 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div className="w-full aspect-video bg-black rounded-2xl overflow-hidden flex items-center justify-center">
                {uploadIsVideo ? (
                  <video src={uploadPreviewUrl} controls className="w-full h-full object-contain" />
                ) : (
                  <img src={uploadPreviewUrl} alt="Upload preview" className="w-full h-full object-contain" />
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-extrabold tracking-wider text-gray-400 uppercase">Write Caption Description</label>
                <textarea
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value.slice(0, 500))}
                  placeholder="Enter a cool caption. Include #hashtags like #programming, #vlog..."
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-50 border focus:border-blue-500 rounded-2xl text-sm font-semibold"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 flex gap-3 justify-end bg-white">
              <button onClick={() => setIsUploadModalOpen(false)} className="px-4 py-2 bg-gray-100 text-xs font-bold text-gray-700 rounded-xl">Cancel</button>
              <button onClick={handlePostMedia} className="px-5 py-2 bg-emerald-600 text-xs font-bold text-white rounded-xl shadow-md">Post Now ➤</button>
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
          shareCounts={shareCounts}
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
              <h3 className="text-base font-black tracking-tight text-gray-900">Explore</h3>
              <button onClick={() => setIsOthersModalOpen(false)} className="p-1.5 hover:bg-gray-100 text-gray-400 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto divide-y divide-gray-100 space-y-3">
              {otherUsers.map((creator, idx) => (
                <div key={creator.id} className="flex items-center justify-between pt-3 pb-1 first:pt-0">
                  <div
                    onClick={() => {
                      setSelectedOtherUser(idx);
                      setViewMode("other");
                      setIsOthersModalOpen(false);
                    }}
                    className="flex items-center gap-3 cursor-pointer group flex-1 mr-4 min-w-0"
                  >
                    <div className={`w-11 h-11 rounded-full bg-gradient-to-tr ${creator.gradient} flex items-center justify-center text-white text-sm font-black`}>
                      {creator.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-black text-gray-900 group-hover:text-blue-600 transition-colors truncate">{creator.name}</span>
                      <span className="text-xs text-gray-400">@{creator.username}</span>
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
              {deleteConfirmState.type === "post" ? "Delete Post?" : "Delete Comment?"}
            </h3>

            <p className="text-xs text-slate-500 font-semibold mb-6">
              Are you sure you want to delete this permanently? This action cannot be undone.
            </p>

            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirmState(null)} className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-black text-slate-500 transition-all">
                Cancel
              </button>
              <button onClick={executeDeleteAction} className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 rounded-xl text-xs font-black text-white shadow-lg transition-all">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
