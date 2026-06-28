import { useLocalStorageState } from "./useLocalStorageState";

interface LikeState {
  liked: boolean;
  count: number;
}

/**
 * Keyed by videoId, so once the feed has more than one video,
 * likes won't collide (the old home.js only ever supported one hardcoded video).
 * Swap toggleLike()'s body for a real API call once a likes endpoint exists.
 */
export function useLike(videoId: string, initialCount = 0) {
  const [state, setState] = useLocalStorageState<LikeState>(`like:${videoId}`, {
    liked: false,
    count: initialCount,
  });

  function toggleLike() {
    setState((prev) => ({
      liked: !prev.liked,
      count: prev.liked ? prev.count - 1 : prev.count + 1,
    }));
  }

  return { liked: state.liked, count: state.count, toggleLike };
}
