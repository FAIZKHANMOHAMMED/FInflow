/**
 * dataPortability.js — Export (CSV / JSON) and Import (JSON) utilities
 */
import { formatDisplayDate } from './dates';
import { formatINR } from './money';

/**
 * Export transactions to a downloadable JSON file
 */
export const exportJSON = (transactions) => {
  const data = {
    exportedAt: new Date().toISOString(),
    version: 2,
    transactions,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  triggerDownload(blob, `finflow-backup-${Date.now()}.json`);
};

/**
 * Export transactions to a downloadable CSV file
 */
export const exportCSV = (transactions) => {
  const headers = [
    'ID','Date','Description','Type','Category','Payment Method',
    'Amount (INR)','Original Amount','Currency','Tags','Notes','Linked ID'
  ];
  const rows = transactions.map((t) => [
    t.id,
    formatDisplayDate(t.date),
    `"${(t.description || '').replace(/"/g, '""')}"`,
    t.type,
    t.category,
    t.paymentMethod,
    t.amount,
    t.originalAmount ?? t.amount,
    t.currency ?? 'INR',
    `"${(t.tags || []).join(', ')}"`,
    `"${(t.notes || '').replace(/"/g, '""')}"`,
    t.linkedTransactionId ?? '',
  ]);
  const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, `finflow-export-${Date.now()}.csv`);
};

/**
 * Import transactions from a JSON file.
 * Returns a Promise that resolves with the parsed transaction array.
 */
export const importJSON = () => {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return reject(new Error('No file selected'));
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const parsed = JSON.parse(ev.target.result);
          // Support both raw array and { transactions: [...] } shape
          const txns = Array.isArray(parsed) ? parsed : (parsed.transactions ?? []);
          if (!Array.isArray(txns)) throw new Error('Invalid format');
          resolve(txns);
        } catch (err) {
          reject(new Error('Invalid JSON file: ' + err.message));
        }
      };
      reader.readAsText(file);
    };
    input.click();
  });
};

/** Helper to trigger a file download in the browser */
const triggerDownload = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
