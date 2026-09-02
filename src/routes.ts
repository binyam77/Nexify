export const ROUTES = {
  firstEntry: "/",
  home: "/home",
  community: "/community",
  profile: "/profile",
  userProfile: "/profile/:username",
  settings: "/settings",
  login: "/login",
  createAccount: "/create-account",
  about: "/about",
  contact: "/contact",
  help: "/help",
  privacy: "/privacy",
  terms: "/terms",
  notifications: "/notifications",
} as const;
export function userProfilePath(username: string): string {
  return `/profile/${username}`;
}
