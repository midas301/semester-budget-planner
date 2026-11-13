// Local-first storage for the semester plan and expenses.

const KEYS = { budget: 'sbp_budget', expenses: 'sbp_expenses' };

function readJSON(key, fallback) {
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;

  try {
    return JSON.parse(raw);
  } catch (error) {
    console.error('Unable to read saved budget data.', error);
    return fallback;
  }
}

function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function toISODate(date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return date.getFullYear() + '-' + month + '-' + day;
}

function shiftISODate(isoDate, days) {
  const parts = isoDate.split('-').map(Number);
  const date = new Date(parts[0], parts[1] - 1, parts[2]);
  date.setDate(date.getDate() + days);
  return toISODate(date);
}

function todayISO() {
  return toISODate(new Date());
}

function getDefaultCategories(total, weeks) {
  const weeklyBudget = Math.round(Number(total) / Number(weeks));
  const food = Math.round(weeklyBudget * 0.4);
  const transport = Math.round(weeklyBudget * 0.4);
  return [
    { id: 'food', name: 'Food', weeklyLimit: food },
    { id: 'transport', name: 'Transport', weeklyLimit: transport },
    { id: 'books', name: 'Books', weeklyLimit: weeklyBudget - food - transport }
  ];
}

function getBudget() {
  const budget = readJSON(KEYS.budget, null);
  if (!budget || typeof budget !== 'object') return null;

  const weeks = Number(budget.weeks);
  const total = Number(budget.total);
  if (!(total > 0) || !Number.isInteger(weeks) || weeks < 1) return null;

  const startDate = budget.startDate || todayISO();
  const hasSavedCategories = Array.isArray(budget.categories) && budget.categories.length > 0;
  const categories = hasSavedCategories
    ? budget.categories
    : getDefaultCategories(total, weeks);
  if (!hasSavedCategories) {
    categories.push({ id: 'other', name: 'Other', weeklyLimit: 0 });
  }
  return {
    ...budget,
    total: total,
    weeks: weeks,
    startDate: startDate,
    endDate: budget.endDate || shiftISODate(startDate, weeks * 7 - 1),
    semesterName: budget.semesterName || 'My semester',
    categories: categories
  };
}

function saveBudget(total, startDate, endDate, semesterName, weeks, categories) {
  const budget = {
    total: Number(total),
    startDate: startDate,
    endDate: endDate,
    semesterName: semesterName,
    weeks: Number(weeks),
    categories: categories
  };
  writeJSON(KEYS.budget, budget);
  return budget;
}

function getExpenses() {
  const expenses = readJSON(KEYS.expenses, []);
  if (!Array.isArray(expenses)) return [];
  const budget = getBudget();
  return expenses.map(expense => {
    if (expense.categoryId || !budget) {
      return { ...expense, id: String(expense.id) };
    }
    const oldName = String(expense.category || '').toLowerCase();
    const categoryName = oldName === 'travel' ? 'transport' :
      oldName === 'shopping' ? 'other' : oldName;
    const category = budget.categories.find(item =>
      item.name.toLowerCase() === categoryName
    );
    return {
      ...expense,
      id: String(expense.id),
      categoryId: category ? category.id : 'other'
    };
  });
}

function addExpense(amount, categoryId, date, note) {
  const expenses = getExpenses();
  const expense = {
    id: String(Date.now()) + '-' + Math.random().toString(36).slice(2, 9),
    amount: Number(amount),
    categoryId: categoryId,
    date: date || todayISO(),
    note: note || ''
  };
  expenses.push(expense);
  writeJSON(KEYS.expenses, expenses);
  return expense;
}

function updateExpense(id, changes) {
  const expenses = getExpenses();
  const expense = expenses.find(item => item.id === id);
  if (!expense) return null;
  Object.assign(expense, changes);
  writeJSON(KEYS.expenses, expenses);
  return expense;
}

function deleteExpense(id) {
  writeJSON(KEYS.expenses, getExpenses().filter(item => item.id !== id));
}

function restoreExpense(expense) {
  const expenses = getExpenses();
  if (expenses.some(item => item.id === String(expense.id))) return false;
  expenses.push({ ...expense, id: String(expense.id) });
  writeJSON(KEYS.expenses, expenses);
  return true;
}

function resetAll() {
  localStorage.removeItem(KEYS.budget);
  localStorage.removeItem(KEYS.expenses);
}

function exportBudgetData() {
  const budget = getBudget();
  if (!budget) return null;
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    budget: {
      ...budget,
      categories: budget.categories.map(category => ({ ...category }))
    },
    expenses: getExpenses().map(expense => ({ ...expense }))
  };
}

function importBudgetData(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Backup data is missing or invalid.');
  }

  const budgetData = payload.budget || payload;
  const total = Number(budgetData.total);
  const startDate = budgetData.startDate;
  const endDate = budgetData.endDate || startDate;
  const weeks = Number(budgetData.weeks || getWeeksInRange(startDate, endDate));

  if (!(total > 0) || !startDate || !endDate || !Number.isInteger(weeks) || weeks < 1) {
    throw new Error('This backup file does not contain a valid semester budget.');
  }

  const categories = Array.isArray(budgetData.categories) && budgetData.categories.length
    ? budgetData.categories.map(category => ({
        id: category.id || String(category.name || 'category').toLowerCase().replace(/\s+/g, '-'),
        name: String(category.name || 'Category').trim() || 'Category',
        weeklyLimit: Number(category.weeklyLimit || 0),
        icon: category.icon || '',
        color: category.color || ''
      }))
    : getDefaultCategories(total, weeks);

  const normalizedBudget = {
    total: total,
    startDate: startDate,
    endDate: endDate,
    semesterName: budgetData.semesterName || 'My semester',
    weeks: weeks,
    categories: categories
  };

  const importedExpenses = Array.isArray(payload.expenses) ? payload.expenses : [];
  const normalizedExpenses = importedExpenses.map((expense, index) => {
    const amount = Number(expense.amount || 0);
    const categoryId = expense.categoryId ||
      ([expense.category, expense.categoryName].find(value => value) || 'other').toLowerCase();
    return {
      id: String(expense.id ?? ('imported-' + index + '-' + Date.now())),
      amount: amount,
      categoryId: categoryId,
      date: expense.date || startDate,
      note: expense.note || ''
    };
  });

  writeJSON(KEYS.budget, normalizedBudget);
  writeJSON(KEYS.expenses, normalizedExpenses);
  return normalizedBudget;
}
