// Screen navigation and interactions for pocket.

const CATEGORY_COLORS = ['#1760a8', '#edae32', '#b83c34', '#6b8f71', '#7b6aa8', '#d17b45'];
let draftPlan = null;
let draftCategories = [];
let selectedCategoryId = null;
let editingExpenseId = null;
let visibleWeekIndex = null;
let messageTimer = null;
let undoAction = null;

function byId(id) {
  return document.getElementById(id);
}

function formatCurrency(value) {
  const amount = Math.round(Number(value) || 0);
  return (amount < 0 ? '−' : '') + '₹' + Math.abs(amount).toLocaleString('en-IN');
}

function formatDate(isoDate, options) {
  if (!isoDate) return '';
  return parseISO(isoDate).toLocaleDateString('en-IN', options || {
    day: 'numeric',
    month: 'short'
  });
}

function showMessage(message) {
  const element = byId('app-message');
  byId('app-message-text').textContent = message;
  byId('app-message-undo').hidden = true;
  undoAction = null;
  element.hidden = false;
  window.clearTimeout(messageTimer);
  messageTimer = window.setTimeout(() => {
    element.hidden = true;
  }, 3200);
}

function showUndoMessage(message, action) {
  const element = byId('app-message');
  window.clearTimeout(messageTimer);
  byId('app-message-text').textContent = message;
  byId('app-message-undo').hidden = false;
  undoAction = action;
  element.hidden = false;
  messageTimer = window.setTimeout(() => {
    element.hidden = true;
    byId('app-message-undo').hidden = true;
    undoAction = null;
  }, 5000);
}

byId('app-message-undo').addEventListener('click', () => {
  if (!undoAction) return;
  const action = undoAction;
  window.clearTimeout(messageTimer);
  undoAction = null;
  byId('app-message').hidden = true;
  byId('app-message-undo').hidden = true;
  action();
});

function getCategoryName(categoryId) {
  const budget = getBudget();
  const category = budget && budget.categories.find(item => item.id === categoryId);
  return category ? category.name : 'Other';
}

function getCategoryIcon(category) {
  if (category.icon) return category.icon;
  const value = (category.name + ' ' + category.id).toLowerCase();
  if (value.includes('food') || value.includes('cafe') || value.includes('meal')) return '♧';
  if (value.includes('transport') || value.includes('travel') || value.includes('bus')) return '▰';
  if (value.includes('book') || value.includes('study')) return '▤';
  return '✧';
}

function getCategoryColor(category, index) {
  const budget = getBudget();
  const categoryIndex = Number.isInteger(index) && index >= 0
    ? index
    : budget
      ? Math.max(0, budget.categories.findIndex(item => item.id === category.id))
      : 0;
  return /^#[0-9a-f]{6}$/i.test(category.color || '')
    ? category.color
    : CATEGORY_COLORS[categoryIndex % CATEGORY_COLORS.length];
}

