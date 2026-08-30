import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import type { ReactNode } from "react";
import type { CommentItem, FeedPost } from "../types";
import {
  fetchFeed,
  fetchPostById,
  fetchComments,
  viewPost,
  likePost,
  unlikePost,
  savePost,
  unsavePost,
  sharePost,
  addComment as apiAddComment,
  addReply as apiAddReply,
  deleteCommentOrReply,
  editComment as apiEditComment,
} from "../api/posts.api";

interface FeedContextType {
  posts: FeedPost[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  loadMore: () => Promise<void>;

  commentsMap: Record<string, CommentItem[]>;
  isLoadingComments: boolean;
  loadComments: (postId: string) => Promise<void>;

  incrementView: (postId: string) => void;
  toggleLike: (postId: string) => void;
  toggleSave: (postId: string) => void;
  incrementShare: (postId: string) => void;

  ensureSinglePost: (postId: string) => Promise<void>;
  addComment: (postId: string, text: string) => void;
  addReply: (postId: string, commentId: string, text: string) => void;
  deleteComment: (postId: string, commentId: string) => void;
  deleteReply: (postId: string, commentId: string, replyId: string) => void;
  // TODO: backend ላይ PATCH /comments/:id endpoint ገና የለም — ስለዚህ ለጊዜው no-op ነው
  editComment: (postId: string, commentId: string, newText: string) => void;
}

const FeedContext = createContext<FeedContextType | null>(null);

export function FeedProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Cursor is a ref, not state — advancing it should never itself trigger a
  // re-render; only the derived `posts`/`hasMore` updates should.
  const nextCursorRef = useRef<string | null>(null);

