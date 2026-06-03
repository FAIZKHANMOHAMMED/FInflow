/**
 * BulkEntryPanel.jsx — Rapid inline multi-transaction entry panel
 *
 * Allows users to enter multiple transactions in a compact spreadsheet-like
 * interface without opening a modal for each one. Supports:
 *   - Multiple rows, each is a transaction draft
 *   - Tab / Enter to advance through fields
 *   - Quick-select category and payment method via dropdowns
 *   - "Add Row" or press Enter on last field to get a new row
 *   - Bulk submit all rows at once
 */
import { useState, useRef, useCallback } from 'react';
import { Plus, Trash2, X, Check, ChevronDown, Zap } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CATEGORIES, PAYMENT_METHODS } from '../../utils/categories';
import { validateAmount, CURRENCY_SYMBOLS, EXCHANGE_RATES } from '../../utils/money';
import { nowDateTimeLocalString } from '../../utils/dates';

const TYPE_COLORS = {
  expense:  { bg: 'bg-rose-500/10',    text: 'text-rose-600 dark:text-rose-400',    border: 'border-rose-400/40' },
  income:   { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-400/40' },
  transfer: { bg: 'bg-amber-500/10',   text: 'text-amber-600 dark:text-amber-400',  border: 'border-amber-400/40' },
};

const TYPE_EMOJIS = { expense: '💸', income: '💰', transfer: '🔄' };

const blankRow = () => ({
  id:            Math.random().toString(36).slice(2),
  type:          'expense',
  amount:        '',
  currency:      'INR',
  description:   '',
  category:      '',
  paymentMethod: '',
  date:          nowDateTimeLocalString().slice(0, 10), // date only for compact display
  error:         {},
});

export default function BulkEntryPanel({ onClose }) {
  const { addTransaction } = useApp();
  const [rows, setRows] = useState([blankRow()]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(0);
  const inputRefs = useRef({});

  const updateRow = useCallback((id, field, value) => {
    setRows((prev) => prev.map((r) => {
      if (r.id !== id) return r;
      const updated = { ...r, [field]: value };
      if (field === 'type') updated.category = '';
      // Clear individual field error on edit
      if (r.error[field]) updated.error = { ...r.error, [field]: undefined };
      return updated;
    }));
  }, []);

  const addRow = useCallback((afterId = null) => {
    const lastRow = rows[rows.length - 1];
    const newRow = blankRow();
    // Carry over date, type, paymentMethod from the row above
    newRow.date          = lastRow?.date          ?? newRow.date;
    newRow.type          = lastRow?.type          ?? 'expense';
    newRow.paymentMethod = lastRow?.paymentMethod ?? '';
    newRow.currency      = lastRow?.currency      ?? 'INR';

    setRows((prev) => {
      if (!afterId) return [...prev, newRow];
      const idx = prev.findIndex((r) => r.id === afterId);
      const next = [...prev];
      next.splice(idx + 1, 0, newRow);
      return next;
    });

    // Focus amount of new row
    setTimeout(() => {
      inputRefs.current[`${newRow.id}-amount`]?.focus();
    }, 50);
  }, [rows]);

  const removeRow = useCallback((id) => {
    setRows((prev) => {
      if (prev.length === 1) return [blankRow()];
      return prev.filter((r) => r.id !== id);
    });
  }, []);

  const validateRow = (row) => {
    const err = {};
    if (!row.amount || isNaN(parseFloat(row.amount)) || parseFloat(row.amount) <= 0)
      err.amount = 'Required';
    if (!row.description.trim()) err.description = 'Required';
    if (!row.category)           err.category    = 'Required';
    if (!row.paymentMethod)      err.paymentMethod = 'Required';
    if (!row.date)               err.date        = 'Required';
    return err;
  };

  const handleSubmitAll = async () => {
    // Validate all rows
    let hasErrors = false;
    const validated = rows.map((row) => {
      const error = validateRow(row);
      if (Object.keys(error).length > 0) hasErrors = true;
      return { ...row, error };
    });
    setRows(validated);
    if (hasErrors) return;

    setSubmitting(true);
    let count = 0;
    for (const row of rows) {
      await addTransaction({
        type:          row.type,
        amount:        parseFloat(row.amount),
        currency:      row.currency,
        description:   row.description,
        category:      row.category,
        paymentMethod: row.paymentMethod,
        date:          row.date + 'T00:00',
        tags:          [],
        notes:         '',
      });
      count++;
      setSubmitted(count);
    }
    setSubmitting(false);
    onClose?.();
  };

  const categories = (type) => CATEGORIES[type] ?? [];

  // Handle Tab/Enter key to advance focus within a row or add new row
  const handleKeyDown = (e, rowId, field, isLast) => {
    if (e.key === 'Enter' && field === 'paymentMethod' && isLast) {
      e.preventDefault();
      addRow();
    }
  };

  const validCount = rows.filter((r) => {
    return r.amount && r.description.trim() && r.category && r.paymentMethod;
  }).length;

  return (
    <div className="card p-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-100 dark:border-surface-800 bg-gradient-to-r from-violet-500/5 to-transparent">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-violet-500/15">
            <Zap size={14} className="text-violet-500" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-surface-900 dark:text-surface-100">Quick Bulk Entry</h3>
            <p className="text-[11px] text-surface-400">Enter multiple transactions at once</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-surface-400 hover:text-surface-600 dark:hover:text-surface-300
                     hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[32px_90px_110px_1fr_130px_130px_90px_32px] gap-1.5 px-3 py-1.5
                      text-[10px] font-bold uppercase tracking-wider text-surface-400 dark:text-surface-500
                      border-b border-surface-100 dark:border-surface-800 bg-surface-50/50 dark:bg-surface-900/30">
        <span />
        <span>Type</span>
        <span>Amount</span>
        <span>Description</span>
        <span>Category</span>
        <span>Payment</span>
        <span>Date</span>
        <span />
      </div>

      {/* Rows */}
      <div className="divide-y divide-surface-100 dark:divide-surface-800/60">
        {rows.map((row, idx) => {
          const tc = TYPE_COLORS[row.type];
          const cats = categories(row.type);
          const isLast = idx === rows.length - 1;

          return (
            <div
              key={row.id}
              className={`
                grid grid-cols-[32px_90px_110px_1fr_130px_130px_90px_32px] gap-1.5 px-3 py-2 items-center
                transition-colors hover:bg-surface-50/50 dark:hover:bg-surface-800/20
                ${Object.keys(row.error).length > 0 ? 'bg-rose-50/40 dark:bg-rose-950/10' : ''}
              `}
            >
              {/* Row number */}
              <span className="text-[10px] font-bold text-center text-surface-400 select-none">{idx + 1}</span>

              {/* Type selector */}
              <div className="relative">
                <select
                  value={row.type}
                  onChange={(e) => updateRow(row.id, 'type', e.target.value)}
                  className={`
                    w-full appearance-none text-xs font-bold rounded-lg px-2 py-1.5 pr-6 border
                    focus:outline-none focus:ring-1 focus:ring-violet-500/50 cursor-pointer
                    ${tc.bg} ${tc.text} ${tc.border}
                  `}
                >
                  {['expense', 'income', 'transfer'].map((t) => (
                    <option key={t} value={t}>{TYPE_EMOJIS[t]} {t.charAt(0).toUpperCase() + t.slice(1)}</option>
                  ))}
                </select>
                <ChevronDown size={10} className={`absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none ${tc.text}`} />
              </div>

              {/* Amount */}
              <div>
                <div className="flex rounded-lg overflow-hidden border border-surface-200 dark:border-surface-700 focus-within:ring-1 focus-within:ring-violet-500/50">
                  <select
                    value={row.currency}
                    onChange={(e) => updateRow(row.id, 'currency', e.target.value)}
                    className="text-[10px] font-bold bg-surface-100 dark:bg-surface-800 border-0 px-1.5 py-1.5 focus:outline-none text-surface-600 dark:text-surface-300"
                  >
                    {Object.keys(EXCHANGE_RATES).map((c) => (
                      <option key={c} value={c}>{CURRENCY_SYMBOLS[c]}</option>
                    ))}
                  </select>
                  <input
                    ref={(el) => { inputRefs.current[`${row.id}-amount`] = el; }}
                    type="number"
                    value={row.amount}
                    onChange={(e) => updateRow(row.id, 'amount', e.target.value)}
                    placeholder="0.00"
                    min="0.01"
                    step="0.01"
                    className={`
                      flex-1 min-w-0 px-2 py-1.5 text-xs font-bold bg-transparent border-0
                      focus:outline-none text-surface-900 dark:text-surface-100 placeholder-surface-300
                      ${row.error.amount ? 'text-rose-500' : ''}
                    `}
                  />
                </div>
                {row.error.amount && <p className="text-[9px] text-rose-500 mt-0.5 font-medium">{row.error.amount}</p>}
              </div>

              {/* Description */}
              <div>
                <input
                  ref={(el) => { inputRefs.current[`${row.id}-description`] = el; }}
                  type="text"
                  value={row.description}
                  onChange={(e) => updateRow(row.id, 'description', e.target.value)}
                  placeholder="What was this for?"
                  className={`
                    w-full px-2.5 py-1.5 rounded-lg text-xs font-medium border
                    bg-transparent focus:outline-none focus:ring-1 focus:ring-violet-500/50 transition-colors
                    ${row.error.description
                      ? 'border-rose-400/60 text-rose-600 dark:text-rose-400 placeholder-rose-300'
                      : 'border-surface-200 dark:border-surface-700 text-surface-900 dark:text-surface-100 placeholder-surface-300'
                    }
                  `}
                />
              </div>

              {/* Category */}
              <div className="relative">
                <select
                  value={row.category}
                  onChange={(e) => updateRow(row.id, 'category', e.target.value)}
                  className={`
                    w-full appearance-none text-xs font-medium rounded-lg px-2.5 py-1.5 pr-6 border
                    bg-transparent focus:outline-none focus:ring-1 focus:ring-violet-500/50 cursor-pointer
                    transition-colors
                    ${row.error.category
                      ? 'border-rose-400/60 text-rose-500'
                      : 'border-surface-200 dark:border-surface-700 text-surface-900 dark:text-surface-100'
                    }
                  `}
                >
                  <option value="">— Category —</option>
                  {cats.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.icon} {cat.label}</option>
                  ))}
                </select>
                <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-surface-400" />
              </div>

              {/* Payment Method */}
              <div className="relative">
                <select
                  value={row.paymentMethod}
                  onChange={(e) => updateRow(row.id, 'paymentMethod', e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, row.id, 'paymentMethod', isLast)}
                  className={`
                    w-full appearance-none text-xs font-medium rounded-lg px-2.5 py-1.5 pr-6 border
                    bg-transparent focus:outline-none focus:ring-1 focus:ring-violet-500/50 cursor-pointer
                    transition-colors
                    ${row.error.paymentMethod
                      ? 'border-rose-400/60 text-rose-500'
                      : 'border-surface-200 dark:border-surface-700 text-surface-900 dark:text-surface-100'
                    }
                  `}
                >
                  <option value="">— Method —</option>
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m.id} value={m.id}>{m.icon} {m.label}</option>
                  ))}
                </select>
                <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-surface-400" />
              </div>

              {/* Date */}
              <div>
                <input
                  type="date"
                  value={row.date}
                  onChange={(e) => updateRow(row.id, 'date', e.target.value)}
                  className={`
                    w-full px-2 py-1.5 rounded-lg text-xs font-medium border
                    bg-transparent focus:outline-none focus:ring-1 focus:ring-violet-500/50 transition-colors
                    ${row.error.date
                      ? 'border-rose-400/60 text-rose-500'
                      : 'border-surface-200 dark:border-surface-700 text-surface-900 dark:text-surface-100'
                    }
                  `}
                />
              </div>

              {/* Delete row */}
              <button
                type="button"
                onClick={() => removeRow(row.id)}
                className="flex items-center justify-center w-6 h-6 rounded-lg text-surface-300 dark:text-surface-600
                           hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30
                           transition-colors mx-auto"
              >
                <Trash2 size={13} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center gap-3 px-3 py-3 border-t border-surface-100 dark:border-surface-800
                      bg-surface-50/60 dark:bg-surface-900/30 flex-wrap">
        {/* Add row button */}
        <button
          type="button"
          onClick={() => addRow()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                     text-violet-600 dark:text-violet-400 border border-dashed border-violet-400/50
                     hover:bg-violet-50 dark:hover:bg-violet-950/30 hover:border-violet-500 transition-all"
        >
          <Plus size={13} /> Add Row
        </button>

        <p className="text-[11px] text-surface-400 hidden sm:block">
          Tab through fields · Enter on last field to add row
        </p>

        <div className="ml-auto flex items-center gap-2">
          {validCount > 0 && (
            <span className="text-[11px] font-semibold text-surface-500">
              {validCount} of {rows.length} ready
            </span>
          )}
          <button
            type="button"
            onClick={handleSubmitAll}
            disabled={submitting || validCount === 0}
            className="btn-primary text-xs px-4 py-2 gap-1.5 disabled:opacity-50"
          >
            {submitting
              ? <><span className="animate-spin">⏳</span> Saving {submitted}/{rows.length}…</>
              : <><Check size={13} /> Save {rows.length} Transaction{rows.length !== 1 ? 's' : ''}</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}
