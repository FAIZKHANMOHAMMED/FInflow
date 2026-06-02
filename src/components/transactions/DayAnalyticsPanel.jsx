/**
 * DayAnalyticsPanel.jsx
 * Shows when a single date is selected — day totals, category breakdown,
 * payment method split, and hourly activity chart.
 */
import {
  TrendingUp, TrendingDown, Wallet, Hash,
  PiggyBank, CreditCard
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, PieChart, Pie
} from 'recharts';
import { formatINR } from '../../utils/money';

// ── Summary stat card ────────────────────────────────────────────────────────
function StatCard({ label, value, sub, icon: Icon, iconBg, iconColor, valueColor }) {
  return (
    <div className="card p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-surface-400 dark:text-surface-500 uppercase tracking-wider">{label}</span>
        <div className={`p-1.5 rounded-lg ${iconBg}`}>
          <Icon size={13} className={iconColor} />
        </div>
      </div>
      <p className={`text-xl font-extrabold tracking-tight leading-none ${valueColor}`}>{value}</p>
      {sub && <p className="text-[11px] text-surface-400 dark:text-surface-500 font-medium">{sub}</p>}
    </div>
  );
}

// ── Hourly activity tooltip ───────────────────────────────────────────────────
const HourTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-900/95 border border-surface-700 rounded-xl px-3 py-2 text-xs shadow-xl backdrop-blur-md">
      <p className="text-surface-400 font-semibold mb-1.5">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 mb-0.5">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: p.fill }} />
          <span className="text-surface-300">{p.name}</span>
          <span className="font-bold text-white ml-auto">{formatINR(p.value, { compact: true })}</span>
        </div>
      ))}
    </div>
  );
};

// ── Payment method icons ──────────────────────────────────────────────────────
const METHOD_META = {
  cash:       { icon: '💵', label: 'Cash' },
  upi:        { icon: '📲', label: 'UPI' },
  credit:     { icon: '💳', label: 'Credit Card' },
  debit:      { icon: '🏧', label: 'Debit Card' },
  bank:       { icon: '🏦', label: 'Bank Transfer' },
  wallet:     { icon: '👛', label: 'Wallet' },
  netbanking: { icon: '🌐', label: 'Net Banking' },
};

