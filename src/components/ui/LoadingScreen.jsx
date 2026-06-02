/** LoadingScreen.jsx — Full-screen loading spinner shown on initial data fetch */
import { Wallet, Loader2 } from 'lucide-react';

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 z-[300] flex flex-col items-center justify-center
                    bg-surface-950 gap-4">
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-violet-400
                        flex items-center justify-center shadow-2xl shadow-violet-500/40">
          <Wallet size={32} className="text-white" />
        </div>
        <Loader2 size={20} className="absolute -bottom-1 -right-1 text-violet-400 animate-spin" />
      </div>
      <div className="text-center">
        <p className="text-base font-bold text-surface-100">FinFlow</p>
        <p className="text-xs text-surface-500 mt-1 animate-pulse">Loading from MongoDB…</p>
      </div>
    </div>
  );
}
