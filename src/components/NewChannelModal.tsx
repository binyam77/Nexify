/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { ArrowLeft, Plus, Upload, Trash2, Camera, Image as ImageIcon } from 'lucide-react';
import type { Chat } from '../types';

interface NewChannelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateChannel: (newChat: Chat) => void;
}

const MAX_NAME_LENGTH = 60;
const MAX_BIO_LENGTH = 300;

// Title: NewChannelModal — Full-screen channel creation flow (Cover → Photo → Name → Bio)
export default function NewChannelModal({
  isOpen,
  onClose,
  onCreateChannel,
}: NewChannelModalProps) {
  const [coverUrl, setCoverUrl] = useState<string>('');
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [gradientIndex, setGradientIndex] = useState(0); // 0 = ምንም አልተመረጠም፣ ተጠቃሚው ራሱ ይምረጥ
  const coverInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const gradients = [
    { label: 'Sunset Red', class: 'bg-gradient-1' },
    { label: 'Ocean Blue', class: 'bg-gradient-2' },
    { label: 'Emerald Mint', class: 'bg-gradient-3' },
    { label: 'Purple Dream', class: 'bg-gradient-4' },
  ];

  const validateImage = (file: File, maxMB: number) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file!');
      return false;
    }
    if (file.size > maxMB * 1024 * 1024) {
      alert(`File size must be under ${maxMB}MB!`);
      return false;
    }
    return true;
  };

  const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !validateImage(file, 5)) return;
    const reader = new FileReader();
    reader.onloadend = () => setCoverUrl(reader.result as string);
    reader.onerror = () => alert('Failed to read the selected image. Please try another file.');
    reader.readAsDataURL(file);
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !validateImage(file, 5)) return;
    const reader = new FileReader();
    reader.onloadend = () => setAvatarUrl(reader.result as string);
    reader.onerror = () => alert('Failed to read the selected image. Please try another file.');
    reader.readAsDataURL(file);
  };

  const handleRemoveCover = () => {
    setCoverUrl('');
    if (coverInputRef.current) coverInputRef.current.value = '';
  };

  const handleRemoveAvatar = () => {
    setAvatarUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;

    const words = trimmedName.split(' ');
    const avatarLabel = words.length > 1
      ? (words[0][0] + words[1][0]).toUpperCase()
      : trimmedName.slice(0, 2).toUpperCase();

    const newChat: Chat = {
      id: `channel-${Date.now()}`,
      name: trimmedName,
      lastMsgText: 'Welcome to this new channel! Stay tuned for updates.',
      lastMsgSender: 'System',
      lastMsgTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      unreadCount: 0,
      avatarLabel,
      bgGradient: gradients[gradientIndex - 1]?.class || 'bg-gradient-1',
      membersCount: 1,
      onlineCount: 0,
      isJoined: true,
      type: 'channel',
      avatarUrl: avatarUrl || undefined,
      cover: coverUrl || undefined,
      description: bio.trim() || undefined,
      isCreatedByMe: true,
    };

    onCreateChannel(newChat);

    setCoverUrl('');
    setAvatarUrl('');
    setName('');
    setBio('');
    setGradientIndex(0);
    if (coverInputRef.current) coverInputRef.current.value = '';
    if (fileInputRef.current) fileInputRef.current.value = '';
    onClose();
  };

  return (
    <div className="fixed inset-0 h-[100svh] bg-white z-50 flex flex-col animate-in fade-in duration-150">
      <header className="px-4 py-4 border-b border-gray-100 flex items-center gap-3 shrink-0">
        <button
          onClick={onClose}
          className="p-1.5 text-gray-600 hover:bg-gray-50 rounded-xl transition-all"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h3 className="text-lg font-extrabold text-gray-900 tracking-tight">Create New Channel</h3>
      </header>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
        <div
          onClick={() => coverInputRef.current?.click()}
          className="relative w-full h-40 bg-gray-100 border-b border-gray-100 flex items-center justify-center cursor-pointer overflow-hidden group"
        >
          {coverUrl ? (
            <>
              <img src={coverUrl} alt="Cover preview" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveCover();
                }}
                className="absolute top-3 right-3 p-1.5 bg-black/50 hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center text-gray-400">
              <ImageIcon className="w-7 h-7 mb-1 text-gray-300" />
              <span className="text-xs font-semibold">Add a cover photo</span>
            </div>
          )}
          <input
            type="file"
            ref={coverInputRef}
            onChange={handleCoverFileChange}
            accept="image/*"
            className="hidden"
          />
        </div>

        <div className="p-6 space-y-4 max-w-lg mx-auto">
          <div className="flex items-center gap-4 -mt-14 relative z-10">
            <div className="relative w-20 h-20 rounded-full bg-gray-200 overflow-hidden shrink-0 flex items-center justify-center border-4 border-white shadow-md">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Channel" className="w-full h-full object-cover" />
              ) : (
                <div className={`w-full h-full flex items-center justify-center text-white font-black text-lg ${gradientIndex > 0 ? gradients[gradientIndex - 1].class : "bg-gray-300"}`}>
                  {name ? (name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?') : '?'}
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity text-white"
                title="Upload Image"
              >
                <Camera className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 pt-8 space-y-1">
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-[10px] font-bold text-gray-700 hover:bg-gray-100 transition-all flex items-center gap-1"
                >
                  <Upload className="w-3 h-3" />
                  <span>Profile Photo</span>
                </button>
                {avatarUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveAvatar}
                    className="px-2.5 py-1.5 bg-red-50 border border-red-100 rounded-lg text-[10px] font-bold text-red-600 hover:bg-red-100 transition-all flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Remove</span>
                  </button>
                )}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarFileChange}
                accept="image/*"
                className="hidden"
              />
            </div>
          </div>

          <div>
            <label htmlFor="channelName" className="block text-xs font-black text-gray-600 uppercase tracking-widest mb-1.5">
              Channel Name *
            </label>
            <input
              id="channelName"
              type="text"
              required
              maxLength={MAX_NAME_LENGTH}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="channel name"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 placeholder-gray-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all duration-200"
            />
          </div>

          <div>
            <label htmlFor="channelBio" className="block text-xs font-black text-gray-600 uppercase tracking-widest mb-1.5">
              Bio
            </label>
            <textarea
              id="channelBio"
              rows={3}
              maxLength={MAX_BIO_LENGTH}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Describe what this channel is about..."
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-800 placeholder-gray-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all duration-200 resize-none"
            />
          </div>

          {!avatarUrl && (
            <div>
              <span className="block text-xs font-black text-gray-600 uppercase tracking-widest mb-2.5">
                Choose Fallback Theme Color
              </span>
              <div className="grid grid-cols-4 gap-3">
                {gradients.map((gradient, index) => {
                  const isSelected = gradientIndex === index + 1;
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setGradientIndex(index + 1)}
                      className={`h-9 rounded-xl cursor-pointer ${gradient.class} flex items-center justify-center transition-all ${
                        isSelected
                          ? 'ring-4 ring-blue-500 scale-[1.05]'
                          : 'opacity-80 hover:opacity-100 hover:scale-[1.02]'
                      }`}
                      title={gradient.label}
                    >
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-white shadow-sm" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </form>

           <div className="p-4 pb-[max(1.5rem,calc(env(safe-area-inset-bottom)+1rem))] border-t border-gray-100 shrink-0 shadow-[0_-4px_12px_rgba(0,0,0,0.04)]">
        <div className="max-w-lg mx-auto">
          <button
            onClick={handleSubmit}
            disabled={!name.trim()}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 text-white text-sm font-extrabold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md shadow-blue-200"
          >
            <Plus className="w-4 h-4" />
            <span>Create Channel</span>
          </button>
        </div>
      </div>
      </div>
  );
}