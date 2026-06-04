/**
 * AnalyticsTopTransactions.jsx
 * Top 5 transactions by amount, compact styled list.
 */
import { formatINR } from '../../utils/money';
import { formatDisplayDate } from '../../utils/dates';
import { getCategoryById } from '../../utils/categories';

const TYPE_STYLES = {
  income:   'text-emerald-600 dark:text-emerald-400',
  expense:  'text-rose-500 dark:text-rose-400',
  transfer: 'text-amber-500 dark:text-amber-400',
};

const TYPE_SIGN = { income: '+', expense: '−', transfer: '↕' };

export default function AnalyticsTopTransactions({ transactions }) {
  if (!transactions || transactions.length === 0) {
    return (
      <div className="card p-5 flex flex-col items-center justify-center h-32 gap-2">
        <p className="text-2xl">📭</p>
        <p className="text-xs text-surface-400">No transactions to show</p>
      </div>
    );
  }

  return (
    <div className="card p-5">
      <h4 className="text-sm font-bold text-surface-800 dark:text-surface-200 mb-0.5">Top Transactions</h4>
      <p className="text-xs text-surface-400 dark:text-surface-500 mb-4">Highest amounts in this period</p>

      <div className="space-y-2">
        {transactions.map((t, idx) => {
          const cat  = getCategoryById(t.category);
          const sign = TYPE_SIGN[t.type] ?? '';
          return (
            <div
              key={t.id}
              className="flex items-center gap-3 p-2.5 rounded-xl
                         bg-surface-50/50 dark:bg-surface-800/30
                         hover:bg-surface-100/60 dark:hover:bg-surface-700/30
                         transition-colors duration-150"
            >
              {/* Rank */}
              <span className="w-5 h-5 rounded-full bg-surface-200/70 dark:bg-surface-700/70 flex items-center justify-center
                               text-[10px] font-bold text-surface-500 dark:text-surface-400 flex-shrink-0">
                {idx + 1}
              </span>

              {/* Category icon */}
              <span className="text-base leading-none flex-shrink-0">{cat.icon}</span>

              {/* Description + date */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-surface-700 dark:text-surface-300 truncate">
                  {t.description || cat.label}
                </p>
                <p className="text-[10px] text-surface-400 dark:text-surface-500">
                  {formatDisplayDate(t.date)}
                </p>
              </div>

              {/* Amount */}
              <span className={`text-sm font-extrabold flex-shrink-0 ${TYPE_STYLES[t.type]}`}>
                {sign}{formatINR(t.amount, { compact: true })}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
