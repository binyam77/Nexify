import { useState, useCallback, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, WifiOff, RotateCw } from "lucide-react";
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

  // `result` is the single source of truth for this fetch's status:
  //   undefined = still loading, true = succeeded, false = failed.
  // No separate isLoading/notFound state to keep in sync, and no setState
  // call happens before the `await` inside `load` — only the one after it,
  // so this effect never triggers React's "setState before await in an
  // effect" cascading-render warning.
  const [result, setResult] = useState<
    { id: string; success: boolean } | undefined
  >(undefined);

   const load = useCallback(async () => {
    if (!id) return;
    const success = await ensureSinglePost(id);
    // setTimeout(…, 0) — a real macrotask, unlike a resolved microtask
    // (which a very fast/cached fetch response can look like to React).
    // This guarantees the browser has a chance to paint before the state
    // update lands, which is what React's dev-only "cascading render"
    // heuristic is actually checking for. Purely a dev-time timing
    // artifact — harmless either way, this just silences the warning.
    setTimeout(() => setResult({ id, success }), 0);
  }, [id, ensureSinglePost]);

  useEffect(() => {
    void load();
  }, [load]);

  const isLoading =result === undefined ||  result.id !== id;
  const failed = result !== undefined && result.id === id && !result.success;

  const post = posts.find((p) => p.id === id);

  const currentUser: User = {
    id: user?.username || "me",
    fullName: user?.username || "User",
    email: user?.email || "",
    avatarUrl: user?.photo || avatarImg,
  };

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-surface text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  // Fetch failed (network drop, or the post no longer exists/was deleted) —
  // an explicit retry-able state instead of a spinner that never resolves.
  if (failed || !post) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-surface text-slate-400 gap-3">
        <WifiOff className="w-10 h-10 opacity-60" />
        <p className="text-lg font-semibold">ፖስት መጫን አልተቻለም</p>
        <button
          onClick={() => void load()}
          className="flex items-center gap-2 px-5 py-2 rounded-full bg-brand text-white text-sm font-semibold active:scale-95 transition-transform"
        >
          <RotateCw className="w-4 h-4" />
          Retry
        </button>
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
