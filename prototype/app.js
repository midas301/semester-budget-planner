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