function setCategoryIcon(element, category, index) {
  const color = getCategoryColor(category, index);
  const channels = color.match(/^#([0-9a-f]{6})$/i);
  const luminance = channels
    ? channels[1].match(/../g).map(channel => {
        const value = parseInt(channel, 16) / 255;
        return value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
      }).reduce((sum, value, channel) =>
        sum + value * [0.2126, 0.7152, 0.0722][channel], 0)
    : 0;
  element.textContent = getCategoryIcon(category);
  element.setAttribute('aria-hidden', 'true');
  element.style.backgroundColor = color;
  element.style.color = luminance > 0.45 ? '#132d47' : '#ffffff';
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach(screen => {
    screen.classList.toggle('active', screen.id === id);
  });
  document.querySelectorAll('[data-nav]').forEach(button => {
    const activeId = id === 'welcome' || id === 'plan' || id === 'category-plan'
      ? 'plan'
      : id === 'alert' ? 'home' : id;
    const isActive = button.dataset.nav === activeId;
    button.classList.toggle('active', isActive);
    if (isActive) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });
  byId('app-main').scrollTop = 0;
}

function navigateTo(id) {
  if (id === 'welcome') {
    showScreen('welcome');
    return;
  }
  if (id === 'plan') {
    beginPlanEditing();
    return;
  }
  if (!getBudget()) {
    showMessage('Build your semester plan first.');
    beginPlanEditing();
    return;
  }
  if (id === 'home') renderHome();
  if (id === 'week') renderWeek();
  if (id === 'insights') renderInsights();
  if (id === 'add') beginExpense();
  showScreen(id);
}

document.querySelectorAll('[data-goto]').forEach(button => {
  button.addEventListener('click', event => {
    event.preventDefault();
    navigateTo(button.dataset.goto);
  });
});

document.querySelectorAll('[data-nav]').forEach(button => {
  button.addEventListener('click', () => navigateTo(button.dataset.nav));
});

byId('help-button').addEventListener('click', () => {
  showMessage('Your plan stays on this device. No bank connection needed.');
});

function beginPlanEditing() {
  const budget = getBudget();
  const pending = draftPlan;
  const start = pending ? pending.startDate : budget ? budget.startDate : todayISO();
  const end = pending ? pending.endDate : budget ? budget.endDate : shiftISODate(start, 139);
  byId('semester-name').value = pending ? pending.name : budget ? budget.semesterName : 'My semester';
  byId('start-date').value = start;
  byId('end-date').value = end;
  byId('total').value = pending ? pending.total : budget ? budget.total : 10000;
  if (!pending) {
    draftCategories = budget ? budget.categories.map(category => ({ ...category })) : [];
  }
  updatePlanPreview();
  byId('plan-error').hidden = true;
  showScreen('plan');
}

function updatePlanPreview() {
  const total = Number(byId('total').value);
  const startDate = byId('start-date').value;
  const endDate = byId('end-date').value;
  if (total > 0 && startDate && endDate && endDate >= startDate) {
    const weeks = getWeeksInRange(startDate, endDate);
    byId('weekly-preview').textContent = formatCurrency(total / weeks) + ' / week';
    byId('weeks-preview').textContent =
      formatCurrency(total) + ' spread across ' + weeks + ' weeks. You can adjust your plan anytime.';
  } else {
    byId('weekly-preview').textContent = '₹— / week';
    byId('weeks-preview').textContent = 'Choose your dates and total to see your plan.';
  }
}

['total', 'start-date', 'end-date'].forEach(id => {
  byId(id).addEventListener('input', updatePlanPreview);
});

byId('plan-form').addEventListener('submit', event => {
  event.preventDefault();
  const name = byId('semester-name').value.trim() || 'My semester';
  const startDate = byId('start-date').value;
  const endDate = byId('end-date').value;
  const total = Number(byId('total').value);
  let error = '';

  if (!Number.isInteger(total) || total < 1) {
    error = 'Enter a whole-number semester budget greater than ₹0.';
  } else if (!startDate || !endDate) {
    error = 'Choose both your semester start and end dates.';
  } else if (endDate < startDate) {
    error = 'Your end date must be after your start date.';
  }

  if (error) {
    byId('plan-error').textContent = error;
    byId('plan-error').hidden = false;
    return;
  }

  const weeks = getWeeksInRange(startDate, endDate);
  const weeklyBudget = Math.round(total / weeks);
  const existingCategories = draftCategories.length
    ? draftCategories
    : getDefaultCategories(total, weeks);
  draftCategories = rebalanceCategories(existingCategories, weeklyBudget);
  draftPlan = { total: total, startDate: startDate, endDate: endDate, name: name, weeks: weeks };
  byId('plan-error').hidden = true;
  renderCategoryEditor();
  showScreen('category-plan');
});

function rebalanceCategories(categories, targetTotal) {
  const oldTotal = categories.reduce((sum, category) => sum + Number(category.weeklyLimit || 0), 0);
  if (!categories.length) return getDefaultCategories(targetTotal, 1);
  if (!oldTotal) {
    const first = categories.map(category => ({ ...category, weeklyLimit: 0 }));
    first[0].weeklyLimit = targetTotal;
    return first;
  }

  const results = categories.map((category, index) => {
    const exact = targetTotal * Number(category.weeklyLimit || 0) / oldTotal;
    return { ...category, weeklyLimit: Math.floor(exact), fraction: exact % 1, index: index };
  });
  let remainder = targetTotal - results.reduce((sum, category) => sum + category.weeklyLimit, 0);
  results.slice().sort((a, b) => b.fraction - a.fraction).forEach(category => {
    if (remainder > 0) {
      results[category.index].weeklyLimit += 1;
      remainder -= 1;
    }
  });
  return results.map(({ fraction, index, ...category }) => category);
}

function renderCategoryEditor() {
  const editor = byId('category-editor');
  editor.replaceChildren();
  draftCategories.forEach((category, index) => {
    const card = document.createElement('article');
    card.className = 'allocation-card';

    const header = document.createElement('div');
    header.className = 'allocation-card-header';
    const icon = document.createElement('span');
    icon.className = 'category-icon';
    setCategoryIcon(icon, category, index);
    const name = document.createElement('input');
    name.type = 'text';
    name.className = 'category-name-input';
    name.value = category.name;
    name.maxLength = 30;
    name.setAttribute('aria-label', 'Category name');
    name.dataset.categoryIndex = String(index);
    name.dataset.categoryField = 'name';
    const amount = document.createElement('label');
    amount.className = 'category-budget-input';
    const label = document.createElement('span');
    label.className = 'sr-only';
    label.textContent = 'Weekly budget for category';
    const currency = document.createElement('span');
    currency.textContent = '₹';
    const amountInput = document.createElement('input');
    amountInput.type = 'number';
    amountInput.inputMode = 'numeric';
    amountInput.min = '0';
    amountInput.step = '1';
    amountInput.value = String(category.weeklyLimit);
    amountInput.dataset.categoryIndex = String(index);
    amountInput.dataset.categoryField = 'weeklyLimit';
    amountInput.setAttribute('aria-label', 'Weekly budget for ' + category.name);
    amount.append(label, currency, amountInput);
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'remove-category';
    remove.dataset.removeIndex = String(index);
    remove.setAttribute('aria-label', 'Remove ' + category.name);
    remove.textContent = '×';
    header.append(icon, name, amount, remove);

    const meter = document.createElement('div');
    meter.className = 'allocation-meter';
    const fill = document.createElement('span');
    const percentage = draftPlan.total > 0
      ? Math.min(100, Number(category.weeklyLimit) / (draftPlan.total / draftPlan.weeks) * 100)
      : 0;
    fill.style.width = percentage + '%';
    meter.appendChild(fill);

    const footer = document.createElement('div');
    footer.className = 'allocation-card-footer';
    const percent = document.createElement('span');
    percent.textContent = Math.round(percentage) + '%';
    const appearance = document.createElement('div');
    appearance.className = 'category-appearance-controls';
    const iconSelect = document.createElement('select');
    iconSelect.dataset.categoryIndex = String(index);
    iconSelect.dataset.categoryField = 'icon';
    iconSelect.setAttribute('aria-label', 'Icon for ' + category.name);
    [
      ['♧', 'Food'],
      ['▰', 'Transport'],
      ['▤', 'Study'],
      ['✧', 'Other'],
      ['◇', 'Shopping'],
      ['+', 'Health']
    ].forEach(([value, labelText]) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = value + ' ' + labelText;
      iconSelect.appendChild(option);
    });
    iconSelect.value = getCategoryIcon(category);
    const colorLabel = document.createElement('label');
    colorLabel.className = 'category-color-label';
    const colorText = document.createElement('span');
    colorText.className = 'sr-only';
    colorText.textContent = 'Color for ' + category.name;
    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.value = getCategoryColor(category, index);
    colorInput.dataset.categoryIndex = String(index);
    colorInput.dataset.categoryField = 'color';
    colorInput.setAttribute('aria-label', 'Color for ' + category.name);
    colorLabel.append(colorText, colorInput);
    appearance.append(iconSelect, colorLabel);
    footer.append(percent, appearance);
    card.append(header, meter, footer);
    editor.appendChild(card);
  });
  updateAllocationSummary();
}

