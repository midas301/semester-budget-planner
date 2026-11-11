// data.js: saves and loads the budget and expenses on the phone.
// Dates are stored as "YYYY-MM-DD" text in local time.

const KEYS = { budget: 'sbp_budget', expenses: 'sbp_expenses' };

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function toISODate(d) {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return d.getFullYear() + '-' + m + '-' + day;
}

function todayISO() {
  return toISODate(new Date());
}

// ---- Budget: { total, startDate, weeks } or null if not set up yet ----
function getBudget() {
  return readJSON(KEYS.budget, null);
}

function saveBudget(total, startDate, weeks) {
  const budget = { total: Number(total), startDate: startDate, weeks: Number(weeks) };
  writeJSON(KEYS.budget, budget);
  return budget;
}

// ---- Expenses: [{ id, amount, category, date, note }] ----
function getExpenses() {
  return readJSON(KEYS.expenses, []);
}

function addExpense(amount, category, date, note) {
  const list = getExpenses();
  const expense = {
    id: Date.now(),
    amount: Number(amount),
    category: category,
    date: date || todayISO(),
    note: note || ''
  };
  list.push(expense);
  writeJSON(KEYS.expenses, list);
  return expense;
}

function updateExpense(id, changes) {
  const list = getExpenses();
  const item = list.find(e => e.id === id);
  if (!item) return null;
  Object.assign(item, changes);
  writeJSON(KEYS.expenses, list);
  return item;
}

function deleteExpense(id) {
  const list = getExpenses().filter(e => e.id !== id);
  writeJSON(KEYS.expenses, list);
}

// ---- Reset everything (used by Settings) ----
function resetAll() {
  localStorage.removeItem(KEYS.budget);
  localStorage.removeItem(KEYS.expenses);
}