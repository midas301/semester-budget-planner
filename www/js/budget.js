// budget.js: weekly budget maths. Needs data.js loaded first.

const WARN_AT = 0.8;   // alert when 80% of the weekly budget is used
const DAY_MS = 86400000;

function parseISO(iso) {
  const p = iso.split('-');
  return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
}

function addDays(iso, n) {
  const d = parseISO(iso);
  d.setDate(d.getDate() + n);
  return toISODate(d);
}

function daysBetween(fromISO, toISO) {
  return Math.round((parseISO(toISO) - parseISO(fromISO)) / DAY_MS);
}

function getWeeklyBudget(budget) {
  return Math.round(budget.total / budget.weeks);
}

// Which week of the semester is today in? (0 = first week)
// Clamped, so before the start it returns 0 and after the end the last week.
function getWeekIndex(budget, dateISO) {
  const idx = Math.floor(daysBetween(budget.startDate, dateISO || todayISO()) / 7);
  return Math.max(0, Math.min(budget.weeks - 1, idx));
}

function getWeekRange(budget, weekIndex) {
  const start = addDays(budget.startDate, weekIndex * 7);
  return { start: start, end: addDays(start, 6) };
}

function sumExpenses(list) {
  return list.reduce((sum, e) => sum + e.amount, 0);
}

function getSpentInRange(start, end) {
  // ISO dates compare correctly as plain text
  return sumExpenses(getExpenses().filter(e => e.date >= start && e.date <= end));
}

// Everything the Home and Alert screens need, in one object.
// Returns null if the budget has not been set up yet.
function getWeekStatus() {
  const budget = getBudget();
  if (!budget) return null;

  const weekIndex = getWeekIndex(budget);
  const range = getWeekRange(budget, weekIndex);
  const weeklyBudget = getWeeklyBudget(budget);
  const spent = getSpentInRange(range.start, range.end);
  const left = weeklyBudget - spent;
  const used = weeklyBudget > 0 ? spent / weeklyBudget : 0;

  let level = 'ok';
  if (used >= 1) level = 'over';
  else if (used >= WARN_AT) level = 'warning';

  return {
    weekNumber: weekIndex + 1,
    totalWeeks: budget.weeks,
    weekStart: range.start,
    weekEnd: range.end,
    weeklyBudget: weeklyBudget,
    spent: spent,
    left: left,
    percentUsed: Math.round(used * 100),
    level: level
  };
}

// For Insights: { Food: 1200, Travel: 300, ... }
function getCategoryTotals() {
  const totals = {};
  getExpenses().forEach(e => {
    totals[e.category] = (totals[e.category] || 0) + e.amount;
  });
  return totals;
}

// For Insights: spending for every week so far, [{ week: 1, spent: 900 }, ...]
function getWeeklyTotals() {
  const budget = getBudget();
  if (!budget) return [];
  const current = getWeekIndex(budget);
  const rows = [];
  for (let i = 0; i <= current; i++) {
    const r = getWeekRange(budget, i);
    rows.push({ week: i + 1, spent: getSpentInRange(r.start, r.end) });
  }
  return rows;
}