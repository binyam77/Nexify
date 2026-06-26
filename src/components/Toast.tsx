interface ToastProps {
  message: string;
  visible: boolean;
}

export default function Toast({ message, visible }: ToastProps) {
  return (
    <div
      className={`fixed top-5 left-1/2 z-50 -translate-x-1/2 rounded-full border border-slate-800 bg-slate-900 px-6 py-3 text-xs font-semibold text-sky-400 shadow-lg transition-transform duration-300 ease-out ${
        visible ? 'translate-y-0' : '-translate-y-24'
      }`}
    >
      {message}
    </div>
  );
}