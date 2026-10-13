import { useState } from "react";
import { WifiOff } from "lucide-react";

interface OfflineStateProps {
  onRetry: () => void;
}

export default function OfflineState({ onRetry }: OfflineStateProps) {
  const [stillOffline, setStillOffline] = useState(false);

  const handleRetry = () => {
    if (!navigator.onLine) {
      setStillOffline(true);
      setTimeout(() => setStillOffline(false), 2500);
      return;
    }
    onRetry();
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-14 px-6 text-center">
      <WifiOff className="w-9 h-9 text-slate-400" />
      <h3 className="text-base font-bold text-text-h2">
        No internet connection
      </h3>
      <p className="text-sm text-small-text max-w-xs">
        Check your connection and try again.
      </p>
      <button
        onClick={handleRetry}
        className="mt-1 px-5 py-2 rounded-xl bg-brand text-white text-sm font-bold"
      >
        Retry
      </button>
      {stillOffline && (
        <p className="text-xs font-semibold text-rose-500">Still offline.</p>
      )}
    </div>
  );
}
