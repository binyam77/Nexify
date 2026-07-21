/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Copy, Check,  Share2 } from 'lucide-react';

// --- የShareModalProps በይነገጽ (Props Interface) ---
interface ShareModalProps {
  post: {
    id: string;
    caption: string;
    username: string;
    type: 'photo' | 'video';
    mediaUrls: string[];
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onShareIncrement: (postId: string) => void;
}

/**
 * የShare ኮንቲነር ሞዳል (Share Modal Component)
 * ተጠቃሚዎች የቪዲዮ ወይም የፎቶ ልጥፎችን ለጓደኞቻቸው እና ለተለያዩ ሶሻል ሚዲያዎች በቀላሉ እንዲያጋሩ ያስችላል።
 * 
 * ለወደፊቱ ከ Node.js + Express + PostgreSQL ጋር ሲያገናኙት፡-
 * - ይህንን ሊንክ በኢሜል ወይም በሶሻል ሚዲያ ለመላክ ወደ backend API ጥሪ ማድረግ ይችላሉ (ለምሳሌ፡ /api/posts/:id/share)
 * - የShare ቁጥርን በዳታቤዝ ውስጥ 'shares_count' በሚል ሠንጠረዥ (table) ውስጥ ማሳደግ ይችላሉ።
 */
export default function ShareModal({ post, isOpen, onClose, onShareIncrement }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !post) return null;

  // የልጥፉን መለያ ሊንክ ማመንጫ (Simulated unique link for the post)
  const shareUrl = `${window.location.origin}/post/${post.id}`;

  // ኮፒ የማድረጊያ ተግባር (Copy link to clipboard)
  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      onShareIncrement(post.id); // የሼር ቆጣሪውን ማሳደጊያ (Increment count on copy)
      setTimeout(() => setCopied(false), 2000);
    }).catch(err => {
      console.error('Failed to copy link:', err);
    });
  };

  // የሶሻል ሚዲያ ማጋሪያ ሊንኮች (Social Media Sharing Links)
  const shareOptions = [
    {
      name: 'Telegram',
      color: 'bg-[#229ED9]',
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M20.665 3.717l-17.73 6.837c-1.21.486-1.203 1.161-.222 1.462l4.552 1.42 10.532-6.645c.498-.303.953-.14.579.192l-8.533 7.701-.332 4.96c.488 0 .702-.223.974-.488l2.337-2.27 4.861 3.59c.896.495 1.537.24 1.761-.83l3.19-15.03c.326-1.31-.5-1.9-1.36-.148z"/>
        </svg>
      ),
      url: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(post.caption)}`
    },
    {
      name: 'WhatsApp',
      color: 'bg-[#25D366]',
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.742.002-2.602-1.01-5.05-2.85-6.892-1.84-1.842-4.287-2.856-6.886-2.858-5.441 0-9.868 4.372-9.872 9.746-.002 1.785.485 3.532 1.411 5.086L1.87 21.057l5.127-1.341c.04-.01.07.01.11-.01zm11.367-7.64c-.31-.155-1.838-.906-2.12-.1-.28.105-.482.906-.59.13-.108-.077-.245-.27-.514-.515-1.07-.942-1.85-2.033-2.06-2.396-.21-.362.22-.38.43-.586.19-.19.31-.36.46-.57.15-.21.08-.39-.04-.6-.12-.21-.93-2.24-1.27-3.07-.33-.8-.71-.69-.97-.7l-.83-.01c-.28 0-.73.11-1.11.53-.38.41-1.46 1.43-1.46 3.49 0 2.06 1.5 4.05 1.71 4.33.21.28 2.95 4.51 7.15 6.32 1 .43 1.78.69 2.39.88 1 .32 1.9.28 2.62.17.8-.12 2.45-.1 2.76-1.12.31-.13.31-2.27.13-2.58-.18-.3-.68-.46-.99-.61z"/>
        </svg>
      ),
      url: `https://api.whatsapp.com/send?text=${encodeURIComponent(post.caption + ' ' + shareUrl)}`
    },
    {
      name: 'Facebook',
      color: 'bg-[#1877F2]',
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      ),
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
    },
    {
      name: 'X (Twitter)',
      color: 'bg-[#000000]',
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      ),
      url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(post.caption)}`
    },
    {
      name: 'LinkedIn',
      color: 'bg-[#0077B5]',
      icon: (
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0z"/>
        </svg>
      ),
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
    }
  ];

  // ሶሻል ሚዲያ ሲጫን ቆጣሪውን ማሳደጊያ (Increment share count on social media click)
  const handleSocialShare = (url: string) => {
    onShareIncrement(post.id);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fade-in">
      <div 
        className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-gray-100 flex flex-col p-6 relative max-sm:w-[95%] animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header (የሼር ሞዳል ራስጌ) */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-black tracking-tight text-gray-900">Share Post</h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 text-gray-400 hover:text-gray-700 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Post Preview Snippet (የልጥፉ አጭር መግለጫ) */}
        <div className="bg-slate-50 rounded-2xl p-3 mb-4 flex items-center gap-3 border border-slate-100">
          {post.mediaUrls[0] && post.type ==="photo" ? (
            <img src={post.mediaUrls[0]} alt="thumbnail" className="w-12 h-12 rounded-xl object-cover border" />
          ) : (
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 font-bold">
              {post.type === 'video' ? '🎬' : '📷'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-gray-400">@{post.username}</p>
            <p className="text-xs text-gray-700 truncate font-semibold">{post.caption || 'No description'}</p>
          </div>
        </div>

        {/* Copy Link Input Section (ሊንኩን ኮፒ ማድረጊያ) */}
        <div className="mb-6">
          <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">Post Link</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              readOnly 
              value={shareUrl} 
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-600 outline-none select-all font-mono"
            />
            <button
              onClick={handleCopy}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 transition-all shadow-md active:scale-95 ${
                copied ? 'bg-emerald-500 shadow-emerald-100' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-100'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Social Sharing Icons (የሶሻል ሚዲያ አማራጮች) */}
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-3 uppercase tracking-wider">Share via Social Media</label>
          <div className="grid grid-cols-5 gap-3.5">
            {shareOptions.map((opt) => (
              <button
                key={opt.name}
                onClick={() => handleSocialShare(opt.url)}
                className="flex flex-col items-center gap-1.5 group outline-none"
              >
                <div className={`${opt.color} w-11 h-11 rounded-full flex items-center justify-center text-white text-lg shadow-md group-hover:scale-110 active:scale-90 transition-transform duration-200`}>
                  {opt.icon}
                </div>
                <span className="text-[10px] font-bold text-gray-500 group-hover:text-blue-600 transition-colors truncate w-full text-center">
                  {opt.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
