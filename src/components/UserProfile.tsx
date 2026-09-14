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
  onOpenFollowing?:() => void;
  onOpenFollowers?:() => void;

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
  onOpenFollowers,
  onOpenFollowing,
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
        <div
          onClick={() => directCoverInputRef.current?.click()}
          className={`w-full h-48 md:h-64 relative overflow-hidden cursor-pointer group ${
            profile.cover
              ? "bg-cover bg-center"
              : "bg-gradient-to-br from-slate-300 via-slate-200 to-slate-300"
          }`}
          style={
            profile.cover
              ? { backgroundImage: `url(${profile.cover})` }
              : undefined
          }
        >
          {!profile.cover && (
            <div className="absolute inset-0 opacity-40 bg-[linear-gradient(to_right,#94a3b8_1px,transparent_1px),linear-gradient(to_bottom,#94a3b8_1px,transparent_1px)] bg-[size:20px_20px]" />
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
          <button
            onClick={(e) => {
              e.stopPropagation();
              directCoverInputRef.current?.click();
            }}
            className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 text-white text-xs font-bold backdrop-blur-sm hover:bg-black/75 transition-colors z-10"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Edit cover</span>
          </button>
        </div>
      </div>

      <div className="max-w-4xl w-full mx-auto px-4 md:px-8 relative -mt-14 sm:-mt-16 mb-5">
        <div className="flex items-end justify-between mb-4">
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
            <div className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-black/70 flex items-center justify-center border-2 border-white group-hover:scale-110 transition-transform">
              <Camera className="w-3.5 h-3.5 text-white" />
            </div>
          </div>

          <div className="flex gap-5 sm:gap-7 pb-1">
            <button
              onClick={onOpenFollowing}
              className="flex flex-col items-center"
            >
              <span className="text-base sm:text-lg font-black text-text tracking-tight">
                {formatCount(starsCount)}
              </span>
              <span className="text-[11px] text-small-text font-semibold">
                Following
              </span>
            </button>
            <button
              onClick={onOpenFollowers}
              className="flex flex-col items-center"
            >
              <span className="text-base sm:text-lg font-black text-text tracking-tight">
                {formatCount(followersCount)}
              </span>
              <span className="text-[11px] text-small-text font-semibold">
                Followers
              </span>
            </button>
            <div className="flex flex-col items-center">
              <span className="text-base sm:text-lg font-black text-text tracking-tight">
                {formatCount(postsCount)}
              </span>
              <span className="text-[11px] text-small-text font-semibold">
                Videos
              </span>
            </div>
          </div>
        </div>

        <div className="mb-3">
          <h2 className="text-xl sm:text-2xl font-black tracking-tight text-text-h2 leading-tight">
            {profile.name}
          </h2>
          <p className="text-xs sm:text-sm font-bold text-brand-dark mt-0.5">
            @{profile.username}
          </p>
        </div>

        {/* 3. Action Buttons (የማስተካከያ እና የመልእክት ቁልፎች) */}
          <div className="flex items-center gap-2.5 mb-5">
          <button
            onClick={handleOpenEditModal}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-text font-bold text-sm transition-all"
          >
            <Edit className="w-4 h-4" />
            <span>Edit Profile</span>
          </button>

          <Link
            to="/settings"
            className="w-11 h-11 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-text transition-all shrink-0"
          >
            <Settings size={18} strokeWidth={2.5} />
          </Link>
        </div>

        {/* 4. Bio Section (የባዮ ገፅ) */}
               {profile.bio && (
          <div className="mb-4">
            <p className="text-sm font-medium text-text leading-relaxed break-words whitespace-pre-line">
              {profile.bio.length > 80 && !isBioExpanded
                ? `${profile.bio.slice(0, 80)}...`
                : profile.bio}
            </p>

            {profile.bio.length > 80 && (
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
              <button
          onClick={() => {
            document.getElementById("profile-posts-grid")?.scrollIntoView({ behavior: "smooth" });
          }}
          className="w-full flex items-center justify-center gap-1.5 border-y border-gray-200/60 py-3 mb-4 text-xs font-black uppercase tracking-wider text-brand-dark"
        >
          <Grid className="w-3.5 h-3.5" />
          <span>Videos</span>
        </button>
      </div>
    </div>
  );
}
