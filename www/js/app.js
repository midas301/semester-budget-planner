// app.js: screen navigation, setup screen, home screen.

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ---- Home ----
function renderHome() {
  const s = getWeekStatus();
  if (!s) return;

  document.getElementById('left-this-week').textContent = '₹' + s.left;
  document.getElementById('week-label').textContent =
    'Week ' + s.weekNumber + ' of ' + s.totalWeeks + ' · ₹' + s.spent +
    ' spent of ₹' + s.weeklyBudget;

  const list = document.getElementById('expense-list');
  list.innerHTML = '';
  getExpenses().slice(-5).reverse().forEach(e => {
    const li = document.createElement('li');
    li.textContent = e.category + ': ₹' + e.amount;
    list.appendChild(li);
  });
}

// ---- Navigation buttons ----
document.querySelectorAll('[data-goto]').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.goto;
    if (target === 'home') renderHome();
    showScreen(target);
  });
});

// ---- Setup screen ----
const totalInput = document.getElementById('total');
const weeksInput = document.getElementById('weeks');
const startInput = document.getElementById('start-date');
const preview = document.getElementById('weekly-preview');
const setupError = document.getElementById('setup-error');

startInput.value = todayISO();

function updatePreview() {
  const total = Number(totalInput.value);
  const weeks = Number(weeksInput.value);
  preview.textContent = (total > 0 && weeks > 0)
    ? 'That is about ₹' + Math.round(total / weeks) + ' per week.'
    : '';
}
totalInput.addEventListener('input', updatePreview);
weeksInput.addEventListener('input', updatePreview);

document.getElementById('create-budget').addEventListener('click', () => {
  const total = Number(totalInput.value);
  const weeks = Number(weeksInput.value);
  const start = startInput.value;

  let message = '';
  if (!(total > 0)) message = 'Enter a total budget greater than 0.';
  else if (!start) message = 'Pick the semester start date.';
  else if (!Number.isInteger(weeks) || weeks < 1 || weeks > 52)
    message = 'Enter a whole number of weeks between 1 and 52.';

  if (message) {
    setupError.textContent = message;
    setupError.hidden = false;
    return;
  }
  setupError.hidden = true;

  saveBudget(total, start, weeks);
  renderHome();
  showScreen('home');
});

// ---- On app start: returning users go straight to Home ----
if (getBudget()) {
  renderHome();
  showScreen('home');
} else {
  showScreen('welcome');
}