/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import {
  Camera,
  Edit,
  ChevronUp,
  ChevronDown,
  Grid,
  Settings,
} from "lucide-react";
import { Link } from "react-router-dom";
// UserProfile.tsx የProp ዓይነቶች መግለጫ (Props Interface for UserProfile.tsx)
interface UserProfileProps {
  profile: {
    name: string;
    username: string;
    photo: string;
    cover: string;
    bio: string;
  };
  followersCount: number;
  starsCount: number;
  postsCount: number;
  isBioExpanded: boolean;
  setIsBioExpanded: (expanded: boolean) => void;
  activeTab: "posts" | "video" | "likes";
  setActiveTab: (tab: "posts" | "video" | "likes") => void;

  handleOpenEditModal: () => void;
  directPhotoInputRef: React.RefObject<HTMLInputElement | null>;
  directCoverInputRef: React.RefObject<HTMLInputElement | null>;
  formatCount: (num: number) => string;
}

export default function UserProfile({
  profile,
  followersCount,
  starsCount,
  postsCount,
  isBioExpanded,
  setIsBioExpanded,
  activeTab,
  setActiveTab,
  handleOpenEditModal,
  directPhotoInputRef,
  directCoverInputRef,
  formatCount,
}: UserProfileProps) {
  return (
    <div className="w-full flex flex-col shrink-0">
      {/* 1. Banner/Cover Photo (የላይኛው ባነር ገጽ) */}
      <div className="w-full relative shrink-0">
        {profile.cover ? (
          <div
            onClick={() => directCoverInputRef.current?.click()}
            className="w-full h-40 md:h-52 bg-cover bg-center transition-all duration-300 border-b border-gray-100 cursor-pointer relative group"
            style={{ backgroundImage: `url(${profile.cover})` }}
          >
            <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-black gap-2 backdrop-blur-[1px]">
              <Camera className="w-5 h-5 text-white animate-bounce" />
              <span>Change Banner Cover</span>
            </div>
          </div>
        ) : (
          <div
            onClick={() => directCoverInputRef.current?.click()}
            className="w-full h-40 md:h-52 bg-slate-900 relative overflow-hidden flex flex-col justify-center items-center px-4 border-b border-gray-200/60 cursor-pointer group"
          >
            <div className="absolute inset-0 opacity-15 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:14px_24px]" />
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-blue-500 rounded-full blur-3xl opacity-25" />
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-500 rounded-full blur-3xl opacity-25" />

            <div className="relative z-10 flex flex-col items-center text-center">
              <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center mb-1.5 backdrop-blur-sm border border-white/20 group-hover:scale-110 transition-transform duration-200">
                <Camera className="w-4.5 h-4.5 text-white/90" />
              </div>
              <span className="text-white font-black tracking-tight text-xs sm:text-sm">
                Personalize Your Cover Space
              </span>
              <span className="text-white/60 text-[10px] font-bold mt-0.5 max-w-xs">
                Click here to select and upload your custom brand banner.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 2. User Stats & Avatar Row (የመገለጫ ፎቶ እና ዝርዝር መረጃዎች) */}
      <div className="max-w-4xl w-full mx-auto px-4 md:px-8 relative -mt-4 sm:-mt-12 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3.5 sm:gap-4.5">
            <div
              onClick={() => directPhotoInputRef.current?.click()}
              className="w-24 h-24 md:w-28 md:h-28 rounded-full border-4 border-white shadow-xl overflow-hidden shrink-0 bg-blue-100 flex items-center justify-center relative group cursor-pointer"
            >
              {profile.photo ? (
                <img
                  src={profile.photo}
                  alt={profile.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold tracking-wider">
                  {profile.name
                    ? profile.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)
                    : "NX"}
                </div>
              )}

              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                <Camera className="w-6 h-6 text-white animate-pulse" />
              </div>
            </div>

            <div className="pt-4 sm:pt-0 sm:pb-1 flex flex-col justify-end">
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-text-h2 flex items-center gap-1.5 leading-tight">
                {profile.name}
              </h2>
              <p className="text-xs sm:text-sm font-black text-brand-dark mt-1 tracking-wide">
                @{profile.username}
              </p>
            </div>
          </div>

          {/* Stats counts container */}
          <div className="flex gap-6 md:gap-8 self-start sm:self-end bg-surface-raised border border-gray-100 shadow-md shadow-gray-100/30 px-5 py-3 rounded-2xl">
            <div className="flex flex-col items-center">
              <span className="text-lg font-black text-text tracking-tight">
                {formatCount(followersCount)}
              </span>
              <span className="text-xs text-small-text font-bold tracking-wide uppercase">
                Followers
              </span>
            </div>
            <div className="flex flex-col items-center border-x border-gray-100 px-6 md:px-8">
              <span className="text-lg font-black text-text tracking-tight">
                {formatCount(postsCount)}
              </span>
              <span className="text-xs text-small-text font-bold tracking-wide uppercase">
                Posts
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-lg font-black text-text tracking-tight flex items-center gap-1">
                {formatCount(starsCount)}
              </span>
              <span className="text-xs text-small-text font-bold tracking-wide uppercase">
                Following
              </span>
            </div>
          </div>
        </div>

        {/* 3. Action Buttons (የማስተካከያ እና የመልእክት ቁልፎች) */}
        <div className="flex flex-wrap items-center gap-2.5 mb-6">
          <button
            onClick={handleOpenEditModal}
            className="px-4 py-2.5 rounded-xl bg-surface border border-border hover:bg-surface-raised hover:text-brand-dark text-text font-black text-xs uppercase tracking-wider transition-all shadow-sm flex items-center gap-2 shrink-0"
            title="Edit Profile"
          >
            <Edit className="w-4 h-4 text-gray-500" />
            <span>Edit</span>
          </button>

          <Link
            to="/settings"
            className="px-4 py-2.5 rounded-xl bg-surface sm:hidden border border-border hover:bg-surface-raised hover:text-brand-dark 
 text-text font-black text-xs uppercase tracking-wider transition-all shadow-sm flex items-center gap-2 shrink-0"
          >
            <Settings size={16} strokeWidth={2.5} />
            <span>SETTINGS</span>
          </Link>
        </div>

        {/* 4. Bio Section (የባዮ ገፅ) */}
        {profile.bio && (
          <div className="bg-surface border border-border rounded-2xl p-4.5 shadow-sm shadow-gray-100/10 mb-6 animate-fade-in">
            <h4 className="text-xs font-black tracking-widest text-text uppercase mb-2 flex items-center gap-1.5">
              <span>BIO</span>
            </h4>

            <p className="text-sm font-medium text-text leading-relaxed break-words whitespace-pre-line">
              {profile.bio.length > 80 && !isBioExpanded
                ? `${profile.bio.slice(0, 80)}...`
                : profile.bio}
            </p>

            {profile.bio.length > 80 &&(
              <button
                onClick={() => setIsBioExpanded(!isBioExpanded)}
                className="mt-2 text-xs font-extrabold text-blue-600 hover:text-indigo-600 flex items-center gap-1 transition-colors"
              >
                {isBioExpanded ? (
                  <>
                    <span>Less</span>
                    <ChevronUp className="w-3 h-3 text-brand-dark" />
                  </>
                ) : (
                  <>
                    <span>More</span>
                    <ChevronDown className="w-3 h-3 text-brand-dark" />
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* 5. Filter Tab (Posts) */}
        <div className="flex justify-center border-b border-gray-200/60 pb-4 mb-6 select-none">
          <div className="flex bg-gray-100/80 p-1 rounded-xl border border-gray-200/30">
            <button
              onClick={() => setActiveTab("posts")}
              className={`px-5 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                activeTab === "posts"
                  ? "bg-white text-brand-dark shadow-sm"
                  : "text-brand-dark hover:text-brand-light"
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Posts</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
