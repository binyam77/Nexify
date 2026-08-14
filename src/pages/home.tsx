import { useEffect, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../routes';
import PostCard from '../components/PostCard';
import avatarImg from '../assets/user.png';
import { useAuth } from '../context/AuthContext';
import { useFeed } from '../context/FeedContext';
import { ChevronUp, ChevronDown } from 'lucide-react';
import type { User } from '../types';

export default function Home() {
 const { user } = useAuth();
  const { posts, incrementView } = useFeed();
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();

  // Post ደራሲ ጋር chat ለመክፈት — Profile's handleMessageUser ጋር ተመሳሳይ pattern
  const handleMessageUser = (creator: { name: string; username: string; photo: string }) => {
    navigate(ROUTES.community, { state: { openChatWith: creator } });
  };
  const currentUser: User = {
    id: user?.username || 'me',
    fullName: user?.username || 'User',
    email: user?.email || '',
    avatarUrl: user?.photo || avatarImg,
  };

  const goNext = useCallback(() => {
    setCurrentIndex(i => Math.min(i + 1, posts.length - 1));
  }, [posts.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex(i => Math.max(i - 1, 0));
  }, []);

  // ① Keyboard — desktop
  useEffect(() => {
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'PageDown') { e.preventDefault(); goNext(); }
      if (e.key === 'ArrowUp'   || e.key === 'PageUp')   { e.preventDefault(); goPrev(); }
    };
    window.addEventListener('keydown', handle);
    return () => window.removeEventListener('keydown', handle);
  }, [goNext, goPrev]);

  // ② Mouse wheel — desktop (debounced)
  useEffect(() => {
    let last = 0;
    const handle = (e: WheelEvent) => {
      e.preventDefault();
      const now = Date.now();
      if (now - last < 600) return;
      last = now;
      if (e.deltaY > 30) goNext();
      else if (e.deltaY < -30) goPrev();
    };
    window.addEventListener('wheel', handle, { passive: false });
    return () => window.removeEventListener('wheel', handle);
  }, [goNext, goPrev]);

  // ③ Touch swipe — mobile (document level)
  useEffect(() => {
    let startY = 0;
    const onStart = (e: TouchEvent) => { startY = e.touches[0].clientY; };
    const onEnd   = (e: TouchEvent) => {
      const diff = startY - e.changedTouches[0].clientY;
      if (Math.abs(diff) > 60) {
        if (diff > 0) goNext();
        else goPrev();
      }
    };
    document.addEventListener('touchstart', onStart, { passive: true });
    document.addEventListener('touchend',   onEnd,   { passive: true });
    return () => {
      document.removeEventListener('touchstart', onStart);
      document.removeEventListener('touchend',   onEnd);
    };
  }, [goNext, goPrev]);

  if (posts.length === 0) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-surface text-slate-400 gap-3">
        <p className="text-lg font-semibold">No posts yet</p>
        <p className="text-sm opacity-60">Profile ውስጥ ፖስት ጨምር!</p>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full bg-surface  overflow-hidden">
      <div className="h-full w-full flex items-center justify-center">
        <PostCard
          key={posts[currentIndex]?.id}
          post={posts[currentIndex]}
          currentUser={currentUser}
          onView={() => incrementView(posts[currentIndex]?.id)}
          onMessageUser={handleMessageUser}
        />
      </div>
 
      {/* Desktop scroll arrows only */}
      {posts.length > 1 && (
        <div className="hidden md:flex fixed right-8 top-1/2 -translate-y-1/2 flex-col gap-3 z-50">
          <button onClick={goPrev} disabled={currentIndex === 0}
            className="w-10 h-10 rounded-full bg-input/90 hover:bg-input shadow-lg flex items-center justify-center text-input-text disabled:opacity-30 transition-all">
            <ChevronUp className="w-5 h-5" />
          </button>
          <button onClick={goNext} disabled={currentIndex === posts.length - 1}
            className="w-10 h-10 rounded-full bg-input/90 hover:bg-input shadow-lg flex items-center justify-center text-input-text disabled:opacity-30 transition-all">
            <ChevronDown className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}