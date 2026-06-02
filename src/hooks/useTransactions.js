/**
 * useTransactions.js — Derived data: filtering, sorting, grouping, pagination, and stats
 * All heavy computation is memoised with useMemo.
 */
import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { parseLocalISO, datePart, todayDateString } from '../utils/dates';
import { safeAdd } from '../utils/money';
import { getCategoryById } from '../utils/categories';

export const PAGE_SIZE = 20;

export const DEFAULT_FILTERS = {
  search:        '',
  type:          'all',
  category:      'all',
  paymentMethod: 'all',
  dateFrom:      '',
  dateTo:        '',
  amountMin:     '',
  amountMax:     '',
  sortBy:        'date_desc',
};

export function useTransactions() {
  const { state } = useApp();
  const { transactions } = state;

  const [filters, setFilters]  = useState(DEFAULT_FILTERS);
  const [currentPage, setPage] = useState(1);

  // ── Apply all filters + sorting ──────────────────────────────────────────
  const filtered = useMemo(() => {
    let result = [...transactions];

    if (filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      result = result.filter((t) =>
        (t.description ?? '').toLowerCase().includes(q) ||
        (t.notes ?? '').toLowerCase().includes(q) ||
        (t.tags ?? []).some((tag) => tag.toLowerCase().includes(q)) ||
        String(t.amount).includes(q)
      );
    }

    if (filters.type !== 'all')          result = result.filter((t) => t.type          === filters.type);
    if (filters.category !== 'all')      result = result.filter((t) => t.category      === filters.category);
    if (filters.paymentMethod !== 'all') result = result.filter((t) => t.paymentMethod === filters.paymentMethod);

    if (filters.dateFrom) {
      const from = parseLocalISO(filters.dateFrom);
      result = result.filter((t) => parseLocalISO(t.date) >= from);
    }
    if (filters.dateTo) {
      const to = parseLocalISO(filters.dateTo + 'T23:59:59');
      result = result.filter((t) => parseLocalISO(t.date) <= to);
    }
    if (filters.amountMin !== '') {
      const min = parseFloat(filters.amountMin);
      if (!isNaN(min)) result = result.filter((t) => t.amount >= min);
    }
    if (filters.amountMax !== '') {
      const max = parseFloat(filters.amountMax);
      if (!isNaN(max)) result = result.filter((t) => t.amount <= max);
    }

    result.sort((a, b) => {
      switch (filters.sortBy) {
        case 'date_asc':    return parseLocalISO(a.date) - parseLocalISO(b.date);
        case 'date_desc':   return parseLocalISO(b.date) - parseLocalISO(a.date);
        case 'amount_high': return b.amount - a.amount;
        case 'amount_low':  return a.amount - b.amount;
        default:            return parseLocalISO(b.date) - parseLocalISO(a.date);
      }
    });

    return result;
  }, [transactions, filters]);

  // ── Pagination ───────────────────────────────────────────────────────────
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, currentPage]);

  // ── Group by date ────────────────────────────────────────────────────────
  const grouped = useMemo(() => {
    const groups = {};
    for (const t of paged) {
      const key = datePart(t.date);
      if (!groups[key]) groups[key] = [];
      groups[key].push(t);
    }
    return Object.entries(groups)
      .sort(([a], [b]) => filters.sortBy === 'date_asc' ? a.localeCompare(b) : b.localeCompare(a))
      .map(([date, items]) => ({ date, items }));
  }, [paged, filters.sortBy]);

  // ── Single-day detection ─────────────────────────────────────────────────
  const isSingleDay = !!(
    filters.dateFrom && filters.dateTo && filters.dateFrom === filters.dateTo
  );

  // ── Day Analytics — computed when a single date is selected ──────────────
  const dayAnalytics = useMemo(() => {
    if (!isSingleDay) return null;

    let income = 0, expense = 0, transfers = 0;
    const categoryMap = {};
    const methodMap   = {};
    const hourlyMap   = {};

    for (const t of filtered) {
      if (t.type === 'income')   income    = safeAdd(income,    t.amount);
      if (t.type === 'expense')  expense   = safeAdd(expense,   t.amount);
      if (t.type === 'transfer') transfers = safeAdd(transfers, t.amount);

      categoryMap[t.category]     = safeAdd(categoryMap[t.category]     ?? 0, t.amount);
      methodMap[t.paymentMethod]  = safeAdd(methodMap[t.paymentMethod]  ?? 0, t.amount);

      const hour = parseLocalISO(t.date).getHours();
      if (!hourlyMap[hour]) hourlyMap[hour] = { income: 0, expense: 0, count: 0 };
      if (t.type === 'income')  hourlyMap[hour].income  = safeAdd(hourlyMap[hour].income,  t.amount);
      if (t.type === 'expense') hourlyMap[hour].expense = safeAdd(hourlyMap[hour].expense, t.amount);
      hourlyMap[hour].count++;
    }

    const categoryBreakdown = Object.entries(categoryMap)
      .map(([category, amount]) => {
        const cat = getCategoryById(category);
        return { category, label: cat.label, icon: cat.icon, color: cat.color, amount };
      })
      .sort((a, b) => b.amount - a.amount);

    const methodBreakdown = Object.entries(methodMap)
      .map(([method, amount]) => ({ method, amount }))
      .sort((a, b) => b.amount - a.amount);

    // Full 24-hour array for the activity chart
    const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      label: hour === 0 ? '12a' : hour < 12 ? `${hour}a` : hour === 12 ? '12p' : `${hour - 12}p`,
      income:  hourlyMap[hour]?.income  ?? 0,
      expense: hourlyMap[hour]?.expense ?? 0,
      count:   hourlyMap[hour]?.count   ?? 0,
    }));

    return {
      income,
      expense,
      transfers,
      net: safeAdd(income, -expense),
      count: filtered.length,
      categoryBreakdown,
      methodBreakdown,
      hourlyData,
      savingsRate: income > 0
        ? Math.max(0, Math.round(((income - expense) / income) * 100))
        : 0,
    };
  }, [filtered, isSingleDay]);

  // ── All-time aggregate stats (for dashboard cards) ────────────────────────
  const stats = useMemo(() => {
    let totalIncome = 0, totalExpense = 0;
    const currentMonth = new Date().getMonth();
    const currentYear  = new Date().getFullYear();
    let monthIncome = 0, monthExpense = 0;

    for (const t of transactions) {
      if (t.type === 'income')  totalIncome  = safeAdd(totalIncome,  t.amount);
      if (t.type === 'expense') totalExpense = safeAdd(totalExpense, t.amount);

      const d = parseLocalISO(t.date);
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
        if (t.type === 'income')  monthIncome  = safeAdd(monthIncome,  t.amount);
        if (t.type === 'expense') monthExpense = safeAdd(monthExpense, t.amount);
      }
    }

    return {
      totalBalance:  safeAdd(totalIncome, -totalExpense),
      totalIncome,
      totalExpense,
      monthIncome,
      monthExpense,
      monthBalance:  safeAdd(monthIncome, -monthExpense),
      savingsRate: totalIncome > 0
        ? Math.max(0, Math.round(((totalIncome - totalExpense) / totalIncome) * 100))
        : 0,
    };
  }, [transactions]);

  // ── Category breakdown (all-time, for dashboard donut) ───────────────────
  const categoryBreakdown = useMemo(() => {
    const map = {};
    for (const t of transactions) {
      if (t.type !== 'expense') continue;
      map[t.category] = safeAdd(map[t.category] ?? 0, t.amount);
    }
    return Object.entries(map)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [transactions]);

  // ── Monthly trend (last 6 months, for dashboard bar chart) ───────────────
  const monthlyTrend = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - i);
      const y = d.getFullYear();
      const m = d.getMonth();
      const label = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
      let income = 0, expense = 0;
      for (const t of transactions) {
        const td = parseLocalISO(t.date);
        if (td.getFullYear() === y && td.getMonth() === m) {
          if (t.type === 'income')  income  = safeAdd(income,  t.amount);
          if (t.type === 'expense') expense = safeAdd(expense, t.amount);
        }
      }
      months.push({ label, income, expense, net: safeAdd(income, -expense) });
    }
    return months;
  }, [transactions]);

  // ── Filter helpers ────────────────────────────────────────────────────────
  const resetFilters = () => { setFilters(DEFAULT_FILTERS); setPage(1); };
  const updateFilter = (key, value) => { setFilters((f) => ({ ...f, [key]: value })); setPage(1); };

  const setDateQuick = (preset) => {
    const today     = todayDateString();
    const pad = (n) => String(n).padStart(2, '0');
    const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;

    const yd = new Date(); yd.setDate(yd.getDate() - 1);
    const ws = new Date(); ws.setDate(ws.getDate() - ws.getDay());
    const ms = new Date(); ms.setDate(1);

    const ranges = {
      today:     { dateFrom: today,   dateTo: today },
      yesterday: { dateFrom: fmt(yd), dateTo: fmt(yd) },
      week:      { dateFrom: fmt(ws), dateTo: today },
      month:     { dateFrom: fmt(ms), dateTo: today },
    };
    const range = ranges[preset];
    if (range) { setFilters((f) => ({ ...f, ...range })); setPage(1); }
  };

  return {
    allTransactions: transactions,
    filtered,
    grouped,
    stats,
    categoryBreakdown,
    monthlyTrend,
    currentPage,
    totalPages,
    setPage,
    totalFiltered: filtered.length,
    filters,
    updateFilter,
    resetFilters,
    setDateQuick,
    isSingleDay,
    dayAnalytics,
  };
}
