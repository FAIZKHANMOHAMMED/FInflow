/** TrendChart.jsx — Monthly income vs expense bar chart using Recharts */
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, ReferenceLine
} from 'recharts';
import { formatINR } from '../../utils/money';
import EmptyState from '../ui/EmptyState';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-surface-900/95 border border-surface-700 rounded-xl px-3 py-2.5 shadow-xl backdrop-blur-md text-xs min-w-[140px]">
      <p className="text-surface-400 font-semibold mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center justify-between gap-4 mb-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full" style={{ background: p.fill }} />
            <span className="text-surface-300">{p.name}</span>
          </div>
          <span className="font-bold text-white">{formatINR(p.value, { compact: true })}</span>
        </div>
      ))}
      {payload.length === 2 && (
        <div className="border-t border-surface-700 mt-2 pt-2 flex justify-between">
          <span className="text-surface-400">Net</span>
          <span className={`font-bold ${payload[0].value - payload[1].value >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatINR(payload[0].value - payload[1].value, { compact: true })}
          </span>
        </div>
      )}
    </div>
  );
};

export default function TrendChart({ data }) {
  const hasData = data && data.some((d) => d.income > 0 || d.expense > 0);

  if (!hasData) {
    return (
      <div className="card p-6">
        <h3 className="text-base font-bold text-surface-800 dark:text-surface-200 mb-1">Monthly Trend</h3>
        <p className="text-xs text-surface-400 mb-4">Income vs expenses over 6 months</p>
        <EmptyState
          icon="📊"
          title="No trend data yet"
          description="Add transactions over multiple months to see your financial trend."
          showCTA={false}
        />
      </div>
    );
  }

  return (
    <div className="card p-6">
      <h3 className="text-base font-bold text-surface-800 dark:text-surface-200 mb-0.5">Monthly Trend</h3>
      <p className="text-xs text-surface-400 dark:text-surface-500 mb-6">Income vs expenses over 6 months</p>

      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} barCategoryGap="30%" barGap={3}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#64748b' }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => formatINR(v, { compact: true }).replace('₹', '₹')}
            width={60}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(139,92,246,0.06)', radius: 6 }} />
          <Legend
            wrapperStyle={{ fontSize: 12, fontWeight: 600, paddingTop: 16 }}
            formatter={(value) => (
              <span style={{ color: '#64748b' }}>{value}</span>
            )}
          />
          <Bar dataKey="income"  name="Income"  fill="#10b981" radius={[6,6,0,0]} maxBarSize={32} />
          <Bar dataKey="expense" name="Expense" fill="#f43f5e" radius={[6,6,0,0]} maxBarSize={32} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
