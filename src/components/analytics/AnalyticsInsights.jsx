/**
 * AnalyticsInsights.jsx
 * Auto-generates 2-3 text insight chips from analytics data.
 */
import { formatINR } from '../../utils/money';
import { getCategoryById } from '../../utils/categories';

function InsightChip({ emoji, text, color }) {
  return (
    <div className={`flex items-start gap-2 px-3 py-2.5 rounded-xl text-xs font-medium border ${color}`}>
      <span className="text-base leading-none mt-0.5 flex-shrink-0">{emoji}</span>
      <span>{text}</span>
    </div>
  );
}

export default function AnalyticsInsights({ summary, categoryBreakdown, period }) {
  if (!summary) return null;

  const insights = [];
  const { income, expense, net, savingsRate, count } = summary;

  // 1. Savings rate insight
  if (income > 0) {
    if (savingsRate >= 40) {
      insights.push({ emoji: '🚀', text: `Excellent savings rate of ${savingsRate}%! You're building wealth fast.`, color: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-300' });
    } else if (savingsRate >= 20) {
      insights.push({ emoji: '🎯', text: `Good savings rate of ${savingsRate}%. Aim for 30%+ to accelerate your goals.`, color: 'bg-sky-50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-800/50 text-sky-700 dark:text-sky-300' });
    } else if (savingsRate > 0) {
      insights.push({ emoji: '💡', text: `Savings rate is ${savingsRate}%. Review your top expense categories to find cuts.`, color: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/50 text-amber-700 dark:text-amber-300' });
    } else {
      insights.push({ emoji: '⚠️', text: `Spending exceeds income by ${formatINR(Math.abs(net), { compact: true })}. Review your budget.`, color: 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/50 text-rose-700 dark:text-rose-300' });
    }
  }

  // 2. Top spending category
  if (categoryBreakdown && categoryBreakdown.length > 0) {
    const topCat    = categoryBreakdown[0];
    const cat       = getCategoryById(topCat.category);
    const pct       = expense > 0 ? Math.round((topCat.amount / expense) * 100) : 0;
    insights.push({
      emoji: cat.icon,
      text:  `${cat.label} is your biggest spend at ${formatINR(topCat.amount, { compact: true })} (${pct}% of expenses).`,
      color: 'bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800/50 text-violet-700 dark:text-violet-300',
    });
  }

  // 3. Transaction count insight
  if (count > 0) {
    const avgAmount = expense > 0 ? (expense / count) : (income / count);
    insights.push({
      emoji: '📊',
      text: `${count} transaction${count !== 1 ? 's' : ''} logged. Average transaction: ${formatINR(avgAmount, { compact: true })}.`,
      color: 'bg-surface-50 dark:bg-surface-800/40 border-surface-200 dark:border-surface-700/50 text-surface-600 dark:text-surface-400',
    });
  }

  // 4. No-spend insight
  if (count === 0) {
    insights.push({
      emoji: '📭',
      text:  `No transactions found for this ${period}. Try adjusting your filters or add new transactions.`,
      color: 'bg-surface-50 dark:bg-surface-800/40 border-surface-200 dark:border-surface-700/50 text-surface-500 dark:text-surface-500',
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 px-1">
        <div className="flex-1 h-px bg-gradient-to-r from-violet-500/30 to-transparent" />
        <span className="text-[10px] font-bold text-violet-500 dark:text-violet-400 uppercase tracking-widest px-2">
          ✨ Insights
        </span>
        <div className="flex-1 h-px bg-gradient-to-l from-violet-500/30 to-transparent" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {insights.map((ins, i) => (
          <InsightChip key={i} {...ins} />
        ))}
      </div>
    </div>
  );
}
