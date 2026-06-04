/**
 * AnalyticsKPICards.jsx
 * Five KPI stat cards — income, expense, net, savings rate, count.
 */
import { TrendingUp, TrendingDown, Wallet, PiggyBank, Hash } from 'lucide-react';
import { formatINR } from '../../utils/money';

function KPICard({ label, value, sub, icon: Icon, iconBg, iconColor, valueColor }) {
  return (
    <div className="card p-4 flex flex-col gap-2 hover:scale-[1.02] transition-transform duration-200">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-surface-400 dark:text-surface-500 uppercase tracking-wider">
          {label}
        </span>
        <div className={`p-1.5 rounded-lg ${iconBg}`}>
          <Icon size={13} className={iconColor} />
        </div>
      </div>
      <p className={`text-xl font-extrabold tracking-tight leading-none ${valueColor}`}>{value}</p>
      {sub && <p className="text-[11px] text-surface-400 dark:text-surface-500 font-medium">{sub}</p>}
    </div>
  );
}

export default function AnalyticsKPICards({ summary }) {
  if (!summary) return null;
  const { income, expense, net, savingsRate, count } = summary;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      <KPICard
        label="Income"
        value={formatINR(income, { compact: true })}
        sub={`${count} transaction${count !== 1 ? 's' : ''}`}
        icon={TrendingUp}
        iconBg="bg-emerald-100 dark:bg-emerald-950/50"
        iconColor="text-emerald-600 dark:text-emerald-400"
        valueColor="text-emerald-600 dark:text-emerald-400"
      />
      <KPICard
        label="Expenses"
        value={formatINR(expense, { compact: true })}
        sub="total spent"
        icon={TrendingDown}
        iconBg="bg-rose-100 dark:bg-rose-950/50"
        iconColor="text-rose-500 dark:text-rose-400"
        valueColor="text-rose-500 dark:text-rose-400"
      />
      <KPICard
        label="Net"
        value={formatINR(net, { compact: true })}
        sub={net >= 0 ? 'Surplus' : 'Deficit'}
        icon={Wallet}
        iconBg="bg-violet-100 dark:bg-violet-950/50"
        iconColor="text-violet-600 dark:text-violet-400"
        valueColor={net >= 0 ? 'text-violet-700 dark:text-violet-300' : 'text-rose-500 dark:text-rose-400'}
      />
      <KPICard
        label="Savings Rate"
        value={`${savingsRate}%`}
        sub={savingsRate >= 30 ? '🎯 Great!' : savingsRate >= 15 ? '📈 Good' : '💡 Improve'}
        icon={PiggyBank}
        iconBg="bg-amber-100 dark:bg-amber-950/50"
        iconColor="text-amber-600 dark:text-amber-400"
        valueColor="text-amber-600 dark:text-amber-400"
      />
      <KPICard
        label="Transactions"
        value={count}
        sub="total logged"
        icon={Hash}
        iconBg="bg-sky-100 dark:bg-sky-950/50"
        iconColor="text-sky-600 dark:text-sky-400"
        valueColor="text-sky-600 dark:text-sky-400"
      />
    </div>
  );
}
