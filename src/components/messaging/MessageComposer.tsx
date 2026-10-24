import { useEffect, useRef, useState } from "react";
import type { ChangeEvent } from "react";
import {
  FileText,
  Mic,
  Paperclip,
  Pencil,
  Send,
  Smile,
  Square,
  Trash2,
  X,
} from "lucide-react";

export type ComposerMediaType = "image" | "video" | "audio" | "pdf";

interface MessageComposerProps {
  placeholder?: string;
  /** ለ edit ሁኔታ — የሚስተካከለው ጽሑፍ (ወላጁ `key` በመቀየር እንደገና ይፈጥረዋል) */
  initialText?: string;
  editing?: boolean;
  onSend: (
    text: string,
    mediaUrl?: string,
    mediaType?: ComposerMediaType,
  ) => void;
  onSubmitEdit?: (text: string) => void;
  onCancelEdit?: () => void;
  onTyping?: () => void;
  /** ሲፈጠር ትኩረት ይሰጣል (edit ወይም "Say Hi" ጽሑፍ ሲገባ) */
  autoFocus?: boolean;
}
// ከ backend `MEDIA_URL_MAX_LENGTH` (1,000,000) እና ከ Socket.IO ነባሪ 1MB ገደብ በታች መሆን አለበት።
// ሲቀየር media-url.ts ጋር ይመሳሰል።
const MAX_DATA_URL_LENGTH = 950_000;
const MAX_RECORDING_SECONDS = 120;
const TOO_LARGE_MESSAGE =
  "File is too large (max about 650 KB). Photos are compressed automatically.";

// ፎቶ ከመላኩ በፊት በ browser ውስጥ ይሳናል (ከገደቡ እስኪገባ ድረስ ሦስት ሙከራ)
const IMAGE_ATTEMPTS = [
  { side: 1280, quality: 0.8 },
  { side: 1024, quality: 0.65 },
  { side: 800, quality: 0.5 },
];

const EMOJIS = [
  "😀",
  "😃",
  "😄",
  "😁",
  "😆",
  "😅",
  "😂",
  "🤣",
  "🙂",
  "😉",
  "😊",
  "😍",
  "🥰",
  "😘",
  "😋",
  "😎",
  "🤔",
  "😐",
  "😴",
  "😢",
  "😭",
  "😡",
  "😱",
  "🙏",
  "👍",
  "👎",
  "👏",
  "🙌",
  "💪",
  "🤝",
  "❤️",
  "🔥",
  "🎉",
  "✨",
  "💯",
  "✅",
  "❌",
  "👀",
  "🎁",
  "🌹",
];

function readAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () =>
      reject(reader.error ?? new Error("Could not read the file."));
    reader.readAsDataURL(blob);
  });
}

