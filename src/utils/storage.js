/**
 * storage.js — localStorage persistence helpers
 */

const STORAGE_KEY = 'finflow_v2';

/** Load the full app state from localStorage */
export const loadState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

/** Save the full app state to localStorage */
export const saveState = (state) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.warn('Failed to save to localStorage:', err);
  }
};

/** Clear all persisted data */
export const clearState = () => {
  localStorage.removeItem(STORAGE_KEY);
};
