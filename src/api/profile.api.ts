import { apiClient } from "../lib/api-client";

interface BackendProfileResponse {
  userId: string;
  username: string;
  displayName: string;
  bio: string | null;
  avatar: string | null;
  cover: string | null;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  isFollowedByMe: boolean | null;
}

// Mirrors User's profile-shaped fields — kept separate from the full User
// type so this module doesn't need to import/depend on AuthContext.
export interface ProfileData {
  username: string;
  name: string;
  bio: string;
  photo: string;
  cover: string;
  followersCount: number;
  followingCount: number;
  postsCount: number;
}

function toProfileData(dto: BackendProfileResponse): ProfileData {
  return {
    username: dto.username,
    name: dto.displayName,
    bio: dto.bio ?? "",
    photo: dto.avatar ?? "",
    cover: dto.cover ?? "",
    followersCount: dto.followersCount,
    followingCount: dto.followingCount,
    postsCount: dto.postsCount,
  };
}

export async function fetchMyProfile(): Promise<ProfileData> {
  const dto = await apiClient<BackendProfileResponse>(`/profile/me`);
  return toProfileData(dto);
}

export interface UpdateProfileInput {
  displayName?: string;
  username?: string;
  bio?: string;
  avatar?: string;
  cover?: string;
}

export async function updateMyProfile(
  input: UpdateProfileInput,
): Promise<ProfileData> {
  const dto = await apiClient<BackendProfileResponse>(`/profile/me`, {
    method: "PATCH",
    body: input,
  });
  return toProfileData(dto);
}
export async function fetchProfile(
  username: string,
): Promise<ProfileData & { userId: string; isFollowedByMe: boolean | null }> {
  const dto = await apiClient<BackendProfileResponse>(`/profile/${username}`);
  return {
    ...toProfileData(dto),
    userId: dto.userId,
    isFollowedByMe: dto.isFollowedByMe,
  };
}

export function followUser(userId: string): Promise<{ isFollowing: boolean }> {
  return apiClient<{ isFollowing: boolean }>(`/profile/${userId}/follow`, {
    method: "POST",
  });
}

export function unfollowUser(
  userId: string,
): Promise<{ isFollowing: boolean }> {
  return apiClient<{ isFollowing: boolean }>(`/profile/${userId}/follow`, {
    method: "DELETE",
  });
}
