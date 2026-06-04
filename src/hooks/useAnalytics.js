/**
 * useAnalytics.js
 * Three independent filter states (daily / weekly / monthly) with
 * fully memoised derived data for each period.
 */
import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { parseLocalISO, todayDateString } from '../utils/dates';
import { safeAdd } from '../utils/money';
import { getCategoryById } from '../utils/categories';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const pad = (n) => String(n).padStart(2, '0');
const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Monday of the ISO week that contains `date` */
function getWeekMonday(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();                // 0=Sun … 6=Sat
  const diff = day === 0 ? -6 : 1 - day; // shift so Mon=0
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Sunday that closes the ISO week starting at `monday` */
function getWeekSunday(monday) {
  const d = new Date(monday);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
}

/** "Jun 2 – Jun 8, 2026" style label */
function weekLabel(monday) {
  const sunday = getWeekSunday(monday);
  const opts = { month: 'short', day: 'numeric' };
  const start = monday.toLocaleDateString('en-IN', opts);
  const end   = sunday.toLocaleDateString('en-IN', { ...opts, year: 'numeric' });
  return `${start} – ${end}`;
}

/** Filter transactions by a date-range string pair */
function filterByRange(txns, fromStr, toStr) {
  const from = parseLocalISO(fromStr);
  const to   = parseLocalISO(toStr + 'T23:59:59');
  return txns.filter((t) => {
    const d = parseLocalISO(t.date);
    return d >= from && d <= to;
  });
}

/** Apply type / category / paymentMethod / amount filters */
function applyCommon(txns, { type, category, paymentMethod, minAmount, maxAmount }) {
  let r = txns;
  if (type          && type          !== 'all') r = r.filter((t) => t.type          === type);
  if (category      && category      !== 'all') r = r.filter((t) => t.category      === category);
  if (paymentMethod && paymentMethod !== 'all') r = r.filter((t) => t.paymentMethod === paymentMethod);
  if (minAmount !== '' && minAmount != null) {
    const min = parseFloat(minAmount);
    if (!isNaN(min)) r = r.filter((t) => t.amount >= min);
  }
  if (maxAmount !== '' && maxAmount != null) {
    const max = parseFloat(maxAmount);
    if (!isNaN(max)) r = r.filter((t) => t.amount <= max);
  }
  return r;
}

/** Build category breakdown from a filtered set */
function buildCategoryBreakdown(txns) {
  const map = {};
  for (const t of txns) {
    if (t.type === 'transfer') continue;
    map[t.category] = safeAdd(map[t.category] ?? 0, t.type === 'expense' ? t.amount : t.amount);
  }
  return Object.entries(map)
    .map(([category, amount]) => {
      const cat = getCategoryById(category);
      return { category, label: cat.label, icon: cat.icon, color: cat.color, amount };
    })
    .sort((a, b) => b.amount - a.amount);
}

/** Build payment-method breakdown */
function buildMethodBreakdown(txns) {
  const map = {};
  for (const t of txns) {
    map[t.paymentMethod] = safeAdd(map[t.paymentMethod] ?? 0, t.amount);
  }
  const total = Object.values(map).reduce((s, v) => s + v, 0);
  return Object.entries(map)
    .map(([method, amount]) => ({ method, amount, pct: total > 0 ? (amount / total) * 100 : 0 }))
    .sort((a, b) => b.amount - a.amount);
}

/** Build summary KPI object */
function buildSummary(txns) {
  let income = 0, expense = 0, transfers = 0;
  for (const t of txns) {
    if (t.type === 'income')   income    = safeAdd(income,    t.amount);
    if (t.type === 'expense')  expense   = safeAdd(expense,   t.amount);
    if (t.type === 'transfer') transfers = safeAdd(transfers, t.amount);
  }
  const net         = safeAdd(income, -expense);
  const savingsRate = income > 0 ? Math.max(0, Math.round(((income - expense) / income) * 100)) : 0;
  return { income, expense, net, transfers, savingsRate, count: txns.length };
}

/** Top N transactions by amount */
function topTxns(txns, n = 5) {
  return [...txns].sort((a, b) => b.amount - a.amount).slice(0, n);
}

// ─── Default filter states ────────────────────────────────────────────────────

function defaultDailyFilters() {
  return { date: todayDateString(), type: 'all', category: 'all', paymentMethod: 'all' };
}

function defaultWeeklyFilters() {
  return { weekStart: fmt(getWeekMonday()), type: 'all', category: 'all', paymentMethod: 'all' };
}

function defaultMonthlyFilters() {
  const now = new Date();
  return {
    year:          now.getFullYear(),
    month:         now.getMonth() + 1, // 1-indexed
    type:          'all',
    category:      'all',
    paymentMethod: 'all',
    minAmount:     '',
    maxAmount:     '',
  };
}

// ─── Main hook ────────────────────────────────────────────────────────────────

export function useAnalytics() {
  const { state } = useApp();
  const { transactions } = state;

  // ── Three independent filter states ─────────────────────────────────────────
  const [dailyFilters,   setDailyFilters]   = useState(defaultDailyFilters);
  const [weeklyFilters,  setWeeklyFilters]  = useState(defaultWeeklyFilters);
  const [monthlyFilters, setMonthlyFilters] = useState(defaultMonthlyFilters);

  // ── DAILY ────────────────────────────────────────────────────────────────────
  const dailyData = useMemo(() => {
    const { date } = dailyFilters;
    if (!date) return null;

    const inDay  = filterByRange(transactions, date, date);
    const common = applyCommon(inDay, dailyFilters);

    const summary           = buildSummary(common);
    const categoryBreakdown = buildCategoryBreakdown(common);
    const methodBreakdown   = buildMethodBreakdown(common);
    const top               = topTxns(common);

    // Hourly trend — 24 buckets
    const hourlyMap = {};
    for (const t of common) {
      const h = parseLocalISO(t.date).getHours();
      if (!hourlyMap[h]) hourlyMap[h] = { income: 0, expense: 0, count: 0 };
      if (t.type === 'income')  hourlyMap[h].income  = safeAdd(hourlyMap[h].income,  t.amount);
      if (t.type === 'expense') hourlyMap[h].expense = safeAdd(hourlyMap[h].expense, t.amount);
      hourlyMap[h].count++;
    }
    const trend = Array.from({ length: 24 }, (_, h) => ({
      label:   h === 0 ? '12a' : h < 12 ? `${h}a` : h === 12 ? '12p' : `${h - 12}p`,
      income:  hourlyMap[h]?.income  ?? 0,
      expense: hourlyMap[h]?.expense ?? 0,
      count:   hourlyMap[h]?.count   ?? 0,
    }));

    return { summary, categoryBreakdown, methodBreakdown, trend, top, trendLabel: 'Hourly Activity' };
  }, [transactions, dailyFilters]);

  // ── WEEKLY ───────────────────────────────────────────────────────────────────
  const weeklyData = useMemo(() => {
    const monday = parseLocalISO(weeklyFilters.weekStart);
    const sunday = getWeekSunday(monday);
    const fromStr = fmt(monday);
    const toStr   = fmt(sunday);

    const inWeek = filterByRange(transactions, fromStr, toStr);
    const common = applyCommon(inWeek, weeklyFilters);

    const summary           = buildSummary(common);
    const categoryBreakdown = buildCategoryBreakdown(common);
    const methodBreakdown   = buildMethodBreakdown(common);
    const top               = topTxns(common);

    // Day-by-day trend (Mon–Sun)
    const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dayMap = {};
    for (const t of common) {
      const d = parseLocalISO(t.date);
      const dayIdx = (d.getDay() + 6) % 7; // 0=Mon … 6=Sun
      if (!dayMap[dayIdx]) dayMap[dayIdx] = { income: 0, expense: 0 };
      if (t.type === 'income')  dayMap[dayIdx].income  = safeAdd(dayMap[dayIdx].income,  t.amount);
      if (t.type === 'expense') dayMap[dayIdx].expense = safeAdd(dayMap[dayIdx].expense, t.amount);
    }
    const trend = DAY_LABELS.map((label, i) => ({
      label,
      income:  dayMap[i]?.income  ?? 0,
      expense: dayMap[i]?.expense ?? 0,
    }));

    return {
      summary, categoryBreakdown, methodBreakdown, trend, top,
      trendLabel: 'Daily Activity',
      weekLabel: weekLabel(monday),
    };
  }, [transactions, weeklyFilters]);

  // ── MONTHLY ──────────────────────────────────────────────────────────────────
  const monthlyData = useMemo(() => {
    const { year, month } = monthlyFilters;
    const firstDay = new Date(year, month - 1, 1);
    const lastDay  = new Date(year, month,     0); // day 0 of next month = last of current
    const fromStr  = fmt(firstDay);
    const toStr    = fmt(lastDay);

    const inMonth = filterByRange(transactions, fromStr, toStr);
    const common  = applyCommon(inMonth, monthlyFilters);

    const summary           = buildSummary(common);
    const categoryBreakdown = buildCategoryBreakdown(common);
    const methodBreakdown   = buildMethodBreakdown(common);
    const top               = topTxns(common);

    // Week-by-week trend (W1–W5)
    const weekMap = {};
    for (const t of common) {
      const d     = parseLocalISO(t.date);
      const wIdx  = Math.floor((d.getDate() - 1) / 7); // 0-indexed week in month
      const wKey  = `W${wIdx + 1}`;
      if (!weekMap[wKey]) weekMap[wKey] = { income: 0, expense: 0 };
      if (t.type === 'income')  weekMap[wKey].income  = safeAdd(weekMap[wKey].income,  t.amount);
      if (t.type === 'expense') weekMap[wKey].expense = safeAdd(weekMap[wKey].expense, t.amount);
    }
    // Determine actual weeks in the month
    const daysInMonth  = lastDay.getDate();
    const weeksCount   = Math.ceil(daysInMonth / 7);
    const trend = Array.from({ length: weeksCount }, (_, i) => {
      const wKey = `W${i + 1}`;
      return { label: wKey, income: weekMap[wKey]?.income ?? 0, expense: weekMap[wKey]?.expense ?? 0 };
    });

    const monthName = firstDay.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

    return {
      summary, categoryBreakdown, methodBreakdown, trend, top,
      trendLabel: 'Week-by-Week Activity',
      monthName,
    };
  }, [transactions, monthlyFilters]);

  // ── Filter update helpers ─────────────────────────────────────────────────────
  const updateDailyFilter   = (key, value) => setDailyFilters((f)   => ({ ...f, [key]: value }));
  const updateWeeklyFilter  = (key, value) => setWeeklyFilters((f)  => ({ ...f, [key]: value }));
  const updateMonthlyFilter = (key, value) => setMonthlyFilters((f) => ({ ...f, [key]: value }));

  const resetDailyFilters   = () => setDailyFilters(defaultDailyFilters());
  const resetWeeklyFilters  = () => setWeeklyFilters(defaultWeeklyFilters());
  const resetMonthlyFilters = () => setMonthlyFilters(defaultMonthlyFilters());

  // ── Week navigation helpers ───────────────────────────────────────────────────
  const prevWeek = () => {
    const d = parseLocalISO(weeklyFilters.weekStart);
    d.setDate(d.getDate() - 7);
    setWeeklyFilters((f) => ({ ...f, weekStart: fmt(d) }));
  };
  const nextWeek = () => {
    const d = parseLocalISO(weeklyFilters.weekStart);
    d.setDate(d.getDate() + 7);
    setWeeklyFilters((f) => ({ ...f, weekStart: fmt(d) }));
  };

  return {
    // Daily
    dailyFilters,
    updateDailyFilter,
    resetDailyFilters,
    dailyData,

    // Weekly
    weeklyFilters,
    updateWeeklyFilter,
    resetWeeklyFilters,
    weeklyData,
    prevWeek,
    nextWeek,

    // Monthly
    monthlyFilters,
    updateMonthlyFilter,
    resetMonthlyFilters,
    monthlyData,
  };
}
