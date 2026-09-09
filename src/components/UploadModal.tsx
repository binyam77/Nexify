import { useState, useRef, useEffect } from "react";
import { X, Upload } from "lucide-react";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialFile?: File | null;
}

export default function UploadModal({
  isOpen,
  onClose,
  initialFile,
}: UploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [caption, setCaption] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isVideo, setIsVideo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
// eslint-disable-next-line react-hooks/set-state-in-effect -- external prop (parent-picked file) ን ወደ local UI state ማስገባት ትክክለኛ pattern ነው
    if (initialFile) {
      setIsVideo(initialFile.type.startsWith("video/"));
      setSelectedFile(initialFile);
      setPreviewUrl(URL.createObjectURL(initialFile));
    }
  }, [initialFile]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setIsVideo(file.type.startsWith("video/"));
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreviewUrl("");
    setCaption("");
    setError(null);
    onClose();
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setError(null);
    try {
      // TODO(object-storage): R2/S3 ሲዘጋጅ፣ selectedFile ን upload አድርገህ
      // resulting URL ን ወደ createPost({
      //   caption,
      //   hashtags: caption.match(/#\w+/g) ?? [],
      //   media: [{ url, type }],
      // }) አስገባ
      throw new Error("STORAGE_NOT_CONFIGURED");
    } catch (e) {
      if (e instanceof Error && e.message === "STORAGE_NOT_CONFIGURED") {
        setError("ፎቶ/ቪዲዮ ማስቀመጫ (storage) ገና አልተዋቀረም — በቅርቡ ይሰራል።");
      } else {
        console.error("Upload failed:", e);
        setError("ልጥፍ መስቀል አልተቻለም። እንደገና ይሞክሩ።");
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 shrink-0">
        <button
          onClick={handleClose}
          className="p-1 rounded-full hover:bg-slate-100"
        >
          <X className="w-5 h-5 text-slate-600" />
        </button>
        <h3 className="text-base font-bold text-slate-900">New Post</h3>
        <div className="w-7" /> {/* symmetry spacer */}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*,image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {!selectedFile ? (
          <button
            onClick={() => fileInputRef.current?.click()}
            className="h-64 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center gap-3 text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-colors"
          >
            <Upload className="w-10 h-10" />
            <span className="text-sm font-medium">Choose Video or Photo</span>
          </button>
        ) : (
          <div className="relative h-64 sm:h-80 rounded-xl overflow-hidden bg-black">
            {isVideo ? (
              <video
                src={previewUrl}
                className="h-full w-full object-contain"
                controls
                muted
              />
            ) : (
              <img
                src={previewUrl}
                alt="preview"
                className="h-full w-full object-contain"
              />
            )}
            <button
              onClick={() => {
                setSelectedFile(null);
                setPreviewUrl("");
              }}
              className="absolute top-2 right-2 bg-black/50 rounded-full p-1"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        )}

        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Write a caption... #hashtags"
          rows={4}
          maxLength={2200}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm text-slate-800 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
        />

        {error && (
          <p className="text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={!selectedFile || isUploading}
          className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl disabled:opacity-50 hover:bg-blue-700 transition-colors"
        >
          {isUploading ? "Posting..." : "Post"}
        </button>
      </div>
    </div>
  );
}
