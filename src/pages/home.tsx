import VideoCard from "../components/VideoCard";
import avatarImg from "../assets/user.png";
import { useAuth } from "../context/AuthContext";
import type { VideoData, User } from "../types";

// TODO: replace with a real feed from your API.
// TODO: drop an actual .mp4 into /public — there's no video asset yet,
// so videoUrl below currently points nowhere.
const mockVideo: VideoData = {
  id: "post-123",
  videoUrl: "/myvideo.mp4",
  authorName: "BinJamin",
  authorAvatarUrl: avatarImg,
  caption: "Connect with your friends and the world on Nexify",
};
export default function Home() {
  const { user } = useAuth();

  const currentUser: User = {
    id: "me",
    fullName: user?.username || "User",
    email: user?.email || "",
    avatarUrl: avatarImg,
  };
  const video: VideoData = {
    ...mockVideo,
    authorName: user?.username || "User",
  };

  return <VideoCard video={video} currentUser={currentUser} />;
}