byId('category-editor').addEventListener('input', event => {
  const input = event.target;
  if (!input.dataset.categoryIndex) return;
  const category = draftCategories[Number(input.dataset.categoryIndex)];
  if (!category) return;
  if (input.dataset.categoryField === 'weeklyLimit') {
    category.weeklyLimit = Math.max(0, Number(input.value) || 0);
  } else if (input.dataset.categoryField === 'icon') {
    category.icon = input.value;
  } else if (input.dataset.categoryField === 'color') {
    category.color = input.value;
  } else {
    category.name = input.value;
  }
  if (input.dataset.categoryField === 'icon' || input.dataset.categoryField === 'color') {
    const card = input.closest('.allocation-card');
    const icon = card && card.querySelector('.category-icon');
    if (icon) setCategoryIcon(icon, category, Number(input.dataset.categoryIndex));
  } else if (input.dataset.categoryField === 'name') {
    const card = input.closest('.allocation-card');
    const amountInput = card && card.querySelector('[data-category-field="weeklyLimit"]');
    const removeButton = card && card.querySelector('[data-remove-index]');
    if (amountInput) amountInput.setAttribute('aria-label', 'Weekly budget for ' + category.name);
    if (removeButton) removeButton.setAttribute('aria-label', 'Remove ' + category.name);
  }
  updateAllocationSummary();
});

byId('category-editor').addEventListener('click', event => {
  const button = event.target.closest('[data-remove-index]');
  if (!button) return;
  const category = draftCategories[Number(button.dataset.removeIndex)];
  if (getExpenses().some(expense => expense.categoryId === category.id)) {
    showMessage('This category has saved expenses, so it can’t be removed.');
    return;
  }
  if (draftCategories.length < 2) {
    showMessage('Keep at least one spending category.');
    return;
  }
  draftCategories.splice(Number(button.dataset.removeIndex), 1);
  renderCategoryEditor();
});

byId('add-category').addEventListener('click', () => {
  const id = 'category-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
  draftCategories.push({ id: id, name: 'New category', weeklyLimit: 0 });
  renderCategoryEditor();
  const inputs = byId('category-editor').querySelectorAll('.category-name-input');
  inputs[inputs.length - 1].focus();
});

byId('category-presets').addEventListener('click', () => {
  const presets = [
    { id: 'food', name: 'Food', icon: '♧', color: '#1760a8' },
    { id: 'transport', name: 'Transport', icon: '▰', color: '#edae32' },
    { id: 'study', name: 'Study', icon: '▤', color: '#7b6aa8' },
    { id: 'housing', name: 'Housing', icon: '◇', color: '#6b8f71' },
    { id: 'entertainment', name: 'Entertainment', icon: '✧', color: '#d17b45' },
    { id: 'health', name: 'Health', icon: '+', color: '#b83c34' },
    { id: 'other', name: 'Other', icon: '✧', color: '#748397' }
  ];
  const existingNames = new Set(draftCategories.map(category => category.name.trim().toLowerCase()));
  let added = 0;
  presets.forEach(preset => {
    if (existingNames.has(preset.name.toLowerCase())) return;
    let id = preset.id;
    let suffix = 2;
    while (draftCategories.some(category => category.id === id)) {
      id = preset.id + '-' + suffix;
      suffix += 1;
    }
    draftCategories.push({ ...preset, id: id, weeklyLimit: 0 });
    existingNames.add(preset.name.toLowerCase());
    added += 1;
  });
  renderCategoryEditor();
  showMessage(added
    ? 'Student categories added. Set budgets for the ones you use.'
    : 'Your plan already has all the student categories.');
});