  const [commentsMap, setCommentsMap] = useState<Record<string, CommentItem[]>>(
    {},
  );
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  // --- Initial feed load ---
  useEffect(() => {
    let cancelled = false;
    async function loadInitial() {
      setIsLoading(true);
      setError(null);
      try {
        const page = await fetchFeed();
        if (cancelled) return;
        setPosts(page.items);
        setHasMore(page.hasMore);
        nextCursorRef.current = page.nextCursor;
      } catch (e) {
        if (!cancelled) setError("Feed መጫን አልተቻለም። እንደገና ይሞክሩ።");
        console.error("Feed load error:", e);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    void loadInitial();
    return () => {
      cancelled = true;
    };
  }, []);
  // Used by SinglePostView (opened from a search result) so PostCard's
  // like/save/etc. keep working normally — they all operate on the same
  // `posts` array, so a post fetched this way needs to live there too for
  // the same reactivity Home.tsx already relies on.
  const ensureSinglePost = useCallback(async (postId: string) => {
    try {
      const post = await fetchPostById(postId);
      setPosts((prev) =>
        prev.some((p) => p.id === postId) ? prev : [...prev, post],
      );
    } catch (e) {
      console.error("Failed to load post:", e);
    }
  }, []);
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore || !nextCursorRef.current) return;
    setIsLoadingMore(true);
    try {
      const page = await fetchFeed(nextCursorRef.current);
      setPosts((prev) => [...prev, ...page.items]);
      setHasMore(page.hasMore);
      nextCursorRef.current = page.nextCursor;
    } catch (e) {
      console.error("Feed loadMore error:", e);
    } finally {
      setIsLoadingMore(false);
    }
  }, [isLoadingMore, hasMore]);

  // --- View — fire-and-forget, matches backend's non-transactional counter ---
  const incrementView = useCallback((postId: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, viewsCount: p.viewsCount + 1 } : p,
      ),
    );
    viewPost(postId).catch((e) => console.error("View tracking failed:", e));
  }, []);

  // --- Like — optimistic update, reverted if the request fails ---
  const toggleLike = useCallback((postId: string) => {
    let wasLiked = false;
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        wasLiked = p.liked;
        return {
          ...p,
          liked: !p.liked,
          likesCount: p.liked ? p.likesCount - 1 : p.likesCount + 1,
        };
      }),
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
                likesCount: wasLiked ? p.likesCount + 1 : p.likesCount - 1,
              }
            : p,
        ),
      );
    });
  }, []);

  // --- Save — optimistic update, reverted if the request fails ---
  const toggleSave = useCallback((postId: string) => {
    let wasSaved = false;
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        wasSaved = p.saved;
        return {
          ...p,
          saved: !p.saved,
          savesCount: p.saved ? p.savesCount - 1 : p.savesCount + 1,
        };
      }),
    );
    const request = wasSaved ? unsavePost(postId) : savePost(postId);
    request.catch((e) => {
      console.error("Save toggle failed, reverting:", e);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                saved: wasSaved,
                savesCount: wasSaved ? p.savesCount + 1 : p.savesCount - 1,
              }
            : p,
        ),
      );
    });
  }, []);

  // --- Share — server returns the authoritative count (append-only log) ---
  const incrementShare = useCallback((postId: string) => {
    sharePost(postId)
      .then(({ sharesCount }) => {
        setPosts((prev) =>
          prev.map((p) => (p.id === postId ? { ...p, sharesCount } : p)),
        );
      })
      .catch((e) => console.error("Share tracking failed:", e));
  }, []);

  // --- Comments — fetched on demand when the modal opens, not preloaded ---
  const loadComments = useCallback(async (postId: string) => {
    setIsLoadingComments(true);
    try {
      const page = await fetchComments(postId);
      setCommentsMap((prev) => ({ ...prev, [postId]: page.items }));
    } catch (e) {
      console.error("Comments load error:", e);
    } finally {
      setIsLoadingComments(false);
    }
  }, []);

  const addComment = useCallback((postId: string, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    apiAddComment(postId, trimmed)
      .then((comment) => {
        setCommentsMap((prev) => ({
          ...prev,
          [postId]: [comment, ...(prev[postId] || [])],
        }));
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p,
          ),
        );
      })
      .catch((e) => console.error("Add comment failed:", e));
  }, []);

  // Note: backend counts replies toward Post.commentsCount too (same
  // createAndIncrementCount path as top-level comments) — so a reply
  // increments commentsCount here as well.
  const addReply = useCallback(
    (postId: string, commentId: string, text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      apiAddReply(postId, commentId, trimmed)
        .then((reply) => {
          setCommentsMap((prev) => {
            const list = prev[postId] || [];
            return {
              ...prev,
              [postId]: list.map((c) =>
                c.id === commentId
                  ? { ...c, replies: [...c.replies, reply] }
                  : c,
              ),
            };
          });
          setPosts((prev) =>
            prev.map((p) =>
              p.id === postId
                ? { ...p, commentsCount: p.commentsCount + 1 }
                : p,
            ),
          );
        })
        .catch((e) => console.error("Add reply failed:", e));
    },
    [],
  );

  // Deleting a top-level comment cascades its replies on the backend, so
  // the local commentsCount decrement accounts for (1 + its loaded replies).
  const deleteComment = useCallback((postId: string, commentId: string) => {
    setCommentsMap((prev) => {
      const list = prev[postId] || [];
      const target = list.find((c) => c.id === commentId);
      const removedCount = 1 + (target?.replies.length ?? 0);
      setPosts((prevPosts) =>
        prevPosts.map((p) =>
          p.id === postId
            ? {
                ...p,
                commentsCount: Math.max(0, p.commentsCount - removedCount),
              }
            : p,
        ),
      );
      return { ...prev, [postId]: list.filter((c) => c.id !== commentId) };
    });
    deleteCommentOrReply(commentId).catch((e) =>
      console.error("Delete comment failed:", e),
    );
  }, []);

  const deleteReply = useCallback(
    (postId: string, commentId: string, replyId: string) => {
      setCommentsMap((prev) => {
        const list = prev[postId] || [];
        return {
          ...prev,
          [postId]: list.map((c) =>
            c.id === commentId
              ? { ...c, replies: c.replies.filter((r) => r.id !== replyId) }
              : c,
          ),
        };
      });
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, commentsCount: Math.max(0, p.commentsCount - 1) }
            : p,
        ),
      );
      deleteCommentOrReply(replyId).catch((e) =>
        console.error("Delete reply failed:", e),
      );
    },
    [],
  );

  // Works whether `commentId` refers to a top-level comment or a reply —
  // we check both locations in the local map since the caller (CommentCard)
  // doesn't distinguish them either.
  const editComment = useCallback(
    (postId: string, commentId: string, newText: string) => {
      const trimmed = newText.trim();
      if (!trimmed) return;
      apiEditComment(commentId, trimmed)
        .then(({ text }) => {
          setCommentsMap((prev) => {
            const list = prev[postId] || [];
            const updated = list.map((c) => {
              if (c.id === commentId) return { ...c, text };
              if (c.replies.some((r) => r.id === commentId)) {
                return {
                  ...c,
                  replies: c.replies.map((r) =>
                    r.id === commentId ? { ...r, text } : r,
                  ),
                };
              }
              return c;
            });
            return { ...prev, [postId]: updated };
          });
        })
        .catch((e) => console.error("Edit comment failed:", e));
    },
    [],
  );

  return (
    <FeedContext.Provider
      value={{
        posts,
        isLoading,
        isLoadingMore,
        hasMore,
        error,
        loadMore,
        ensureSinglePost,
        commentsMap,
        isLoadingComments,
        loadComments,
        incrementView,
        toggleLike,
        toggleSave,
        incrementShare,
        addComment,
        addReply,
        deleteComment,
        deleteReply,
        editComment,
      }}
    >
      {children}
    </FeedContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- context+hook በ1 File ማድረግ የተለመደ pattern ነው
export function useFeed() {
  const ctx = useContext(FeedContext);
  if (!ctx) throw new Error("useFeed must be used within FeedProvider");
  return ctx;
}
