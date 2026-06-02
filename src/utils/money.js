/**
 * money.js — Safe floating-point monetary math for INR
 * All amounts stored as integer paise (1 INR = 100 paise) internally,
 * then divided by 100 for display. This eliminates 0.1 + 0.2 style errors.
 */

/** Convert a rupee float to integer paise (avoids float errors) */
export const toPaise = (amount) => Math.round(parseFloat(amount) * 100);

/** Convert paise back to rupee float, rounded to 2 decimal places */
export const fromPaise = (paise) => Math.round(paise) / 100;

/** Safe addition in paise */
export const safeAdd = (a, b) => fromPaise(toPaise(a) + toPaise(b));

/** Safe subtraction in paise */
export const safeSub = (a, b) => fromPaise(toPaise(a) - toPaise(b));

/** Safe multiplication (amount × rate) */
export const safeMul = (a, b) => fromPaise(Math.round(toPaise(a) * b));

/**
 * Format a number as Indian Rupee string
 * e.g. 125000 → "₹1,25,000.00"
 */
export const formatINR = (amount, opts = {}) => {
  const { showSign = false, compact = false } = opts;
  const abs = Math.abs(amount);
  const sign = showSign ? (amount >= 0 ? '+' : '−') : '';

  if (compact) {
    if (abs >= 1e7)  return `${sign}₹${(amount / 1e7).toFixed(2)}Cr`;
    if (abs >= 1e5)  return `${sign}₹${(amount / 1e5).toFixed(2)}L`;
    if (abs >= 1000) return `${sign}₹${(amount / 1000).toFixed(1)}K`;
  }

  return sign + new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/** Mock exchange rates — base is INR */
export const EXCHANGE_RATES = {
  INR: 1,
  USD: 83.5,
  EUR: 90.2,
  GBP: 105.4,
  JPY: 0.56,
  AED: 22.73,
  SGD: 61.8,
};

/** Convert foreign currency to INR base amount */
export const toBaseINR = (amount, currency) => {
  const rate = EXCHANGE_RATES[currency] ?? 1;
  return fromPaise(Math.round(toPaise(amount) * rate));
};

/** Currency symbols */
export const CURRENCY_SYMBOLS = {
  INR: '₹', USD: '$', EUR: '€', GBP: '£', JPY: '¥', AED: 'د.إ', SGD: 'S$',
};

/** Validate amount: must be positive, non-zero, finite float */
export const validateAmount = (raw) => {
  if (!raw && raw !== 0) return 'Amount is required';
  const n = parseFloat(raw);
  if (isNaN(n))   return 'Enter a valid number';
  if (n <= 0)     return 'Amount must be greater than zero';
  if (!isFinite(n)) return 'Amount is too large';
  if (toPaise(n) <= 0) return 'Amount must be greater than ₹0.00';
  return null; // valid
};
