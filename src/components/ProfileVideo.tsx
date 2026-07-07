/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Eye, Heart, Trash2 } from "lucide-react";
import type{ PostMeta } from "../types";

// ProfileVideo.tsx የProp ዓይነቶች መግለጫ (Props Interface for ProfileVideo.tsx)
interface ProfileVideoProps {
  filteredPosts: PostMeta[];
  mediaUrls: Record<number, string>;
  viewMode: "me" | "other";
  handleOpenPlayer: (post: PostMeta) => void;
  handleDeletePost: (postId: number, e?: React.MouseEvent) => void;
  formatCount: (num: number) => string;
}

export default function ProfileVideo({
  filteredPosts,
  mediaUrls,
  viewMode,
  handleOpenPlayer,
  handleDeletePost,
  formatCount,
}: ProfileVideoProps) {
  return (
    <div className="min-h-48">
      {filteredPosts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 bg-white border border-gray-100 rounded-3xl text-center px-4 animate-fade-in">
          <span className="text-4xl mb-3">🎬</span>
          <h3 className="text-base font-extrabold text-gray-800 mb-1">
            No content published in Posts
          </h3>
          <p className="text-xs text-gray-400 max-w-xs mb-5">
            Select a file and publish your very first picture or video stream with hashtags!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2.5 sm:gap-4 animate-fade-in">
          {filteredPosts.map((post) => {
            const mediaSrc = mediaUrls[post.id];

            return (
              <div
                key={post.id}
                onClick={() => handleOpenPlayer(post)}
                className="aspect-[9/16] bg-gray-900 rounded-2xl overflow-hidden relative cursor-pointer group shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100/50"
              >
                {/* 1. Media Preview Grid Block */}
                {post.thumbnail || mediaSrc ? (
                  post.thumbnail ? (
                    <>
                      <img
                        src={post.thumbnail}
                        alt="Post thumbnail"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      {post.isVideo && (
                        <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider z-10">
                          🎬 VIDEO
                        </div>
                      )}
                    </>
                  ) : post.isVideo ? (
                    <>
                      <video
                        src={mediaSrc}
                        className="w-full h-full object-cover"
                        muted
                        preload="metadata"
                      />
                      <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-sm text-white text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider z-10">
                        🎬 VIDEO
                      </div>
                    </>
                  ) : (
                    <img
                      src={mediaSrc}
                      alt="Post content preview"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  )
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-800 text-white/50 text-xs">
                    Loading file...
                  </div>
                )}

                {/* 2. Engagement stats counts overlay badge (Always visible on mobile) */}
                <div className="absolute bottom-2.5 right-2.5 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-2.5 shadow-sm z-10 group-hover:opacity-0 transition-opacity duration-200 border border-white/5">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5 text-white/95" />
                    <span>{formatCount(post.views)}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart
                      className={`w-3.5 h-3.5 ${post.liked ? "fill-rose-500 text-rose-500" : "text-white/95"}`}
                    />
                    <span>{formatCount(post.likes)}</span>
                  </span>
                </div>

                {/* 3. Likes, Description and Trash/Delete Action on Hover (Desktop) */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent flex flex-col justify-end p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <p className="text-xs text-white/90 font-medium line-clamp-2 leading-relaxed mb-3">
                    {post.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-white text-xs font-bold">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5 text-white/80" />{" "}
                        {formatCount(post.views)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Heart
                          className={`w-3.5 h-3.5 ${post.liked ? "fill-rose-500 text-rose-500" : "text-white/80"}`}
                        />{" "}
                        {formatCount(post.likes)}
                      </span>
                    </div>

                    {viewMode === "me" && (
                      <button
                        onClick={(e) => handleDeletePost(post.id, e)}
                        className="p-1.5 bg-rose-600/90 hover:bg-rose-700 text-white rounded-lg transition-colors shadow-sm"
                        title="Delete Post"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
