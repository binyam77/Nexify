import { useState, useRef } from 'react';
import { X, Upload } from 'lucide-react';
import { saveMediaFile } from '../lib/db';
import { useFeed } from '../context/FeedContext';
import { useAuth } from '../context/AuthContext';
import type { FeedPost } from '../types';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UploadModal({ isOpen, onClose }: UploadModalProps) {
  const { user } = useAuth();
  const { addPost } = useFeed();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isVideo, setIsVideo] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsVideo(file.type.startsWith('video/'));
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    const postId = Date.now();

    try { await saveMediaFile(postId, selectedFile); }
    catch (e) { console.error('Save error:', e); }

    const savedProfile = JSON.parse(localStorage.getItem('userProfile') || '{}');
    const resolvedUrl = URL.createObjectURL(selectedFile);

    const feedPost: FeedPost = {
      id: String(postId),
      userId: user?.username || 'me',
      username: savedProfile.username || user?.username || 'User',
      userAvatar: savedProfile.photo || user?.photo || '',
      type: isVideo ? 'video' : 'photo',
      mediaUrls: [resolvedUrl],
      caption,
      hashtags: caption.match(/#\w+/g) || [],
      likesCount: 0, commentsCount: 0,
      sharesCount: 0, savesCount: 0, viewsCount: 0,
      createdAt: new Date().toISOString(),
    };

    // Profile posts sync
    const savedPosts = JSON.parse(localStorage.getItem('userPostsMeta') || '[]');
    localStorage.setItem('userPostsMeta', JSON.stringify([{
      id: postId, isVideo,
      description: caption,
      hashtags: caption.match(/#\w+/g) || [],
      username: savedProfile.username || user?.username || 'User',
      avatar: savedProfile.photo || '',
      views: 0, likes: 0, liked: false,
      saves: 0, saved: false,
      timestamp: new Date().toISOString(),
    }, ...savedPosts]));

    addPost(feedPost);
    setIsUploading(false);
    setSelectedFile(null);
    setPreviewUrl('');
    setCaption('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 flex items-end md:items-center justify-center">
      <div className="bg-white w-full max-w-md rounded-t-2xl md:rounded-2xl p-5 flex flex-col gap-4 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-900">New Post</h3>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-100">
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <input ref={fileInputRef} type="file" accept="video/*,image/*" onChange={handleFileChange} className="hidden" />

        {!selectedFile ? (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="h-48 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center gap-3 text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-colors"
          >
            <Upload className="w-10 h-10" />
            <span className="text-sm font-medium">Choose Video or Photo</span>
          </button>
        ) : (
          <div className="relative h-48 rounded-xl overflow-hidden bg-black">
            {isVideo
              ? <video src={previewUrl} className="h-full w-full object-contain" muted />
              : <img src={previewUrl} alt="preview" className="h-full w-full object-contain" />
            }
            <button
              onClick={() => { setSelectedFile(null); setPreviewUrl(''); }}
              className="absolute top-2 right-2 bg-black/50 rounded-full p-1"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        )}

        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Write a caption... #hashtags"
          rows={3}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
        />

        <button
          onClick={handleSubmit}
          disabled={!selectedFile || isUploading}
          className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl disabled:opacity-50 hover:bg-blue-700 transition-colors"
        >
          {isUploading ? 'Posting...' : 'Post'}
        </button>
      </div>
    </div>
  );
}