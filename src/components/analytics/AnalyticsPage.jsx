/**
 * AnalyticsPage.jsx
 * Three-tab analytics view: Daily | Weekly | Monthly.
 * Each tab has its own independent filters and rich visualisations.
 */
import { useState } from 'react';
import { BarChart2, CalendarDays, CalendarRange, Calendar } from 'lucide-react';
import { useAnalytics } from '../../hooks/useAnalytics';

import { DailyFilterBar, WeeklyFilterBar, MonthlyFilterBar } from './AnalyticsFilterBar';
import AnalyticsKPICards      from './AnalyticsKPICards';
import AnalyticsTrendChart    from './AnalyticsTrendChart';
import AnalyticsCategoryChart from './AnalyticsCategoryChart';
import AnalyticsMethodChart   from './AnalyticsMethodChart';
import AnalyticsTopTransactions from './AnalyticsTopTransactions';
import AnalyticsInsights      from './AnalyticsInsights';

// ── Tab definitions ────────────────────────────────────────────────────────────
const TABS = [
  { id: 'daily',   label: 'Daily',   icon: CalendarDays },
  { id: 'weekly',  label: 'Weekly',  icon: CalendarRange },
  { id: 'monthly', label: 'Monthly', icon: Calendar },
];

// ── Tab Button ─────────────────────────────────────────────────────────────────
function TabButton({ tab, isActive, onClick }) {
  const Icon = tab.icon;
  return (
    <button
      onClick={() => onClick(tab.id)}
      className={`
        flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold
        transition-all duration-200 whitespace-nowrap
        ${isActive
          ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/30'
          : 'bg-white/60 dark:bg-surface-800/50 text-surface-500 dark:text-surface-400 hover:bg-white/90 dark:hover:bg-surface-700/60 border border-white/50 dark:border-surface-600/30'
        }
      `}
    >
      <Icon size={15} />
      {tab.label}
    </button>
  );
}

// ── Period content wrapper (avoids remounting) ─────────────────────────────────
function PeriodSection({ data, trendLabel, filterBar, period }) {
  if (!data) {
    return (
      <div className="card p-10 text-center">
        <p className="text-4xl mb-3">📊</p>
        <p className="text-sm font-bold text-surface-700 dark:text-surface-300">Select a period to see analytics</p>
      </div>
    );
  }

  const { summary, categoryBreakdown, methodBreakdown, trend, top } = data;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Filters */}
      {filterBar}

      {/* KPI Cards */}
      <AnalyticsKPICards summary={summary} />

      {/* Trend Chart — full width */}
      <AnalyticsTrendChart trend={trend} label={trendLabel} />

      {/* Category + Method — 2 col */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <AnalyticsCategoryChart categoryBreakdown={categoryBreakdown} />
        <AnalyticsMethodChart   methodBreakdown={methodBreakdown} />
      </div>

      {/* Top Transactions — full width */}
      <AnalyticsTopTransactions transactions={top} />

      {/* Insights */}
      <AnalyticsInsights
        summary={summary}
        categoryBreakdown={categoryBreakdown}
        period={period}
      />
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState('daily');

  const {
    dailyFilters,  updateDailyFilter,  resetDailyFilters,  dailyData,
    weeklyFilters, updateWeeklyFilter, resetWeeklyFilters, weeklyData, prevWeek, nextWeek,
    monthlyFilters, updateMonthlyFilter, resetMonthlyFilters, monthlyData,
  } = useAnalytics();

  return (
    <div className="space-y-6 transition-page">

      {/* ── Page header ────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-surface-900 dark:text-surface-50 tracking-tight flex items-center gap-2">
            <BarChart2 size={24} className="text-violet-500" />
            Analytics
          </h1>
          <p className="text-sm text-surface-400 dark:text-surface-500 mt-0.5">
            Deep-dive reports for any day, week, or month
          </p>
        </div>
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {TABS.map((tab) => (
          <TabButton
            key={tab.id}
            tab={tab}
            isActive={activeTab === tab.id}
            onClick={setActiveTab}
          />
        ))}
      </div>

      {/* ── Daily tab ──────────────────────────────────────────────────────── */}
      {activeTab === 'daily' && (
        <PeriodSection
          data={dailyData}
          trendLabel={dailyData?.trendLabel ?? 'Hourly Activity'}
          period="day"
          filterBar={
            <DailyFilterBar
              filters={dailyFilters}
              onUpdate={updateDailyFilter}
              onReset={resetDailyFilters}
            />
          }
        />
      )}

      {/* ── Weekly tab ─────────────────────────────────────────────────────── */}
      {activeTab === 'weekly' && (
        <PeriodSection
          data={weeklyData}
          trendLabel={weeklyData?.trendLabel ?? 'Daily Activity'}
          period="week"
          filterBar={
            <WeeklyFilterBar
              filters={weeklyFilters}
              onUpdate={updateWeeklyFilter}
              onReset={resetWeeklyFilters}
              weekLabel={weeklyData?.weekLabel ?? ''}
              onPrev={prevWeek}
              onNext={nextWeek}
            />
          }
        />
      )}

      {/* ── Monthly tab ────────────────────────────────────────────────────── */}
      {activeTab === 'monthly' && (
        <PeriodSection
          data={monthlyData}
          trendLabel={monthlyData?.trendLabel ?? 'Week-by-Week Activity'}
          period="month"
          filterBar={
            <MonthlyFilterBar
              filters={monthlyFilters}
              onUpdate={updateMonthlyFilter}
              onReset={resetMonthlyFilters}
            />
          }
        />
      )}
    </div>
  );
}
