/**
 * AnalyticsTrendChart.jsx
 * Recharts ComposedChart showing income/expense bars + net line.
 * Shared by all three periods — label varies (hourly / daily / weekly).
 */
import {
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend,
} from 'recharts';
import { formatINR } from '../../utils/money';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-900/95 border border-surface-700/60 rounded-xl px-3 py-2.5 text-xs shadow-2xl backdrop-blur-md">
      <p className="text-surface-400 font-bold mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: p.color || p.fill }} />
          <span className="text-surface-300">{p.name}</span>
          <span className="font-bold text-white ml-auto pl-3">
            {formatINR(p.value, { compact: true })}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function AnalyticsTrendChart({ trend, label }) {
  if (!trend || trend.length === 0) return null;

  const hasData = trend.some((d) => d.income > 0 || d.expense > 0);
  if (!hasData) return (
    <div className="card p-5 flex flex-col items-center justify-center h-48 gap-2">
      <p className="text-3xl">📊</p>
      <p className="text-sm text-surface-400">No activity in this period</p>
    </div>
  );

  // Add net to each data point
  const enriched = trend.map((d) => ({ ...d, net: d.income - d.expense }));

  return (
    <div className="card p-5">
      <h4 className="text-sm font-bold text-surface-800 dark:text-surface-200 mb-0.5">{label}</h4>
      <p className="text-xs text-surface-400 dark:text-surface-500 mb-4">Income vs Expense</p>
      <ResponsiveContainer width="100%" height={200}>
        <ComposedChart data={enriched} barCategoryGap="25%" barGap={2}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.12)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: '#64748b' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#64748b' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => formatINR(v, { compact: true }).replace('₹', '₹')}
            width={52}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(139,92,246,0.06)', radius: 4 }} />
          <Legend
            wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
            formatter={(val) => <span className="text-surface-500 dark:text-surface-400">{val}</span>}
          />
          <Bar dataKey="income"  name="Income"  fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={28} />
          <Bar dataKey="expense" name="Expense" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={28} />
          <Line
            dataKey="net"
            name="Net"
            stroke="#8b5cf6"
            strokeWidth={2}
            dot={{ fill: '#8b5cf6', r: 3, strokeWidth: 0 }}
            activeDot={{ r: 5 }}
            type="monotone"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
