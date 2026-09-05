/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Trash2 } from "lucide-react";
import type { FeedPost } from "../types";

// ProfileVideo.tsx የProp ዓይነቶች መግለጫ (Props Interface for ProfileVideo.tsx)
interface ProfileVideoProps {
  filteredPosts: FeedPost[];
  viewMode?: "me" | "other";
  handleOpenPlayer: (post: FeedPost) => void;
  handleDeletePost: (postId: string, e?: React.MouseEvent) => void;
  
}

export default function ProfileVideo({
  filteredPosts,
  viewMode="me",
  handleOpenPlayer,
  handleDeletePost,
}: ProfileVideoProps) {
  return (
    <div className="min-h-48">
      {filteredPosts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-14 bg-surface-raised border border-border rounded-3xl text-center px-4 animate-fade-in">
          <span className="text-4xl mb-3">🎬</span>
          <h3 className="text-base font-extrabold text-text mb-1">
            No content published in Posts
          </h3>
          <p className="text-xs text-small-text max-w-xs mb-5">
            Select a file and publish your very first picture or video stream
            with hashtags!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2.5 sm:gap-4 animate-fade-in">
          {filteredPosts.map((post) => {
            const mediaSrc = post.mediaUrls[0];
            const isVideo = post.type === "video";

            return (
              <div
                key={post.id}
                onClick={() => handleOpenPlayer(post)}
                className="aspect-[9/16] bg-gray-900 rounded-2xl overflow-hidden relative cursor-pointer group shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100/50"
              >
                {/* 1. Media Preview Grid Block */}
                {mediaSrc ? (
                  isVideo ? (
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

                {/* 3. Likes, Description and Trash/Delete Action on Hover (Desktop) */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent flex flex-col justify-end p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <p className="text-xs text-white/90 font-medium line-clamp-2 leading-relaxed mb-3">
                    {post.caption}
                  </p>

                  <div className="flex items-center justify-end">
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
