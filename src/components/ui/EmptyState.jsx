/** EmptyState.jsx — Beautiful empty states with icon and CTA */
import { PlusCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function EmptyState({
  icon = '💸',
  title = 'No transactions yet',
  description = "Start tracking your money by adding your first transaction.",
  showCTA = true,
}) {
  const { dispatch } = useApp();

  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6 animate-fade-in">
      {/* Illustration */}
      <div className="relative mb-6">
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-violet-500/10 to-violet-600/5
                        border border-violet-500/20 flex items-center justify-center text-5xl
                        shadow-lg shadow-violet-500/10">
          {icon}
        </div>
        {/* Floating rings */}
        <div className="absolute -inset-3 rounded-full border border-violet-500/10 animate-ping" style={{ animationDuration: '3s' }} />
      </div>

      <h3 className="text-xl font-bold text-surface-900 dark:text-surface-100 mb-2">{title}</h3>
      <p className="text-sm text-surface-500 dark:text-surface-400 max-w-xs leading-relaxed mb-6">
        {description}
      </p>

      {showCTA && (
        <button
          onClick={() => dispatch({ type: 'OPEN_FORM' })}
          className="btn-primary"
        >
          <PlusCircle size={16} />
          Add First Transaction
        </button>
      )}
    </div>
  );
}
