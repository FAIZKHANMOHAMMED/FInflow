/**
 * BulkEntryPanel.jsx — Rapid inline multi-transaction entry panel
 *
 * Mobile  (<md): Stacked card layout — one card per row, all fields vertical.
 * Desktop (≥md): Spreadsheet grid — compact horizontal rows.
 *
 * Features:
 *   - Multiple rows with carry-over defaults (date, type, paymentMethod)
 *   - Inline validation highlighting
 *   - Add Row / Remove Row
 *   - Bulk submit all rows at once
 */
import { useState, useRef, useCallback } from 'react';
import { Plus, Trash2, X, Check, ChevronDown, Zap } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CATEGORIES, PAYMENT_METHODS } from '../../utils/categories';
import { CURRENCY_SYMBOLS, EXCHANGE_RATES } from '../../utils/money';
import { nowDateTimeLocalString } from '../../utils/dates';

const TYPE_COLORS = {
  expense:  { bg: 'bg-rose-500/10',    text: 'text-rose-600 dark:text-rose-400',       border: 'border-rose-400/50' },
  income:   { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-400/50' },
  transfer: { bg: 'bg-amber-500/10',   text: 'text-amber-600 dark:text-amber-400',     border: 'border-amber-400/50' },
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
  date:          nowDateTimeLocalString().slice(0, 10),
  error:         {},
});

