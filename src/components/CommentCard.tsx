import { useState } from 'react';
import { Heart, Pencil, Trash2, Send } from 'lucide-react';
import EmojiPicker from './EmojiPicker';
import type { CommentItem, CommentReply } from '../types';

const REPLIES_VISIBLE_LIMIT = 2;

interface CommentCardProps {
  comment: CommentItem;
  currentUsername: string;
  onDelete: (commentId: number) => void;
  onEdit: (commentId: number, newText: string) => void;
  onToggleLike: (commentId: number) => void;
  onAddReply: (commentId: number, text: string) => void;
  onDeleteReply: (commentId: number, replyId: number) => void;
}

export default function CommentCard({ comment, currentUsername, onDelete, onEdit, onToggleLike, onAddReply, onDeleteReply }: CommentCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.text);
  const [showReplyInput, setShowReplyInput] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showAllReplies, setShowAllReplies] = useState(false);

  const isOwner = comment.username === currentUsername;
  const visibleReplies = showAllReplies ? comment.replies : comment.replies.slice(0, REPLIES_VISIBLE_LIMIT);
  const hiddenCount = comment.replies.length - REPLIES_VISIBLE_LIMIT;

  function saveEdit() {
    const trimmed = editText.trim();
    if (!trimmed) return;
    onEdit(comment.id, trimmed);
    setIsEditing(false);
  }

  function submitReply() {
    const trimmed = replyText.trim();
    if (!trimmed) return;
    onAddReply(comment.id, trimmed);
    setReplyText('');
    setShowReplyInput(false);
  }

  return (
    <div className="rounded-xl border-l-[3px] border-blue-600 bg-white p-3 shadow-sm transition-transform hover:translate-x-0.5">
      <div className="mb-2 flex items-center gap-2.5">
        <img src={comment.avatar ?? undefined} alt={comment.username} className="h-9 w-9 rounded-full border-2 border-blue-600 object-cover" />
        <div className="flex-1">
          <p className="text-xs font-bold text-blue-600">{comment.username}</p>
          <p className="mt-1.5 text-[11px] text-slate-400">{comment.timestamp}</p>
        </div>
        {isOwner && (
          <div className="flex gap-1">
            <button type="button" onClick={() => setIsEditing(true)} className="rounded-md p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600" aria-label="Edit comment">
              <Pencil size={14} />
            </button>
            <button type="button" onClick={() => onDelete(comment.id)} className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600" aria-label="Delete comment">
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      {!isEditing ? (
        <p className="break-words text-sm leading-relaxed text-slate-700">{comment.text}</p>
      ) : (
        <div className="mt-2">
          <input
            value={editText}
            maxLength={300}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setIsEditing(false); }}
            className="w-full rounded-lg border-[1.5px] border-blue-600 bg-blue-50/40 px-3.5 py-2 text-sm text-slate-700 outline-none"
            autoFocus
          />
          <div className="mt-2 flex justify-end gap-2">
            <button type="button" onClick={() => setIsEditing(false)} className="rounded-lg bg-slate-100 px-4 py-1 text-xs font-bold text-slate-500 hover:bg-slate-200">Cancel</button>
            <button type="button" onClick={saveEdit} className="rounded-lg bg-blue-600 px-4 py-1 text-xs font-bold text-white hover:bg-blue-700">Save</button>
          </div>
        </div>
      )}

      <div className="mt-2.5 flex items-center gap-3.5">
        <button type="button" onClick={() => onToggleLike(comment.id)} className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold hover:bg-blue-50 ${comment.liked ? 'text-rose-600' : 'text-slate-500'}`}>
          <Heart size={14} fill={comment.liked ? 'currentColor' : 'none'} />
          <span>{comment.likesCount}</span>
        </button>
        <button type="button" onClick={() => setShowReplyInput((s) => !s)} className="rounded-full px-2.5 py-1 text-xs font-bold text-blue-600 hover:bg-blue-50">Reply</button>
      </div>

      {showReplyInput && (
        <div className="mt-2.5 flex items-center gap-2 rounded-xl bg-blue-50/40 p-2">
          <EmojiPicker onSelect={(emoji) => setReplyText((t) => t + emoji)} />
          <input
            value={replyText}
            maxLength={300}
            placeholder="Write a reply..."
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submitReply()}
            className="flex-1 rounded-full border-[1.5px] border-slate-200 bg-white px-3.5 py-1.5 text-xs text-slate-700 outline-none focus:border-blue-600"
          />
          <button type="button" onClick={submitReply} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white hover:bg-emerald-600">
            <Send size={14} />
          </button>
        </div>
      )}

      {comment.replies.length > 0 && (
        <div className="ml-5 mt-2 flex flex-col gap-2">
          {visibleReplies.map((reply) => (
            <ReplyCard key={reply.id} reply={reply} isOwner={reply.username === currentUsername} onDelete={() => onDeleteReply(comment.id, reply.id)} />
          ))}
          {!showAllReplies && hiddenCount > 0 && (
            <button type="button" onClick={() => setShowAllReplies(true)} className="block py-1.5 text-left text-xs font-bold text-blue-600 hover:underline">
              Show {hiddenCount} more {hiddenCount === 1 ? 'reply' : 'replies'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function ReplyCard({ reply, isOwner, onDelete }: { reply: CommentReply; isOwner: boolean; onDelete: () => void }) {
  return (
    <div className="rounded-lg border-l-2 border-emerald-500 bg-blue-50/40 px-3 py-2">
      <div className="mb-1 flex items-center gap-2.5">
        <img src={reply.avatar ?? undefined} alt={reply.username} className="h-7 w-7 rounded-full object-cover" />
        <div className="flex-1">
          <p className="text-xs font-bold text-blue-600">{reply.username}</p>
          <p className="mt-1 text-[11px] text-slate-400">{reply.timestamp}</p>
        </div>
        {isOwner && (
          <button type="button" onClick={onDelete} className="rounded-md px-1.5 py-0.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600" aria-label="Delete reply">
            <Trash2 size={13} />
          </button>
        )}
      </div>
      <p className="text-sm leading-relaxed text-slate-700">{reply.text}</p>
    </div>
  );
}