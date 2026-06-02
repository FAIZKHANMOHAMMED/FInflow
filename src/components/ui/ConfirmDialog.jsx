/** ConfirmDialog.jsx — Reusable confirm dialog for destructive or warning actions */
import { AlertTriangle, Calendar } from 'lucide-react';
import Modal from './Modal';

/**
 * Usage:
 * <ConfirmDialog
 *   isOpen={bool}
 *   onConfirm={fn}
 *   onCancel={fn}
 *   variant="danger" | "warning"
 *   title="Are you sure?"
 *   message="This action cannot be undone."
 *   confirmLabel="Delete"
 * />
 */
export default function ConfirmDialog({
  isOpen,
  onConfirm,
  onCancel,
  variant = 'danger',
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
}) {
  const isDanger  = variant === 'danger';
  const isWarning = variant === 'warning';

  return (
    <Modal isOpen={isOpen} onClose={onCancel} size="sm">
      <div className="flex flex-col items-center text-center gap-4">
        {/* Icon */}
        <div className={`p-4 rounded-full ${isDanger ? 'bg-rose-100 dark:bg-rose-900/30' : 'bg-amber-100 dark:bg-amber-900/30'}`}>
          {isWarning
            ? <Calendar size={28} className="text-amber-500" />
            : <AlertTriangle size={28} className={isDanger ? 'text-rose-500' : 'text-amber-500'} />
          }
        </div>

        <div>
          <h3 className="text-lg font-bold text-surface-900 dark:text-surface-100 mb-1">{title}</h3>
          {message && <p className="text-sm text-surface-500 dark:text-surface-400 leading-relaxed">{message}</p>}
        </div>

        <div className="flex gap-3 w-full pt-2">
          <button onClick={onCancel} className="btn-secondary flex-1">Cancel</button>
          <button
            onClick={onConfirm}
            className={`flex-1 btn font-semibold px-4 py-2.5 text-sm rounded-xl text-white ${
              isDanger
                ? 'bg-rose-500 hover:bg-rose-400'
                : 'bg-amber-500 hover:bg-amber-400'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
