const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const sourceRoot = path.join(__dirname, '..', 'www', 'js');
const dataSource = fs.readFileSync(path.join(sourceRoot, 'data.js'), 'utf8');
const budgetSource = fs.readFileSync(path.join(sourceRoot, 'budget.js'), 'utf8');

function createAppContext() {
  const values = new Map();
  const localStorage = {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
    removeItem(key) {
      values.delete(key);
    }
  };
  const context = vm.createContext({ localStorage, console, Date, Math, Intl });
  vm.runInContext(dataSource, context);
  vm.runInContext(budgetSource, context);
  return { context, localStorage };
}

function saveSamplePlan(context) {
  context.saveBudget(10000, '2025-08-01', '2025-12-19', 'Autumn', 20, [
    { id: 'food', name: 'Food', weeklyLimit: 200 },
    { id: 'transport', name: 'Transport', weeklyLimit: 200 },
    { id: 'books', name: 'Books', weeklyLimit: 100 }
  ]);
}

test('semester date range matches the 20-week example and has seven-day weeks', () => {
  const { context } = createAppContext();
  assert.equal(context.getWeeksInRange('2025-08-01', '2025-12-19'), 20);
  assert.deepEqual(
    JSON.parse(JSON.stringify(context.getWeekRange({
      startDate: '2025-08-01',
      endDate: '2025-12-19',
      weeks: 20
    }, 0))),
    { start: '2025-08-01', end: '2025-08-07' }
  );
});

test('whole-rupee weekly budgets distribute the semester remainder exactly', () => {
  const { context } = createAppContext();
  const budget = { total: 10001, weeks: 20 };
  const weeklyTotal = Array.from({ length: budget.weeks }, (_, index) =>
    context.getWeeklyBudget(budget, index)
  ).reduce((sum, amount) => sum + amount, 0);

  assert.equal(weeklyTotal, budget.total);
});

test('overspending level and category totals use the selected week', () => {
  const { context } = createAppContext();
  saveSamplePlan(context);
  context.addExpense(560, 'food', '2025-08-02', 'Campus bus pass');

  const status = context.getWeekStatus('2025-08-02');
  assert.equal(status.level, 'over');
  assert.equal(status.left, -60);
  assert.equal(context.getCategorySpent('2025-08-01', '2025-08-07', 'food'), 560);
});

test('warning and over-budget thresholds change at the expected amounts', () => {
  const { context } = createAppContext();
  saveSamplePlan(context);
  context.addExpense(400, 'food', '2025-08-02', '');
  assert.equal(context.getWeekStatus('2025-08-02').level, 'warning');
  context.addExpense(100, 'food', '2025-08-03', '');
  assert.equal(context.getWeekStatus('2025-08-03').level, 'over');
});

test('expense updates and deletions are reflected in range totals', () => {
  const { context } = createAppContext();
  saveSamplePlan(context);
  const expense = context.addExpense(120, 'food', '2025-08-02', 'Lunch');
  context.updateExpense(expense.id, { amount: 80, note: 'Snack' });
  assert.equal(context.getSpentInRange('2025-08-01', '2025-08-07'), 80);
  context.deleteExpense(expense.id);
  assert.equal(context.getSpentInRange('2025-08-01', '2025-08-07'), 0);
});

test('legacy category names are mapped to the current category IDs', () => {
  const { context, localStorage } = createAppContext();
  localStorage.setItem('sbp_budget', JSON.stringify({
    total: 10000,
    startDate: '2025-08-01',
    weeks: 20
  }));
  localStorage.setItem('sbp_expenses', JSON.stringify([
    { id: 1, amount: 120, category: 'Food', date: '2025-08-02' },
    { id: 2, amount: 80, category: 'Travel', date: '2025-08-03' },
    { id: 3, amount: 40, category: 'Shopping', date: '2025-08-04' }
  ]));

  assert.deepEqual(
    Array.from(context.getExpenses(), expense => expense.categoryId),
    ['food', 'transport', 'other']
  );
});

test('week status identifies dates outside the semester', () => {
  const { context } = createAppContext();
  saveSamplePlan(context);

  assert.equal(context.getWeekStatus('2025-07-31').beforeSemester, true);
  assert.equal(context.getWeekStatus('2025-12-20').afterSemester, true);
});

test('budget backups can be exported and restored', () => {
  const { context } = createAppContext();
  saveSamplePlan(context);
  const budget = context.getBudget();
  budget.categories[0].icon = '♡';
  budget.categories[0].color = '#123456';
  context.saveBudget(
    budget.total,
    budget.startDate,
    budget.endDate,
    budget.semesterName,
    budget.weeks,
    budget.categories
  );
  const expense = context.addExpense(220, 'food', '2025-08-04', 'Snacks');

  const backup = context.exportBudgetData();
  assert.equal(backup.budget.total, 10000);
  assert.equal(backup.expenses[0].id, expense.id);

  context.resetAll();
  assert.equal(context.getBudget(), null);

  const restored = context.importBudgetData(backup);
  assert.equal(restored.total, 10000);
  assert.equal(restored.categories[0].icon, '♡');
  assert.equal(restored.categories[0].color, '#123456');
  assert.equal(context.getExpenses().length, 1);
  assert.equal(context.getSpentInRange('2025-08-01', '2025-08-07'), 220);
  context.deleteExpense(expense.id);
  assert.equal(context.restoreExpense(expense), true);
  assert.equal(context.restoreExpense(expense), false);
  assert.equal(context.getExpenses().length, 1);
});
