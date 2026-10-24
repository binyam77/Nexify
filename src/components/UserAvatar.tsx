import { useState } from "react";

interface UserAvatarProps {
  username: string;
  src?: string | null;
  size: number;
  className?: string;
}

// ፎቶ ከሌለ ወይም ከተሰበረ → ጠንካራ #1370fc ቀለም + የስሙ የመጀመሪያ ፊደል።
// ለ PostCard እና ለ comments/replies አንድ ቦታ ብቻ ይገለጻል።
export default function UserAvatar({
  username,
  src,
  size,
  className = "",
}: UserAvatarProps) {
  // የተሰበረውን src ራሱን እናስታውሳለን፤ src ሲቀየር ራሱ እንደገና ይሞክራል
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showImage = Boolean(src) && src !== failedSrc;

  return (
    <div
      className={`shrink-0 overflow-hidden rounded-full ${className}`}
      style={{ width: size, height: size }}
    >
      {showImage ? (
        <img
          src={src as string}
          alt={username}
          onError={() => setFailedSrc(src ?? null)}
          className="h-full w-full object-cover"
        />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center bg-[#1370fc] font-bold text-white"
          style={{ fontSize: size * 0.4 }}
        >
          {username[0]?.toUpperCase()}
        </div>
      )}
    </div>
  );
}