import { useState } from "react";
import type { ReactNode } from "react";
import { Copy, Pencil, Pin, PinOff, Trash2, X } from "lucide-react";

const QUICK_EMOJIS = ["👍", "❤️", "🔥", "😂", "😮", "😢", "🙏"];

interface QuickReactionsProps {
  onPick: (emoji: string) => void;
  /** የራሴ የአሁኑ reaction (ጎላ ብሎ ይታያል) */
  activeEmoji?: string | null;
}

// ከመልዕክቱ በላይ የሚታየው emoji ረድፍ (WhatsApp ዓይነት)
export function QuickReactions({
  onPick,
  activeEmoji = null,
}: QuickReactionsProps) {
  return (
    <div
      role="toolbar"
      aria-label="React to message"
      className="inline-flex items-center gap-0.5 rounded-full bg-white border border-border shadow-md px-1.5 py-1"
    >
      {QUICK_EMOJIS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onPick(emoji);
          }}
          aria-label={`React ${emoji}`}
          aria-pressed={emoji === activeEmoji}
          className={`w-9 h-9 flex items-center justify-center text-xl rounded-full transition-transform hover:scale-110 active:scale-90 ${
            emoji === activeEmoji ? "bg-primary-light" : ""
          }`}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}

function ActionIconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="p-2.5 rounded-full text-icon-primary hover:bg-surface-hover active:bg-surface-active transition-colors"
    >
      {children}
    </button>
  );
}

interface MessageActionBarProps {
  canEdit: boolean;
  canCopy: boolean;
  canPin: boolean;
  isPinned: boolean;
  canDelete: boolean;
  onEdit: () => void;
  onCopy: () => void;
  onPin: () => void;
  onDelete: () => void;
  onClose: () => void;
}

/**
 * እንደ WhatsApp — መልዕክት ረዘም ብሎ ሲያዝ ራስጌው በዚህ የድርጊት መስመር ይተካል።
 * አዶዎች ነጠላ ቀለም (ባለቀለም ክብ የለም)። ማጥፋት ከማረጋገጫ በኋላ ብቻ።
 */
export default function MessageActionBar({
  canEdit,
  canCopy,
  canPin,
  isPinned,
  canDelete,
  onEdit,
  onCopy,
  onPin,
  onDelete,
  onClose,
}: MessageActionBarProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <>
      <header className="min-h-[68px] px-3 bg-surface border-b border-border flex items-center gap-1 shrink-0 z-10">
        <ActionIconButton label="Cancel selection" onClick={onClose}>
          <X className="w-6 h-6" />
        </ActionIconButton>
        <div className="flex-1" />
        {canEdit && (
          <ActionIconButton label="Edit" onClick={onEdit}>
            <Pencil className="w-5 h-5" />
          </ActionIconButton>
        )}
        {canCopy && (
          <ActionIconButton label="Copy" onClick={onCopy}>
            <Copy className="w-5 h-5" />
          </ActionIconButton>
        )}
        {canPin && (
          <ActionIconButton label={isPinned ? "Unpin" : "Pin"} onClick={onPin}>
            {isPinned ? (
              <PinOff className="w-5 h-5" />
            ) : (
              <Pin className="w-5 h-5" />
            )}
          </ActionIconButton>
        )}
        {canDelete && (
          <ActionIconButton
            label="Delete"
            onClick={() => setConfirmDelete(true)}
          >
            <Trash2 className="w-5 h-5" />
          </ActionIconButton>
        )}
      </header>

      {confirmDelete && (
        <div
          className="fixed inset-0 z-[130] bg-overlay flex items-center justify-center p-4"
          onClick={() => setConfirmDelete(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-xs rounded-2xl bg-surface-secondary p-5 text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-text-primary mb-1">
              Delete this message?
            </h3>
            <p className="text-sm text-text-secondary mb-5">
              It will be permanently removed for everyone.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="flex-1 rounded-xl bg-surface-secondary py-2.5 text-sm font-semibold text-text-secondary hover:bg-surface-hover transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmDelete(false);
                  onDelete();
                }}
                className="flex-1 rounded-xl bg-error py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
