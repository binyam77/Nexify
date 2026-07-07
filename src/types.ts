export interface User {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
}

export interface VideoData {
  id: string;
  videoUrl: string;
  authorName: string;
  authorAvatarUrl: string;
  caption: string;
  hashtags?: string[];
  isVideo?:boolean;
  thumbnail?:string;
  likes?:number;
  views?: number;
}

export interface CommentReply {
  id: number;
  text: string;
  username: string;
  avatar: string | null;
  timestamp: string;
}

export interface CommentItem {
  id: number;
  text: string;
  username: string;
  avatar: string | null;
  timestamp: string;
  likesCount: number;
  liked: boolean;
  replies: CommentReply[];
}

export type CommentSort = 'newest' | 'oldest';



/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// ==========================================
// 1. types.ts - የዳታ አይነቶች መግለጫ (Data Interfaces)
// ==========================================
// በአማርኛ፦ ይህ ፋይል በሲስተሙ ውስጥ ጥቅም ላይ የሚውሉ የዳታ መዋቅሮችን ይይዛል።
// In English: This file contains the TypeScript interfaces used across the application.
// Structured to easily integrate with database APIs or server backends in the future.

export interface Chat {
  id: string; // ለቻቱ/ለግሩፑ ልዩ መለያ (Unique ID of the chat/room)
  name: string; // የቻቱ፣ የቻናሉ ወይም የግለሰቡ ስም (Name of the chat, group, or channel)
  lastMsgText: string; // የመጨረሻው መልዕክት ይዘት (Content of the last message)
  lastMsgSender: string; // የመጨረሻውን መልዕክት የላከው ሰው ስም (Name of the sender of the last message)
  lastMsgTime: string; // መልዕክቱ የተላከበት ሰዓት (Timestamp of the last message)
  unreadCount: number; // ያላለቁ መልዕክቶች ብዛት (Number of unread messages)
  avatarLabel: string; // የአምሳያ ምስል በሌለበት የሚቀመጥ አጭር ፊደል (e.g. NX)
  bgGradient: string; // የአምሳያ ምስል የጀርባ ቀለም (Tailwind CSS gradient class for avatar background)
  membersCount: number; // የግሩፑ/የቻናሉ ጠቅላላ አባላት ብዛት (Total number of members in group/channel)
  onlineCount: number; // አሁን መስመር ላይ ያሉ አባላት ብዛት (Current number of online members)
  isJoined: boolean; // ተጠቃሚው ይህን ግሩፕ የተቀላቀለ መሆኑን ማሳያ (Whether the current user has joined this room)
  type?: 'group' | 'chat' | 'channel'; // የቻቱ አይነት፦ ግሩፕ፣ የግል ቻት ወይም ቻናል (Type of room: group, private direct chat, or public channel)
  avatarUrl?: string; // የአምሳያ ምስል ሊንክ (Optional image URL or Base64 data URL for avatar)
  isCreatedByMe?: boolean; // በኔ የተፈጠረ መሆኑን ማሳያ (True if created by the current user to authorize posts)
  isOnline?: boolean; // መስመር ላይ መሆን አለመሆኑን ማሳያ - ለግል ቻት (Online status for direct private chats)
  lastSeen?: string; // በመጨረሻ የታየበት ሰዓት (Last seen timestamp)
}

export interface Message {
  id: string; // ለመልዕክቱ ልዩ መለያ (Unique ID of the message)
  senderName: string; // የላኪው ስም (Sender's display name)
  text: string; // የመልዕክቱ ፅሁፍ (Message body text)
  time: string; // መልዕክቱ የተላከበት ሰዓት (Message sent time/date string)
  isSentByMe: boolean; // መልዕክቱን የላኩት እኔ መሆኔን ማሳያ (Flag to indicate if the message was sent by the current user)
  mediaUrl?: string; // በአባሪነት የተላከ ምስል ወይም ቪዲዮ (Optional URL/Base64 string for photo, video, etc.)
  mediaType?: 'image' | 'video' | 'audio' | 'pdf'; // የአባሪው ፋይል አይነት (Type of attached media file)
  isEdited?: boolean; // መልዕክቱ የተቀየረ መሆኑን ማሳያ (Flag to indicate if the message has been edited)
  reactions?: { emoji: string; count: number; users: string[] }[]; // ተጠቃሚዎች የሰጡት ምላሽ (List of user reactions to this message)
}


export interface PostMeta {
  id: number;
  title: string;
  isVideo: boolean;
  fileName?: string;
  description: string;
  hashtags: string[];
  username: string;
  avatar: string | null;
  views: number;
  likes: number;
  liked: boolean;
  saves: number;
  saved: boolean;
  timestamp: string;
  thumbnail?: string;
}

export interface OtherCreator {
  id: number;
  name: string;
  username: string;
  photo: string;
  gradient: string;
  isFollowing: boolean;
  followersCount: number;
  followingCount: number;
  bio: string;
  loginsCount: number;
  posts: PostMeta[];
}


export interface FeedPost{
  id: string;
  userId:string;  // PostagraSQL: usres.id
  username:string;
  userAvatar:string;
  type:'video' | 'photo';
  mediaUrls: string[];// carousel = array, video=[0]
  caption:string;
  hashtags: string[];
  likesCount: number;
  commentsCount :number;
  sharesCount:number;
  savesCount : number;
  viewsCount:number;
  createdAt:string;
  

}
export type NavTab = 'home' | 'community' | 'profile' | 'settings' | 'explore';