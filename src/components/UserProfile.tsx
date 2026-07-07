/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Camera, Edit, Users, MessageCircle, ChevronUp, ChevronDown, Grid } from "lucide-react";

// UserProfile.tsx የProp ዓይነቶች መግለጫ (Props Interface for UserProfile.tsx)
interface UserProfileProps {
  profile: {
    name: string;
    username: string;
    photo: string;
    cover: string;
    bio: string;
  };
  otherProfile: {
    name: string;
    username: string;
    photo: string;
    bio: string;
    followersCount: number;
    followingCount: number;
    isFollowing: boolean;
  } | null;
  viewMode: "me" | "other";
  followersCount: number;
  starsCount: number;
  postsCount: number;
  otherPostsCount: number;
  isBioExpanded: boolean;
  setIsBioExpanded: (expanded: boolean) => void;
  activeTab: "posts" | "video" | "likes";
  setActiveTab: (tab: "posts" | "video" | "likes") => void;
  
  // ተፅዕኖ ፈጣሪ ተግባራት (Action handler callbacks)
  handleOpenEditModal: () => void;
  setIsOthersModalOpen: (open: boolean) => void;
  handleMessageUser: (user: { name: string; username: string; photo: string }) => void;
  toggleFollowUser: (index: number) => void;
  selectedOtherUser: number;
  directPhotoInputRef: React.RefObject<HTMLInputElement | null>;
  directCoverInputRef: React.RefObject<HTMLInputElement | null>;
  formatCount: (num: number) => string;
}

