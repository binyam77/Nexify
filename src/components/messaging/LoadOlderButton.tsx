interface LoadOlderButtonProps {
  loading: boolean;
  onClick: () => void;
}

// በመልዕክቶች አናት ላይ የሚታይ "የቆዩ መልዕክቶችን ጫን" ቁልፍ
export default function LoadOlderButton({
  loading,
  onClick,
}: LoadOlderButtonProps) {
  return (
    <div className="flex justify-center pb-3">
      <button
        type="button"
        disabled={loading}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        className="rounded-full border border-border bg-surface px-4 py-1.5 text-xs font-semibold text-primary transition-colors hover:bg-surface-hover disabled:opacity-60"
      >
        {loading ? "Loading..." : "Load earlier messages"}
      </button>
    </div>
  );
}
