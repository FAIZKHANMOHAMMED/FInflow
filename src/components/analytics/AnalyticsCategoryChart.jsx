/**
 * AnalyticsCategoryChart.jsx
 * Donut chart + legend for category breakdown.
 */
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
} from 'recharts';
import { formatINR } from '../../utils/money';

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-surface-900/95 border border-surface-700/60 rounded-xl px-3 py-2 text-xs shadow-2xl backdrop-blur-md">
      <p className="text-surface-300 font-semibold">{d.icon} {d.label}</p>
      <p className="text-white font-bold mt-0.5">{formatINR(d.amount)}</p>
    </div>
  );
};

export default function AnalyticsCategoryChart({ categoryBreakdown }) {
  if (!categoryBreakdown || categoryBreakdown.length === 0) {
    return (
      <div className="card p-5 flex flex-col items-center justify-center h-48 gap-2">
        <p className="text-3xl">🗂️</p>
        <p className="text-sm text-surface-400">No category data</p>
      </div>
    );
  }

  const top6    = categoryBreakdown.slice(0, 6);
  const total   = top6.reduce((s, d) => s + d.amount, 0);
  const topCats = categoryBreakdown.slice(0, 7);

  return (
    <div className="card p-5">
      <h4 className="text-sm font-bold text-surface-800 dark:text-surface-200 mb-0.5">Category Breakdown</h4>
      <p className="text-xs text-surface-400 dark:text-surface-500 mb-4">Where money moved</p>

      <div className="flex items-center gap-4">
        {/* Donut */}
        <div className="w-32 h-32 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={top6}
                dataKey="amount"
                cx="50%"
                cy="50%"
                innerRadius={36}
                outerRadius={58}
                paddingAngle={2}
                strokeWidth={0}
              >
                {top6.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-2 min-w-0">
          {topCats.map((cat) => {
            const pct = total > 0 ? ((cat.amount / total) * 100).toFixed(0) : 0;
            return (
              <div key={cat.category} className="flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: cat.color }}
                  />
                  <span className="text-surface-600 dark:text-surface-400 font-medium truncate">
                    {cat.icon} {cat.label}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="text-surface-400">{pct}%</span>
                  <span className="font-bold text-surface-700 dark:text-surface-300">
                    {formatINR(cat.amount, { compact: true })}
                  </span>
                </div>
              </div>
            );
          })}
          {categoryBreakdown.length > 7 && (
            <p className="text-[10px] text-surface-400 dark:text-surface-500">
              +{categoryBreakdown.length - 7} more categories
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
