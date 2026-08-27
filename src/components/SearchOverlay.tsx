import { useState, useEffect, useRef, useCallback } from "react";
import { ArrowLeft, X, Clock, Search as SearchIcon } from "lucide-react";
import { searchPosts } from "../features/posts.api";
import { useSearchHistory } from "../hooks/useSearchHistory";
import type { FeedPost } from "../types";

interface SearchOverlayProps {
  onClose: () => void;
  onSelectPost: (postId: string) => void;
}

const DEBOUNCE_MS = 400;

// Mobile-only (md:hidden) full-screen overlay — matches the reference
// screenshot: back arrow + input + clear-X header, History list when
// empty, result thumbnails when searching.
export default function SearchOverlay({
  onClose,
  onSelectPost,
}: SearchOverlayProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FeedPost[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { history, addTerm, removeTerm } = useSearchHistory();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const runSearch = useCallback(async (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) {
      setResults([]);
      setHasSearched(false);
      return;
    }
    setIsSearching(true);
    setHasSearched(true);
    try {
      const page = await searchPosts(trimmed);
      setResults(page.items);
    } catch (e) {
      console.error("Search failed:", e);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);
  // Debounced live search as the user types. No setState here — when the
  // query is empty, the render branch below (`!query.trim() ? history : ...`)
  // already falls back to showing History regardless of stale results/
  // hasSearched state, so nothing needs clearing synchronously in the effect.
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) return;

    debounceRef.current = setTimeout(() => {
      void runSearch(query);
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, runSearch]);
  function handleHistoryTap(term: string) {
    setQuery(term);
    void runSearch(term);
  }

  function handleSelectResult(post: FeedPost) {
    addTerm(query);
    onSelectPost(post.id);
  }

  return (
    <div className="fixed inset-0 z-[100] bg-surface flex flex-col md:hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-3 border-b border-input-border shrink-0">
        <button
          onClick={onClose}
          aria-label="Back"
          className="p-1 text-input-text"
        >
          <ArrowLeft size={22} />
        </button>
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                if (debounceRef.current) clearTimeout(debounceRef.current);
                void runSearch(query);
              }
            }}
            placeholder="Search Video"
            className="w-full rounded-full bg-input px-4 py-2 text-sm text-input-text placeholder-input-placeholder outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              aria-label="Clear"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-input-placeholder"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {!query.trim() ? (
          history.length === 0 ? (
            <div className="p-6 text-center text-sm text-input-placeholder">
              ምንም የፍለጋ ታሪክ የለም
            </div>
          ) : (
            <div className="py-2">
              <p className="px-4 py-2 text-xs font-semibold text-input-placeholder">
                History
              </p>
              {history.map((term) => (
                <div
                  key={term}
                  className="flex items-center justify-between px-4 py-3 border-b border-input-border"
                >
                  <button
                    onClick={() => handleHistoryTap(term)}
                    className="flex items-center gap-3 flex-1 text-left"
                  >
                    <Clock
                      size={16}
                      className="text-input-placeholder shrink-0"
                    />
                    <span className="text-sm text-input-text truncate">
                      {term}
                    </span>
                  </button>
                  <button
                    onClick={() => removeTerm(term)}
                    aria-label="Remove"
                    className="text-input-placeholder p-1"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )
        ) : isSearching ? (
          <div className="p-6 text-center text-sm text-input-placeholder">
            በመፈለግ ላይ...
          </div>
        ) : hasSearched && results.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 p-10 text-center">
            <SearchIcon size={28} className="text-input-placeholder" />
            <p className="text-sm text-input-placeholder">No results found</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-0.5 p-0.5">
            {results.map((post) => (
              <button
                key={post.id}
                onClick={() => handleSelectResult(post)}
                className="relative aspect-[9/16] bg-black overflow-hidden"
              >
                {post.type === "video" ? (
                  <video
                    src={post.mediaUrls[0]}
                    className="w-full h-full object-cover"
                    muted
                  />
                ) : (
                  <img
                    src={post.mediaUrls[0]}
                    alt={post.caption}
                    className="w-full h-full object-cover"
                  />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
