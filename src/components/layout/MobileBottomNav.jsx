/** MobileBottomNav.jsx — Mobile sticky bottom navigation + FAB */
import { LayoutDashboard, List, Settings, Plus, LogOut, Zap, BarChart2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  { id: 'dashboard',    label: 'Dashboard', icon: LayoutDashboard },
  { id: 'transactions', label: 'History',   icon: List },
  { id: 'analytics',   label: 'Analytics', icon: BarChart2 },
  { id: 'settings',     label: 'Settings',  icon: Settings },
];

export default function MobileBottomNav() {
  const { state, dispatch } = useApp();
  const activePage = state.ui.activePage;
  const isBulkOpen = state.ui.isBulkOpen;
  const { logout } = useAuth();

  const onDashboard = activePage === 'dashboard';

  return (
    <div className="md:hidden fixed bottom-4 left-4 right-4 z-40">
      {/* Nav bar */}
      <nav className="glass-panel relative z-0 flex items-center px-1">
        {/* Render with FAB spacer in middle — items: Dashboard, History, [FAB], Analytics, Settings */}
        {[NAV_ITEMS[0], NAV_ITEMS[1], null, NAV_ITEMS[2], NAV_ITEMS[3]].map((item, i) => {
          if (item === null) {
            // Spacer for FAB
            return <div key="fab-spacer" className="flex-1" />;
          }
          const { id, label, icon: Icon } = item;
          const isActive = activePage === id;
          return (
            <button
              key={id}
              onClick={() => dispatch({ type: 'SET_PAGE', payload: id })}
              className={`
                flex-1 flex flex-col items-center justify-center gap-1
                py-3 px-1 transition-all duration-150
                ${isActive ? 'text-violet-600 dark:text-violet-400' : 'text-surface-400 dark:text-surface-500'}
              `}
            >
              <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
              <span className={`text-[10px] font-semibold ${isActive ? '' : 'opacity-70'}`}>{label}</span>
            </button>
          );
        })}

        {/* Logout button */}
        <button
          onClick={logout}
          className="flex-1 flex flex-col items-center justify-center gap-1
                     py-3 px-1 transition-all duration-150
                     text-surface-400 dark:text-surface-500
                     hover:text-red-500 active:text-red-600"
        >
          <LogOut size={22} strokeWidth={1.8} />
          <span className="text-[10px] font-semibold opacity-70">Sign out</span>
        </button>
      </nav>

      {/* FAB — floating add button (single transaction) */}
      <button
        onClick={() => dispatch({ type: 'OPEN_FORM' })}
        className="absolute -top-8 left-1/2 -translate-x-1/2 z-10
                   w-14 h-14 rounded-full
                   bg-gradient-to-br from-violet-500 to-violet-700
                   shadow-[0_8px_20px_rgba(139,92,246,0.4)]
                   flex items-center justify-center
                   text-white transition-all duration-300
                   hover:scale-110 active:scale-95 border border-violet-400/50"
        aria-label="Add transaction"
      >
        <Plus size={24} strokeWidth={2.5} />
      </button>

      {/* Bulk Entry pill — only shown on dashboard, floats above nav */}
      {onDashboard && (
        <button
          onClick={() => dispatch({ type: isBulkOpen ? 'CLOSE_BULK' : 'OPEN_BULK' })}
          className={`
            absolute -top-14 right-0 z-10
            flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold
            shadow-lg transition-all duration-200 active:scale-95
            ${isBulkOpen
              ? 'bg-violet-600 text-white shadow-violet-500/40 border border-violet-400/50'
              : 'bg-white dark:bg-surface-800 text-violet-600 dark:text-violet-400 shadow-black/10 dark:shadow-black/40 border border-violet-200 dark:border-violet-800/50'
            }
          `}
          aria-label="Toggle bulk entry"
        >
          <Zap size={13} className={isBulkOpen ? 'text-white' : 'text-violet-500'} />
          {isBulkOpen ? 'Close Bulk' : 'Bulk Entry'}
        </button>
      )}
    </div>
  );
}
