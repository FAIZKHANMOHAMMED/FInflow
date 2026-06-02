/** Sidebar.jsx — Desktop left navigation */
import {
  LayoutDashboard, List, Settings, PlusCircle,
  TrendingUp, Wallet, LogOut
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import ThemeToggle from '../ui/ThemeToggle';

const NAV_ITEMS = [
  { id: 'dashboard',    label: 'Dashboard',     icon: LayoutDashboard },
  { id: 'transactions', label: 'Transactions',  icon: List },
  { id: 'settings',     label: 'Settings',      icon: Settings },
];

export default function Sidebar() {
  const { state, dispatch } = useApp();
  const activePage = state.ui.activePage;
  const { user, logout } = useAuth();

  return (
    <div className="hidden md:flex flex-col w-64 shrink-0 h-screen sticky top-0 p-4">
      <aside className="glass-panel flex-1 flex flex-col py-6 px-4 gap-2 h-full">
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

        {/* User info + logout */}
        {user && (
          <div className="flex items-center gap-2 px-2 py-2 rounded-xl
                          bg-surface-50 dark:bg-surface-800/60 mt-1">
            {user.picture
              ? <img src={user.picture} alt={user.name}
                     className="w-7 h-7 rounded-full ring-2 ring-violet-400/50 shrink-0" />
              : <div className="w-7 h-7 rounded-full bg-violet-500 flex items-center justify-center
                                text-white text-xs font-bold shrink-0">
                  {user.name?.[0]}
                </div>
            }
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-surface-800 dark:text-surface-100 truncate">{user.name}</p>
            </div>
            <button
              onClick={logout}
              title="Sign out"
              className="p-1.5 rounded-lg text-surface-400 hover:text-red-500
                         hover:bg-red-50 dark:hover:bg-red-900/20
                         transition-colors duration-150 shrink-0"
            >
              <LogOut size={14} />
            </button>
          </div>
        )}
      </div>
    </aside>
    </div>
  );
}
