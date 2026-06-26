import { useState } from 'react';
import { X, Send } from 'lucide-react';
import EmojiPicker from './EmojiPicker';
import CommentCard from './CommentCard';
import type { CommentItem, CommentSort } from '../types';

interface CommentModalProps {
  comments: CommentItem[];
  currentUsername: string;
  onClose: () => void;
  onPostComment: (text: string) => void;
  onDeleteComment: (id: number) => void;
  onEditComment: (id: number, text: string) => void;
  onToggleLike: (id: number) => void;
  onAddReply: (id: number, text: string) => void;
  onDeleteReply: (commentId: number, replyId: number) => void;
}

export default function CommentModal({ comments, currentUsername, onClose, onPostComment, onDeleteComment, onEditComment, onToggleLike, onAddReply, onDeleteReply }: CommentModalProps) {
  const [sort, setSort] = useState<CommentSort>('newest');
  const [newCommentText, setNewCommentText] = useState('');

  const sortedComments = [...comments].sort((a, b) => (sort === 'newest' ? b.id - a.id : a.id - b.id));

  function handlePost() {
    const trimmed = newCommentText.trim();
    if (!trimmed) return;
    onPostComment(trimmed);
    setNewCommentText('');
  }
  

  return (
    <div className="animate-slide-up fixed bottom-[85px] right-4 z-[9999] flex max-h-[520px] w-[360px] flex-col overflow-hidden rounded-[18px] bg-white shadow-2xl max-[480px]:bottom-20 max-[480px]:right-2 max-[480px]:max-h-[65vh] max-[480px]:w-[calc(100vw-16px)]">
      <div className="flex shrink-0 items-center justify-between bg-blue-600 px-5 py-4">
        <h3 className="text-base font-bold tracking-wide text-white">Comments</h3>
        <div className="flex items-center gap-2.5">
          <select value={sort} onChange={(e) => setSort(e.target.value as CommentSort)} className="rounded-lg border-none bg-white/20 px-2 py-1 text-xs font-semibold text-white outline-none">
            <option value="newest">⬇ Newest</option>
            <option value="oldest">⬆ Oldest</option>
          </select>
          <button type="button" onClick={onClose} className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/35" aria-label="Close comments">
            <X size={15} />
          </button>
        </div>
      </div>

      <div className="scrollbar-thin-blue flex min-h-[200px] max-h-[320px] flex-1 flex-col gap-2.5 overflow-y-auto bg-blue-50/40 p-3.5">
        {sortedComments.length === 0 ? (
          <div className="m-auto px-4 py-6 text-center text-sm leading-relaxed text-slate-400">
            <span className="mb-2 block text-3xl">💬</span>
            No comments yet. Be the first!
          </div>
        ) : (
          sortedComments.map((comment) => (
            <CommentCard key={comment.id} comment={comment} currentUsername={currentUsername} onDelete={onDeleteComment} onEdit={onEditComment} onToggleLike={onToggleLike} onAddReply={onAddReply} onDeleteReply={onDeleteReply} />
          ))
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2.5 border-t border-slate-200 bg-white px-4 py-3.5">
        <EmojiPicker onSelect={(emoji) => setNewCommentText((t) => t + emoji)} />
        <input
          value={newCommentText}
          maxLength={300}
          placeholder="Write a comment..."
          onChange={(e) => setNewCommentText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handlePost()}
          className="flex-1 rounded-full border-[1.5px] border-slate-200 bg-blue-50/40 px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-600 focus:bg-white"
        />
        <button type="button" onClick={handlePost} className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 active:scale-95">
          <Send size={17} />
        </button>
      </div>
    </div>
  );
}