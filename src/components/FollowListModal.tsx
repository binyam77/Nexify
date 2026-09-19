import { useState, useEffect, useCallback, useRef } from "react";
import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { fetchFollowers, fetchFollowing } from "../api/follow.api";
import type { FollowListItem } from "../api/follow.api";

interface FollowListModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  type: "followers" | "following";
}

export default function FollowListModal({
  isOpen,
  onClose,
  userId,
  type,
}: FollowListModalProps) {
  const navigate = useNavigate();
  const [items, setItems] = useState<FollowListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const cursorRef = useRef<string | null>(null);

  const fetcher = type === "followers" ? fetchFollowers : fetchFollowing;

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const page = await fetcher(userId);
      setItems(page.items);
      setHasMore(page.hasMore);
      cursorRef.current = page.nextCursor;
    } catch (e) {
      console.error(`Failed to load ${type}:`, e);
      setError("መጫን አልተቻለም።");
    } finally {
      setIsLoading(false);
    }
  }, [userId, type, fetcher]);

  useEffect(() => {
    if (isOpen) void load();
  }, [isOpen, load]);

  const loadMore = async () => {
    if (!hasMore || !cursorRef.current) return;
    const page = await fetcher(userId, cursorRef.current);
    setItems((prev) => [...prev, ...page.items]);
    setHasMore(page.hasMore);
    cursorRef.current = page.nextCursor;
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/60 flex items-end md:items-center justify-center"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-md md:rounded-2xl rounded-t-2xl max-h-[75vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 shrink-0">
          <h3 className="text-base font-bold text-slate-900">
            {type === "followers" ? "Followers" : "Following"}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-slate-100"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2">
          {isLoading ? (
            <div className="text-center text-slate-400 text-sm py-10">
              Loading...
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-2 py-10">
              <p className="text-sm text-rose-500 font-semibold">{error}</p>
              <button
                onClick={load}
                className="text-xs font-bold text-blue-600 underline"
              >
                Retry
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center text-slate-400 text-sm py-10">
              {type === "followers"
                ? "No followers yet"
                : "Not following anyone yet"}
            </div>
          ) : (
            <>
              {items.map((item) => (
                <button
                  key={item.userId}
                  onClick={() => {
                    onClose();
                    navigate(`/profile/${item.username}`);
                  }}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-slate-50 transition-colors text-left"
                >
                  <div className="w-11 h-11 rounded-full overflow-hidden bg-blue-50 flex items-center justify-center text-blue-600 text-sm font-bold shrink-0">
                    {item.avatar ? (
                      <img
                        src={item.avatar}
                        alt={item.displayName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      item.displayName.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">
                      {item.displayName}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      @{item.username}
                    </p>
                  </div>
                </button>
              ))}
              {hasMore && (
                <div className="flex justify-center py-3">
                  <button
                    onClick={loadMore}
                    className="text-xs font-bold text-blue-600 hover:underline"
                  >
                    Load more
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
