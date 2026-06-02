/**
 * FilterBar.jsx — Search, quick-date chips, advanced filters, and sort
 */
import { Search, SlidersHorizontal, X, RotateCcw, CalendarDays } from 'lucide-react';
import { useState } from 'react';
import { DEFAULT_FILTERS } from '../../hooks/useTransactions';
import { CATEGORIES, PAYMENT_METHODS } from '../../utils/categories';
import { todayDateString } from '../../utils/dates';

const SELECT_CLS = `
  px-3 py-2 rounded-xl border border-surface-200/50 dark:border-surface-700/50
  bg-white/50 dark:bg-surface-900/50 backdrop-blur-sm
  text-xs font-semibold text-surface-700 dark:text-surface-300
  focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500
  transition-all cursor-pointer
`;

const QUICK_DATES = [
  { key: 'today',     label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'week',      label: 'This Week' },
  { key: 'month',     label: 'This Month' },
];

export default function FilterBar({ filters, updateFilter, resetFilters, setDateQuick, totalFiltered, totalAll }) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const isFiltered = JSON.stringify(filters) !== JSON.stringify(DEFAULT_FILTERS);

  // Detect which quick-date preset is currently active
  const today     = todayDateString();
  const pad = (n) => String(n).padStart(2, '0');
  const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  const yd  = new Date(); yd.setDate(yd.getDate() - 1);
  const ws  = new Date(); ws.setDate(ws.getDate() - ws.getDay());
  const ms  = new Date(); ms.setDate(1);

  const activePreset = (() => {
    const { dateFrom, dateTo } = filters;
    if (dateFrom === today     && dateTo === today)     return 'today';
    if (dateFrom === fmt(yd)   && dateTo === fmt(yd))   return 'yesterday';
    if (dateFrom === fmt(ws)   && dateTo === today)     return 'week';
    if (dateFrom === fmt(ms)   && dateTo === today)     return 'month';
    return null;
  })();

  return (
    <div className="space-y-3">
      {/* ── Row 1: Search + Sort + Controls ─────────────────────────────────── */}
      <div className="flex gap-2 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
          <input
            type="text"
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            placeholder="Search description, tags, amount…"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-white/50 dark:bg-surface-900/50 backdrop-blur-sm border border-surface-200/50 dark:border-surface-700/50 text-surface-900 dark:text-surface-100 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/50 transition-all duration-150"
          />
          {filters.search && (
            <button
              onClick={() => updateFilter('search', '')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Sort */}
        <select
          value={filters.sortBy}
          onChange={(e) => updateFilter('sortBy', e.target.value)}
          className={SELECT_CLS}
        >
          <option value="date_desc">📅 Newest first</option>
          <option value="date_asc">📅 Oldest first</option>
          <option value="amount_high">💰 Highest amount</option>
          <option value="amount_low">💰 Lowest amount</option>
        </select>

        {/* Advanced toggle */}
        <button
          onClick={() => setShowAdvanced((v) => !v)}
          className={`
            flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all
            ${showAdvanced
              ? 'border-violet-500 bg-violet-50/50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400'
              : 'border-surface-200/50 dark:border-surface-700/50 text-surface-600 dark:text-surface-400 hover:border-surface-300 bg-white/50 dark:bg-surface-800/50'
            }
          `}
        >
          <SlidersHorizontal size={13} />
          Filters
          {isFiltered && <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />}
        </button>

        {/* Reset */}
        {isFiltered && (
          <button
            onClick={resetFilters}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-200/50 dark:border-rose-800/50
                       text-xs font-semibold text-rose-500 dark:text-rose-400
                       hover:bg-rose-50/50 dark:hover:bg-rose-950/40 transition-all bg-white/50 dark:bg-surface-800/50"
          >
            <RotateCcw size={12} /> Reset
          </button>
        )}
      </div>

      {/* ── Row 2: Quick-date chips ──────────────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap">
        <CalendarDays size={13} className="text-surface-400 flex-shrink-0" />
        {QUICK_DATES.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => activePreset === key ? resetFilters() : setDateQuick(key)}
            className={`
              px-3 py-1.5 rounded-full text-[11px] font-bold transition-all border
              ${activePreset === key
                ? 'bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-500/30'
                : 'bg-white/50 dark:bg-surface-800/50 border-surface-200/50 dark:border-surface-700/50 text-surface-500 dark:text-surface-400 hover:border-violet-400 hover:text-violet-600 dark:hover:text-violet-400'
              }
            `}
          >
            {label}
          </button>
        ))}

        {/* Custom single-date picker */}
        <div className="flex items-center gap-1.5 ml-auto">
          <input
            type="date"
            value={filters.dateFrom === filters.dateTo ? filters.dateFrom : ''}
            max={todayDateString()}
            onChange={(e) => {
              updateFilter('dateFrom', e.target.value);
              updateFilter('dateTo',   e.target.value);
            }}
            className={`
              text-[11px] font-semibold px-2.5 py-1.5 rounded-xl border transition-all
              bg-white dark:bg-surface-800
              text-surface-700 dark:text-surface-300
              ${filters.dateFrom && filters.dateFrom === filters.dateTo && !activePreset
                ? 'border-violet-500 ring-2 ring-violet-500/20'
                : 'border-surface-200 dark:border-surface-700 hover:border-violet-300'
              }
            `}
            title="Jump to specific date"
          />
          {filters.dateFrom && filters.dateFrom === filters.dateTo && !activePreset && (
            <button
              onClick={() => { updateFilter('dateFrom', ''); updateFilter('dateTo', ''); }}
              className="text-surface-400 hover:text-rose-500 transition-colors"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* ── Advanced Filters Panel ───────────────────────────────────────────── */}
      {showAdvanced && (
        <div className="card p-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 animate-fade-in">
          {/* Type */}
          <div>
            <label className="label-base">Type</label>
            <select value={filters.type} onChange={(e) => updateFilter('type', e.target.value)} className={`${SELECT_CLS} w-full`}>
              <option value="all">All Types</option>
              <option value="expense">💸 Expense</option>
              <option value="income">💰 Income</option>
              <option value="transfer">🔄 Transfer</option>
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="label-base">Category</label>
            <select value={filters.category} onChange={(e) => updateFilter('category', e.target.value)} className={`${SELECT_CLS} w-full`}>
              <option value="all">All Categories</option>
              <optgroup label="Expense">
                {CATEGORIES.expense.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
              </optgroup>
              <optgroup label="Income">
                {CATEGORIES.income.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
              </optgroup>
              <optgroup label="Transfer">
                {CATEGORIES.transfer.map((c) => <option key={c.id} value={c.id}>{c.icon} {c.label}</option>)}
              </optgroup>
            </select>
          </div>

          {/* Payment method */}
          <div>
            <label className="label-base">Payment Method</label>
            <select value={filters.paymentMethod} onChange={(e) => updateFilter('paymentMethod', e.target.value)} className={`${SELECT_CLS} w-full`}>
              <option value="all">All Methods</option>
              {PAYMENT_METHODS.map((m) => <option key={m.id} value={m.id}>{m.icon} {m.label}</option>)}
            </select>
          </div>

          {/* Date From */}
          <div>
            <label className="label-base">From Date</label>
            <input
              type="date"
              value={filters.dateFrom}
              max={todayDateString()}
              onChange={(e) => updateFilter('dateFrom', e.target.value)}
              className={`${SELECT_CLS} w-full`}
            />
          </div>

          {/* Date To */}
          <div>
            <label className="label-base">To Date</label>
            <input
              type="date"
              value={filters.dateTo}
              max={todayDateString()}
              onChange={(e) => updateFilter('dateTo', e.target.value)}
              className={`${SELECT_CLS} w-full`}
            />
          </div>

          {/* Amount Min */}
          <div>
            <label className="label-base">Min Amount (₹)</label>
            <input
              type="number"
              value={filters.amountMin}
              onChange={(e) => updateFilter('amountMin', e.target.value)}
              placeholder="0"
              min="0"
              className={`${SELECT_CLS} w-full`}
            />
          </div>

          {/* Amount Max */}
          <div>
            <label className="label-base">Max Amount (₹)</label>
            <input
              type="number"
              value={filters.amountMax}
              onChange={(e) => updateFilter('amountMax', e.target.value)}
              placeholder="∞"
              min="0"
              className={`${SELECT_CLS} w-full`}
            />
          </div>
        </div>
      )}

      {/* ── Results count ────────────────────────────────────────────────────── */}
      {isFiltered && (
        <p className="text-xs text-surface-400 dark:text-surface-500 font-medium px-1">
          Showing {totalFiltered} of {totalAll} transactions
        </p>
      )}
    </div>
  );
}
