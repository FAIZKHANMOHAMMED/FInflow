/** categories.js — All transaction categories and payment methods */

export const CATEGORIES = {
  expense: [
    { id: 'food',          label: 'Food & Dining',    icon: '🍔', color: '#f59e0b' },
    { id: 'grocery',       label: 'Groceries',         icon: '🛒', color: '#84cc16' },
    { id: 'transport',     label: 'Transport',          icon: '🚗', color: '#3b82f6' },
    { id: 'rent',          label: 'Rent & Housing',    icon: '🏠', color: '#64748b' },
    { id: 'utilities',     label: 'Utilities & Bills', icon: '💡', color: '#ef4444' },
    { id: 'entertainment', label: 'Entertainment',      icon: '🎮', color: '#8b5cf6' },
    { id: 'shopping',      label: 'Shopping',           icon: '🛍️', color: '#ec4899' },
    { id: 'health',        label: 'Health & Medical',  icon: '💊', color: '#10b981' },
    { id: 'education',     label: 'Education',          icon: '📚', color: '#06b6d4' },
    { id: 'travel',        label: 'Travel',             icon: '✈️', color: '#f97316' },
    { id: 'subscriptions', label: 'Subscriptions',      icon: '📱', color: '#a855f7' },
    { id: 'insurance',     label: 'Insurance',          icon: '🛡️', color: '#0ea5e9' },
    { id: 'investment',    label: 'Investments',        icon: '📈', color: '#22c55e' },
    { id: 'personal_care', label: 'Personal Care',      icon: '🧴', color: '#f472b6' },
    { id: 'general',       label: 'General / Other',   icon: '⚙️', color: '#78716c' },
    { id: 'other_exp',     label: 'Other Expense',     icon: '📦', color: '#94a3b8' },
  ],
  income: [
    { id: 'salary',        label: 'Salary',             icon: '💼', color: '#10b981' },
    { id: 'freelance',     label: 'Freelance',          icon: '💻', color: '#3b82f6' },
    { id: 'business',      label: 'Business',           icon: '🏪', color: '#f59e0b' },
    { id: 'investment_inc',label: 'Investment Return',  icon: '📊', color: '#22c55e' },
    { id: 'rental',        label: 'Rental Income',     icon: '🏘️', color: '#6366f1' },
    { id: 'gift_inc',      label: 'Gift Received',     icon: '🎁', color: '#ec4899' },
    { id: 'refund',        label: 'Refund',             icon: '↩️', color: '#06b6d4' },
    { id: 'other_inc',     label: 'Other Income',      icon: '💰', color: '#84cc16' },
  ],
  transfer: [
    { id: 'savings',       label: 'To Savings',         icon: '🏦', color: '#6366f1' },
    { id: 'investment_tr', label: 'To Investment',      icon: '📈', color: '#22c55e' },
    { id: 'family',        label: 'Family Transfer',   icon: '👨‍👩‍👧', color: '#f97316' },
    { id: 'other_tr',      label: 'Other Transfer',    icon: '🔄', color: '#94a3b8' },
  ],
};

export const ALL_CATEGORIES = [
  ...CATEGORIES.expense,
  ...CATEGORIES.income,
  ...CATEGORIES.transfer,
];

export const getCategoryById = (id) => {
  const normId = id === 'groceries' ? 'grocery' : id;
  return ALL_CATEGORIES.find((c) => c.id === normId) ?? { id, label: id, icon: '📦', color: '#94a3b8' };
};

export const PAYMENT_METHODS = [
  { id: 'cash',       label: 'Cash',         icon: '💵' },
  { id: 'upi',        label: 'UPI',          icon: '📲' },
  { id: 'credit',     label: 'Credit Card',  icon: '💳' },
  { id: 'debit',      label: 'Debit Card',   icon: '🏧' },
  { id: 'bank',       label: 'Bank Transfer',icon: '🏦' },
  { id: 'wallet',     label: 'Wallet',       icon: '👛' },
  { id: 'netbanking', label: 'Net Banking',  icon: '🌐' },
];

export const PRESET_TAGS = ['refund', 'reversal', 'recurring', 'tax', 'reimbursable', 'business', 'personal'];
