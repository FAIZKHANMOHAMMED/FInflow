/**
 * ApiStatusBanner.jsx — Shows a banner when the API is offline / connecting
 */
import { WifiOff, Loader2, CheckCircle2 } from 'lucide-react';

const STATUS_CONFIG = {
  online: {
    icon:    CheckCircle2,
    iconCls: 'text-emerald-400',
    bg:      'bg-emerald-950/80 border-emerald-500/30',
    text:    'Connected to MongoDB',
    hidden:  true, // don't show when fully online
  },
  offline: {
    icon:    WifiOff,
    iconCls: 'text-amber-400',
    bg:      'bg-amber-950/80 border-amber-500/30',
    text:    'Offline — using local cache. Data will sync when connection is restored.',
    hidden:  false,
  },
  connecting: {
    icon:    Loader2,
    iconCls: 'text-blue-400 animate-spin',
    bg:      'bg-blue-950/80 border-blue-500/30',
    text:    'Connecting to MongoDB…',
    hidden:  false,
  },
  error: {
    icon:    WifiOff,
    iconCls: 'text-rose-400',
    bg:      'bg-rose-950/80 border-rose-500/30',
    text:    'Could not reach MongoDB. Running in offline mode.',
    hidden:  false,
  },
};

export default function ApiStatusBanner({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.offline;
  if (cfg.hidden) return null;

  const Icon = cfg.icon;

  return (
    <div className={`
      fixed top-2 left-1/2 -translate-x-1/2 z-[200]
      flex items-center justify-center gap-2
      px-4 py-2 text-xs font-bold text-white
      rounded-full shadow-lg border backdrop-blur-xl
      ${cfg.bg}
      animate-slide-down
    `}>
      <Icon size={14} className={cfg.iconCls} />
      {cfg.text}
    </div>
  );
}