export default function DayAnalyticsPanel({ analytics, date }) {
  if (!analytics) return null;

  const { income, expense, net, count, savingsRate,
          categoryBreakdown, methodBreakdown, hourlyData } = analytics;

  // Only show hours that have any activity
  const activeHours = hourlyData.filter((h) => h.income > 0 || h.expense > 0);

  // Donut data — top 6 categories
  const donutData = categoryBreakdown.slice(0, 6);
  const donutTotal = donutData.reduce((s, d) => s + d.amount, 0);

  return (
    <div className="space-y-4 animate-fade-in">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-1">
        <div className="flex-1 h-px bg-gradient-to-r from-violet-500/30 to-transparent" />
        <span className="text-xs font-bold text-violet-500 dark:text-violet-400 uppercase tracking-widest px-2">
          📅 Day Analytics
        </span>
        <div className="flex-1 h-px bg-gradient-to-l from-violet-500/30 to-transparent" />
      </div>

      {/* ── Summary Cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Income"
          value={formatINR(income)}
          sub={`${count} transaction${count !== 1 ? 's' : ''}`}
          icon={TrendingUp}
          iconBg="bg-emerald-100 dark:bg-emerald-950/50"
          iconColor="text-emerald-600 dark:text-emerald-400"
          valueColor="text-emerald-600 dark:text-emerald-400"
        />
        <StatCard
          label="Expenses"
          value={formatINR(expense)}
          sub={`${savingsRate}% savings rate`}
          icon={TrendingDown}
          iconBg="bg-rose-100 dark:bg-rose-950/50"
          iconColor="text-rose-500 dark:text-rose-400"
          valueColor="text-rose-500 dark:text-rose-400"
        />
        <StatCard
          label="Net"
          value={formatINR(net)}
          sub={net >= 0 ? 'Surplus' : 'Deficit'}
          icon={Wallet}
          iconBg="bg-violet-100 dark:bg-violet-950/50"
          iconColor="text-violet-600 dark:text-violet-400"
          valueColor={net >= 0
            ? 'text-violet-700 dark:text-violet-300'
            : 'text-rose-500 dark:text-rose-400'}
        />
        <StatCard
          label="Transactions"
          value={count}
          sub={income > 0 && expense > 0 ? `₹${formatINR(expense/count, {compact:true})} avg spend` : 'logged today'}
          icon={Hash}
          iconBg="bg-amber-100 dark:bg-amber-950/50"
          iconColor="text-amber-600 dark:text-amber-400"
          valueColor="text-amber-600 dark:text-amber-400"
        />
      </div>

      {/* ── Charts row ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Category Breakdown */}
        {categoryBreakdown.length > 0 && (
          <div className="card p-5">
            <h4 className="text-sm font-bold text-surface-800 dark:text-surface-200 mb-0.5">
              Category Breakdown
            </h4>
            <p className="text-xs text-surface-400 dark:text-surface-500 mb-4">Where money moved today</p>

            {donutData.length > 0 && (
              <div className="flex items-center gap-4">
                {/* Mini donut */}
                <div className="w-28 h-28 flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={donutData}
                        dataKey="amount"
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={54}
                        paddingAngle={2}
                        strokeWidth={0}
                      >
                        {donutData.map((d, i) => (
                          <Cell key={i} fill={d.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend */}
                <div className="flex-1 space-y-1.5 min-w-0">
                  {categoryBreakdown.slice(0, 5).map((cat) => (
                    <div key={cat.category} className="flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: cat.color }} />
                        <span className="text-surface-600 dark:text-surface-400 font-medium truncate">
                          {cat.icon} {cat.label}
                        </span>
                      </div>
                      <span className="font-bold text-surface-700 dark:text-surface-300 flex-shrink-0">
                        {formatINR(cat.amount, { compact: true })}
                      </span>
                    </div>
                  ))}
                  {categoryBreakdown.length > 5 && (
                    <p className="text-[10px] text-surface-400">+{categoryBreakdown.length - 5} more</p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Payment Method Split */}
        {methodBreakdown.length > 0 && (
          <div className="card p-5">
            <h4 className="text-sm font-bold text-surface-800 dark:text-surface-200 mb-0.5">
              Payment Methods
            </h4>
            <p className="text-xs text-surface-400 dark:text-surface-500 mb-4">How you paid today</p>
            <div className="space-y-3">
              {methodBreakdown.map(({ method, amount }) => {
                const meta = METHOD_META[method] ?? { icon: '💳', label: method };
                const pct  = donutTotal > 0 ? (amount / donutTotal) * 100 : 0;
                return (
                  <div key={method}>
                    <div className="flex items-center justify-between text-xs mb-1">
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
                    <div className="h-1.5 bg-surface-100 dark:bg-surface-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-violet-400 transition-all duration-500"
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Hourly Activity Chart ───────────────────────────────────────────── */}
      {activeHours.length > 0 && (
        <div className="card p-5">
          <h4 className="text-sm font-bold text-surface-800 dark:text-surface-200 mb-0.5">
            Hourly Activity
          </h4>
          <p className="text-xs text-surface-400 dark:text-surface-500 mb-4">
            When money moved throughout the day
          </p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={hourlyData} barCategoryGap="20%" barGap={1}>
              <XAxis
                dataKey="label"
                tick={{ fontSize: 9, fill: '#64748b' }}
                axisLine={false}
                tickLine={false}
                interval={1}
              />
              <YAxis hide />
              <Tooltip content={<HourTooltip />} cursor={{ fill: 'rgba(139,92,246,0.06)', radius: 4 }} />
              <Bar dataKey="income"  name="Income"  fill="#10b981" radius={[3,3,0,0]} maxBarSize={14} />
              <Bar dataKey="expense" name="Expense" fill="#f43f5e" radius={[3,3,0,0]} maxBarSize={14} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* No data for the selected day */}
      {count === 0 && (
        <div className="card p-8 text-center">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-sm font-bold text-surface-700 dark:text-surface-300">No transactions on this day</p>
          <p className="text-xs text-surface-400 mt-1">Try a different date or add a new transaction</p>
        </div>
      )}

      {/* Divider before transaction list */}
      {count > 0 && (
        <div className="flex items-center gap-3 px-1 pt-2">
          <div className="flex-1 h-px bg-surface-100 dark:bg-surface-800" />
          <span className="text-[11px] font-bold text-surface-400 uppercase tracking-widest">
            {count} Transaction{count !== 1 ? 's' : ''}
          </span>
          <div className="flex-1 h-px bg-surface-100 dark:bg-surface-800" />
        </div>
      )}
    </div>
  );
}
