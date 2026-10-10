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
import LinkifiedText from "./LinkifiedText";
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
  onOpenFollowing?: () => void;
  onOpenFollowers?: () => void;

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
  const scrollToPosts = () => {
    document
      .getElementById("profile-posts-grid")
      ?.scrollIntoView({ behavior: "smooth" });
  };
  const isLongBio =
    profile.bio.length > 80 || profile.bio.split("\n").length > 2;
  return (
    <div className="w-full flex flex-col shrink-0">
      <div className="max-w-4xl w-full mx-auto px-4 md:px-8 pt-5">
        <div className="flex items-center justify-between mb-4">
          <div
            onClick={() => directPhotoInputRef.current?.click()}
            className="relative w-24 h-24 md:w-28 md:h-28 shrink-0 cursor-pointer group"
          >
            <div className="w-full h-full rounded-full border-4 border-white shadow-xl overflow-hidden bg-blue-100 flex items-center justify-center">
              {profile.photo ? (
                <img
                  src={profile.photo}
                  alt={profile.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                  <Camera className="w-8 h-8 text-slate-400" />
                </div>
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-black/70 flex items-center justify-center border-2 border-white group-hover:scale-110 transition-transform z-10">
              <Camera className="w-4 h-4 text-white" />
            </div>
          </div>

          <div className="flex gap-5 sm:gap-7 pb-2">
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
              onClick={scrollToPosts}
              className="flex flex-col items-center"
            >
              <span className="text-base sm:text-lg font-black text-text tracking-tight">
                {formatCount(postsCount)}
              </span>
              <span className="text-[11px] text-small-text font-semibold">
                Videos
              </span>
            </button>
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

               {/* Bio — ከ Edit ቁልፍ በላይ፣ link ካለ ሰማያዊ */}
        {profile.bio && (
          <div className="mb-4">
            <p
              className={`text-sm font-medium text-text leading-relaxed break-words whitespace-pre-line ${
                !isBioExpanded ? "line-clamp-2" : ""
              }`}
            >
              <LinkifiedText text={profile.bio} />
            </p>
            {isLongBio && (
              <button
                onClick={() => setIsBioExpanded(!isBioExpanded)}
                className="mt-1 text-xs font-extrabold text-blue-600 hover:text-indigo-600 flex items-center gap-1 transition-colors"
              >
                {isBioExpanded ? (
                  <>
                    <span>Less</span>
                    <ChevronUp className="w-3 h-3" />
                  </>
                ) : (
                  <>
                    <span>More</span>
                    <ChevronDown className="w-3 h-3" />
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 mb-5">
          <button
            onClick={handleOpenEditModal}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-100 hover:bg-hover-input text-text font-bold text-sm transition-all"
          >
            <Edit className="w-4 h-4" />
            <span>Edit Profile</span>
          </button>

          <Link
            to="/settings"
            className="w-11 h-11 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-hover-input text-text transition-all shrink-0"
          >
            <Settings size={18} strokeWidth={2.5} />
          </Link>
        </div>

        {/* Videos tab — ከታች መስመር ብቻ (ከላይ የለም)፣ ፖስቶች ከሱ ጋር ይጣበቃሉ */}
        <button
          onClick={scrollToPosts}
          className="w-full flex items-center justify-center gap-1.5 border-b border-gray-200/60 py-3 text-xs font-black uppercase tracking-wider text-brand-dark"
        >
          <Grid className="w-3.5 h-3.5" />
          <span>Videos</span>
        </button>
      </div>
    </div>
  );
}
