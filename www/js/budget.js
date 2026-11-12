// Semester date and spending calculations. Needs data.js loaded first.

const WARN_AT = 0.8;
const DAY_MS = 86400000;

function parseISO(isoDate) {
  const parts = isoDate.split('-').map(Number);
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

function addDays(isoDate, days) {
  const date = parseISO(isoDate);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

function daysBetween(fromISO, toISO) {
  const from = fromISO.split('-').map(Number);
  const to = toISO.split('-').map(Number);
  return Math.round((Date.UTC(to[0], to[1] - 1, to[2]) -
    Date.UTC(from[0], from[1] - 1, from[2])) / DAY_MS);
}

function getWeeksInRange(startDate, endDate) {
  return Math.max(1, Math.ceil(daysBetween(startDate, endDate) / 7));
}

function getWeeklyBudget(budget, weekIndex) {
  const base = Math.floor(budget.total / budget.weeks);
  const remainder = budget.total - base * budget.weeks;
  if (typeof weekIndex !== 'number') return Math.round(budget.total / budget.weeks);
  return base + (weekIndex < remainder ? 1 : 0);
}

function getWeekIndex(budget, dateISO) {
  const targetDate = dateISO || todayISO();
  const index = Math.floor(daysBetween(budget.startDate, targetDate) / 7);
  return Math.max(0, Math.min(budget.weeks - 1, index));
}

function getWeekRange(budget, weekIndex) {
  const index = Math.max(0, Math.min(budget.weeks - 1, weekIndex));
  const start = addDays(budget.startDate, index * 7);
  const defaultEnd = addDays(start, 6);
  return {
    start: start,
    end: index === budget.weeks - 1 && budget.endDate
      ? budget.endDate
      : budget.endDate && budget.endDate < defaultEnd ? budget.endDate : defaultEnd
  };
}

function getExpensesInRange(startDate, endDate) {
  return getExpenses().filter(expense =>
    expense.date >= startDate && expense.date <= endDate
  );
}

function sumExpenses(expenses) {
  return expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
}

function getSpentInRange(startDate, endDate) {
  return sumExpenses(getExpensesInRange(startDate, endDate));
}

function getWeekStatus(dateISO) {
  const budget = getBudget();
  if (!budget) return null;

  const today = dateISO || todayISO();
  const weekIndex = getWeekIndex(budget, today);
  const range = getWeekRange(budget, weekIndex);
  const weeklyBudget = getWeeklyBudget(budget, weekIndex);
  const spent = getSpentInRange(range.start, range.end);
  const left = weeklyBudget - spent;
  const used = weeklyBudget > 0 ? spent / weeklyBudget : 0;
  let level = 'ok';
  if (used >= 1) level = 'over';
  else if (used >= WARN_AT) level = 'warning';

  return {
    weekIndex: weekIndex,
    weekNumber: weekIndex + 1,
    totalWeeks: budget.weeks,
    weekStart: range.start,
    weekEnd: range.end,
    weeklyBudget: weeklyBudget,
    spent: spent,
    left: left,
    percentUsed: Math.round(used * 100),
    level: level,
    beforeSemester: today < budget.startDate,
    afterSemester: today > budget.endDate
  };
}

function getCategorySpent(startDate, endDate, categoryId) {
  return sumExpenses(getExpensesInRange(startDate, endDate).filter(expense =>
    expense.categoryId === categoryId
  ));
}

function getCategoryTotals(startDate, endDate) {
  const expenses = startDate && endDate
    ? getExpensesInRange(startDate, endDate)
    : getExpenses();
  const totals = {};
  expenses.forEach(expense => {
    totals[expense.categoryId] = (totals[expense.categoryId] || 0) +
      Number(expense.amount || 0);
  });
  return totals;
}

function getWeeklyTotals() {
  const budget = getBudget();
  if (!budget) return [];
  const current = getWeekIndex(budget);
  const rows = [];
  for (let index = 0; index <= current; index += 1) {
    const range = getWeekRange(budget, index);
    rows.push({
      week: index + 1,
      budget: getWeeklyBudget(budget, index),
      spent: getSpentInRange(range.start, range.end)
    });
  }
  return rows;
}

function getDayTotals(startDate, endDate) {
  const expenses = getExpensesInRange(startDate, endDate);
  const totals = {};
  expenses.forEach(expense => {
    totals[expense.date] = (totals[expense.date] || 0) +
      Number(expense.amount || 0);
  });
  return totals;
}

function getSemesterSpent(budget) {
  return getSpentInRange(budget.startDate, budget.endDate);
}

function getMonthlyExpenses(year, month) {
  const prefix = String(year) + '-' + String(month).padStart(2, '0');
  return getExpenses().filter(expense => expense.date.slice(0, 7) === prefix);
}