function updateAllocationSummary() {
  if (!draftPlan) return;
  const allocated = draftCategories.reduce((sum, category) =>
    sum + Math.max(0, Number(category.weeklyLimit) || 0), 0);
  const weekly = Math.round(draftPlan.total / draftPlan.weeks);
  const names = draftCategories.map(category => category.name.trim().toLowerCase());
  const validCategories = draftCategories.every(category =>
    category.name.trim() &&
    Number.isInteger(Number(category.weeklyLimit)) &&
    Number(category.weeklyLimit) >= 0
  ) && new Set(names).size === names.length;
  const isBalanced = allocated === weekly && validCategories;
  byId('allocation-total').textContent = formatCurrency(allocated) + ' / ' + formatCurrency(weekly);
  byId('allocation-message').textContent = isBalanced
    ? '✓  Every rupee has a home. You’re ready.'
    : !validCategories
      ? 'Use unique category names and whole-number amounts.'
      : formatCurrency(Math.abs(weekly - allocated)) +
        (allocated < weekly ? ' left to allocate.' : ' over your weekly budget.');
  byId('allocation-message').classList.toggle('is-balanced', isBalanced);
  byId('create-plan').disabled = !isBalanced;
}

byId('create-plan').addEventListener('click', () => {
  if (!draftPlan) return;
  const names = draftCategories.map(category => category.name.trim().toLowerCase());
  if (draftCategories.some(category => !category.name.trim()) ||
      new Set(names).size !== names.length) {
    byId('category-error').textContent = 'Give each category a unique name.';
    byId('category-error').hidden = false;
    return;
  }
  if (draftCategories.some(category => !Number.isInteger(Number(category.weeklyLimit)) ||
      Number(category.weeklyLimit) < 0)) {
    byId('category-error').textContent = 'Category amounts must be whole numbers of ₹0 or more.';
    byId('category-error').hidden = false;
    return;
  }
  const weekly = Math.round(draftPlan.total / draftPlan.weeks);
  const allocated = draftCategories.reduce((sum, category) =>
    sum + Number(category.weeklyLimit), 0);
  if (allocated !== weekly) {
    byId('category-error').textContent = 'Your category amounts must match the weekly budget.';
    byId('category-error').hidden = false;
    return;
  }

  saveBudget(
    draftPlan.total,
    draftPlan.startDate,
    draftPlan.endDate,
    draftPlan.name,
    draftPlan.weeks,
    draftCategories.map(category => ({
      id: category.id,
      name: category.name.trim(),
      weeklyLimit: Number(category.weeklyLimit),
      icon: category.icon || '',
      color: category.color || ''
    }))
  );
  draftPlan = null;
  renderHome();
  showScreen('home');
  showMessage('Your semester plan is ready.');
});

function getWeekCategoryBudgets(budget, weekIndex) {
  const categories = budget.categories.map(category => ({ ...category }));
  const allocated = categories.reduce((sum, category) => sum + Number(category.weeklyLimit || 0), 0);
  const difference = getWeeklyBudget(budget, weekIndex) - allocated;
  if (categories.length && difference) {
    const largest = categories.reduce((current, category) =>
      Number(category.weeklyLimit) > Number(current.weeklyLimit) ? category : current
    );
    largest.weeklyLimit = Math.max(0, Number(largest.weeklyLimit) + difference);
  }
  return categories;
}

function renderDayChart(elementId, range) {
  const chart = byId(elementId);
  chart.replaceChildren();
  const totals = getDayTotals(range.start, range.end);
  const dates = [];
  for (let day = 0; day < 7; day += 1) {
    const date = addDays(range.start, day);
    if (date <= range.end) dates.push(date);
  }
  const max = Math.max(1, ...dates.map(date => totals[date] || 0));
  for (let day = 0; day < 7; day += 1) {
    const date = addDays(range.start, day);
    const hasDate = date <= range.end;
    const amount = hasDate ? totals[date] || 0 : null;
    const item = document.createElement('div');
    item.className = 'day-column';
    item.setAttribute('aria-label', hasDate
      ? formatDate(date, { weekday: 'long', day: 'numeric', month: 'short' }) +
        ', ' + formatCurrency(amount)
      : 'No day in this week');
    const value = document.createElement('span');
    value.className = 'day-value';
    value.textContent = hasDate && amount > 0 ? String(amount) : '–';
    const barTrack = document.createElement('div');
    barTrack.className = 'day-bar-track';
    const bar = document.createElement('span');
    bar.className = 'day-bar';
    bar.style.height = hasDate ? Math.max(amount > 0 ? 8 : 0, amount / max * 100) + '%' : '0';
    if (!hasDate) barTrack.classList.add('day-bar-empty');
    barTrack.appendChild(bar);
    const label = document.createElement('small');
    label.textContent = hasDate
      ? parseISO(date).toLocaleDateString('en', { weekday: 'narrow' })
      : '';
    item.append(value, barTrack, label);
    chart.appendChild(item);
  }
}

function renderCategoryRows(containerId, budget, weekIndex, range, includeEmpty) {
  const container = byId(containerId);
  container.replaceChildren();
  const categories = getWeekCategoryBudgets(budget, weekIndex);
  const used = categories.filter(category =>
    includeEmpty || getCategorySpent(range.start, range.end, category.id) > 0
  );
  if (!used.length) {
    const empty = document.createElement('p');
    empty.className = 'muted-empty';
    empty.textContent = 'Your category spending will show up here.';
    container.appendChild(empty);
    return;
  }

  used.forEach((category, index) => {
    const spent = getCategorySpent(range.start, range.end, category.id);
    const row = document.createElement('article');
    row.className = 'category-spend-row';
    const icon = document.createElement('span');
    icon.className = 'category-icon';
    setCategoryIcon(icon, category, budget.categories.indexOf(category));
    const copy = document.createElement('div');
    copy.className = 'category-spend-copy';
    const title = document.createElement('strong');
    title.textContent = category.name;
    const sub = document.createElement('small');
    sub.textContent = spent ? 'This week' : 'Nothing spent yet';
    copy.append(title, sub);
    const amount = document.createElement('strong');
    amount.className = 'category-spend-amount';
    amount.textContent = formatCurrency(spent);
    row.append(icon, copy, amount);
    container.appendChild(row);
  });
}

