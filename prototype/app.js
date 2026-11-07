document.querySelectorAll('[data-goto]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
      document.getElementById(btn.dataset.goto).classList.add('active');
    });
  });

  const state = { total: 0, weeks: 0, weeklyBudget: 0, spentThisWeek: 0, expenses: [] };

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

document.getElementById('create-budget').addEventListener('click', () => {
  const total = Number(document.getElementById('total').value);
  const weeks = Number(document.getElementById('weeks').value);
  const error = document.getElementById('setup-error');

  if (total <= 0 || weeks <= 0) {
    error.hidden = false;
    return;
  }
  error.hidden = true;

  state.total = total;
  state.weeks = weeks;
  state.weeklyBudget = Math.round(total / weeks);

  // TODO (your task): show state.weeklyBudget on the Home screen
  showScreen('home');
});

let selectedCategory = 'Food';

document.querySelectorAll('.chip').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'));
    chip.classList.add('selected');
    selectedCategory = chip.dataset.cat;
  });
});

function updateHome() {
  const left = state.weeklyBudget - state.spentThisWeek;
  document.getElementById('left-this-week').textContent = '₹' + left;

  const list = document.getElementById('expense-list');
  list.innerHTML = '';
  state.expenses.slice(-5).reverse().forEach(e => {
    const li = document.createElement('li');
    li.textContent = e.category + ': ₹' + e.amount;
    list.appendChild(li);
  });
}

document.getElementById('save-expense').addEventListener('click', () => {
  const amount = Number(document.getElementById('amount').value);
  const error = document.getElementById('add-error');

  if (amount <= 0) {
    error.hidden = false;
    return;
  }
  error.hidden = true;

  state.expenses.push({ amount, category: selectedCategory });
  state.spentThisWeek += amount;
  document.getElementById('amount').value = '';

  updateHome();
  showScreen('home');
});