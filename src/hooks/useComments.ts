import { useLocalStorageState } from './useLocalStorageState';
import type { CommentItem } from '../types';

/** Owns the comment list for one video: create, edit, delete, like, reply. */
export function useComments(videoId: string) {
  const [comments, setComments] = useLocalStorageState<CommentItem[]>(`comments:${videoId}`, []);

  function postComment(text: string, username: string, avatar: string | null) {
    const newComment: CommentItem = {
      id: Date.now(),
      text,
      username,
      avatar,
      timestamp: formatTimestamp(),
      likesCount: 0,
      liked: false,
      replies: [],
    };
    setComments((prev) => [newComment, ...prev]);
  }

  function deleteComment(commentId: number) {
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  }

  function editComment(commentId: number, newText: string) {
    setComments((prev) => prev.map((c) => (c.id === commentId ? { ...c, text: newText } : c)));
  }

  function toggleLike(commentId: number) {
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId ? { ...c, liked: !c.liked, likesCount: c.liked ? c.likesCount - 1 : c.likesCount + 1 } : c,
      ),
    );
  }

  function addReply(commentId: number, text: string, username: string, avatar: string | null) {
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? { ...c, replies: [...c.replies, { id: Date.now(), text, username, avatar, timestamp: formatTimestamp() }] }
          : c,
      ),
    );
  }

  function deleteReply(commentId: number, replyId: number) {
    setComments((prev) =>
      prev.map((c) => (c.id === commentId ? { ...c, replies: c.replies.filter((r) => r.id !== replyId) } : c)),
    );
  }

  return { comments, postComment, deleteComment, editComment, toggleLike, addReply, deleteReply };
}

function formatTimestamp() {
  return new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}