function getBudgetGuidance(status) {
  const budget = getBudget();
  if (!budget || !status) return 'You’re on track with your semester plan.';

  const range = getWeekRange(budget, status.weekIndex);
  const totals = getCategoryTotals(range.start, range.end);
  const topCategoryId = Object.entries(totals).sort((a, b) => b[1] - a[1])[0]?.[0];
  const topCategoryName = topCategoryId ? getCategoryName(topCategoryId) : 'your main spending area';

  if (status.level === 'over') {
    const overAmount = Math.abs(status.left);
    const trimTarget = Math.max(50, Math.ceil(overAmount / 2));
    return 'You’re ' + formatCurrency(overAmount) + ' over this week. The biggest spend is in ' +
      topCategoryName + '. Trim about ' + formatCurrency(trimTarget) + ' there and you’ll be back on track.';
  }

  if (status.level === 'warning') {
    const remaining = Math.max(0, status.weeklyBudget - status.spent);
    return 'You’ve used ' + formatCurrency(status.spent) + ' of ' + formatCurrency(status.weeklyBudget) + ' this week. ' +
      formatCurrency(remaining) + ' remains before you hit the weekly cap.';
  }

  if (status.beforeSemester) {
    return 'Your plan starts on ' + formatDate(budget.startDate, { day: 'numeric', month: 'short' }) + '. You can log spending once it begins.';
  }

  if (status.afterSemester) {
    return 'Your semester has ended. Review what you spent and set your next plan.';
  }

  return 'You’re pacing well. Keep your weekly spending close to ' + formatCurrency(status.weeklyBudget) + ' to stay steady.';
}

function renderHome() {
  const budget = getBudget();
  if (!budget) return;
  const status = getWeekStatus();
  const range = getWeekRange(budget, status.weekIndex);
  byId('home-date').textContent = formatDate(todayISO(), {
    weekday: 'long', day: 'numeric', month: 'long'
  });
  byId('home-week-number').textContent =
    'Week ' + status.weekNumber + ' of ' + status.totalWeeks;
  byId('home-left').textContent = formatCurrency(status.left);
  byId('home-spent').textContent =
    formatCurrency(status.spent) + ' of ' + formatCurrency(status.weeklyBudget) + ' spent';
  byId('home-percent').textContent =
    Math.max(0, 100 - status.percentUsed) + '% left';
  byId('home-meter').style.width = Math.min(100, Math.max(0, status.percentUsed)) + '%';
  byId('balance-card').classList.toggle('is-over', status.level === 'over');
  byId('balance-card').classList.toggle('is-warning', status.level === 'warning');
  byId('home-status').textContent = status.level === 'over'
    ? 'Over budget'
    : status.level === 'warning' ? 'Keep an eye on it' : 'On track';
  if (status.beforeSemester) {
    byId('home-status').textContent = 'Plan starts ' + formatDate(budget.startDate);
  } else if (status.afterSemester) {
    byId('home-status').textContent = 'Semester ended';
  }
  renderDayChart('day-chart', range);
  renderCategoryRows('home-categories', budget, status.weekIndex, range, false);
  const hasExpenses = getExpenses().length > 0;
  byId('home-categories').hidden = !hasExpenses;
  byId('home-empty').hidden = hasExpenses;
  byId('home').querySelector('.empty-action').hidden = hasExpenses;
  renderHomeInsight(budget, status);
}

function renderHomeInsight(budget, status) {
  const callout = byId('home-insight');
  const totalSpent = getSemesterSpent(budget);
  callout.textContent = '';
  const title = document.createElement('strong');
  const description = document.createElement('span');
  if (totalSpent === 0) {
    title.textContent = 'On pace to last your whole semester';
    description.textContent = 'Small choices. A stronger semester.';
  } else if (status.level === 'over') {
    title.textContent = formatCurrency(Math.abs(status.left)) + ' over this week';
    description.textContent = getBudgetGuidance(status);
  } else {
    title.textContent = formatCurrency(budget.total - totalSpent) + ' left for your semester';
    description.textContent = getBudgetGuidance(status);
  }
  callout.append(title, description);
}

function beginExpense(expense) {
  const budget = getBudget();
  if (!budget) {
    beginPlanEditing();
    return;
  }
  const today = todayISO();
  const defaultDate = today < budget.startDate
    ? budget.startDate
    : today > budget.endDate ? budget.endDate : today;
  editingExpenseId = expense ? expense.id : null;
  const recent = getExpenses().slice().reverse().find(item =>
    budget.categories.some(category => category.id === item.categoryId)
  );
  selectedCategoryId = expense ? expense.categoryId :
    recent ? recent.categoryId :
      (budget.categories.find(category => category.id === 'food') || budget.categories[0]).id;
  byId('add-title').textContent = expense ? 'Edit spend' : 'New spend';
  byId('amount').value = expense ? expense.amount : '';
  byId('expense-note').value = expense ? expense.note || '' : '';
  byId('expense-date').value = expense ? expense.date : defaultDate;
  byId('expense-error').hidden = true;
  byId('expense-date-label').textContent = formatDate(byId('expense-date').value, {
    weekday: 'long', day: 'numeric', month: 'short'
  });
  updateDateShortcuts();
  renderExpenseCategories();
  updateExpensePreview();
  showScreen('add');
}

