import { FileText } from "lucide-react";
import type { Message } from "../../types";
import { isSafeMediaUrl } from "./messagingUtils";

interface MessageMediaProps {
  msg: Message;
  onOpenImage: (url: string) => void;
  /** ረዘም ብሎ መያዝ ከተፈጸመ በኋላ የሚመጣውን click ለማስቆም */
  wasLongPress: () => boolean;
  /**
   * "bubble": በ bubble ውስጥ (ክብ ጥግ፣ ከታች ህዳግ) — Group/Chat
   * "bleed": እስከ ሳጥኑ ጠርዝ — Channel post
   */
  variant?: "bubble" | "bleed";
}

// በመልዕክት ውስጥ የሚታይ ሚዲያ (ፎቶ፣ ቪዲዮ፣ ድምጽ፣ PDF) — ያልተፈተሸ URL በፍጹም አይታይም
export default function MessageMedia({
  msg,
  onOpenImage,
  wasLongPress,
  variant = "bubble",
}: MessageMediaProps) {
  const media = isSafeMediaUrl(msg.mediaUrl) ? msg.mediaUrl : undefined;
  if (!media) return null;
  const bleed = variant === "bleed";

  if (msg.mediaType === "image") {
    return (
      <img
        src={media}
        alt="Shared media"
        loading="lazy"
        referrerPolicy="no-referrer"
        onClick={(e) => {
          e.stopPropagation();
          if (wasLongPress()) return;
          onOpenImage(media);
        }}
        className={
          bleed
            ? "block max-h-96 w-full cursor-zoom-in object-cover"
            : "mb-1.5 block max-h-72 w-full cursor-zoom-in rounded-xl object-cover"
        }
      />
    );
  }

  if (msg.mediaType === "video") {
    return (
      <video
        src={media}
        controls
        playsInline
        preload="metadata"
        onClick={(e) => e.stopPropagation()}
        className={
          bleed
            ? "block max-h-96 w-full bg-black"
            : "mb-1.5 block max-h-72 w-full rounded-xl bg-black"
        }
      />
    );
  }

  if (msg.mediaType === "audio") {
    const audio = (
      <audio
        src={media}
        controls
        onClick={(e) => e.stopPropagation()}
        className={bleed ? "w-full" : "mb-1.5 w-full"}
      />
    );
    return bleed ? <div className="px-3 pt-3">{audio}</div> : audio;
  }

  if (msg.mediaType === "pdf") {
    return (
      <a
        href={media}
        download="document.pdf"
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className={`flex items-center gap-3 rounded-xl bg-surface-secondary p-3 transition-colors hover:bg-surface-hover ${
          bleed ? "m-2" : "mb-1.5"
        }`}
      >
        <FileText className="h-6 w-6 text-icon-secondary" />
        <span className="text-sm font-semibold text-text-primary">
          Document.pdf
        </span>
      </a>
    );
  }

  return null;
}
