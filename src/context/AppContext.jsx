/**
 * AppContext.jsx — Global state with MongoDB-backed persistence
 *
 * Strategy: OPTIMISTIC UI
 * 1. Update React state immediately (instant UI feel)
 * 2. Persist to localStorage cache immediately
 * 3. Sync to MongoDB in the background
 * 4. On API error → revert state + show error toast
 *
 * On load:
 * 1. Try to GET /api/transactions from MongoDB
 * 2. If offline/error → load from localStorage cache
 */
import { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { loadState, saveState } from '../utils/storage';
import { toLocalISO } from '../utils/dates';
import { toBaseINR } from '../utils/money';
import * as api from '../services/api';

// ─── Initial State ─────────────────────────────────────────────────────────

const initialState = {
  transactions: [],
  settings: {
    baseCurrency: 'INR',
    theme: 'dark',
  },
  ui: {
    activePage:          'dashboard',
    isFormOpen:          false,
    isBulkOpen:          false,
    editingTransaction:  null,
    toast:               null,
    // API connection status: 'connecting' | 'online' | 'offline' | 'error'
    apiStatus:           'connecting',
    isLoadingData:       true,
  },
};

// ─── Reducer ───────────────────────────────────────────────────────────────

function reducer(state, action) {
  switch (action.type) {
    case 'SET_TRANSACTIONS':
      return { ...state, transactions: action.payload };

    case 'ADD_TRANSACTION':
      return { ...state, transactions: [action.payload, ...state.transactions] };

    case 'UPDATE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.map((t) =>
          t.id === action.payload.id ? action.payload : t
        ),
      };

    case 'DELETE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.filter((t) => t.id !== action.payload),
      };

    // Revert optimistic update on API error
    case 'REVERT_TRANSACTIONS':
      return { ...state, transactions: action.payload };

    case 'IMPORT_TRANSACTIONS': {
      const existingIds = new Set(state.transactions.map((t) => t.id));
      const newOnes = action.payload.filter((t) => !existingIds.has(t.id));
      return { ...state, transactions: [...newOnes, ...state.transactions] };
    }

    case 'CLEAR_ALL_TRANSACTIONS':
      return { ...state, transactions: [] };

    case 'SET_PAGE':
      return { ...state, ui: { ...state.ui, activePage: action.payload } };

    case 'OPEN_FORM':
      return { ...state, ui: { ...state.ui, isFormOpen: true, isBulkOpen: false, editingTransaction: action.payload ?? null } };

    case 'CLOSE_FORM':
      return { ...state, ui: { ...state.ui, isFormOpen: false, editingTransaction: null } };

    case 'OPEN_BULK':
      return { ...state, ui: { ...state.ui, isBulkOpen: true, activePage: 'transactions' } };

    case 'CLOSE_BULK':
      return { ...state, ui: { ...state.ui, isBulkOpen: false } };

    case 'SHOW_TOAST':
      return { ...state, ui: { ...state.ui, toast: { id: Date.now(), ...action.payload } } };

    case 'CLEAR_TOAST':
      return { ...state, ui: { ...state.ui, toast: null } };

    case 'SET_API_STATUS':
      return { ...state, ui: { ...state.ui, apiStatus: action.payload } };

    case 'SET_LOADING':
      return { ...state, ui: { ...state.ui, isLoadingData: action.payload } };

    case 'TOGGLE_THEME': {
      const newTheme = state.settings.theme === 'dark' ? 'light' : 'dark';
      return { ...state, settings: { ...state.settings, theme: newTheme } };
    }

    case 'SET_THEME':
      return { ...state, settings: { ...state.settings, theme: action.payload } };

    case 'LOAD_STATE':
      return { ...state, ...action.payload };

    default:
      return state;
  }
}