function renderExpenseCategories() {
  const container = byId('expense-categories');
  container.replaceChildren();
  const budget = getBudget();
  budget.categories.forEach(category => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'expense-category-option' +
      (category.id === selectedCategoryId ? ' selected' : '');
    button.dataset.expenseCategory = category.id;
    button.setAttribute('aria-pressed', category.id === selectedCategoryId ? 'true' : 'false');
    const icon = document.createElement('span');
    icon.className = 'category-icon';
    setCategoryIcon(icon, category, budget.categories.indexOf(category));
    const name = document.createElement('strong');
    name.textContent = category.name;
    button.append(icon, name);
    container.appendChild(button);
  });
}

byId('expense-categories').addEventListener('click', event => {
  const option = event.target.closest('[data-expense-category]');
  if (!option) return;
  selectedCategoryId = option.dataset.expenseCategory;
  renderExpenseCategories();
  updateExpensePreview();
});

byId('cycle-category').addEventListener('click', () => {
  const categories = getBudget().categories;
  const index = categories.findIndex(category => category.id === selectedCategoryId);
  selectedCategoryId = categories[(index + 1) % categories.length].id;
  renderExpenseCategories();
  updateExpensePreview();
});

function updateExpensePreview() {
  const amount = Number(byId('amount').value) || 0;
  const date = byId('expense-date').value || todayISO();
  const status = getWeekStatus(date);
  const editedExpense = editingExpenseId
    ? getExpenses().find(expense => expense.id === editingExpenseId)
    : null;
  const range = getWeekRange(getBudget(), status.weekIndex);
  const editCredit = editedExpense && editedExpense.date >= range.start &&
    editedExpense.date <= range.end ? editedExpense.amount : 0;
  const leftAfter = status.left + editCredit - amount;
  byId('expense-impact').textContent = amount > 0
    ? 'After this spend, you’ll have ' + formatCurrency(leftAfter) + ' left this week.'
    : 'After this spend, your weekly balance will update.';
  byId('expense-date-label').textContent = formatDate(date, {
    weekday: 'long', day: 'numeric', month: 'short'
  });
}

document.querySelectorAll('[data-expense-amount]').forEach(button => {
  button.addEventListener('click', () => {
    byId('amount').value = button.dataset.expenseAmount;
    byId('amount').focus();
    updateExpensePreview();
  });
});

function updateDateShortcuts() {
  const budget = getBudget();
  const today = todayISO();
  const yesterday = shiftISODate(today, -1);
  document.querySelectorAll('[data-expense-date]').forEach(button => {
    const date = button.dataset.expenseDate === 'yesterday' ? yesterday : today;
    button.disabled = date < budget.startDate || date > budget.endDate || date > today;
  });
}

document.querySelectorAll('[data-expense-date]').forEach(button => {
  button.addEventListener('click', () => {
    const date = button.dataset.expenseDate === 'yesterday'
      ? shiftISODate(todayISO(), -1)
      : todayISO();
    byId('expense-date').value = date;
    updateExpensePreview();
  });
});

byId('amount').addEventListener('input', updateExpensePreview);
byId('expense-date').addEventListener('input', () => {
  updateExpensePreview();
  updateDateShortcuts();
});

byId('expense-form').addEventListener('submit', event => {
  event.preventDefault();
  const budget = getBudget();
  const amount = Number(byId('amount').value);
  const date = byId('expense-date').value;
  let error = '';
  if (!Number.isInteger(amount) || amount < 1) {
    error = 'Enter an amount of at least ₹1.';
  } else if (!date || date < budget.startDate || date > budget.endDate) {
    error = 'Choose a date within your semester plan.';
  } else if (date > todayISO()) {
    error = 'A spend date cannot be in the future.';
  } else if (!budget.categories.some(category => category.id === selectedCategoryId)) {
    error = 'Choose a spending category.';
  }
  if (error) {
    byId('expense-error').textContent = error;
    byId('expense-error').hidden = false;
    return;
  }

  const changes = {
    amount: amount,
    categoryId: selectedCategoryId,
    date: date,
    note: byId('expense-note').value.trim()
  };
  if (editingExpenseId) updateExpense(editingExpenseId, changes);
  else addExpense(changes.amount, changes.categoryId, changes.date, changes.note);
  editingExpenseId = null;

  const status = getWeekStatus(date);
  if (status.level === 'over') {
    renderAlert(status);
    showScreen('alert');
  } else if (getWeekIndex(budget, date) !== getWeekIndex(budget)) {
    visibleWeekIndex = getWeekIndex(budget, date);
    renderWeek();
    showScreen('week');
  } else {
    renderHome();
    showScreen('home');
  }
  showMessage('Spend saved.');
});

function renderAlert(status) {
  const budget = getBudget();
  const weekIndex = status.weekIndex;
  const range = getWeekRange(budget, weekIndex);
  byId('alert-week-label').textContent =
    'Week ' + status.weekNumber + ' of ' + status.totalWeeks + ' · ' +
    formatDate(range.start) + '–' + formatDate(range.end);
  byId('alert-left').textContent = formatCurrency(status.left);
  byId('alert-spent').textContent =
    formatCurrency(status.spent) + ' of ' + formatCurrency(status.weeklyBudget) + ' spent';
  byId('alert-message').textContent = getBudgetGuidance(status);
  renderDayChart('alert-day-chart', range);
}

