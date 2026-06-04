/**
 * AnalyticsMethodChart.jsx
 * Horizontal progress bars for payment method breakdown.
 */
import { formatINR } from '../../utils/money';

const METHOD_META = {
  cash:       { icon: '💵', label: 'Cash' },
  upi:        { icon: '📲', label: 'UPI' },
  credit:     { icon: '💳', label: 'Credit Card' },
  debit:      { icon: '🏧', label: 'Debit Card' },
  bank:       { icon: '🏦', label: 'Bank Transfer' },
  wallet:     { icon: '👛', label: 'Wallet' },
  netbanking: { icon: '🌐', label: 'Net Banking' },
};

const METHOD_COLORS = [
  'from-violet-500 to-violet-400',
  'from-sky-500 to-sky-400',
  'from-emerald-500 to-emerald-400',
  'from-amber-500 to-amber-400',
  'from-rose-500 to-rose-400',
  'from-indigo-500 to-indigo-400',
  'from-teal-500 to-teal-400',
];

export default function AnalyticsMethodChart({ methodBreakdown }) {
  if (!methodBreakdown || methodBreakdown.length === 0) {
    return (
      <div className="card p-5 flex flex-col items-center justify-center h-48 gap-2">
        <p className="text-3xl">💳</p>
        <p className="text-sm text-surface-400">No payment data</p>
      </div>
    );
  }

  return (
    <div className="card p-5">
      <h4 className="text-sm font-bold text-surface-800 dark:text-surface-200 mb-0.5">Payment Methods</h4>
      <p className="text-xs text-surface-400 dark:text-surface-500 mb-4">How you paid</p>

      <div className="space-y-3.5">
        {methodBreakdown.map(({ method, amount, pct }, idx) => {
          const meta  = METHOD_META[method] ?? { icon: '💳', label: method };
          const color = METHOD_COLORS[idx % METHOD_COLORS.length];
          return (
            <div key={method}>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-surface-700 dark:text-surface-300">
                  {meta.icon} {meta.label}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-surface-400">{pct.toFixed(0)}%</span>
                  <span className="font-bold text-surface-800 dark:text-surface-200">
                    {formatINR(amount, { compact: true })}
                  </span>
                </div>
              </div>
              <div className="h-2 bg-surface-100 dark:bg-surface-700/60 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-700`}
                  style={{ width: `${Math.min(100, pct)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
