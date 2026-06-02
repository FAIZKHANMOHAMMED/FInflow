/**
 * SettingsPage.jsx — Data management, export/import, clear data
 */
import { useState } from 'react';
import {
  Download, Upload, Trash2, FileJson, FileSpreadsheet,
  Shield, Database, Info
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { exportJSON, exportCSV, importJSON } from '../../utils/dataPortability';
// clearState is now handled by clearAllData in AppContext
import ConfirmDialog from '../ui/ConfirmDialog';
import ThemeToggle from '../ui/ThemeToggle';

function Section({ icon: Icon, title, description, children }) {
  return (
    <div className="card p-6 space-y-4">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-violet-100 dark:bg-violet-950/50 flex-shrink-0">
          <Icon size={18} className="text-violet-600 dark:text-violet-400" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-surface-900 dark:text-surface-100">{title}</h3>
          <p className="text-xs text-surface-400 dark:text-surface-500 mt-0.5">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const { state, importTransactions, showToast, clearAllData } = useApp();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const txnCount = state.transactions.length;

  const handleExportJSON = () => {
    if (txnCount === 0) { showToast('No transactions to export', 'info'); return; }
    exportJSON(state.transactions);
    showToast('JSON exported successfully!', 'success');
  };

  const handleExportCSV = () => {
    if (txnCount === 0) { showToast('No transactions to export', 'info'); return; }
    exportCSV(state.transactions);
    showToast('CSV exported successfully!', 'success');
  };

  const handleImport = async () => {
    try {
      const txns = await importJSON();
      importTransactions(txns);
    } catch (err) {
      showToast(err.message ?? 'Import failed', 'error');
    }
  };

  const handleClearAll = async () => {
    await clearAllData();
    setShowClearConfirm(false);
  };

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-surface-900 dark:text-surface-50 tracking-tight">Settings</h1>
        <p className="text-sm text-surface-400 dark:text-surface-500 mt-1">Manage your data and preferences</p>
      </div>

      {/* Appearance */}
      <Section icon={Info} title="Appearance" description="Choose your preferred colour theme">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-surface-700 dark:text-surface-300">
            {state.settings.theme === 'dark' ? '🌙 Dark mode' : '☀️ Light mode'}
          </span>
          <ThemeToggle />
        </div>
      </Section>

      {/* Data Stats */}
      <Section icon={Database} title="Your Data" description="Overview of stored transactions">
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl bg-surface-50 dark:bg-surface-900 p-4 text-center border border-surface-100 dark:border-surface-700">
            <p className="text-2xl font-extrabold text-violet-600 dark:text-violet-400">{txnCount}</p>
            <p className="text-xs text-surface-400 font-medium mt-0.5">Transactions</p>
          </div>
          <div className="rounded-xl bg-surface-50 dark:bg-surface-900 p-4 text-center border border-surface-100 dark:border-surface-700">
            <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {Math.round(JSON.stringify(state.transactions).length / 1024)} KB
            </p>
            <p className="text-xs text-surface-400 font-medium mt-0.5">Storage used</p>
          </div>
        </div>
        <p className="text-xs text-surface-400 dark:text-surface-500 flex items-center gap-1.5">
          <Shield size={12} className="text-emerald-500" />
          All data is saved to MongoDB and cached locally for offline access.
        </p>
      </Section>

      {/* Export */}
      <Section
        icon={Download}
        title="Export Data"
        description="Download your transaction history as JSON (full backup) or CSV (spreadsheet)"
      >
        <div className="flex flex-wrap gap-3">
          <button onClick={handleExportJSON} className="btn-secondary gap-2">
            <FileJson size={15} className="text-violet-500" />
            Export JSON
          </button>
          <button onClick={handleExportCSV} className="btn-secondary gap-2">
            <FileSpreadsheet size={15} className="text-emerald-500" />
            Export CSV
          </button>
        </div>
        <p className="text-xs text-surface-400">
          JSON export includes all fields and can be re-imported. CSV is for spreadsheet analysis.
        </p>
      </Section>

      {/* Import */}
      <Section
        icon={Upload}
        title="Import Data"
        description="Import transactions from a previously exported JSON backup. Duplicates are skipped automatically."
      >
        <button onClick={handleImport} className="btn-primary gap-2">
          <Upload size={15} />
          Import JSON File
        </button>
        <p className="text-xs text-surface-400">
          Existing transactions are preserved. Only new (non-duplicate) transactions will be added.
        </p>
      </Section>

      {/* Danger zone */}
      <Section
        icon={Trash2}
        title="Danger Zone"
        description="Permanently delete all transaction data. This cannot be undone."
      >
        <button
          onClick={() => setShowClearConfirm(true)}
          disabled={txnCount === 0}
          className="btn-danger gap-2 disabled:opacity-40"
        >
          <Trash2 size={15} />
          Clear All Data ({txnCount} transactions)
        </button>
      </Section>

      <ConfirmDialog
        isOpen={showClearConfirm}
        onConfirm={handleClearAll}
        onCancel={() => setShowClearConfirm(false)}
        variant="danger"
        title="Clear all data?"
        message={`This will permanently delete all ${txnCount} transactions. This action cannot be undone.`}
        confirmLabel="Yes, clear everything"
      />
    </div>
  );
}