export default function BulkEntryPanel({ onClose }) {
  const { addTransaction } = useApp();
  const [rows, setRows] = useState([blankRow()]);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(0);
  const amountRefs = useRef({});

  // ── Row helpers ────────────────────────────────────────────────────────────
  const updateRow = useCallback((id, field, value) => {
    setRows((prev) => prev.map((r) => {
      if (r.id !== id) return r;
      const updated = { ...r, [field]: value };
      if (field === 'type') updated.category = '';
      if (r.error[field]) updated.error = { ...r.error, [field]: undefined };
      return updated;
    }));
  }, []);

  const addRow = useCallback(() => {
    const last = rows[rows.length - 1];
    const newRow = {
      ...blankRow(),
      date:          last?.date          ?? blankRow().date,
      type:          last?.type          ?? 'expense',
      paymentMethod: last?.paymentMethod ?? '',
      currency:      last?.currency      ?? 'INR',
    };
    setRows((prev) => [...prev, newRow]);
    setTimeout(() => amountRefs.current[newRow.id]?.focus(), 60);
  }, [rows]);

  const removeRow = useCallback((id) => {
    setRows((prev) => prev.length === 1 ? [blankRow()] : prev.filter((r) => r.id !== id));
  }, []);

  // ── Validation ─────────────────────────────────────────────────────────────
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

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmitAll = async () => {
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

  const validCount = rows.filter((r) =>
    r.amount && r.description.trim() && r.category && r.paymentMethod
  ).length;

  // ── Shared field classes ───────────────────────────────────────────────────
  const fieldCls = (hasErr) =>
    `w-full px-2.5 py-2 rounded-lg text-xs font-medium border bg-transparent
     focus:outline-none focus:ring-1 focus:ring-violet-500/50 transition-colors
     ${hasErr
       ? 'border-rose-400/60 text-rose-600 dark:text-rose-400'
       : 'border-surface-200 dark:border-surface-700 text-surface-900 dark:text-surface-100'
     }`;

  const selectCls = (hasErr) =>
    `w-full appearance-none px-2.5 py-2 pr-7 rounded-lg text-xs font-medium border bg-transparent
     focus:outline-none focus:ring-1 focus:ring-violet-500/50 cursor-pointer transition-colors
     ${hasErr
       ? 'border-rose-400/60 text-rose-500'
       : 'border-surface-200 dark:border-surface-700 text-surface-900 dark:text-surface-100'
     }`;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="card p-0 overflow-hidden">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-100 dark:border-surface-800
                      bg-gradient-to-r from-violet-500/5 to-transparent">
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

      {/* ── Desktop: spreadsheet header ── */}
      <div className="hidden md:grid md:grid-cols-[28px_88px_108px_1fr_128px_128px_88px_28px] gap-1.5 px-3 py-1.5
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

      {/* ── Rows ── */}
      <div className="divide-y divide-surface-100 dark:divide-surface-800/60">
        {rows.map((row, idx) => {
          const tc = TYPE_COLORS[row.type];
          const cats = CATEGORIES[row.type] ?? [];
          const hasErr = Object.keys(row.error).length > 0;

          return (
            <div key={row.id} className={`transition-colors ${hasErr ? 'bg-rose-50/30 dark:bg-rose-950/10' : 'hover:bg-surface-50/50 dark:hover:bg-surface-800/20'}`}>

              {/* ── Mobile card layout ── */}
              <div className="md:hidden p-3 space-y-2.5">
                {/* Card header: row number + type + delete */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-surface-400 w-5 text-center shrink-0">#{idx + 1}</span>

                  {/* Type */}
                  <div className="relative flex-1">
                    <select
                      value={row.type}
                      onChange={(e) => updateRow(row.id, 'type', e.target.value)}
                      className={`w-full appearance-none text-xs font-bold rounded-lg px-2.5 py-2 pr-7 border
                                  focus:outline-none focus:ring-1 focus:ring-violet-500/50 cursor-pointer
                                  ${tc.bg} ${tc.text} ${tc.border}`}
                    >
                      {['expense', 'income', 'transfer'].map((t) => (
                        <option key={t} value={t}>{TYPE_EMOJIS[t]} {t.charAt(0).toUpperCase() + t.slice(1)}</option>
                      ))}
                    </select>
                    <ChevronDown size={10} className={`absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none ${tc.text}`} />
                  </div>

                  <button
                    onClick={() => removeRow(row.id)}
                    className="p-1.5 rounded-lg text-surface-300 dark:text-surface-600 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Amount row */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-surface-400 mb-1 block">Amount</label>
                  <div className="flex rounded-lg overflow-hidden border border-surface-200 dark:border-surface-700 focus-within:ring-1 focus-within:ring-violet-500/50">
                    <select
                      value={row.currency}
                      onChange={(e) => updateRow(row.id, 'currency', e.target.value)}
                      className="text-[10px] font-bold bg-surface-100 dark:bg-surface-800 border-0 px-2 py-2 focus:outline-none text-surface-600 dark:text-surface-300"
                    >
                      {Object.keys(EXCHANGE_RATES).map((c) => (
                        <option key={c} value={c}>{CURRENCY_SYMBOLS[c]} {c}</option>
                      ))}
                    </select>
                    <input
                      ref={(el) => { amountRefs.current[row.id] = el; }}
                      type="number"
                      value={row.amount}
                      onChange={(e) => updateRow(row.id, 'amount', e.target.value)}
                      placeholder="0.00"
                      min="0.01"
                      step="0.01"
                      className={`flex-1 min-w-0 px-2.5 py-2 text-sm font-bold bg-transparent border-0
                                  focus:outline-none text-surface-900 dark:text-surface-100 placeholder-surface-300
                                  ${row.error.amount ? 'text-rose-500' : ''}`}
                    />
                  </div>
                  {row.error.amount && <p className="text-[10px] text-rose-500 mt-0.5">{row.error.amount}</p>}
                </div>

                {/* Description */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-surface-400 mb-1 block">Description</label>
                  <input
                    type="text"
                    value={row.description}
                    onChange={(e) => updateRow(row.id, 'description', e.target.value)}
                    placeholder="What was this for?"
                    className={fieldCls(row.error.description)}
                  />
                  {row.error.description && <p className="text-[10px] text-rose-500 mt-0.5">{row.error.description}</p>}
                </div>

                {/* Category + Payment in a 2-col grid */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-surface-400 mb-1 block">Category</label>
                    <div className="relative">
                      <select
                        value={row.category}
                        onChange={(e) => updateRow(row.id, 'category', e.target.value)}
                        className={selectCls(row.error.category)}
                      >
                        <option value="">— Pick —</option>
                        {cats.map((cat) => (
                          <option key={cat.id} value={cat.id}>{cat.icon} {cat.label}</option>
                        ))}
                      </select>
                      <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-surface-400" />
                    </div>
                    {row.error.category && <p className="text-[10px] text-rose-500 mt-0.5">{row.error.category}</p>}
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-surface-400 mb-1 block">Payment</label>
                    <div className="relative">
                      <select
                        value={row.paymentMethod}
                        onChange={(e) => updateRow(row.id, 'paymentMethod', e.target.value)}
                        className={selectCls(row.error.paymentMethod)}
                      >
                        <option value="">— Pick —</option>
                        {PAYMENT_METHODS.map((m) => (
                          <option key={m.id} value={m.id}>{m.icon} {m.label}</option>
                        ))}
                      </select>
                      <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-surface-400" />
                    </div>
                    {row.error.paymentMethod && <p className="text-[10px] text-rose-500 mt-0.5">{row.error.paymentMethod}</p>}
                  </div>
                </div>

                {/* Date */}
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-wider text-surface-400 mb-1 block">Date</label>
                  <input
                    type="date"
                    value={row.date}
                    onChange={(e) => updateRow(row.id, 'date', e.target.value)}
                    className={fieldCls(row.error.date)}
                  />
                </div>
              </div>

              {/* ── Desktop spreadsheet row ── */}
              <div className="hidden md:grid md:grid-cols-[28px_88px_108px_1fr_128px_128px_88px_28px] gap-1.5 px-3 py-2 items-center">
                {/* Row number */}
                <span className="text-[10px] font-bold text-center text-surface-400 select-none">{idx + 1}</span>

                {/* Type */}
                <div className="relative">
                  <select
                    value={row.type}
                    onChange={(e) => updateRow(row.id, 'type', e.target.value)}
                    className={`w-full appearance-none text-xs font-bold rounded-lg px-2 py-1.5 pr-6 border
                                focus:outline-none focus:ring-1 focus:ring-violet-500/50 cursor-pointer
                                ${tc.bg} ${tc.text} ${tc.border}`}
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
                      ref={(el) => { amountRefs.current[row.id] = el; }}
                      type="number"
                      value={row.amount}
                      onChange={(e) => updateRow(row.id, 'amount', e.target.value)}
                      placeholder="0.00"
                      min="0.01"
                      step="0.01"
                      className={`flex-1 min-w-0 px-2 py-1.5 text-xs font-bold bg-transparent border-0
                                  focus:outline-none text-surface-900 dark:text-surface-100 placeholder-surface-300
                                  ${row.error.amount ? 'text-rose-500' : ''}`}
                    />
                  </div>
                </div>

                {/* Description */}
                <input
                  type="text"
                  value={row.description}
                  onChange={(e) => updateRow(row.id, 'description', e.target.value)}
                  placeholder="What was this for?"
                  className={fieldCls(row.error.description)}
                />

                {/* Category */}
                <div className="relative">
                  <select
                    value={row.category}
                    onChange={(e) => updateRow(row.id, 'category', e.target.value)}
                    className={selectCls(row.error.category)}
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
                    className={selectCls(row.error.paymentMethod)}
                  >
                    <option value="">— Method —</option>
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m.id} value={m.id}>{m.icon} {m.label}</option>
                    ))}
                  </select>
                  <ChevronDown size={10} className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none text-surface-400" />
                </div>

                {/* Date */}
                <input
                  type="date"
                  value={row.date}
                  onChange={(e) => updateRow(row.id, 'date', e.target.value)}
                  className={fieldCls(row.error.date)}
                />

                {/* Delete */}
                <button
                  onClick={() => removeRow(row.id)}
                  className="flex items-center justify-center w-6 h-6 rounded-lg mx-auto
                             text-surface-300 dark:text-surface-600 hover:text-rose-500 hover:bg-rose-50
                             dark:hover:bg-rose-950/30 transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              </div>

            </div>
          );
        })}
      </div>

      {/* ── Footer ── */}
      <div className="flex items-center gap-3 px-3 py-3 border-t border-surface-100 dark:border-surface-800
                      bg-surface-50/60 dark:bg-surface-900/30 flex-wrap">
        <button
          onClick={addRow}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                     text-violet-600 dark:text-violet-400 border border-dashed border-violet-400/50
                     hover:bg-violet-50 dark:hover:bg-violet-950/30 hover:border-violet-500 transition-all"
        >
          <Plus size={13} /> Add Row
        </button>

        <p className="text-[11px] text-surface-400 hidden sm:block">
          {rows.length} row{rows.length !== 1 ? 's' : ''} · {validCount} ready
        </p>

        <div className="ml-auto flex items-center gap-2">
          {/* Mobile: show count */}
          <span className="text-[11px] font-semibold text-surface-500 sm:hidden">
            {validCount}/{rows.length} ready
          </span>
          <button
            onClick={handleSubmitAll}
            disabled={submitting || validCount === 0}
            className="btn-primary text-xs px-4 py-2 gap-1.5 disabled:opacity-50"
          >
            {submitting
              ? <><span className="animate-spin inline-block">⏳</span> {submitted}/{rows.length}…</>
              : <><Check size={13} /> Save {rows.length} transaction{rows.length !== 1 ? 's' : ''}</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}
