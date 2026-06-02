/** Toast.jsx — Notification toasts (auto-dismiss after 3.5s) */
import { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const ICONS = {
  success: <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />,
  error:   <AlertCircle  size={16} className="text-rose-400 flex-shrink-0"    />,
  info:    <Info          size={16} className="text-blue-400 flex-shrink-0"    />,
};

const BG = {
  success: 'border-emerald-500/30 bg-emerald-950/80',
  error:   'border-rose-500/30 bg-rose-950/80',
  info:    'border-blue-500/30 bg-blue-950/80',
};

export default function Toast() {
  const { state, clearToast } = useApp();
  const toast = state.ui.toast;

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(clearToast, 3500);
    return () => clearTimeout(t);
  }, [toast, clearToast]);

  if (!toast) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-[100] animate-slide-up">
      <div className={`
        flex items-center gap-3 px-4 py-3 rounded-2xl border backdrop-blur-md shadow-2xl
        text-sm text-white font-medium min-w-[260px] max-w-sm
        ${BG[toast.type] ?? BG.info}
      `}>
        {ICONS[toast.type] ?? ICONS.info}
        <span className="flex-1">{toast.message}</span>
        <button onClick={clearToast} className="text-white/50 hover:text-white transition-colors">
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
