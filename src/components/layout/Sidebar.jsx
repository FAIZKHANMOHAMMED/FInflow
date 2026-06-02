/** Sidebar.jsx — Desktop left navigation */
import {
  LayoutDashboard, List, Settings, PlusCircle,
  TrendingUp, Wallet
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import ThemeToggle from '../ui/ThemeToggle';

const NAV_ITEMS = [
  { id: 'dashboard',    label: 'Dashboard',     icon: LayoutDashboard },
  { id: 'transactions', label: 'Transactions',  icon: List },
  { id: 'settings',     label: 'Settings',      icon: Settings },
];

export default function Sidebar() {
  const { state, dispatch } = useApp();
  const activePage = state.ui.activePage;

  return (
    <aside className="hidden md:flex flex-col w-60 shrink-0 h-screen sticky top-0
                      bg-white dark:bg-surface-900
                      border-r border-surface-200 dark:border-surface-800
                      py-6 px-4 gap-2">
      {/* Logo */}
      <div className="flex items-center gap-3 px-2 mb-6">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-violet-400
                        flex items-center justify-center shadow-lg shadow-violet-500/30">
          <Wallet size={18} className="text-white" />
        </div>
        <div>
          <span className="text-base font-extrabold text-surface-900 dark:text-surface-50 tracking-tight">FinFlow</span>
          <div className="text-[10px] font-medium text-surface-400 dark:text-surface-500">Expense Tracker</div>
        </div>
      </div>

      {/* Add Transaction Button */}
      <button
        onClick={() => dispatch({ type: 'OPEN_FORM' })}
        className="btn-primary w-full mb-4"
      >
        <PlusCircle size={16} />
        Add Transaction
      </button>

      {/* Nav Items */}
      <nav className="flex flex-col gap-1 flex-1">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
          const isActive = activePage === id;
          return (
            <button
              key={id}
              onClick={() => dispatch({ type: 'SET_PAGE', payload: id })}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold
                transition-all duration-150 text-left
                ${isActive
                  ? 'bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-400'
                  : 'text-surface-500 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-800 hover:text-surface-900 dark:hover:text-surface-200'
                }
              `}
            >
              <Icon size={18} className={isActive ? 'text-violet-600 dark:text-violet-400' : ''} />
              {label}
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-violet-500" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="flex flex-col gap-2 pt-4 border-t border-surface-100 dark:border-surface-800">
        <ThemeToggle />
        <div className="px-2 text-[10px] text-surface-300 dark:text-surface-600 font-medium">
          v2.0 · All data stored locally
        </div>
      </div>
    </aside>
  );
}
