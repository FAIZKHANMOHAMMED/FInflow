/** SummaryCards.jsx — Balance, Income, Expense and Savings Rate summary cards */
import { TrendingUp, TrendingDown, Wallet, PiggyBank } from 'lucide-react';
import { formatINR } from '../../utils/money';

const cards = [
  {
    key: 'totalBalance',
    label: 'Net Balance',
    icon: Wallet,
    iconBg: 'bg-violet-100 dark:bg-violet-950/50',
    iconColor: 'text-violet-600 dark:text-violet-400',
    gradient: 'from-violet-600 to-violet-400',
    valueColor: (v) => v >= 0
      ? 'text-violet-700 dark:text-violet-300'
      : 'text-rose-500 dark:text-rose-400',
    format: (v) => formatINR(v),
    subKey: 'savingsRate',
    subFormat: (v) => `${v}% savings rate`,
  },
  {
    key: 'totalIncome',
    label: 'Total Income',
    icon: TrendingUp,
    iconBg: 'bg-emerald-100 dark:bg-emerald-950/50',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    gradient: 'from-emerald-600 to-emerald-400',
    valueColor: () => 'text-emerald-600 dark:text-emerald-400',
    format: (v) => formatINR(v),
    subKey: 'monthIncome',
    subFormat: (v) => `${formatINR(v, { compact: true })} this month`,
  },
  {
    key: 'totalExpense',
    label: 'Total Expenses',
    icon: TrendingDown,
    iconBg: 'bg-rose-100 dark:bg-rose-950/50',
    iconColor: 'text-rose-500 dark:text-rose-400',
    gradient: 'from-rose-500 to-rose-400',
    valueColor: () => 'text-rose-500 dark:text-rose-400',
    format: (v) => formatINR(v),
    subKey: 'monthExpense',
    subFormat: (v) => `${formatINR(v, { compact: true })} this month`,
  },
  {
    key: 'monthBalance',
    label: 'This Month',
    icon: PiggyBank,
    iconBg: 'bg-amber-100 dark:bg-amber-950/50',
    iconColor: 'text-amber-600 dark:text-amber-400',
    gradient: 'from-amber-500 to-amber-300',
    valueColor: (v) => v >= 0
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-rose-500 dark:text-rose-400',
    format: (v) => formatINR(v),
    subKey: null,
    subFormat: () => 'Net income vs expenses',
  },
];

export default function SummaryCards({ stats }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon  = card.icon;
        const value = stats[card.key] ?? 0;
        const sub   = card.subKey ? stats[card.subKey] : null;

        return (
          <div
            key={card.key}
            className="card p-5 flex flex-col gap-3 hover:shadow-md transition-shadow duration-200"
          >
            {/* Top row */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-surface-400 dark:text-surface-500 uppercase tracking-wider">
                {card.label}
              </span>
              <div className={`p-2 rounded-xl ${card.iconBg}`}>
                <Icon size={16} className={card.iconColor} />
              </div>
            </div>

            {/* Value */}
            <div>
              <p className={`text-2xl font-extrabold tracking-tight leading-none ${card.valueColor(value)}`}>
                {card.format(value)}
              </p>
              <p className="text-xs text-surface-400 dark:text-surface-500 mt-1.5 font-medium">
                {card.subFormat(sub ?? value)}
              </p>
            </div>

            {/* Thin gradient accent line */}
            <div className={`h-0.5 rounded-full bg-gradient-to-r ${card.gradient} opacity-40`} />
          </div>
        );
      })}
    </div>
  );
}
