/**
 * App.jsx — Root application component
 */
import { useState } from 'react';
import { Zap } from 'lucide-react';
import { useApp } from './context/AppContext';

// Layout
import Sidebar from './components/layout/Sidebar';
import MobileBottomNav from './components/layout/MobileBottomNav';

// Dashboard
import SummaryCards from './components/dashboard/SummaryCards';
import DonutChart from './components/dashboard/DonutChart';
import TrendChart from './components/dashboard/TrendChart';

// Transactions
import TransactionList from './components/transactions/TransactionList';
import TransactionForm from './components/transactions/TransactionForm';
import BulkEntryPanel from './components/transactions/BulkEntryPanel';

// Settings
import SettingsPage from './components/settings/SettingsPage';

// UI
import Toast from './components/ui/Toast';
import EmptyState from './components/ui/EmptyState';
import ThemeToggle from './components/ui/ThemeToggle';
import ApiStatusBanner from './components/ui/ApiStatusBanner';
import LoadingScreen from './components/ui/LoadingScreen';

// Hooks
import { useTransactions } from './hooks/useTransactions';

// ─── Dashboard Page ──────────────────────────────────────────────────────────

function DashboardPage() {
  const { stats, categoryBreakdown, monthlyTrend, allTransactions } = useTransactions();

  return (
    <div className="space-y-6 transition-page">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-surface-900 dark:text-surface-50 tracking-tight">
            Dashboard
          </h1>
          <p className="text-sm text-surface-400 dark:text-surface-500 mt-0.5">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <AddButton />
        </div>
      </div>

      {/* Summary cards — always show (even at zero) */}
      <SummaryCards stats={stats} />

      {/* Charts or empty state */}
      {allTransactions.length === 0 ? (
        <div className="card">
          <EmptyState
            icon="📊"
            title="Your dashboard is empty"
            description="Add your first transaction to start seeing charts, spending breakdowns, and financial insights."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DonutChart data={categoryBreakdown} />
          <TrendChart data={monthlyTrend} />
        </div>
      )}
    </div>
  );
}

// ─── Transactions Page ────────────────────────────────────────────────────────

function TransactionsPage() {
  const [bulkMode, setBulkMode] = useState(false);

  return (
    <div className="space-y-6 transition-page">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-surface-900 dark:text-surface-50 tracking-tight">
            Transaction History
          </h1>
          <p className="text-sm text-surface-400 dark:text-surface-500 mt-0.5">
            All your income, expenses and transfers
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {/* Bulk entry toggle — visible on all screen sizes */}
          <button
            onClick={() => setBulkMode((b) => !b)}
            title={bulkMode ? 'Close bulk entry' : 'Quick bulk entry'}
            className={`
              flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-bold
              border transition-all duration-200 cursor-pointer
              ${bulkMode
                ? 'bg-violet-600 text-white border-violet-500 shadow-lg shadow-violet-500/30'
                : 'bg-white/60 dark:bg-surface-800/60 text-surface-600 dark:text-surface-300 border-white/50 dark:border-surface-600/30 hover:bg-white/90 dark:hover:bg-surface-700/80'
              }
            `}
          >
            <Zap size={15} className={bulkMode ? 'text-white' : 'text-violet-500'} />
            <span className="hidden sm:inline">{bulkMode ? 'Close Bulk Entry' : 'Bulk Entry'}</span>
          </button>
          <AddButton />
        </div>
      </div>

      {/* Bulk entry panel */}
      {bulkMode && (
        <BulkEntryPanel onClose={() => setBulkMode(false)} />
      )}

      <TransactionList />
    </div>
  );
}

// ─── Add Button ──────────────────────────────────────────────────────────────

function AddButton() {
  const { dispatch } = useApp();
  return (
    <button onClick={() => dispatch({ type: 'OPEN_FORM' })} className="btn-primary hidden md:flex">
      + Add Transaction
    </button>
  );
}

import LoginPage from './components/auth/LoginPage';
import { useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';

// ─── Authenticated App Shell (only mounts AFTER login) ───────────────────────

function AuthenticatedApp() {
  const { state } = useApp();
  const { activePage, apiStatus, isLoadingData } = state.ui;

  if (isLoadingData) return <LoadingScreen />;

  return (
    <div className="flex min-h-screen relative z-0">
      {/* API status banner — shows when offline/connecting/error */}
        <ApiStatusBanner status={apiStatus} />

        {/* Desktop sidebar */}
        <Sidebar />

        {/* Main content — push down when banner is visible */}
        <main className={`
          flex-1 p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 overflow-x-hidden
          ${apiStatus !== 'online' ? 'pt-12 sm:pt-14' : ''}
        `}>
        <div className="max-w-5xl mx-auto">
          {activePage === 'dashboard'    && <DashboardPage />}
          {activePage === 'transactions' && <TransactionsPage />}
          {activePage === 'settings'     && <SettingsPage />}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <MobileBottomNav />

      {/* Global transaction form modal */}
      <TransactionForm />

      {/* Toast notifications */}
      <Toast />
    </div>
  );
}

// ─── App Root (handles auth gate) ────────────────────────────────────────────

export default function App() {
  const { isAuthenticated, isLoadingAuth } = useAuth();

  return (
    <>
      {/* Global Animated Mesh Background */}
      <div className="mesh-bg">
        <div className="mesh-blob blob-1" />
        <div className="mesh-blob blob-2" />
        <div className="mesh-blob blob-3" />
      </div>

      <div className="relative z-0">
        {isLoadingAuth ? (
          <LoadingScreen />
        ) : !isAuthenticated ? (
          <LoginPage />
        ) : (
          <AppProvider>
            <AuthenticatedApp />
          </AppProvider>
        )}
      </div>
    </>
  );
}
