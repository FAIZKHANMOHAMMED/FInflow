/** ThemeToggle.jsx — Sun/Moon theme switcher */
import { Sun, Moon } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function ThemeToggle({ compact = false }) {
  const { state, dispatch } = useApp();
  const isDark = state.settings.theme === 'dark';

  return (
    <button
      onClick={() => dispatch({ type: 'TOGGLE_THEME' })}
      className={`
        relative flex items-center gap-2 transition-all duration-200
        ${compact
          ? 'p-2 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-500 dark:text-surface-400'
          : 'px-3 py-2 rounded-xl bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-600'
        }
      `}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label="Toggle theme"
    >
      {isDark
        ? <Sun  size={compact ? 18 : 16} className="text-amber-400" />
        : <Moon size={compact ? 18 : 16} className="text-violet-500" />
      }
      {!compact && (
        <span className="text-xs font-semibold">{isDark ? 'Light' : 'Dark'}</span>
      )}
    </button>
  );
}
