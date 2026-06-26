import VideoCard from '../components/VideoCard';
import avatarImg from '../assets/user.png';
import type { VideoData, User } from '../types';

// TODO: replace with a real feed from your API.
// TODO: drop an actual .mp4 into /public — there's no video asset yet,
// so videoUrl below currently points nowhere.
const mockVideo: VideoData = {
  id: 'post-123',
  videoUrl: '/myvideo.mp4',
  authorName: 'BinJamin',
  authorAvatarUrl: avatarImg,
  caption: 'Connect with your friends and the world on Nexify',
};

// TODO: replace with the real logged-in user once auth exists.
const mockCurrentUser: User = {
  id: 'me',
  fullName: 'BinJamin',
  email: 'binjamin@example.com',
  avatarUrl: avatarImg,
};

export default function Home() {
  return <VideoCard video={mockVideo} currentUser={mockCurrentUser} />;
}