function renderWeek() {
  const budget = getBudget();
  if (!budget) return;
  const current = getWeekIndex(budget);
  if (visibleWeekIndex === null) visibleWeekIndex = current;
  visibleWeekIndex = Math.max(0, Math.min(budget.weeks - 1, visibleWeekIndex));
  const index = visibleWeekIndex;
  const range = getWeekRange(budget, index);
  const expenses = getExpensesInRange(range.start, range.end)
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date));
  byId('week-range-label').textContent =
    formatDate(range.start, { month: 'short', day: 'numeric' }) + ' – ' +
    formatDate(range.end, { month: 'short', day: 'numeric' });
  byId('week-budget').textContent = formatCurrency(getWeeklyBudget(budget, index));
  byId('week-spent').textContent = formatCurrency(sumExpenses(expenses));
  byId('week-delta-label').textContent =
    sumExpenses(expenses) > getWeeklyBudget(budget, index) ? 'OVER' : 'LEFT';
  byId('week-delta').textContent =
    formatCurrency(getWeeklyBudget(budget, index) - sumExpenses(expenses));
  byId('previous-week').disabled = index === 0;
  byId('next-week').disabled = index >= current;
  renderWeekCategories(budget, index, range);
  renderTransactions(expenses);
}

function renderWeekCategories(budget, weekIndex, range) {
  const container = byId('week-categories');
  container.replaceChildren();
  getWeekCategoryBudgets(budget, weekIndex).forEach((category, index) => {
    const spent = getCategorySpent(range.start, range.end, category.id);
    const row = document.createElement('article');
    row.className = 'week-category-row';
    const header = document.createElement('div');
    header.className = 'week-category-heading';
    const categoryLabel = document.createElement('span');
    const icon = document.createElement('span');
    icon.className = 'category-icon week-category-icon';
    setCategoryIcon(icon, category, budget.categories.indexOf(category));
    const name = document.createElement('span');
    name.textContent = category.name;
    categoryLabel.append(icon, name);
    const values = document.createElement('strong');
    values.textContent = formatCurrency(spent) + ' / ' + formatCurrency(category.weeklyLimit);
    header.append(categoryLabel, values);
    const meter = document.createElement('div');
    meter.className = 'category-meter';
    const fill = document.createElement('span');
    fill.style.width = Math.min(100, category.weeklyLimit > 0
      ? spent / category.weeklyLimit * 100 : spent > 0 ? 100 : 0) + '%';
    if (spent > category.weeklyLimit) fill.classList.add('over');
    meter.appendChild(fill);
    row.append(header, meter);
    container.appendChild(row);
  });
}

function renderTransactions(expenses) {
  const list = byId('transaction-list');
  list.replaceChildren();
  byId('transaction-count').textContent = expenses.length + ' ' +
    (expenses.length === 1 ? 'spend' : 'spends');
  byId('empty-week').hidden = expenses.length > 0;
  expenses.forEach(expense => {
    const item = document.createElement('li');
    item.className = 'transaction-item';
    const icon = document.createElement('span');
    icon.className = 'category-icon';
    const category = getBudget().categories.find(entry => entry.id === expense.categoryId);
    if (category) setCategoryIcon(icon, category, getBudget().categories.indexOf(category));
    else icon.textContent = '✧';
    const details = document.createElement('div');
    details.className = 'transaction-details';
    const title = document.createElement('strong');
    title.textContent = expense.note || getCategoryName(expense.categoryId);
    const subtitle = document.createElement('small');
    subtitle.textContent = getCategoryName(expense.categoryId) + ' · ' +
      formatDate(expense.date, { day: 'numeric', month: 'short' });
    details.append(title, subtitle);
    const amount = document.createElement('strong');
    amount.className = 'transaction-amount';
    amount.textContent = '−' + formatCurrency(expense.amount);
    const edit = document.createElement('button');
    edit.type = 'button';
    edit.className = 'transaction-edit';
    edit.dataset.editExpense = expense.id;
    edit.setAttribute('aria-label', 'Edit ' + (expense.note || 'expense'));
    edit.textContent = 'Edit';
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'transaction-edit';
    remove.dataset.deleteExpense = expense.id;
    remove.setAttribute('aria-label', 'Delete ' + (expense.note || 'expense'));
    remove.textContent = 'Delete';
    item.append(icon, details, amount, edit, remove);
    list.appendChild(item);
  });
}

byId('transaction-list').addEventListener('click', event => {
  const edit = event.target.closest('[data-edit-expense]');
  if (edit) {
    const expense = getExpenses().find(item => item.id === edit.dataset.editExpense);
    if (expense) beginExpense(expense);
    return;
  }
  const remove = event.target.closest('[data-delete-expense]');
  if (remove) {
    const expense = getExpenses().find(item => item.id === remove.dataset.deleteExpense);
    if (!expense) return;
    deleteExpense(expense.id);
    renderWeek();
    showUndoMessage('Spend deleted.', () => {
      if (!restoreExpense(expense)) {
        showMessage('Could not restore the deleted spend.');
        return;
      }
      renderWeek();
      renderHome();
      showMessage('Spend restored.');
    });
  }
});

