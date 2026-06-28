import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import type { ReactNode } from "react";
import type { FeedPost } from "../types";
  // የ'import' ማስተካከያ ከላይ
import { getMediaFile } from '../lib/db';

// Mock posts — otherUsers posts (algorithm ሲሰራ API ይተካዋል)
const MOCK_FEED_POSTS: FeedPost[] = [
  {
    id: "mock-1",
    userId: "abel_codes",
    username: "abel_codes",
    userAvatar: "",
    type: "photo",
    mediaUrls: [
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=600",
    ],
    caption: "Dynamic Interactive Canvas Dashboard #canvas #react",
    hashtags: ["#canvas", "#react"],
    likesCount: 48,
    commentsCount: 5,
    sharesCount: 3,
    savesCount: 12,
    viewsCount: 342,
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: "mock-2",
    userId: "fitsum_backend",
    username: "fitsum_backend",
    userAvatar: "",
    type: "photo",
    mediaUrls: [
      "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?q=80&w=600",
    ],
    caption: "Database Schema Sharding — scaled writes by 3x #postgres",
    hashtags: ["#postgres", "#backend"],
    likesCount: 94,
    commentsCount: 12,
    sharesCount: 8,
    savesCount: 45,
    viewsCount: 512,
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    id: "mock-3",
    userId: "eden_creates",
    username: "eden_creates",
    userAvatar: "",
    type: "photo",
    mediaUrls: [
      "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600",
    ],
    caption: "3D WebGL Shader Loop #webgl #animation",
    hashtags: ["#webgl", "#animation"],
    likesCount: 85,
    commentsCount: 9,
    sharesCount: 6,
    savesCount: 37,
    viewsCount: 298,
    createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
  },
];

interface FeedContextType {
  posts: FeedPost[];
  addPost: (post: FeedPost) => void;
  removePost: (postId: string) => void;
  incrementView: (postId: string) => void;
}

const FeedContext = createContext<FeedContextType | null>(null);

// Shuffle utility (Fisher-Yates) — algorithm placeholder
function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function FeedProvider({ children }: { children: ReactNode }) {
  const [posts, setPosts] = useState<FeedPost[]>([]);


useEffect(() => {
  // የፈጠርናቸውን object URLs ለመከታተል የሚጠቅም array
  const createdUrls: string[] = [];

  async function loadFeed() {
    const savedPosts = localStorage.getItem('userPostsMeta');
    let userPosts: FeedPost[] = [];
    if (savedPosts) {
      try {
        const parsed = JSON.parse(savedPosts);
        userPosts = await Promise.all(parsed.map(async (p: any) => {
          let mediaUrl = p.thumbnail || '';
          try {
            const blob = await getMediaFile(Number(p.id));
            if (blob) {
              mediaUrl = URL.createObjectURL(blob);
              createdUrls.push(mediaUrl); // በኋላ ላይ ከ memory ለማጽዳት እዚህ እናስቀምጠዋለን
            }
          } catch (e) {
            console.error('Media file fetch error:', e);
          }
          return {
            id: String(p.id),
            userId: p.username || 'me',
            username: p.username || 'me',
            userAvatar: p.avatar || '',
            type: p.isVideo ? 'video' : 'photo',
            mediaUrls: [mediaUrl],
            caption: p.description || '',
            hashtags: p.hashtags || [],
            likesCount: p.likes || 0,
            commentsCount: 0, 
            sharesCount: 0,
            savesCount: p.saves || 0,
            viewsCount: p.views || 0,
            createdAt: p.timestamp || new Date().toISOString(),
          };
        }));
      } catch (e) { 
        console.error('Feed load error:', e); 
      }
    }
    const combined = shuffleArray([...userPosts, ...MOCK_FEED_POSTS]);
    setPosts(combined);
  }

  loadFeed();

  // Cleanup function: component unmount ሲያደርግ memory-ውን ነጻ ያደርጋል
  return () => {
    createdUrls.forEach(url => URL.revokeObjectURL(url));
  };
}, []);
  const addPost = useCallback((post: FeedPost) => {
    setPosts((prev) => [post, ...prev]);
  }, []);

  const removePost = useCallback((postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  }, []);

  const incrementView = useCallback((postId: string) => {
    // TODO: POST /api/posts/:id/view
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, viewsCount: p.viewsCount + 1 } : p,
      ),
    );
  }, []);

  return (
    <FeedContext.Provider value={{ posts, addPost, removePost, incrementView }}>
      {children}
    </FeedContext.Provider>
  );
}

export function useFeed() {
  const ctx = useContext(FeedContext);
  if (!ctx) throw new Error("useFeed must be used within FeedProvider");
  return ctx;
}
