import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import type { ReactNode } from "react";
import type { CommentReply, CommentItem, FeedPost } from "../types";
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
  editComment as apiEditComment,
  deleteCommentOrReply,
} from "../api/posts.api";
import { followUser, unfollowUser } from "../api/follow.api";
interface FeedContextType {
  posts: FeedPost[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  loadMoreError: string | null;
  loadMore: () => Promise<void>;
  retryFeed: () => Promise<boolean>;
  commentsMap: Record<string, CommentItem[]>;
  isLoadingComments: boolean;
  commentsError: string | null;
  loadComments: (postId: string) => Promise<void>;
  loadMoreComments:(postId:string) => Promise<void>;
 hasMoreComments :Record<string, boolean>;
  isLoadingMoreComments:boolean;

  incrementView: (postId: string) => void;
  toggleLike: (postId: string) => void;
  toggleSave: (postId: string) => void;
  incrementShare: (postId: string) => void;

  ensureSinglePost: (postId: string) => Promise<boolean>;
  toggleFollow: (authorUserId: string) => void;
  addComment: (postId: string, text: string) => Promise<boolean>;
  addReply: (
    postId: string,
    commentId: string,
    text: string,
  ) => Promise<boolean>;
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
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  // Cursor is a ref, not state — advancing it should never itself trigger a
  // re-render; only the derived `posts`/`hasMore` updates should.
  const nextCursorRef = useRef<string | null>(null);

  const [commentsMap, setCommentsMap] = useState<Record<string, CommentItem[]>>(
    {},
  );
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [commentsError, setCommentsError] = useState<string | null>(null);
  const [hasMoreComments, setHasMoreComments] = useState<
    Record<string, boolean>
  >({});
  const commentsCursorRef = useRef<Record<string, string | null>>({});
  const [isLoadingMoreComments, setIsLoadingMoreComments] = useState(false);
  // --- Initial feed load — extracted so the same logic backs both the
  // automatic mount-time fetch AND the user-facing Retry button (no
  // duplicated fetch/setState logic between the two call sites).
   const retryFeed = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const page = await fetchFeed();
      setPosts(page.items);
      setHasMore(page.hasMore);
      nextCursorRef.current = page.nextCursor;
      return true;
    } catch (e) {
      setError("Feed መጫን አልተቻለም። እንደገና ይሞክሩ።");
      console.error("Feed load error:", e);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Mount-time load — deferred by one macrotask (SinglePostView.tsx ላይ
  // የተረጋገጠ ተመሳሳይ technique) ስለሆነ ተመሳሳይ `retryFeed()`ን Retry button ም
  // ይህ effect ም ይጠቀማሉ — logic 2 ቦታ አልተደጋገመም፣ "setState before await
  // in an effect" warning ም አይመጣም።
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void retryFeed();
    }, 0);
    return () => clearTimeout(timeoutId);
  }, [retryFeed]);
  // Used by SinglePostView (opened from a search result) so PostCard's
  // like/save/etc. keep working normally — they all operate on the same
  // `posts` array, so a post fetched this way needs to live there too for
  // the same reactivity Home.tsx already relies on.
  const ensureSinglePost = useCallback(
    async (postId: string): Promise<boolean> => {
      try {
        const post = await fetchPostById(postId);
        setPosts((prev) =>
          prev.some((p) => p.id === postId) ? prev : [...prev, post],
        );
        return true;
      } catch (e) {
        console.error("Failed to load post:", e);
        return false;
      }
    },
    [],
  );
  const loadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore || !nextCursorRef.current) return;
    setIsLoadingMore(true);
    setLoadMoreError(null);
    try {
      const page = await fetchFeed(nextCursorRef.current);
      setPosts((prev) => [...prev, ...page.items]);
      setHasMore(page.hasMore);
      nextCursorRef.current = page.nextCursor;
    } catch (e) {
      console.error("Feed loadMore error:", e);
      setLoadMoreError("ተጨማሪ ፖስቶች መጫን አልተቻለም።");
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
  // --- Follow — one author may have several posts on screen at once
  // (feed + search results share the same `posts` array), so toggling
  // updates every post by that author, not just the one the button was
  // clicked on. Optimistic, reverted on failure — same pattern as like/save.
  const toggleFollow = useCallback((authorUserId: string) => {
    let wasFollowing = false;
    setPosts((prev) =>
      prev.map((p) => {
        if (p.userId !== authorUserId) return p;
        wasFollowing = p.isFollowing;
        return { ...p, isFollowing: !p.isFollowing };
      }),
    );
    const request = wasFollowing
      ? unfollowUser(authorUserId)
      : followUser(authorUserId);
    request.catch((e) => {
      console.error("Follow toggle failed, reverting:", e);
      setPosts((prev) =>
        prev.map((p) =>
          p.userId === authorUserId ? { ...p, isFollowing: wasFollowing } : p,
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

   const loadComments = useCallback(async (postId: string) => {
    setIsLoadingComments(true);
    setCommentsError(null);
    try {
      const page = await fetchComments(postId);
      setCommentsMap((prev) => ({ ...prev, [postId]: page.items }));
      setHasMoreComments((prev) => ({ ...prev, [postId]: page.hasMore }));
      commentsCursorRef.current[postId] = page.nextCursor;
    } catch (e) {
      console.error("Comments load error:", e);
      setCommentsError("አስተያየቶች መጫን አልተቻለም።");
    } finally {
      setIsLoadingComments(false);
    }
  }, []);

  const loadMoreComments = useCallback(async (postId: string) => {
    const cursor = commentsCursorRef.current[postId];
    if (!cursor || isLoadingMoreComments) return;
    setIsLoadingMoreComments(true);
    try {
      const page = await fetchComments(postId, cursor);
      setCommentsMap((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), ...page.items],
      }));
      setHasMoreComments((prev) => ({ ...prev, [postId]: page.hasMore }));
      commentsCursorRef.current[postId] = page.nextCursor;
    } catch (e) {
      console.error("Load more comments error:", e);
    } finally {
      setIsLoadingMoreComments(false);
    }
  }, [isLoadingMoreComments]);

  const addComment = useCallback(
    async (postId: string, text: string): Promise<boolean> => {
      const trimmed = text.trim();
      if (!trimmed) return false;
      try {
        const comment = await apiAddComment(postId, trimmed);
        setCommentsMap((prev) => ({
          ...prev,
          [postId]: [comment, ...(prev[postId] || [])],
        }));
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p,
          ),
        );
        return true;
      } catch (e) {
        console.error("Add comment failed:", e);
        return false;
      }
    },
    [],
  );

  // Note: backend counts replies toward Post.commentsCount too (same
  // createAndIncrementCount path as top-level comments) — so a reply
  // increments commentsCount here as well.
  const addReply = useCallback(
    async (
      postId: string,
      commentId: string,
      text: string,
    ): Promise<boolean> => {
      const trimmed = text.trim();
      if (!trimmed) return false;
      try {
        const reply = await apiAddReply(postId, commentId, trimmed);
        setCommentsMap((prev) => {
          const list = prev[postId] || [];
          return {
            ...prev,
            [postId]: list.map((c) =>
              c.id === commentId ? { ...c, replies: [...c.replies, reply] } : c,
            ),
          };
        });
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p,
          ),
        );
        return true;
      } catch (e) {
        console.error("Add reply failed:", e);
        return false;
      }
    },
    [],
  );

  // Deleting a top-level comment cascades its replies on the backend, so
  // the local commentsCount decrement accounts for (1 + its loaded replies).
  const deleteComment = useCallback((postId: string, commentId: string) => {
    let removed: CommentItem | undefined;
    let removedIndex = -1;

    setCommentsMap((prev) => {
      const list = prev[postId] || [];
      removedIndex = list.findIndex((c) => c.id === commentId);
      removed = list[removedIndex];
      const removedCount = 1 + (removed?.replies.length ?? 0);
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

    deleteCommentOrReply(commentId).catch((e) => {
      console.error("Delete comment failed, reverting:", e);
      if (!removed) return;
      const restoredCount = 1 + removed.replies.length;
      setCommentsMap((prev) => {
        const list = [...(prev[postId] || [])];
        list.splice(
          Math.min(removedIndex, list.length),
          0,
          removed as CommentItem,
        );
        return { ...prev, [postId]: list };
      });
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, commentsCount: p.commentsCount + restoredCount }
            : p,
        ),
      );
    });
  }, []);

  const deleteReply = useCallback(
    (postId: string, commentId: string, replyId: string) => {
      let removed: CommentReply | undefined;
      let removedIndex = -1;

      setCommentsMap((prev) => {
        const list = prev[postId] || [];
        return {
          ...prev,
          [postId]: list.map((c) => {
            if (c.id !== commentId) return c;
            removedIndex = c.replies.findIndex((r) => r.id === replyId);
            removed = c.replies[removedIndex];
            return { ...c, replies: c.replies.filter((r) => r.id !== replyId) };
          }),
        };
      });
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, commentsCount: Math.max(0, p.commentsCount - 1) }
            : p,
        ),
      );

      deleteCommentOrReply(replyId).catch((e) => {
        console.error("Delete reply failed, reverting:", e);
        if (!removed) return;
        setCommentsMap((prev) => {
          const list = prev[postId] || [];
          return {
            ...prev,
            [postId]: list.map((c) => {
              if (c.id !== commentId) return c;
              const replies = [...c.replies];
              replies.splice(
                Math.min(removedIndex, replies.length),
                0,
                removed as CommentReply,
              );
              return { ...c, replies };
            }),
          };
        });
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p,
          ),
        );
      });
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
        loadMoreError,
        loadMore,
        retryFeed,
        ensureSinglePost,
        toggleFollow,
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