byId('previous-week').addEventListener('click', () => {
  visibleWeekIndex = Math.max(0, (visibleWeekIndex || 0) - 1);
  renderWeek();
});

byId('next-week').addEventListener('click', () => {
  const budget = getBudget();
  visibleWeekIndex = Math.min(getWeekIndex(budget), (visibleWeekIndex || 0) + 1);
  renderWeek();
});

function renderInsights() {
  const budget = getBudget();
  if (!budget) return;
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const expenses = getMonthlyExpenses(year, month);
  const monthlyTotal = sumExpenses(expenses);
  byId('month-empty').hidden = monthlyTotal > 0;
  const categoryTotals = getCategoryTotals(
    String(year) + '-' + String(month).padStart(2, '0') + '-01',
    String(year) + '-' + String(month).padStart(2, '0') + '-31'
  );
  byId('month-title').textContent = now.toLocaleDateString('en', { month: 'long' }) + ' spending';
  byId('month-range').textContent = 'THIS MONTH';
  byId('month-total').textContent = formatCurrency(monthlyTotal);
  renderDonut(categoryTotals, budget.categories);

  const totalSpent = getSemesterSpent(budget);
  const remaining = budget.total - totalSpent;
  byId('projection-summary').textContent =
    formatCurrency(Math.max(0, remaining)) + ' remaining of your ' + formatCurrency(budget.total) + ' plan';
  byId('projection-spent').textContent = formatCurrency(totalSpent) + ' spent';
  byId('projection-progress').style.width =
    Math.min(100, Math.max(0, totalSpent / budget.total * 100)) + '%';

  const callout = byId('projection-callout');
  callout.replaceChildren();
  const heading = document.createElement('strong');
  const detail = document.createElement('span');
  if (totalSpent <= 0) {
    heading.textContent = 'Your semester is ready for its first spend';
    detail.textContent = 'Log a few purchases to see your spending pace.';
  } else {
    const elapsed = Math.max(1, daysBetween(budget.startDate, todayISO()) + 1);
    const dailyRate = totalSpent / elapsed;
    if (dailyRate > 0 && remaining > 0) {
      const runout = addDays(todayISO(), Math.ceil(remaining / dailyRate));
      heading.textContent = 'At this pace, your funds may last until ' +
        formatDate(runout, { month: 'short', day: 'numeric' }) + '.';
      detail.textContent = 'A forecast based on your recorded spending so far.';
    } else if (remaining <= 0) {
      heading.textContent = 'Your semester budget has been used.';
      detail.textContent = 'Review your plan and adjust what you can.';
    } else {
      heading.textContent = 'You’re keeping a steady pace.';
      detail.textContent = formatCurrency(remaining) + ' is still available for the semester.';
    }
  }
  callout.append(heading, detail);
}

function renderDonut(totals, categories) {
  const donut = byId('month-donut');
  const legend = byId('month-legend');
  legend.replaceChildren();
  const total = categories.reduce((sum, category) => sum + (totals[category.id] || 0), 0);
  const segments = [];
  let cursor = 0;
  categories.forEach((category, index) => {
    const amount = totals[category.id] || 0;
    const percent = total ? amount / total * 100 : 0;
    if (amount > 0) {
      segments.push(getCategoryColor(category, index) + ' ' +
        cursor + '% ' + (cursor + percent) + '%');
      cursor += percent;
    }
    const item = document.createElement('li');
    const dot = document.createElement('span');
    dot.className = 'legend-dot';
    dot.style.backgroundColor = getCategoryColor(category, index);
    const details = document.createElement('span');
    details.className = 'legend-details';
    const name = document.createElement('strong');
    name.textContent = category.name;
    const share = document.createElement('small');
    share.textContent = total ? Math.round(percent) + '%' : '—';
    const amountText = document.createElement('strong');
    amountText.textContent = formatCurrency(amount);
    details.append(name, share);
    item.append(dot, details, amountText);
    legend.appendChild(item);
  });
  donut.style.background = segments.length
    ? 'conic-gradient(' + segments.join(', ') + ')'
    : 'conic-gradient(#e2e8ec 0 100%)';
  donut.setAttribute('aria-label', total
    ? 'Monthly spending: ' + categories
        .filter(category => totals[category.id] > 0)
        .map(category => category.name + ' ' + formatCurrency(totals[category.id]))
        .join(', ')
    : 'No spending recorded this month');
}

byId('amount').addEventListener('focus', () => {
  if (byId('amount').value === '0') byId('amount').value = '';
});

function handleDataExport() {
  const budget = getBudget();
  if (!budget) {
    showMessage('Build a semester plan before exporting your backup.');
    return;
  }
  const payload = exportBudgetData();
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'pocket-budget-backup.json';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  showMessage('Backup downloaded.');
}

function handleDataImport(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const payload = JSON.parse(String(reader.result || ''));
      importBudgetData(payload);
      renderHome();
      showScreen('home');
      showMessage('Backup restored.');
    } catch (error) {
      showMessage(error.message || 'This backup could not be restored.');
    } finally {
      event.target.value = '';
    }
  };
  reader.onerror = () => {
    showMessage('Unable to read this backup file.');
    event.target.value = '';
  };
  reader.readAsText(file);
}

byId('export-data').addEventListener('click', handleDataExport);
byId('import-data-file').addEventListener('change', handleDataImport);

if (getBudget()) {
  renderHome();
  showScreen('home');
} else {
  showScreen('welcome');
}
