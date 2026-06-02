/**
 * src/services/api.js
 * Thin, typed fetch wrapper for all backend API calls.
 * All methods throw on HTTP errors so callers can catch and show toasts.
 */

const BASE = '/api'; // Vite proxy forwards /api → http://localhost:5000

// ─── Helper: fetch + parse JSON, throw on non-2xx ─────────────────────────
async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
    ...options,
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    const msg = json?.error ?? `HTTP ${res.status}: ${res.statusText}`;
    throw new Error(msg);
  }

  return json;
}

// ─── Health ────────────────────────────────────────────────────────────────
export const healthCheck = () => request('/health');

// ─── Transactions ──────────────────────────────────────────────────────────

/** Fetch all transactions (optionally filtered by query params) */
export const fetchTransactions = (params = {}) => {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v && v !== 'all')
  ).toString();
  return request(`/transactions${qs ? '?' + qs : ''}`);
};

/** Create a new transaction */
export const createTransaction = (data) =>
  request('/transactions', { method: 'POST', body: JSON.stringify(data) });

/** Update an existing transaction by clientId */
export const updateTransaction = (id, data) =>
  request(`/transactions/${id}`, { method: 'PUT', body: JSON.stringify(data) });

/** Delete a single transaction by clientId */
export const deleteTransaction = (id) =>
  request(`/transactions/${id}`, { method: 'DELETE' });

/** Delete ALL transactions */
export const clearAllTransactions = () =>
  request('/transactions', { method: 'DELETE' });

// ─── Settings ──────────────────────────────────────────────────────────────

export const fetchSettings = () => request('/settings');

export const saveSettings = (data) =>
  request('/settings', { method: 'PUT', body: JSON.stringify(data) });
