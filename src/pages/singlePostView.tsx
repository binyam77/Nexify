import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import PostCard from "../components/PostCard";
import avatarImg from "../assets/user.png";
import { useAuth } from "../context/AuthContext";
import { useFeed } from "../context/FeedContext";
import type { User } from "../types";

// Opened from a search result — shows exactly one post, fetched by id,
// reusing the same FeedContext + PostCard the main Home feed uses.
export default function SinglePostView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { posts, ensureSinglePost, incrementView } = useFeed();

  useEffect(() => {
    if (id) void ensureSinglePost(id);
  }, [id, ensureSinglePost]);

  const post = posts.find((p) => p.id === id);

  const currentUser: User = {
    id: user?.username || "me",
    fullName: user?.username || "User",
    email: user?.email || "",
    avatarUrl: user?.photo || avatarImg,
  };

  if (!post) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-surface text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="relative h-full w-full bg-surface overflow-hidden">
      <button
        onClick={() => navigate(-1)}
        aria-label="Back"
        className="absolute top-3 left-3 z-20 bg-black/50 rounded-full p-2 text-white"
      >
        <ArrowLeft size={20} />
      </button>
      <div className="h-full w-full flex items-center justify-center">
        <PostCard
          post={post}
          currentUser={currentUser}
          onView={() => incrementView(post.id)}
        />
      </div>
    </div>
  );
}