export default function UserProfile({
  profile,
  otherProfile,
  viewMode,
  followersCount,
  starsCount,
  postsCount,
  otherPostsCount,
  isBioExpanded,
  setIsBioExpanded,
  activeTab,
  setActiveTab,
  handleOpenEditModal,
  setIsOthersModalOpen,
  handleMessageUser,
  toggleFollowUser,
  selectedOtherUser,
  directPhotoInputRef,
  directCoverInputRef,
  formatCount,
}: UserProfileProps) {
  return (
    <div className="w-full flex flex-col shrink-0">
      
      {/* 1. Banner/Cover Photo (የላይኛው ባነር ገጽ) */}
      <div className="w-full relative shrink-0">
        {viewMode === "me" ? (
          profile.cover ? (
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
          )
        ) : (
          <div className="w-full h-40 md:h-52 bg-slate-900 relative overflow-hidden flex flex-col justify-center items-center px-4 border-b border-gray-200/60">
            <div className="absolute inset-0 opacity-15 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:14px_24px]" />
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-emerald-500 rounded-full blur-3xl opacity-25" />
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-teal-500 rounded-full blur-3xl opacity-25" />

            <div className="relative z-10 flex flex-col items-center text-center">
              <span className="text-white/20 font-mono tracking-widest text-xs select-none uppercase font-black">
                ABEL CODES WORKSPACE
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
              onClick={() => viewMode === "me" && directPhotoInputRef.current?.click()}
              className={`w-24 h-24 md:w-28 md:h-28 rounded-full border-4 border-white shadow-xl overflow-hidden shrink-0 bg-blue-100 flex items-center justify-center relative group ${viewMode === "me" ? "cursor-pointer" : ""}`}
            >
              {viewMode === "me" ? (
                profile.photo ? (
                  <img src={profile.photo} alt={profile.name} className="w-full h-full object-cover" />
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
                )
              ) : otherProfile?.photo ? (
                <img src={otherProfile.photo} alt={otherProfile.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white text-3xl font-bold tracking-wider">
                  AT
                </div>
              )}
              
              {viewMode === "me" && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                  <Camera className="w-6 h-6 text-white animate-pulse" />
                </div>
              )}
            </div>

            <div className="pt-4 sm:pt-0 sm:pb-1 flex flex-col justify-end">
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-950 flex items-center gap-1.5 leading-tight">
                {viewMode === "me" ? profile.name : otherProfile?.name}
              </h2>
              <p className="text-xs sm:text-sm font-black text-blue-600 mt-1 tracking-wide">
                @{viewMode === "me" ? profile.username : otherProfile?.username}
              </p>
            </div>
          </div>

          {/* Stats counts container */}
          <div className="flex gap-6 md:gap-8 self-start sm:self-end bg-white border border-gray-100 shadow-md shadow-gray-100/30 px-5 py-3 rounded-2xl">
            <div className="flex flex-col items-center">
              <span className="text-lg font-black text-gray-900 tracking-tight">
                {viewMode === "me" ? formatCount(followersCount) : formatCount(otherProfile?.followersCount ?? 0)}
              </span>
              <span className="text-xs text-gray-400 font-bold tracking-wide uppercase">
                Followers
              </span>
            </div>
            <div className="flex flex-col items-center border-x border-gray-100 px-6 md:px-8">
              <span className="text-lg font-black text-gray-900 tracking-tight">
                {viewMode === "me" ? formatCount(postsCount) : formatCount(otherPostsCount)}
              </span>
              <span className="text-xs text-gray-400 font-bold tracking-wide uppercase">
                Posts
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-1">
                {viewMode === "me" ? formatCount(starsCount) : formatCount(otherProfile?.followingCount ?? 0)}
              </span>
              <span className="text-xs text-gray-400 font-bold tracking-wide uppercase">
                Following
              </span>
            </div>
          </div>

        </div>

        {/* 3. Action Buttons (የማስተካከያ እና የመልእክት ቁልፎች) */}
        <div className="flex flex-wrap items-center gap-2.5 mb-6">
          {viewMode === "me" ? (
            <>
              <button
                onClick={handleOpenEditModal}
                className="px-4 py-2.5 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 hover:text-blue-600 text-gray-750 font-black text-xs uppercase tracking-wider transition-all shadow-sm flex items-center gap-2 shrink-0"
                title="Edit Profile"
              >
                <Edit className="w-4 h-4 text-gray-500" />
                <span>Edit</span>
              </button>

              <button
                onClick={() => setIsOthersModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 hover:text-blue-600 text-gray-750 font-black text-xs uppercase tracking-wider transition-all shadow-sm flex items-center gap-2 shrink-0"
                title="View Other Developers"
              >
                <Users className="w-4 h-4 text-gray-500" />
                <span>others</span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() =>
                  otherProfile &&
                  handleMessageUser({
                    name: otherProfile.name,
                    username: otherProfile.username,
                    photo: otherProfile.photo,
                  })
                }
                className="px-4 py-2.5 rounded-xl bg-[#2481cc] hover:bg-[#2075b8] text-white hover:scale-105 active:scale-95 font-black text-xs uppercase tracking-wider transition-all shadow-md flex items-center gap-2 shrink-0"
                title="Message this developer"
              >
                <MessageCircle className="w-4 h-4 text-white" />
                <span>Message</span>
              </button>

              <button
                onClick={() => toggleFollowUser(selectedOtherUser)}
                className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-sm transition-all duration-200 ${
                  otherProfile?.isFollowing
                    ? "bg-gray-100 hover:bg-gray-200 text-gray-800"
                    : "bg-gradient-to-b from-[#019BE5] via-[#0185E5] to-[#0071E3] text-white hover:opacity-95 shadow-sm shadow-blue-200/20"
                }`}
              >
                {otherProfile?.isFollowing ? "Following" : "Follow"}
              </button>

              <button
                onClick={() => setIsOthersModalOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 hover:text-blue-600 text-gray-750 font-black text-xs uppercase tracking-wider transition-all shadow-sm flex items-center gap-2 shrink-0"
                title="View Other Developers"
              >
                <Users className="w-4 h-4 text-gray-500" />
                <span>others</span>
              </button>
            </>
          )}
        </div>

        {/* 4. Bio Section (የባዮ ገፅ) */}
        {(viewMode === "me" ? profile.bio : otherProfile?.bio) && (
          <div className="bg-white border border-gray-100/80 rounded-2xl p-4.5 shadow-sm shadow-gray-100/10 mb-6 animate-fade-in">
            <h4 className="text-xs font-black tracking-widest text-blue-600 uppercase mb-2 flex items-center gap-1.5">
              <span>BIO</span>
            </h4>

            <p className="text-sm font-medium text-gray-700 leading-relaxed break-words whitespace-pre-line">
              {viewMode === "me"
                ? profile.bio.length > 80 && !isBioExpanded
                  ? `${profile.bio.slice(0, 80)}...`
                  : profile.bio
                : (otherProfile?.bio ?? "").length > 80 && !isBioExpanded
                  ? `${otherProfile?.bio.slice(0, 80)}...`
                  : otherProfile?.bio}
            </p>

            {(viewMode === "me" ? profile.bio.length : (otherProfile?.bio ?? "").length) > 80 && (
              <button
                onClick={() => setIsBioExpanded(!isBioExpanded)}
                className="mt-2 text-xs font-extrabold text-blue-600 hover:text-indigo-600 flex items-center gap-1 transition-colors"
              >
                {isBioExpanded ? (
                  <>
                    <span>Less</span>
                    <ChevronUp className="w-3 h-3 text-blue-600" />
                  </>
                ) : (
                  <>
                    <span>More</span>
                    <ChevronDown className="w-3 h-3 text-blue-600" />
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
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-800"
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