// ─── Context ───────────────────────────────────────────────────────────────

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState, (init) => {
    const saved = loadState();
    if (!saved) return init;
    return {
      ...init,
      ...saved,
      ui: { ...init.ui, ...(saved.ui ?? {}), isFormOpen: false, toast: null, apiStatus: 'connecting', isLoadingData: true },
    };
  });

  // Keep a ref to current transactions for optimistic revert
  const txnSnapshot = useRef(state.transactions);
  useEffect(() => { txnSnapshot.current = state.transactions; }, [state.transactions]);

  // ── Sync <html class="dark"> with theme ──────────────────────────────────
  useEffect(() => {
    document.documentElement.classList.toggle('dark', state.settings.theme === 'dark');
  }, [state.settings.theme]);

  // ── Persist to localStorage on every meaningful state change ─────────────
  useEffect(() => {
    const { ui, ...rest } = state;
    saveState({ ...rest, ui: { activePage: ui.activePage } });
  }, [state]);

  // ── Initial data load from MongoDB ────────────────────────────────────────
  useEffect(() => {
    const initLoad = async () => {
      dispatch({ type: 'SET_API_STATUS', payload: 'connecting' });
      dispatch({ type: 'SET_LOADING',    payload: true });
      try {
        const result = await api.fetchTransactions();
        dispatch({ type: 'SET_TRANSACTIONS', payload: result.data ?? [] });
        dispatch({ type: 'SET_API_STATUS',   payload: 'online' });
      } catch (err) {
        console.warn('API unavailable, using localStorage cache:', err.message);
        dispatch({ type: 'SET_API_STATUS', payload: 'offline' });
        // State already loaded from localStorage in the reducer initialiser
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initLoad();
  }, []); // runs once on mount

  // ── Helper: build transaction object ──────────────────────────────────────
  const buildTxn = useCallback((data, existingId) => {
    const id = existingId ?? `txn_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const baseAmount = data.currency && data.currency !== 'INR'
      ? toBaseINR(data.amount, data.currency)
      : data.amount;
    return {
      id,
      amount:              baseAmount,
      originalAmount:      data.amount,
      currency:            data.currency ?? 'INR',
      type:                data.type,
      category:            data.category,
      paymentMethod:       data.paymentMethod,
      description:         data.description,
      tags:                data.tags ?? [],
      notes:               data.notes ?? '',
      date:                data.date ?? toLocalISO(),
      linkedTransactionId: data.linkedTransactionId ?? null,
    };
  }, []);

  // ── Action: Add transaction ────────────────────────────────────────────────
  const addTransaction = useCallback(async (data) => {
    const txn = buildTxn(data, null);

    // 1. Optimistic update
    dispatch({ type: 'ADD_TRANSACTION', payload: txn });
    dispatch({ type: 'SHOW_TOAST', payload: { message: 'Transaction saved!', type: 'success' } });

    // 2. Sync to MongoDB in background
    if (state.ui.apiStatus !== 'offline') {
      try {
        await api.createTransaction(txn);
      } catch (err) {
        console.error('Failed to sync new transaction to MongoDB:', err);
        // Revert: remove the optimistically added item
        dispatch({ type: 'REVERT_TRANSACTIONS', payload: txnSnapshot.current.filter((t) => t.id !== txn.id) });
        dispatch({ type: 'SHOW_TOAST', payload: { message: 'Saved locally (DB sync failed)', type: 'error' } });
      }
    }
  }, [buildTxn, state.ui.apiStatus]);

  // ── Action: Update transaction ─────────────────────────────────────────────
  const updateTransaction = useCallback(async (data) => {
    const txn = buildTxn(data, data.id);
    const prev = txnSnapshot.current.find((t) => t.id === data.id);

    // 1. Optimistic update
    dispatch({ type: 'UPDATE_TRANSACTION', payload: txn });
    dispatch({ type: 'SHOW_TOAST', payload: { message: 'Transaction updated!', type: 'success' } });

    // 2. Sync to MongoDB
    if (state.ui.apiStatus !== 'offline') {
      try {
        await api.updateTransaction(txn.id, txn);
      } catch (err) {
        console.error('Failed to sync update to MongoDB:', err);
        // Revert to previous
        if (prev) dispatch({ type: 'UPDATE_TRANSACTION', payload: prev });
        dispatch({ type: 'SHOW_TOAST', payload: { message: 'Update failed to sync to DB', type: 'error' } });
      }
    }
  }, [buildTxn, state.ui.apiStatus]);

  // ── Action: Delete transaction ─────────────────────────────────────────────
  const deleteTransaction = useCallback(async (id) => {
    const prev = txnSnapshot.current;

    // 1. Optimistic delete
    dispatch({ type: 'DELETE_TRANSACTION', payload: id });
    dispatch({ type: 'SHOW_TOAST', payload: { message: 'Transaction deleted', type: 'info' } });

    // 2. Sync to MongoDB
    if (state.ui.apiStatus !== 'offline') {
      try {
        await api.deleteTransaction(id);
      } catch (err) {
        console.error('Failed to sync delete to MongoDB:', err);
        // Revert
        dispatch({ type: 'REVERT_TRANSACTIONS', payload: prev });
        dispatch({ type: 'SHOW_TOAST', payload: { message: 'Delete failed to sync to DB', type: 'error' } });
      }
    }
  }, [state.ui.apiStatus]);

  // ── Action: Import transactions ────────────────────────────────────────────
  const importTransactions = useCallback(async (txns) => {
    dispatch({ type: 'IMPORT_TRANSACTIONS', payload: txns });
    dispatch({ type: 'SHOW_TOAST', payload: { message: `Imported ${txns.length} transactions`, type: 'success' } });

    // Sync each to MongoDB in parallel (fire-and-forget)
    if (state.ui.apiStatus !== 'offline') {
      for (const txn of txns) {
        api.createTransaction(txn).catch((err) =>
          console.warn(`Failed to sync imported txn ${txn.id}:`, err.message)
        );
      }
    }
  }, [state.ui.apiStatus]);

  // ── Action: Clear all ──────────────────────────────────────────────────────
  const clearAllData = useCallback(async () => {
    const prev = txnSnapshot.current;
    dispatch({ type: 'CLEAR_ALL_TRANSACTIONS' });
    dispatch({ type: 'SHOW_TOAST', payload: { message: 'All data cleared', type: 'info' } });

    if (state.ui.apiStatus !== 'offline') {
      try {
        await api.clearAllTransactions();
      } catch (err) {
        console.error('Failed to clear DB:', err);
        dispatch({ type: 'REVERT_TRANSACTIONS', payload: prev });
        dispatch({ type: 'SHOW_TOAST', payload: { message: 'Clear failed on DB', type: 'error' } });
      }
    }
  }, [state.ui.apiStatus]);

  // ── Theme sync to DB ───────────────────────────────────────────────────────
  useEffect(() => {
    if (state.ui.apiStatus === 'online') {
      api.saveSettings({ theme: state.settings.theme, baseCurrency: state.settings.baseCurrency })
        .catch(() => {}); // fire-and-forget, non-critical
    }
  }, [state.settings.theme, state.settings.baseCurrency, state.ui.apiStatus]);

  const showToast = useCallback((message, type = 'info') => {
    dispatch({ type: 'SHOW_TOAST', payload: { message, type } });
  }, []);

  const clearToast = useCallback(() => dispatch({ type: 'CLEAR_TOAST' }), []);

  const value = {
    state,
    dispatch,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    importTransactions,
    clearAllData,
    showToast,
    clearToast,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