async function imageToDataUrl(file: File): Promise<string> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("Couldn't read this image.");
  }
  try {
    for (const { side, quality } of IMAGE_ATTEMPTS) {
      const scale = Math.min(1, side / Math.max(bitmap.width, bitmap.height));
      const width = Math.max(1, Math.round(bitmap.width * scale));
      const height = Math.max(1, Math.round(bitmap.height * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Image processing is not available.");
      // ግልጽ ጀርባ (PNG) በ JPEG ጥቁር እንዳይሆን
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(bitmap, 0, 0, width, height);
      const url = canvas.toDataURL("image/jpeg", quality);
      if (url.length <= MAX_DATA_URL_LENGTH) return url;
    }
    throw new Error("This image is too large even after compression.");
  } finally {
    bitmap.close();
  }
}

function formatDuration(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const s = (totalSeconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

interface Attached {
  url: string;
  type: ComposerMediaType;
  name: string;
}

// የተጋራ የመጻፊያ (Channel / Group / Chat): ጽሑፍ፣ emoji፣ መያያዝ፣ ድምጽ መቅዳት፣ edit
export default function MessageComposer({
  placeholder = "Message",
  initialText = "",
  editing = false,
  onSend,
  onSubmitEdit,
  onCancelEdit,
  onTyping,
  autoFocus = false,
}: MessageComposerProps) {
  const [text, setText] = useState(initialText);
  const [attached, setAttached] = useState<Attached | null>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const cancelledRef = useRef(false);
  const recordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const secondsRef = useRef(0);

  const canSend = text.trim().length > 0 || (!editing && attached !== null);

  // ጽሑፉ ሲያድግ ሳጥኑ ያድጋል (እስከ ~7 መስመር)
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    const maxHeight = 160;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
    el.style.overflowY = el.scrollHeight > maxHeight ? "auto" : "hidden";
  }, [text]);

    // ሲፈጠር ትኩረት ይሰጣል — ጠቋሚው ከጽሑፉ መጨረሻ
  useEffect(() => {
    const el = textareaRef.current;
    if (!autoFocus || !el) return;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
  }, [autoFocus]);


  // ክፍሉ ሲዘጋ ሰዓት ቆጣሪዎች እና መቅጃው ይቆማሉ
  useEffect(() => {
    return () => {
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
      const recorder = recorderRef.current;
      if (recorder && recorder.state !== "inactive") {
        cancelledRef.current = true;
        recorder.stop();
      }
    };
  }, []);

  const showError = (message: string) => {
    setErrorText(message);
    if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    errorTimerRef.current = setTimeout(() => setErrorText(null), 4000);
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // ተመሳሳይ ፋይል እንደገና ቢመረጥ እንዲሰራ
    if (!file) return;
    try {
      if (file.type.startsWith("image/")) {
        if (file.type === "image/svg+xml") {
          throw new Error("SVG images are not supported.");
        }
        const url = await imageToDataUrl(file);
        setAttached({ url, type: "image", name: file.name });
        return;
      }
      const type: ComposerMediaType | null = file.type.startsWith("video/")
        ? "video"
        : file.type.startsWith("audio/")
          ? "audio"
          : file.type === "application/pdf"
            ? "pdf"
            : null;
      if (!type) throw new Error("Unsupported file type.");
      // base64 ~1.37 እጥፍ ይበልጣል — ከገደቡ እንደሚያልፍ ቀድመን እናውቃለን
      if (file.size * 1.37 > MAX_DATA_URL_LENGTH) {
        throw new Error(TOO_LARGE_MESSAGE);
      }
      const url = await readAsDataUrl(file);
      if (url.length > MAX_DATA_URL_LENGTH) throw new Error(TOO_LARGE_MESSAGE);
      setAttached({ url, type, name: file.name });
    } catch (err) {
      showError(
        err instanceof Error ? err.message : "Could not attach this file.",
      );
    }
  };

  // ===== ድምጽ መቅዳት =====
  const clearRecordTimer = () => {
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
  };

  const stopRecording = () => {
    clearRecordTimer();
    setIsRecording(false);
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
  };

  const cancelRecording = () => {
    cancelledRef.current = true;
    stopRecording();
  };

  const startRecording = async () => {
    if (
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === "undefined"
    ) {
      showError("Voice recording isn't supported in this browser.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // ዝቅተኛ bitrate — አጭር መልዕክት ከመጠን ገደቡ ውስጥ እንዲገባ
      const recorder = new MediaRecorder(stream, {
        audioBitsPerSecond: 24_000,
      });
      chunksRef.current = [];
      cancelledRef.current = false;
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        if (cancelledRef.current) return;
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        // blob: URL ለሌሎች አይሰራም — ወደ data URL እንቀይራለን
        readAsDataUrl(blob)
          .then((url) => {
            if (url.length > MAX_DATA_URL_LENGTH) {
              showError("The recording is too long. Try a shorter message.");
              return;
            }
            setAttached({ url, type: "audio", name: "Voice message" });
          })
          .catch(() => showError("Couldn't process the recording."));
      };
      recorderRef.current = recorder;
      recorder.start();
      secondsRef.current = 0;
      setRecordingSeconds(0);
      setIsRecording(true);
      recordTimerRef.current = setInterval(() => {
        secondsRef.current += 1;
        setRecordingSeconds(secondsRef.current);
        if (secondsRef.current >= MAX_RECORDING_SECONDS) stopRecording();
      }, 1000);
    } catch {
      showError(
        "Could not access the microphone. Check your browser permissions.",
      );
    }
  };

  const submit = () => {
    if (!canSend) return;
    const trimmed = text.trim();
    if (editing) {
      onSubmitEdit?.(trimmed);
      return;
    }
    onSend(trimmed, attached?.url, attached?.type);
    setText("");
    setAttached(null);
    setShowEmoji(false);
  };

  return (
    <div className="relative shrink-0 bg-surface border-t border-border px-3 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
      {errorText && (
        <p
          role="alert"
          className="mb-2 rounded-xl border border-error-border bg-error-light px-3 py-2 text-xs font-medium text-error"
        >
          {errorText}
        </p>
      )}

      {editing && (
        <div className="mb-2 flex items-center justify-between rounded-xl border border-primary-border bg-primary-light px-3 py-2">
          <span className="flex items-center gap-2 text-xs font-semibold text-primary">
            <Pencil className="w-4 h-4" />
            Editing message
          </span>
          <button
            type="button"
            onClick={onCancelEdit}
            aria-label="Cancel edit"
            className="p-1 rounded-full text-primary hover:bg-surface-hover"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {attached && !editing && (
        <div className="mb-2 flex items-center justify-between gap-3 rounded-xl border border-border bg-surface-secondary px-3 py-2">
          <span className="flex min-w-0 items-center gap-2 text-sm text-text-secondary">
            <FileText className="w-4 h-4 shrink-0 text-icon-secondary" />
            <span className="truncate">{attached.name}</span>
          </span>
          <button
            type="button"
            onClick={() => setAttached(null)}
            aria-label="Remove attachment"
            className="p-1 rounded-full text-icon-secondary hover:bg-surface-hover"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {showEmoji && !isRecording && (
        <div className="absolute bottom-full left-3 z-20 mb-2 grid w-72 grid-cols-8 gap-1 rounded-2xl border border-border bg-white p-2 shadow-xl">
          {EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => setText((prev) => prev + emoji)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-xl hover:bg-surface-hover active:scale-90"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {isRecording ? (
        <div className="flex items-center gap-3 rounded-3xl border border-input-special-border bg-input-special-bg px-2 py-1.5">
          <button
            type="button"
            onClick={cancelRecording}
            aria-label="Cancel recording"
            className="rounded-full p-2.5 text-error hover:bg-error-light"
          >
            <Trash2 className="w-5 h-5" />
          </button>
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-error" />
          <span className="flex-1 text-sm font-semibold tabular-nums text-text-secondary">
            {formatDuration(recordingSeconds)}
          </span>
          <button
            type="button"
            onClick={stopRecording}
            aria-label="Stop recording"
            className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-text-on-primary hover:bg-primary-hover"
          >
            <Square className="w-4 h-4" fill="currentColor" />
          </button>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="flex items-end gap-2"
        >
          {!editing && (
            <button
              type="button"
              onClick={() => {
                fileInputRef.current?.click();
                setShowEmoji(false);
              }}
              aria-label="Attach file"
              className="mb-1 shrink-0 rounded-full p-2.5 text-icon-secondary transition-colors hover:bg-surface-hover hover:text-icon-active"
            >
              <Paperclip className="w-6 h-6" />
            </button>
          )}

          <div className="flex flex-1 items-end gap-1 rounded-3xl border border-input-special-border bg-input-special-bg px-3 py-1.5 transition-colors focus-within:border-input-special-focus">
            <textarea
              ref={textareaRef}
              value={text}
              rows={1}
              onChange={(e) => {
                setText(e.target.value);
                onTyping?.();
              }}
              placeholder={placeholder}
              className="min-h-[24px] flex-1 resize-none bg-transparent py-1.5 text-sm text-input-special-text outline-none placeholder:text-input-special-placeholder"
            />
            <button
              type="button"
              onClick={() => setShowEmoji((v) => !v)}
              aria-label="Emoji"
              aria-expanded={showEmoji}
              className="mb-0.5 shrink-0 rounded-full p-1.5 text-icon-secondary transition-colors hover:text-icon-active"
            >
              <Smile className="w-6 h-6" />
            </button>
          </div>

          {canSend || editing ? (
            <button
              type="submit"
              disabled={!canSend}
              aria-label={editing ? "Save edit" : "Send message"}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-text-on-primary transition-colors hover:bg-primary-hover disabled:opacity-40"
            >
              <Send className="w-5 h-5 -rotate-12 translate-x-0.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void startRecording()}
              aria-label="Record voice message"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-text-on-primary transition-colors hover:bg-primary-hover"
            >
              <Mic className="w-5 h-5" />
            </button>
          )}
        </form>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*,audio/*,application/pdf"
        onChange={(e) => void handleFileChange(e)}
        className="hidden"
      />
    </div>
  );
}
