/** TransactionItem.jsx — A single transaction row in the list */
import { useState } from 'react';
import { Pencil, Trash2, ChevronDown, Link2 } from 'lucide-react';
import { getCategoryById } from '../../utils/categories';
import { formatINR, CURRENCY_SYMBOLS } from '../../utils/money';
import { formatDisplayDate } from '../../utils/dates';
import { useApp } from '../../context/AppContext';
import ConfirmDialog from '../ui/ConfirmDialog';

const TYPE_AMOUNT_COLOR = {
  income:   'text-emerald-500 dark:text-emerald-400',
  expense:  'text-rose-500 dark:text-rose-400',
  transfer: 'text-amber-500 dark:text-amber-400',
};
const TYPE_SIGN = { income: '+', expense: '−', transfer: '↔' };

const METHOD_ICONS = {
  cash: '💵', upi: '📲', credit: '💳', debit: '🏧', bank: '🏦', wallet: '👛', netbanking: '🌐',
};

export default function TransactionItem({ transaction: t }) {
  const { dispatch, deleteTransaction } = useApp();
  const [showDelete, setShowDelete]   = useState(false);
  const [expanded, setExpanded]       = useState(false);

  const cat = getCategoryById(t.category);
  const hasNotes   = !!t.notes;
  const hasLinked  = !!t.linkedTransactionId;
  const hasTags    = t.tags && t.tags.length > 0;
  const hasExtra   = hasNotes || hasLinked || hasTags;

  const isForeign  = t.currency && t.currency !== 'INR';

  return (
    <>
      <div className={`group rounded-2xl border border-surface-100 dark:border-surface-700/60
                      glass-panel
                      hover:border-surface-200 dark:hover:border-surface-600
                      hover:shadow-md transition-all duration-200 overflow-hidden
                      ${isDeleting ? 'opacity-50 pointer-events-none' : ''}`}>

        {/* Main row */}
        <div className="flex items-center gap-3 px-4 py-3.5">
          {/* Category icon */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ background: cat.color + '20' }}
          >
            {cat.icon}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-surface-900 dark:text-surface-100 truncate">
              {t.description}
            </p>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-[11px] text-surface-400 dark:text-surface-500 font-medium">
                {formatDisplayDate(t.date)}
              </span>
              <span className="text-[11px] text-surface-300 dark:text-surface-600">•</span>
              <span className="text-[11px] text-surface-400 dark:text-surface-500 capitalize">
                {METHOD_ICONS[t.paymentMethod] ?? '💳'} {t.paymentMethod}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                    style={{ background: cat.color + '20', color: cat.color }}>
                {cat.label}
              </span>
            </div>
          </div>

          {/* Amount + actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="text-right">
              <p className={`text-base font-extrabold tracking-tight ${TYPE_AMOUNT_COLOR[t.type]}`}>
                {TYPE_SIGN[t.type]}{formatINR(t.amount)}
              </p>
              {isForeign && (
                <p className="text-[10px] text-surface-400 dark:text-surface-500">
                  {CURRENCY_SYMBOLS[t.currency]}{t.originalAmount} {t.currency}
                </p>
              )}
            </div>

            {/* Edit */}
            <button
              onClick={() => dispatch({ type: 'OPEN_FORM', payload: t })}
              className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all
                         text-surface-400 hover:text-violet-600 dark:hover:text-violet-400
                         hover:bg-violet-50 dark:hover:bg-violet-950/40"
              title="Edit"
            >
              <Pencil size={14} />
            </button>

            {/* Delete */}
            <button
              onClick={() => setShowDelete(true)}
              className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all
                         text-surface-400 hover:text-rose-500 dark:hover:text-rose-400
                         hover:bg-rose-50 dark:hover:bg-rose-950/40"
              title="Delete"
            >
              <Trash2 size={14} />
            </button>

            {/* Expand toggle */}
            {hasExtra && (
              <button
                onClick={() => setExpanded((v) => !v)}
                className={`p-1.5 rounded-lg transition-all text-surface-400 hover:text-surface-600
                            dark:hover:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700 ${expanded ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                title="Details"
              >
                <ChevronDown size={14} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
              </button>
            )}
          </div>
        </div>

        {/* Expanded details */}
        {expanded && hasExtra && (
          <div className="px-4 pb-3.5 border-t border-surface-50 dark:border-surface-700/50 pt-3 space-y-2 animate-fade-in">
            {hasTags && (
              <div className="flex flex-wrap gap-1.5">
                {t.tags.map((tag) => (
                  <span key={tag} className={`text-[10px] px-2 py-0.5 rounded-full font-semibold
                    ${tag === 'refund' || tag === 'reversal' ? 'badge-refund' : 'badge-tag'}`}>
                    #{tag}
                  </span>
                ))}
              </div>
            )}
            {hasNotes && (
              <p className="text-xs text-surface-500 dark:text-surface-400 italic leading-relaxed">
                "{t.notes}"
              </p>
            )}
            {hasLinked && (
              <p className="text-[10px] text-surface-400 dark:text-surface-500 flex items-center gap-1 font-mono">
                <Link2 size={10} /> Linked: {t.linkedTransactionId}
              </p>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={showDelete}
        onConfirm={() => { deleteTransaction(t.id); setShowDelete(false); }}
        onCancel={() => setShowDelete(false)}
        variant="danger"
        title="Delete transaction?"
        message={`"${t.description}" for ${formatINR(t.amount)} will be permanently removed.`}
        confirmLabel="Delete"
      />
    </>
  );
}
