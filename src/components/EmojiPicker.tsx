import { useState, useRef, useEffect } from 'react';
import { Smile } from 'lucide-react';

const EMOJIS = [
  '🤫', '😬', '🙄', '😯', '😮', '😲', '🥱', '😴', '🤕', '🤲',
  '🙌', '👏', '🤝', '👍', '👊', '✌️', '🤟', '👌', '🤏', '💪', '🖕',
  '❤️', '💞', '💕', '💔', '💗', '💖', '💘', '💝',
  '🔥', '💯', '😅', '🎉', '✨', '🙏', '😢', '🤣', '😁', '💀',
  '😂', '😇', '😉', '😍', '🥰', '😘', '😚', '😋', '😛', '😝',
  '😜', '🤪', '🤨', '😎', '🤩', '😒', '😞', '😔', '😫', '😩', '😭', '😳',
];

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
}

export default function EmojiPicker({ onSelect }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative shrink-0" ref={wrapperRef}>
      <button type="button" onClick={() => setOpen((o) => !o)} className="rounded-md p-1 text-slate-500 transition-transform hover:scale-110" aria-label="Open emoji picker">
        <Smile size={20} />
      </button>

      {open && (
        <div className="animate-fade-in absolute bottom-12 left-0 z-50 grid w-[272px] grid-cols-8 gap-1 rounded-2xl border border-slate-200 bg-gradient-to-br from-emerald-500 to-blue-600 p-2.5 shadow-xl">
          {EMOJIS.map((emoji, i) => (
            <button key={`${emoji}-${i}`} type="button" onClick={() => { onSelect(emoji); setOpen(false); }} className="rounded-md p-1 text-lg transition-colors hover:bg-white/20">
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}