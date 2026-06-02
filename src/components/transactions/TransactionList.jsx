/**
 * TransactionList.jsx — Grouped-by-date list with DayAnalyticsPanel + pagination
 */
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTransactions, PAGE_SIZE } from '../../hooks/useTransactions';
import TransactionItem from './TransactionItem';
import FilterBar from './FilterBar';
import DayAnalyticsPanel from './DayAnalyticsPanel';
import EmptyState from '../ui/EmptyState';
import { formatGroupDate } from '../../utils/dates';
import { formatINR, safeAdd } from '../../utils/money';

export default function TransactionList() {
  const {
    allTransactions,
    filtered,
    grouped,
    filters,
    updateFilter,
    resetFilters,
    setDateQuick,
    currentPage,
    totalPages,
    setPage,
    totalFiltered,
    isSingleDay,
    dayAnalytics,
  } = useTransactions();

  const noTransactions = allTransactions.length === 0;
  const noResults      = !noTransactions && filtered.length === 0;

  return (
    <div className="space-y-5">

      {/* Filter bar */}
      <FilterBar
        filters={filters}
        updateFilter={updateFilter}
        resetFilters={resetFilters}
        setDateQuick={setDateQuick}
        totalFiltered={totalFiltered}
        totalAll={allTransactions.length}
      />

      {/* Day Analytics — appears automatically when a single date is selected */}
      {isSingleDay && (
        <DayAnalyticsPanel
          analytics={dayAnalytics}
          date={filters.dateFrom}
        />
      )}

      {/* Empty states */}
      {noTransactions && (
        <EmptyState
          icon="💳"
          title="No transactions yet"
          description="Add your first transaction to start tracking income and expenses."
        />
      )}

      {noResults && !isSingleDay && (
        <EmptyState
          icon="🔍"
          title="No results found"
          description="Try adjusting your search or filters to find what you're looking for."
          showCTA={false}
        />
      )}

      {/* Transaction groups */}
      {grouped.map(({ date, items }) => {
        const dayIncome  = items.filter(t => t.type === 'income') .reduce((s, t) => safeAdd(s, t.amount), 0);
        const dayExpense = items.filter(t => t.type === 'expense').reduce((s, t) => safeAdd(s, t.amount), 0);

        return (
          <div key={date} className="space-y-2 animate-fade-in">
            {/* Date header — hide in single-day mode (panel already shows the date) */}
            {!isSingleDay && (
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-bold text-surface-400 dark:text-surface-500 uppercase tracking-widest">
                  {formatGroupDate(date)}
                </h3>
                <div className="flex items-center gap-3 text-xs font-semibold">
                  {dayIncome  > 0 && <span className="text-emerald-500">+{formatINR(dayIncome,  { compact: true })}</span>}
                  {dayExpense > 0 && <span className="text-rose-500">   −{formatINR(dayExpense, { compact: true })}</span>}
                </div>
              </div>
            )}

            <div className="space-y-2">
              {items.map((t) => <TransactionItem key={t.id} transaction={t} />)}
            </div>
          </div>
        );
      })}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-surface-100 dark:border-surface-800">
          <p className="text-xs text-surface-400 font-medium">
            Page {currentPage} of {totalPages} · {totalFiltered} transactions
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="btn-secondary px-3 py-2 disabled:opacity-40"
            >
              <ChevronLeft size={16} />
            </button>

            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let page = i + 1;
              if (totalPages > 5) {
                if      (currentPage <= 3)              page = i + 1;
                else if (currentPage >= totalPages - 2) page = totalPages - 4 + i;
                else                                    page = currentPage - 2 + i;
              }
              return (
                <button
                  key={page}
                  onClick={() => setPage(page)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                    currentPage === page
                      ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/30'
                      : 'btn-secondary px-0'
                  }`}
                >
                  {page}
                </button>
              );
            })}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="btn-secondary px-3 py-2 disabled:opacity-40"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
