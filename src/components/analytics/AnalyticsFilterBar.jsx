/**
 * AnalyticsFilterBar.jsx
 * Period-specific filter controls — renders different UI for daily / weekly / monthly.
 */
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { CATEGORIES, PAYMENT_METHODS } from '../../utils/categories';

const TYPE_OPTIONS = [
  { value: 'all',      label: 'All Types' },
  { value: 'income',   label: 'Income' },
  { value: 'expense',  label: 'Expense' },
  { value: 'transfer', label: 'Transfer' },
];

function FilterSelect({ label, value, onChange, options }) {
  return (
    <div className="flex flex-col gap-1 min-w-0">
      <label className="text-[10px] font-bold text-surface-500 dark:text-surface-400 uppercase tracking-wider">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input-base text-xs py-2 cursor-pointer"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

function AmountInput({ label, value, onChange, placeholder }) {
  return (
    <div className="flex flex-col gap-1 min-w-0">
      <label className="text-[10px] font-bold text-surface-500 dark:text-surface-400 uppercase tracking-wider">
        {label}
      </label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        min="0"
        className="input-base text-xs py-2"
      />
    </div>
  );
}

// ── Shared sub-filter controls (type + category + method) ─────────────────────
function CommonFilters({ filters, onUpdate, showAmountRange = false }) {
  const typeFiltered = filters.type && filters.type !== 'all'
    ? CATEGORIES[filters.type] ?? []
    : [...CATEGORIES.expense, ...CATEGORIES.income, ...CATEGORIES.transfer];

  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    ...typeFiltered.map((c) => ({ value: c.id, label: `${c.icon} ${c.label}` })),
  ];

  const methodOptions = [
    { value: 'all', label: 'All Methods' },
    ...PAYMENT_METHODS.map((m) => ({ value: m.id, label: `${m.icon} ${m.label}` })),
  ];

  return (
    <>
      <FilterSelect
        label="Type"
        value={filters.type}
        onChange={(v) => { onUpdate('type', v); onUpdate('category', 'all'); }}
        options={TYPE_OPTIONS}
      />
      <FilterSelect
        label="Category"
        value={filters.category}
        onChange={(v) => onUpdate('category', v)}
        options={categoryOptions}
      />
      <FilterSelect
        label="Payment Method"
        value={filters.paymentMethod}
        onChange={(v) => onUpdate('paymentMethod', v)}
        options={methodOptions}
      />
      {showAmountRange && (
        <>
          <AmountInput
            label="Min ₹"
            value={filters.minAmount ?? ''}
            onChange={(v) => onUpdate('minAmount', v)}
            placeholder="0"
          />
          <AmountInput
            label="Max ₹"
            value={filters.maxAmount ?? ''}
            onChange={(v) => onUpdate('maxAmount', v)}
            placeholder="Any"
          />
        </>
      )}
    </>
  );
}

// ── Daily filter bar ──────────────────────────────────────────────────────────
export function DailyFilterBar({ filters, onUpdate, onReset }) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-surface-500 dark:text-surface-400 uppercase tracking-wider">
          Filters
        </p>
        <button onClick={onReset} className="flex items-center gap-1 text-[11px] text-violet-500 hover:text-violet-600 font-semibold transition-colors">
          <RotateCcw size={11} /> Reset
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Date picker */}
        <div className="flex flex-col gap-1 min-w-0">
          <label className="text-[10px] font-bold text-surface-500 dark:text-surface-400 uppercase tracking-wider">Date</label>
          <input
            type="date"
            value={filters.date}
            onChange={(e) => onUpdate('date', e.target.value)}
            max={new Date().toISOString().slice(0, 10)}
            className="input-base text-xs py-2"
          />
        </div>
        <CommonFilters filters={filters} onUpdate={onUpdate} />
      </div>
    </div>
  );
}

// ── Weekly filter bar ─────────────────────────────────────────────────────────
export function WeeklyFilterBar({ filters, onUpdate, onReset, weekLabel, onPrev, onNext }) {
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-surface-500 dark:text-surface-400 uppercase tracking-wider">
          Filters
        </p>
        <button onClick={onReset} className="flex items-center gap-1 text-[11px] text-violet-500 hover:text-violet-600 font-semibold transition-colors">
          <RotateCcw size={11} /> Reset
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Week navigator */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold text-surface-500 dark:text-surface-400 uppercase tracking-wider">Week</label>
          <div className="flex items-center gap-1">
            <button
              onClick={onPrev}
              className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors shrink-0"
              title="Previous week"
            >
              <ChevronLeft size={14} className="text-surface-500" />
            </button>
            <div className="flex-1 input-base text-[11px] py-2 text-center font-semibold leading-tight">
              {weekLabel}
            </div>
            <button
              onClick={onNext}
              className="p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors shrink-0"
              title="Next week"
            >
              <ChevronRight size={14} className="text-surface-500" />
            </button>
          </div>
        </div>
        <CommonFilters filters={filters} onUpdate={onUpdate} />
      </div>
    </div>
  );
}

// ── Monthly filter bar ────────────────────────────────────────────────────────
export function MonthlyFilterBar({ filters, onUpdate, onReset }) {
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => ({
    value: currentYear - i,
    label: String(currentYear - i),
  }));

  const MONTH_NAMES = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December',
  ];
  const monthOptions = MONTH_NAMES.map((name, i) => ({ value: i + 1, label: name }));

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-surface-500 dark:text-surface-400 uppercase tracking-wider">
          Filters
        </p>
        <button onClick={onReset} className="flex items-center gap-1 text-[11px] text-violet-500 hover:text-violet-600 font-semibold transition-colors">
          <RotateCcw size={11} /> Reset
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {/* Year */}
        <FilterSelect
          label="Year"
          value={filters.year}
          onChange={(v) => onUpdate('year', parseInt(v))}
          options={yearOptions.map((o) => ({ value: o.value, label: o.label }))}
        />
        {/* Month */}
        <FilterSelect
          label="Month"
          value={filters.month}
          onChange={(v) => onUpdate('month', parseInt(v))}
          options={monthOptions.map((o) => ({ value: o.value, label: o.label }))}
        />
        <CommonFilters filters={filters} onUpdate={onUpdate} showAmountRange />
      </div>
    </div>
  );
}
