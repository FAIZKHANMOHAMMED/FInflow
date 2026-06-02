/** DonutChart.jsx — Category expense breakdown using Recharts */
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { getCategoryById } from '../../utils/categories';
import { formatINR } from '../../utils/money';
import EmptyState from '../ui/EmptyState';

const RADIAN = Math.PI / 180;

// Custom label on the arc
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.05) return null; // hide tiny slices
  const r  = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x  = cx + r * Math.cos(-midAngle * RADIAN);
  const y  = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central"
          fontSize={11} fontWeight={700}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const { name, value, payload: { color } } = payload[0];
  return (
    <div className="bg-surface-900/95 border border-surface-700 rounded-xl px-3 py-2 shadow-xl backdrop-blur-md text-xs">
      <div className="flex items-center gap-2 mb-1">
        <span className="w-2 h-2 rounded-full" style={{ background: color }} />
        <span className="text-surface-300 font-semibold">{name}</span>
      </div>
      <span className="text-white font-bold">{formatINR(value)}</span>
    </div>
  );
};

export default function DonutChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="card p-6">
        <h3 className="text-base font-bold text-surface-800 dark:text-surface-200 mb-1">Expenses by Category</h3>
        <p className="text-xs text-surface-400 mb-4">Where your money is going</p>
        <EmptyState
          icon="🍩"
          title="No expense data"
          description="Add some expense transactions to see a category breakdown."
          showCTA={false}
        />
      </div>
    );
  }

  const chartData = data.slice(0, 8).map(({ category, amount }) => {
    const cat = getCategoryById(category);
    return { name: cat.label, value: amount, color: cat.color, icon: cat.icon };
  });

  const total = chartData.reduce((s, d) => s + d.value, 0);

  return (
    <div className="card p-6">
      <h3 className="text-base font-bold text-surface-800 dark:text-surface-200 mb-0.5">Expenses by Category</h3>
      <p className="text-xs text-surface-400 dark:text-surface-500 mb-4">Where your money is going</p>

      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
            labelLine={false}
            label={renderCustomLabel}
          >
            {chartData.map((entry, i) => (
              <Cell key={i} fill={entry.color} stroke="transparent" />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Center total */}
      <div className="flex items-center justify-center -mt-4 mb-4">
        <div className="text-center">
          <p className="text-xs text-surface-400 font-medium">Total Expenses</p>
          <p className="text-base font-extrabold text-surface-900 dark:text-surface-100">{formatINR(total)}</p>
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-2">
        {chartData.map((item) => (
          <div key={item.name} className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: item.color }} />
              <span className="text-surface-600 dark:text-surface-400 font-medium">{item.icon} {item.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-surface-400 dark:text-surface-500">{((item.value / total) * 100).toFixed(1)}%</span>
              <span className="font-bold text-surface-700 dark:text-surface-300">{formatINR(item.value, { compact: true })}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
