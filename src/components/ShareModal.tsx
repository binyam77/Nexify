import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { IconType } from "react-icons";
import { Check, Link2, X } from "lucide-react";
import {
  FaFacebookF,
  FaTelegramPlane,
  FaTiktok,
  FaWhatsapp,
} from "react-icons/fa";

interface ShareModalProps {
  post: {
    id: string;
    caption: string;
    username: string;
    type: "photo" | "video";
    mediaUrls: string[];
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onShareIncrement: (postId: string) => void;
}

type Feedback = "copied" | "tiktok" | "error" | null;

const FEEDBACK_MS = 2500;
// TikTok ለ ሊንክ web-share URL የለውም — ሊንኩን ቀድተን TikTok እንከፍታለን
const TIKTOK_URL = "https://www.tiktok.com/";

// navigator.clipboard በ insecure context (http LAN) ላይ የለም፣ ያኔ ወደ ድሮው ዘዴ ይወርዳል
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // ወደ legacy path ይወርዳል
  }
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

export default function ShareModal({
  post,
  isOpen,
  onClose,
  onShareIncrement,
}: ShareModalProps) {
  const [feedback, setFeedback] = useState<Feedback>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // ሲከፈት focus ወደ modal ውስጥ ይገባል (ስለዚህ ቀስት ቁልፎች Home's feed navigation
  // አያነሱም)፣ ሲዘጋ ወደ ቀድሞው ቁልፍ ይመለሳል
  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    return () => previouslyFocused?.focus();
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    };
  }, []);

  if (!isOpen || !post) return null;

  const { id: postId, username, type, mediaUrls } = post;
  const caption = post.caption.trim();
  // ሁልጊዜ ከ app ራሱ origin — ከ client ምንም አይመጣም
  const shareUrl = `${window.location.origin}/post/${postId}`;
  const shareText = caption
    ? caption.slice(0, 120)
    : `Check out @${username}'s post on Nexify`;

  const showFeedback = (kind: Exclude<Feedback, null>) => {
    setFeedback(kind);
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => setFeedback(null), FEEDBACK_MS);
  };

  // Social ሲጫን ቆጣሪው ይጨምራል (በሌላ መተግበሪያ ውስጥ መላኩ ሊረጋገጥ ስለማይችል
  // ሐሳቡን ነው የምንቆጥረው)። Backend 20/ደቂቃ throttle አለው።
  const openExternal = (url: string) => {
    window.open(url, "_blank", "noopener,noreferrer");
    onShareIncrement(postId);
  };

  const handleCopy = async () => {
    if (await copyToClipboard(shareUrl)) {
      onShareIncrement(postId);
      showFeedback("copied");
    } else {
      showFeedback("error");
    }
  };

  const handleTikTok = () => {
    // Clipboard ጽሑፍ መጀመሪያ ይጀምራል (document ገና focus ላይ እያለ)፣ ከዚያ
    // window.open በተመሳሳይ ንካ ውስጥ (popup blocker እንዳይከለክል)
    const copying = copyToClipboard(shareUrl);
    window.open(TIKTOK_URL, "_blank", "noopener,noreferrer");
    void copying.then((ok) => {
      if (ok) {
        onShareIncrement(postId);
        showFeedback("tiktok");
      } else {
        showFeedback("error");
      }
    });
  };

  const networks: {
    name: string;
    Icon: IconType;
    bg: string;
    onClick: () => void;
  }[] = [
    {
      name: "Facebook",
      Icon: FaFacebookF,
      bg: "bg-[#1877F2]",
      onClick: () =>
        openExternal(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
        ),
    },
    {
      name: "Telegram",
      Icon: FaTelegramPlane,
      bg: "bg-[#229ED9]",
      onClick: () =>
        openExternal(
          `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
        ),
    },
    {
      name: "WhatsApp",
      Icon: FaWhatsapp,
      bg: "bg-[#25D366]",
      onClick: () =>
        openExternal(
          `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText}\n${shareUrl}`)}`,
        ),
    },
    {
      name: "TikTok",
      Icon: FaTiktok,
      bg: "bg-black ring-1 ring-zinc-700",
      onClick: handleTikTok,
    },
  ];

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end justify-center md:items-center"
      // በ modal ውስጥ የሚደረግ wheel/swipe ወደ Home.tsx's window/document-level
      // feed-navigation listeners እንዳይደርስ
      onWheel={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
    >
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Share post"
        tabIndex={-1}
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
          e.stopPropagation();
        }}
        className="relative w-full max-w-md rounded-t-[20px] bg-surface p-5 pb-8 shadow-2xl outline-none animate-slide-up md:rounded-3xl md:pb-5 md:animate-fade-in"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold text-input-text">Share</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-full text-input-placeholder hover:text-input-text"
          >
            <X size={18} />
          </button>
        </div>

        {/* የፖስቱ አጭር ቅድመ እይታ */}
        <div className="mb-5 flex items-center gap-3 rounded-2xl bg-input p-3">
          {type === "photo" && mediaUrls[0] ? (
            <img
              src={mediaUrls[0]}
              alt=""
              className="h-12 w-12 shrink-0 rounded-xl object-cover"
            />
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand text-xl text-white">
              {type === "video" ? "🎬" : "📷"}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-input-placeholder">
              @{username}
            </p>
            <p className="truncate text-xs font-semibold text-input-text">
              {caption || "No description"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {networks.map(({ name, Icon, bg, onClick }) => (
            <button
              key={name}
              type="button"
              onClick={onClick}
              className="group flex flex-col items-center gap-1.5 outline-none"
            >
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-full text-white shadow-md transition-transform group-active:scale-90 ${bg}`}
              >
                <Icon size={22} />
              </span>
              <span className="w-full truncate text-center text-[11px] font-semibold text-input-text">
                {name}
              </span>
            </button>
          ))}

          {/* Copy link */}
          <button
            type="button"
            onClick={() => void handleCopy()}
            className="group flex flex-col items-center gap-1.5 outline-none"
          >
            <span
              className={`flex h-12 w-12 items-center justify-center rounded-full shadow-md transition group-active:scale-90 ${
                feedback === "copied"
                  ? "bg-green-500 text-white"
                  : "bg-input text-input-text"
              }`}
            >
              {feedback === "copied" ? (
                <Check size={22} />
              ) : (
                <Link2 size={22} />
              )}
            </span>
            <span className="w-full truncate text-center text-[11px] font-semibold text-input-text">
              {feedback === "copied" ? "Copied!" : "Copy"}
            </span>
          </button>
        </div>

        <p
          aria-live="polite"
          className="mt-4 min-h-[1rem] text-center text-xs font-medium text-input-placeholder"
        >
          {feedback === "tiktok" && "ሊንኩ ተቀድቷል — TikTok ላይ ለጥፍ"}
          {feedback === "error" && "ሊንኩን መቅዳት አልተቻለም። እንደገና ይሞክሩ።"}
        </p>
      </div>
    </div>,
    document.body,
  );
}
