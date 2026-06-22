/**
 * TransactionForm.jsx — Add / Edit transaction modal
 * Handles: validation, future-date warning, multi-currency, refund linking, tags,
 *          "Save & Add Another" for fast bulk entry with smart carry-over defaults.
 *
 * Keyboard shortcuts (when modal is open):
 *   Ctrl+Enter          → Save & close
 *   Ctrl+Shift+Enter    → Save & Add Another
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Tag, Link2, AlertTriangle, Plus } from 'lucide-react';
import Modal from '../ui/Modal';
import ConfirmDialog from '../ui/ConfirmDialog';
import { useApp } from '../../context/AppContext';
import { CATEGORIES, PAYMENT_METHODS, PRESET_TAGS } from '../../utils/categories';
import { validateAmount, EXCHANGE_RATES, CURRENCY_SYMBOLS, formatINR } from '../../utils/money';
import { nowDateTimeLocalString, isFutureDate } from '../../utils/dates';

const TYPE_STYLES = {
  expense:  'bg-rose-500 text-white shadow-rose-500/30',
  income:   'bg-emerald-500 text-white shadow-emerald-500/30',
  transfer: 'bg-amber-500 text-white shadow-amber-500/30',
};

const BLANK = {
  type:              'expense',
  amount:            '',
  currency:          'INR',
  date:              '',
  category:          '',
  paymentMethod:     '',
  description:       '',
  tags:              [],
  notes:             '',
  linkedTransactionId: '',
};

export default function TransactionForm() {
  const { state, dispatch, addTransaction, updateTransaction } = useApp();
  const { isFormOpen, editingTransaction } = state.ui;

  const [form,    setForm]    = useState(BLANK);
  const [errors,  setErrors]  = useState({});
  const [tagInput, setTagInput] = useState('');
  const [showFutureWarning, setShowFutureWarning] = useState(false);
  const [pendingSubmit, setPendingSubmit] = useState(false);
  // When true, after submit we open a fresh form with carry-over defaults
  const [addAnotherPending, setAddAnotherPending] = useState(false);
  // Stores the carry-over defaults from the last saved entry
  const lastDefaults = useRef({});
  // Counter to track how many were added in this "session"
  const [addedCount, setAddedCount] = useState(0);
  const amountRef = useRef(null);

  const isEditing = !!editingTransaction;

  // Populate form when opened
  useEffect(() => {
    if (isFormOpen) {
      if (editingTransaction) {
        setForm({
          ...BLANK,
          ...editingTransaction,
          amount: String(editingTransaction.originalAmount ?? editingTransaction.amount),
          currency: editingTransaction.currency ?? 'INR',
          tags: editingTransaction.tags ?? [],
          linkedTransactionId: editingTransaction.linkedTransactionId ?? '',
        });
        setAddedCount(0);
      } else {
        // Apply carry-over defaults if they exist (from Save & Add Another)
        const d = lastDefaults.current;
        setForm({
          ...BLANK,
          date:          d.date          ?? nowDateTimeLocalString(),
          type:          d.type          ?? 'expense',
          category:      d.category      ?? '',
          paymentMethod: d.paymentMethod ?? '',
          currency:      d.currency      ?? 'INR',
        });
      }
      setErrors({});
      setTagInput('');
      // Auto-focus amount field
      setTimeout(() => amountRef.current?.focus(), 80);
    } else {
      // Reset session counter when form fully closes (not "add another")
      if (!addAnotherPending) setAddedCount(0);
    }
  }, [isFormOpen, editingTransaction]); // eslint-disable-line



  const categories = CATEGORIES[form.type] ?? [];

  // ── Validation ──────────────────────────────────────────────────────────
  const validate = useCallback(() => {
    const errs = {};
    const amtErr = validateAmount(form.amount);
    if (amtErr) errs.amount = amtErr;
    if (!form.date)               errs.date          = 'Date & time is required';
    if (!form.category)           errs.category      = 'Select a category';
    if (!form.paymentMethod)      errs.paymentMethod = 'Select a payment method';
    if (!form.description.trim()) errs.description   = 'Description is required';
    return errs;
  }, [form]);

  // ── Core submit logic ────────────────────────────────────────────────────
  const doSubmit = (andAddAnother = false) => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return false;
    }
    if (!pendingSubmit && isFutureDate(form.date)) {
      setAddAnotherPending(andAddAnother);
      setShowFutureWarning(true);
      return false;
    }
    commitSubmit(andAddAnother);
    return true;
  };

  const commitSubmit = (andAddAnother = false) => {
    const data = { ...form, amount: parseFloat(form.amount) };

    if (isEditing) {
      updateTransaction({ ...editingTransaction, ...data });
    } else {
      addTransaction(data);
      // Save defaults for carry-over
      lastDefaults.current = {
        date:          form.date,
        type:          form.type,
        category:      form.category,
        paymentMethod: form.paymentMethod,
        currency:      form.currency,
      };
      setAddedCount((n) => n + 1);
    }

    setPendingSubmit(false);
    setAddAnotherPending(false);

    if (andAddAnother && !isEditing) {
      // Reopen with carry-over — trigger via dispatch CLOSE then OPEN
      dispatch({ type: 'CLOSE_FORM' });
      requestAnimationFrame(() => dispatch({ type: 'OPEN_FORM' }));
    } else {
      dispatch({ type: 'CLOSE_FORM' });
    }
  };

  // ── Public handlers ──────────────────────────────────────────────────────
  const handleSubmit = (e) => { e?.preventDefault(); doSubmit(false); };
  const handleSaveAndAddAnother = () => doSubmit(true);

  // Keyboard shortcuts: Ctrl+Enter = save, Ctrl+Shift+Enter = save & add another
  useEffect(() => {
    if (!isFormOpen) return;
    const handler = (e) => {
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        if (e.shiftKey) {
          handleSaveAndAddAnother();
        } else {
          handleSubmit();
        }
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isFormOpen, form]); // eslint-disable-line

  const onFutureConfirm = () => {
    setShowFutureWarning(false);
    setPendingSubmit(true);
    commitSubmit(addAnotherPending);
  };

  // ── Field helpers ────────────────────────────────────────────────────────
  const set = (key, value) => {
    setForm((f) => {
      const updated = { ...f, [key]: value };
      if (key === 'type') updated.category = '';
      return updated;
    });
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const addTag = (tag) => {
    const t = tag.trim().toLowerCase().replace(/\s+/g, '-');
    if (t && !form.tags.includes(t)) set('tags', [...form.tags, t]);
    setTagInput('');
  };

  const removeTag = (tag) => set('tags', form.tags.filter((t) => t !== tag));

  const onTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(tagInput); }
    if (e.key === 'Backspace' && !tagInput && form.tags.length > 0)
      removeTag(form.tags[form.tags.length - 1]);
  };

  const convertedAmount = form.currency !== 'INR' && form.amount
    ? parseFloat(form.amount) * (EXCHANGE_RATES[form.currency] ?? 1)
    : null;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <Modal
        isOpen={isFormOpen}
        onClose={() => { dispatch({ type: 'CLOSE_FORM' }); setAddedCount(0); }}
        title={isEditing ? 'Edit Transaction' : 'Add Transaction'}
        size="md"
      >
        {/* Session counter badge */}
        {!isEditing && addedCount > 0 && (
          <div className="mb-4 -mt-2 flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] font-bold">{addedCount}</span>
            transaction{addedCount !== 1 ? 's' : ''} added this session
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-5">

          {/* ── Type Toggle ─────────────────────────────────────────── */}
          <div className="flex gap-2 p-1 bg-surface-100 dark:bg-surface-900 rounded-xl">
            {['expense', 'income', 'transfer'].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => set('type', type)}
                className={`
                  flex-1 py-2 rounded-lg text-sm font-bold capitalize transition-all duration-200 shadow-sm
                  ${form.type === type
                    ? `${TYPE_STYLES[type]} shadow-lg`
                    : 'text-surface-500 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-800'
                  }
                `}
              >
                {type === 'expense' ? '💸' : type === 'income' ? '💰' : '🔄'} {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>

          {/* ── Amount + Currency ────────────────────────────────────── */}
          <div>
            <label className="label-base">Amount</label>
            <div className="flex gap-2">
              <select
                value={form.currency}
                onChange={(e) => set('currency', e.target.value)}
                className="input-base w-28 shrink-0"
              >
                {Object.keys(EXCHANGE_RATES).map((c) => (
                  <option key={c} value={c}>{CURRENCY_SYMBOLS[c]} {c}</option>
                ))}
              </select>
              <input
                ref={amountRef}
                type="number"
                value={form.amount}
                onChange={(e) => set('amount', e.target.value)}
                placeholder="0.00"
                min="0.01"
                step="0.01"
                className={`input-base flex-1 text-lg font-bold ${errors.amount ? 'input-error' : ''}`}
              />
            </div>
            {errors.amount && <p className="text-xs text-rose-500 mt-1 font-medium">{errors.amount}</p>}
            {convertedAmount != null && (
              <p className="text-xs text-violet-500 dark:text-violet-400 mt-1 font-medium">
                ≈ {formatINR(convertedAmount)} at rate 1 {form.currency} = ₹{EXCHANGE_RATES[form.currency]}
              </p>
            )}
          </div>

          {/* ── Description ──────────────────────────────────────────── */}
          <div>
            <label className="label-base">Description</label>
            <input
              type="text"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="What was this for?"
              className={`input-base ${errors.description ? 'input-error' : ''}`}
            />
            {errors.description && <p className="text-xs text-rose-500 mt-1 font-medium">{errors.description}</p>}
          </div>

          {/* ── Date & Time ──────────────────────────────────────────── */}
          <div>
            <label className="label-base">Date & Time</label>
            <input
              type="datetime-local"
              value={form.date}
              onChange={(e) => set('date', e.target.value)}
              className={`input-base ${errors.date ? 'input-error' : ''}`}
            />
            {errors.date && <p className="text-xs text-rose-500 mt-1 font-medium">{errors.date}</p>}
            {form.date && isFutureDate(form.date) && (
              <p className="text-xs text-amber-500 mt-1 font-medium flex items-center gap-1">
                <AlertTriangle size={12} /> Future date — you'll be asked to confirm
              </p>
            )}
          </div>

          {/* ── Category ─────────────────────────────────────────────── */}
          <div>
            <label className="label-base">Category</label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => set('category', cat.id)}
                  className={`
                    flex flex-col items-center gap-1 p-2.5 rounded-xl border text-xs font-semibold
                    transition-all duration-150 cursor-pointer
                    ${form.category === cat.id
                      ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300 shadow-sm'
                      : 'border-surface-200 dark:border-surface-700 text-surface-500 dark:text-surface-400 hover:border-surface-300 dark:hover:border-surface-600 hover:bg-surface-50 dark:hover:bg-surface-800'
                    }
                  `}
                  style={form.category === cat.id ? { borderColor: cat.color + '80', backgroundColor: cat.color + '15' } : {}}
                >
                  <span className="text-lg leading-none">{cat.icon}</span>
                  <span className="leading-tight text-center">{cat.label.split(' ')[0]}</span>
                </button>
              ))}
            </div>
            {errors.category && <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.category}</p>}
          </div>

          {/* ── Payment Method ────────────────────────────────────────── */}
          <div>
            <label className="label-base">Payment Method</label>
            <div className="flex flex-wrap gap-2">
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => set('paymentMethod', m.id)}
                  className={`
                    flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold
                    transition-all duration-150
                    ${form.paymentMethod === m.id
                      ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/50 text-violet-700 dark:text-violet-300'
                      : 'border-surface-200 dark:border-surface-700 text-surface-500 dark:text-surface-400 hover:border-surface-300 dark:hover:border-surface-600'
                    }
                  `}
                >
                  {m.icon} {m.label}
                </button>
              ))}
            </div>
            {errors.paymentMethod && <p className="text-xs text-rose-500 mt-1 font-medium">{errors.paymentMethod}</p>}
          </div>

          {/* ── Tags ─────────────────────────────────────────────────── */}
          <div>
            <label className="label-base flex items-center gap-1"><Tag size={11} /> Tags <span className="normal-case font-normal text-surface-400">(optional)</span></label>
            <div
              className={`input-base flex flex-wrap gap-1.5 min-h-[42px] cursor-text ${errors.tags ? 'input-error' : ''}`}
              onClick={(e) => e.currentTarget.querySelector('input')?.focus()}
            >
              {form.tags.map((tag) => (
                <span key={tag} className={`
                  inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold
                  ${tag === 'refund' || tag === 'reversal' ? 'badge-refund' : 'badge-tag'}
                `}>
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)} className="opacity-60 hover:opacity-100">
                    <X size={10} />
                  </button>
                </span>
              ))}
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={onTagKeyDown}
                placeholder={form.tags.length === 0 ? 'Type tag, press Enter…' : ''}
                className="flex-1 bg-transparent outline-none text-xs min-w-[80px] text-surface-900 dark:text-surface-100 placeholder-surface-400"
              />
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {PRESET_TAGS.filter((t) => !form.tags.includes(t)).map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => addTag(tag)}
                  className="text-[10px] px-2 py-0.5 rounded-full border border-surface-200 dark:border-surface-700
                             text-surface-400 dark:text-surface-500 hover:border-violet-400 hover:text-violet-600
                             dark:hover:text-violet-400 transition-colors font-medium"
                >
                  +{tag}
                </button>
              ))}
            </div>
          </div>

          {/* ── Notes ────────────────────────────────────────────────── */}
          <div>
            <label className="label-base">Notes <span className="normal-case font-normal text-surface-400">(optional)</span></label>
            <textarea
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Any extra details, context…"
              rows={2}
              className="input-base resize-none"
            />
          </div>

          {/* ── Refund Link ───────────────────────────────────────────── */}
          {(form.type === 'income' || form.tags.includes('refund')) && (
            <div>
              <label className="label-base flex items-center gap-1"><Link2 size={11} /> Linked Transaction ID (Refund)</label>
              <input
                type="text"
                value={form.linkedTransactionId}
                onChange={(e) => set('linkedTransactionId', e.target.value)}
                placeholder="Paste transaction ID this refund is for…"
                className="input-base font-mono text-xs"
              />
              <p className="text-xs text-surface-400 mt-1">Optional: Link this income to a previous expense to offset it in analytics.</p>
            </div>
          )}

          {/* ── Keyboard shortcut hint ─────────────────────────────── */}
          {!isEditing && (
            <p className="text-[10px] text-surface-400 dark:text-surface-500 text-center">
              <kbd className="px-1 py-0.5 rounded bg-surface-100 dark:bg-surface-800 font-mono text-[9px]">Ctrl+Enter</kbd> Save ·{' '}
              <kbd className="px-1 py-0.5 rounded bg-surface-100 dark:bg-surface-800 font-mono text-[9px]">Ctrl+Shift+Enter</kbd> Save & Add Another
            </p>
          )}

          {/* ── Actions ──────────────────────────────────────────────── */}
          <div className="flex flex-col gap-2 pt-1">
            {/* Primary actions row */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { dispatch({ type: 'CLOSE_FORM' }); setAddedCount(0); }}
                className="btn-secondary px-4 py-2.5 text-sm"
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary flex-1">
                {isEditing ? '✏️ Update Transaction' : '✓ Save Transaction'}
              </button>
            </div>

            {/* Save & Add Another — only for new transactions */}
            {!isEditing && (
              <button
                type="button"
                onClick={handleSaveAndAddAnother}
                className="
                  w-full flex items-center justify-center gap-2
                  py-2.5 px-4 rounded-xl text-sm font-bold
                  border-2 border-dashed border-violet-400/50 dark:border-violet-500/40
                  text-violet-600 dark:text-violet-400
                  hover:border-violet-500 hover:bg-violet-50 dark:hover:bg-violet-950/30
                  transition-all duration-200 group
                "
              >
                <Plus size={15} className="group-hover:scale-110 transition-transform" />
                Save & Add Another
                {addedCount > 0 && (
                  <span className="ml-auto text-[10px] font-normal opacity-60">
                    {addedCount} added so far
                  </span>
                )}
              </button>
            )}
          </div>
        </form>
      </Modal>

      {/* Future date confirmation */}
      <ConfirmDialog
        isOpen={showFutureWarning}
        onConfirm={onFutureConfirm}
        onCancel={() => setShowFutureWarning(false)}
        variant="warning"
        title="Future date selected"
        message={`You've selected a date in the future. Are you sure you want to log this transaction ahead of time?`}
        confirmLabel="Yes, log it"
      />
    </>
  );
}
