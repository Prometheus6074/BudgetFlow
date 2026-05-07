/* ════════════════════════════════════════════════════
   BUDGETFLOW — app.js
   Features: Budget Limits, Goals, Charts, Bills,
   Period-based Balance (Daily/Weekly/Monthly/Yearly),
   Prev/Next Period Navigation, Manual Entry, Categories
   Icons: Lucide (https://lucide.dev)
   ════════════════════════════════════════════════════ */

'use strict';

// ═══════════════════════════════════════════════
//  1. DEFAULT CATEGORIES
// ═══════════════════════════════════════════════

const DEFAULT_CATEGORIES = [
  // Inflows
  { id: 'c1',  name: 'Allowance',      type: 'inflow',  icon: 'wallet',       color: '#2fa084' },
  { id: 'c2',  name: 'Salary',         type: 'inflow',  icon: 'briefcase',    color: '#1f6f5f' },
  { id: 'c3',  name: 'Freelance',      type: 'inflow',  icon: 'laptop',       color: '#6fcf97' },
  { id: 'c4',  name: 'Investment',     type: 'inflow',  icon: 'trending-up',  color: '#27ae60' },
  { id: 'c5',  name: 'Gift',           type: 'inflow',  icon: 'gift',         color: '#2ecc71' },
  { id: 'c6',  name: 'Other Income',   type: 'inflow',  icon: 'plus-circle',  color: '#52b788' },
  // Outflows
  { id: 'c7',  name: 'Food',           type: 'outflow', icon: 'utensils',     color: '#e74c3c' },
  { id: 'c8',  name: 'Transportation', type: 'outflow', icon: 'bus',          color: '#e67e22' },
  { id: 'c9',  name: 'Housing',        type: 'outflow', icon: 'home',         color: '#9b59b6' },
  { id: 'c10', name: 'Utilities',      type: 'outflow', icon: 'zap',          color: '#f39c12' },
  { id: 'c11', name: 'Entertainment',  type: 'outflow', icon: 'gamepad-2',    color: '#e91e63' },
  { id: 'c12', name: 'Shopping',       type: 'outflow', icon: 'shopping-bag', color: '#ff5722' },
  { id: 'c13', name: 'Healthcare',     type: 'outflow', icon: 'pill',         color: '#3498db' },
  { id: 'c14', name: 'Education',      type: 'outflow', icon: 'book-open',    color: '#8e44ad' },
  { id: 'c15', name: 'Subscriptions',  type: 'outflow', icon: 'smartphone',   color: '#16a085' },
  { id: 'c16', name: 'Other',          type: 'outflow', icon: 'package',      color: '#95a5a6' },
];

// ═══════════════════════════════════════════════
//  2. STATE & STORAGE
// ═══════════════════════════════════════════════

const STORAGE_KEY = 'budgetflow_v1';

let state = {
  transactions: [],
  categories: [],
  budgets: [],
  goals: [],
  bills: [],
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      state = JSON.parse(raw);
      state.categories = DEFAULT_CATEGORIES;
    } else {
      state = {
        transactions: [],
        categories:   DEFAULT_CATEGORIES,
        budgets:      [],
        goals:        [],
        bills:        [],
      };
      saveState();
    }
  } catch (e) {
    console.error('State load error', e);
    state = { transactions: [], categories: DEFAULT_CATEGORIES, budgets: [], goals: [], bills: [] };
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('State save error', e);
  }
}

// ═══════════════════════════════════════════════
//  3. UTILITY FUNCTIONS
// ═══════════════════════════════════════════════

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function formatCurrency(amount, showSign = false) {
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const sign = showSign && amount > 0 ? '+' : (amount < 0 ? '-' : '');
  return sign + '\u20B1' + formatted;
}

function formatCurrencyShort(amount) {
  const abs = Math.abs(amount);
  let formatted;
  if (abs >= 1000000) formatted = (abs / 1000000).toFixed(1) + 'M';
  else if (abs >= 1000) formatted = (abs / 1000).toFixed(1) + 'K';
  else formatted = abs.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  return (amount < 0 ? '-' : '') + '\u20B1' + formatted;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateShort(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
}

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function getCategory(id) {
  return state.categories.find(c => c.id === id) || { name: 'Unknown', icon: 'package', color: '#95a5a6', type: 'outflow' };
}

function getPeriodRange(period) {
  const now = new Date();
  let start, end;
  if (period === 'weekly') {
    const day = now.getDay();
    start = new Date(now);
    start.setDate(now.getDate() - day);
    end = new Date(start);
    end.setDate(start.getDate() + 6);
  } else {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  }
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

function getReportRange(rperiod) {
  const now = new Date();
  let start;
  if (rperiod === 'week') {
    start = new Date(now); start.setDate(now.getDate() - 6);
  } else if (rperiod === '3months') {
    start = new Date(now); start.setMonth(now.getMonth() - 2); start.setDate(1);
  } else {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
  }
  return { start: start.toISOString().split('T')[0], end: now.toISOString().split('T')[0] };
}

function getTransactionsInRange(start, end) {
  return state.transactions.filter(t => t.date >= start && t.date <= end);
}

function getTotalInflow(transactions) {
  return transactions.filter(t => t.type === 'inflow').reduce((s, t) => s + t.amount, 0);
}

function getTotalOutflow(transactions) {
  return transactions.filter(t => t.type === 'outflow').reduce((s, t) => s + t.amount, 0);
}

function getNetBalance() {
  return state.transactions.reduce((s, t) => t.type === 'inflow' ? s + t.amount : s - t.amount, 0);
}

// ─── Lucide Icon Helper ───
function icon(name, size = 18, style = '') {
  return `<i data-lucide="${name}" style="width:${size}px;height:${size}px;display:block;${style}"></i>`;
}

function refreshIcons() {
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
}

// ═══════════════════════════════════════════════
//  3b. HEADER PERIOD LOGIC
// ═══════════════════════════════════════════════

// 'daily' | 'weekly' | 'monthly' | 'yearly'
let headerPeriodMode   = 'monthly';
// 0 = current, -1 = previous, -2 = two periods ago, etc.
let headerPeriodOffset = 0;

/**
 * Returns { start, end, label } for the given mode + offset.
 * offset 0 = current period, -1 = previous, etc.
 */
function getHeaderRange(mode, offset) {
  const now = new Date();
  let start, end, label;

  if (mode === 'daily') {
    const d = new Date(now);
    d.setDate(d.getDate() + offset);
    const dateStr = d.toISOString().split('T')[0];
    start = dateStr;
    end   = dateStr;
    if (offset === 0)       label = 'Today';
    else if (offset === -1) label = 'Yesterday';
    else                    label = formatDate(dateStr);

  } else if (mode === 'weekly') {
    // Anchor to the Sunday of the current week, then shift by offset weeks
    const d = new Date(now);
    d.setDate(d.getDate() + offset * 7);
    const dow = d.getDay();                       // 0=Sun
    const wStart = new Date(d);
    wStart.setDate(d.getDate() - dow);
    const wEnd = new Date(wStart);
    wEnd.setDate(wStart.getDate() + 6);
    start = wStart.toISOString().split('T')[0];
    end   = wEnd.toISOString().split('T')[0];
    if (offset === 0)       label = 'This Week';
    else if (offset === -1) label = 'Last Week';
    else                    label = `Wk of ${formatDateShort(start)}`;

  } else if (mode === 'monthly') {
    const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    start = d.toISOString().split('T')[0];
    end   = mEnd.toISOString().split('T')[0];
    if (offset === 0) label = 'This Month';
    else              label = d.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' });

  } else { // yearly
    const year = now.getFullYear() + offset;
    start = `${year}-01-01`;
    end   = `${year}-12-31`;
    if (offset === 0) label = 'This Year';
    else              label = String(year);
  }

  return { start, end, label };
}

function updatePeriodModeUI() {
  // Highlight the active mode button
  document.querySelectorAll('.period-mode-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === headerPeriodMode);
  });

  // Disable "next" when already at the current period
  const nextBtn = document.getElementById('nextPeriodBtn');
  if (nextBtn) {
    nextBtn.disabled = headerPeriodOffset >= 0;
    nextBtn.style.opacity = headerPeriodOffset >= 0 ? '0.35' : '1';
  }
}

// ═══════════════════════════════════════════════
//  4. BILLS AUTO-DEDUCTION
// ═══════════════════════════════════════════════

function processBills() {
  const today = new Date();
  const todayISO = todayStr();
  let deducted = [];

  state.bills.forEach(bill => {
    if (!bill.autoDeduct) return;

    if (bill.frequency === 'daily') {
      if (bill.lastDeducted === todayISO) return;
      const tx = { id: uid(), date: todayISO, amount: bill.amount, type: 'outflow', categoryId: bill.categoryId, note: `[Auto] ${bill.name}` };
      state.transactions.unshift(tx);
      bill.lastDeducted = todayISO;
      deducted.push(bill.name);

    } else if (bill.frequency === 'monthly') {
      const day = bill.dayOfMonth || 1;
      const thisMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
      if (bill.lastDeducted && bill.lastDeducted.startsWith(thisMonthKey)) return;
      if (today.getDate() >= day) {
        const dueDate = new Date(today.getFullYear(), today.getMonth(), day);
        const dueDateISO = dueDate.toISOString().split('T')[0];
        const tx = { id: uid(), date: dueDateISO, amount: bill.amount, type: 'outflow', categoryId: bill.categoryId, note: `[Auto] ${bill.name}` };
        state.transactions.unshift(tx);
        bill.lastDeducted = todayISO;
        deducted.push(bill.name);
      }
    }
  });

  if (deducted.length > 0) {
    saveState();
    showToast(`Auto-deducted: ${deducted.join(', ')}`, 'success');
  }
}

// ═══════════════════════════════════════════════
//  5. RENDER: HEADER
// ═══════════════════════════════════════════════

function renderHeader() {
  const { start, end, label } = getHeaderRange(headerPeriodMode, headerPeriodOffset);

  // Income and expenses pills: only transactions within the selected period
  const periodTx = getTransactionsInRange(start, end);
  const income   = getTotalInflow(periodTx);
  const expenses = getTotalOutflow(periodTx);

  // Net Balance: cumulative running total of ALL transactions up to (and including) the end of the selected period.
  // This means if you earned 5000 two days ago and spent 200 yesterday, viewing "yesterday" in daily mode shows 4800.
  const cumulativeTx = state.transactions.filter(t => t.date <= end);
  const balance = getTotalInflow(cumulativeTx) - getTotalOutflow(cumulativeTx);

  const el = document.getElementById('totalBalance');
  el.textContent = formatCurrency(balance);
  el.classList.toggle('negative', balance < 0);

  document.getElementById('balancePeriodLabel').textContent = label;
  document.getElementById('totalIncome').textContent   = formatCurrencyShort(income);
  document.getElementById('totalExpenses').textContent = formatCurrencyShort(expenses);

  // Bills pill: always show the recurring monthly bill total regardless of period
  const bills = state.bills.filter(b => b.autoDeduct && b.frequency === 'monthly').reduce((s, b) => s + b.amount, 0);
  document.getElementById('totalBills').textContent = formatCurrencyShort(bills);

  const now = new Date();
  document.getElementById('headerDate').textContent = now.toLocaleDateString('en-PH', { weekday: 'short', month: 'long', day: 'numeric' });

  updatePeriodModeUI();
}

// ═══════════════════════════════════════════════
//  6. RENDER: DASHBOARD
// ═══════════════════════════════════════════════

function renderDashboard() {
  renderBudgetSnapshot();
  renderGoalsSnapshot();
  renderRecentTransactions();
}

function renderBudgetSnapshot() {
  const container = document.getElementById('budgetSnapshot');
  const { start, end } = getPeriodRange('monthly');
  const monthTx = getTransactionsInRange(start, end);

  if (state.budgets.length === 0) {
    container.innerHTML = `<div class="snapshot-empty">No budgets set yet. Go to <strong>Budget</strong> tab to add limits.</div>`;
    return;
  }

  const shown = state.budgets.slice(0, 4);
  container.innerHTML = shown.map(b => {
    const cat = getCategory(b.categoryId);
    const spent = monthTx.filter(t => t.type === 'outflow' && t.categoryId === b.categoryId).reduce((s, t) => s + t.amount, 0);
    const pct = Math.min((spent / b.limit) * 100, 100);
    const cls = pct >= 100 ? 'danger' : pct >= 80 ? 'warning' : '';
    return `
      <div class="snapshot-card">
        <div class="snapshot-cat">
          <div class="snapshot-icon">${icon(cat.icon, 16)}</div>
          <span class="snapshot-name">${cat.name}</span>
        </div>
        <div class="snapshot-amounts">
          <span class="snapshot-spent">${formatCurrencyShort(spent)}</span>
          <span class="snapshot-limit">of ${formatCurrencyShort(b.limit)}</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill ${cls}" style="width:${pct}%"></div>
        </div>
      </div>`;
  }).join('');
  refreshIcons();
}

function renderGoalsSnapshot() {
  const container = document.getElementById('goalsSnapshot');
  if (state.goals.length === 0) {
    container.innerHTML = `<div class="snapshot-empty">No goals yet.</div>`;
    return;
  }
  container.innerHTML = state.goals.slice(0, 3).map(g => {
    const pct = Math.min(Math.round((g.current / g.target) * 100), 100);
    const circumference = 2 * Math.PI * 17;
    const dash = (pct / 100) * circumference;
    return `
      <div class="goal-snap-card">
        <div class="goal-snap-ring">
          <svg viewBox="0 0 40 40">
            <circle cx="20" cy="20" r="17" fill="none" stroke="#eeeeee" stroke-width="4"/>
            <circle cx="20" cy="20" r="17" fill="none" stroke="var(--clr-secondary)" stroke-width="4"
              stroke-dasharray="${dash} ${circumference}" stroke-linecap="round"/>
          </svg>
          <div class="goal-snap-pct">${pct}%</div>
        </div>
        <div class="goal-snap-info">
          <div class="goal-snap-name">${g.name}</div>
          <div class="goal-snap-sub">${formatCurrency(g.current)} / ${formatCurrency(g.target)}</div>
        </div>
      </div>`;
  }).join('');
}

function renderRecentTransactions() {
  const container = document.getElementById('recentTransactions');
  const sorted = [...state.transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8);
  if (sorted.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">${icon('banknote', 36)}</div>
        <p>No transactions yet. Tap <strong>+</strong> to add one.</p>
      </div>`;
    refreshIcons();
    return;
  }
  container.innerHTML = sorted.map(t => renderTransactionItem(t)).join('');
  container.querySelectorAll('.tx-item').forEach(el => {
    el.addEventListener('click', () => openEditTransaction(el.dataset.id));
  });
  refreshIcons();
}

function renderTransactionItem(t) {
  const cat = getCategory(t.categoryId);
  const isIn = t.type === 'inflow';
  const isAuto = t.note && t.note.startsWith('[Auto]');
  return `
    <div class="tx-item" data-id="${t.id}">
      <div class="tx-icon ${t.type}">${icon(cat.icon, 18)}</div>
      <div class="tx-info">
        <div class="tx-name">${t.note || cat.name}</div>
        <div class="tx-meta">
          <span class="tx-category">${cat.name}</span>
          <span class="tx-date">${formatDateShort(t.date)}</span>
          ${isAuto ? '<span class="tx-auto-tag">Auto</span>' : ''}
        </div>
      </div>
      <span class="tx-amount ${t.type}">${isIn ? '+' : '-'}${formatCurrency(t.amount)}</span>
    </div>`;
}

// ═══════════════════════════════════════════════
//  7. RENDER: BUDGET
// ═══════════════════════════════════════════════

let activeBudgetPeriod = 'monthly';

function renderBudgetList() {
  const container = document.getElementById('budgetList');
  const { start, end } = getPeriodRange(activeBudgetPeriod);
  const periodTx = getTransactionsInRange(start, end);

  if (state.budgets.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">${icon('target', 36)}</div>
        <p>Set spending limits per category to track your budget.</p>
      </div>`;
    refreshIcons();
    return;
  }

  const filtered = state.budgets.filter(b => b.period === activeBudgetPeriod);
  if (filtered.length === 0) {
    container.innerHTML = `<div class="empty-state"><p>No ${activeBudgetPeriod} budgets. Add one above.</p></div>`;
    return;
  }

  container.innerHTML = filtered.map(b => {
    const cat = getCategory(b.categoryId);
    const spent = periodTx.filter(t => t.type === 'outflow' && t.categoryId === b.categoryId).reduce((s, t) => s + t.amount, 0);
    const pct = Math.min((spent / b.limit) * 100, 100);
    const remaining = b.limit - spent;
    const cls = pct >= 100 ? 'danger' : pct >= 80 ? 'warning' : '';
    return `
      <div class="budget-item">
        <div class="budget-item-header">
          <div class="budget-cat">
            <div class="budget-icon">${icon(cat.icon, 18)}</div>
            <div>
              <div class="budget-cat-name">${cat.name}</div>
              <span class="budget-period-tag">${b.period}</span>
            </div>
          </div>
          <div class="budget-item-actions">
            <button class="action-btn edit" onclick="openEditBudget('${b.id}')" title="Edit">&#x270E;</button>
            <button class="action-btn delete" onclick="deleteBudget('${b.id}')" title="Delete">&#x2715;</button>
          </div>
        </div>
        <div class="budget-amounts">
          <div>
            <div class="budget-spent-label">Spent</div>
            <div class="budget-spent-val">${formatCurrency(spent)}</div>
          </div>
          <div class="budget-limit-val">Limit: ${formatCurrency(b.limit)}</div>
        </div>
        <div class="progress-bar">
          <div class="progress-fill ${cls}" style="width:${pct}%"></div>
        </div>
        <div class="budget-remaining ${remaining < 0 ? 'over' : 'ok'}">
          ${remaining < 0
            ? `${icon('alert-triangle', 13)} Over budget by ${formatCurrency(Math.abs(remaining))}`
            : `${formatCurrency(remaining)} remaining (${Math.round(pct)}% used)`}
        </div>
      </div>`;
  }).join('');
  refreshIcons();
}

// ═══════════════════════════════════════════════
//  8. RENDER: BILLS
// ═══════════════════════════════════════════════

function renderBillsList() {
  const container = document.getElementById('billsList');
  if (state.bills.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">${icon('receipt', 36)}</div>
        <p>Add recurring bills to auto-track monthly or daily deductions.</p>
      </div>`;
    refreshIcons();
    return;
  }
  const sorted = [...state.bills].sort((a, b) => (a.dayOfMonth || 0) - (b.dayOfMonth || 0));
  container.innerHTML = sorted.map(b => {
    const cat = getCategory(b.categoryId);
    const today = new Date().getDate();
    const daysUntil = b.frequency === 'monthly' && b.dayOfMonth ? b.dayOfMonth - today : null;
    const isToday = daysUntil === 0;
    const dueLabel = b.frequency === 'daily' ? 'Daily'
      : isToday      ? 'Due today'
      : daysUntil < 0 ? `Day ${b.dayOfMonth}`
      : `In ${daysUntil}d (Day ${b.dayOfMonth})`;
    return `
      <div class="bill-item">
        <div class="bill-icon">${icon(cat.icon, 20)}</div>
        <div class="bill-info">
          <div class="bill-name">${b.name}</div>
          <div class="bill-meta">
            <span class="bill-freq-tag">${b.frequency}</span>
            <span class="bill-due${isToday ? ' today' : ''}">${dueLabel}</span>
            ${b.autoDeduct ? `<span class="bill-auto-tag">${icon('zap', 10)} Auto</span>` : ''}
          </div>
        </div>
        <span class="bill-amount">${formatCurrency(b.amount)}</span>
        <div class="bill-actions">
          <button class="action-btn edit" onclick="openEditBill('${b.id}')" title="Edit">&#x270E;</button>
          <button class="action-btn delete" onclick="deleteBill('${b.id}')" title="Delete">&#x2715;</button>
        </div>
      </div>`;
  }).join('');
  refreshIcons();
}

// ═══════════════════════════════════════════════
//  9. RENDER: GOALS
// ═══════════════════════════════════════════════

let activeGoalFilter = 'all';

function renderGoalsList() {
  const container = document.getElementById('goalsList');
  let goals = state.goals;
  if (activeGoalFilter !== 'all') goals = goals.filter(g => g.type === activeGoalFilter);

  if (goals.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">${icon('trophy', 36)}</div>
        <p>No goals yet. Add one above.</p>
      </div>`;
    refreshIcons();
    return;
  }

  container.innerHTML = goals.map(g => {
    const pct = Math.min(Math.round((g.current / g.target) * 100), 100);
    const remaining = g.target - g.current;
    const circumference = 2 * Math.PI * 34;
    const dash = (pct / 100) * circumference;
    const arcColor = g.type === 'debt' ? '#e74c3c' : 'var(--clr-secondary)';
    const deadlineStr = g.deadline ? formatDate(g.deadline) : '';
    const daysLeft = g.deadline ? Math.ceil((new Date(g.deadline) - new Date()) / 86400000) : null;
    const deadlineWarning = daysLeft !== null && daysLeft < 30
      ? ` (${daysLeft > 0 ? daysLeft + 'd left' : 'overdue!'})`
      : '';
    const badgeIcon = g.type === 'savings' ? 'piggy-bank' : 'trending-down';

    return `
      <div class="goal-card ${g.type}">
        <div class="goal-header">
          <div class="goal-title-wrap">
            <div class="goal-type-badge ${g.type}">
              ${icon(badgeIcon, 10)}
              ${g.type === 'savings' ? 'Savings' : 'Debt Payoff'}
            </div>
            <div class="goal-name">${g.name}</div>
            ${g.note ? `<div style="font-size:0.72rem;color:var(--clr-text-muted);margin-top:3px;">${g.note}</div>` : ''}
          </div>
          <div class="goal-actions">
            <button class="action-btn edit" onclick="openEditGoal('${g.id}')" title="Edit">&#x270E;</button>
            <button class="action-btn delete" onclick="deleteGoal('${g.id}')" title="Delete">&#x2715;</button>
          </div>
        </div>
        <div class="goal-progress-wrap">
          <div class="goal-arc">
            <svg viewBox="0 0 76 76">
              <circle cx="38" cy="38" r="34" fill="none" stroke="#eeeeee" stroke-width="7"/>
              <circle cx="38" cy="38" r="34" fill="none" stroke="${arcColor}" stroke-width="7"
                stroke-dasharray="${dash} ${circumference}" stroke-linecap="round"/>
            </svg>
            <div class="goal-arc-pct">
              <span class="goal-arc-num">${pct}%</span>
              <span class="goal-arc-label">done</span>
            </div>
          </div>
          <div class="goal-amounts">
            <div class="goal-amount-row">
              <span class="goal-amount-label">${g.type === 'savings' ? 'Saved' : 'Paid Off'}</span>
              <span class="goal-amount-val highlight">${formatCurrency(g.current)}</span>
            </div>
            <div class="goal-amount-row">
              <span class="goal-amount-label">Target</span>
              <span class="goal-amount-val">${formatCurrency(g.target)}</span>
            </div>
            <div class="goal-amount-row">
              <span class="goal-amount-label">Remaining</span>
              <span class="goal-amount-val">${formatCurrency(Math.max(remaining, 0))}</span>
            </div>
          </div>
        </div>
        ${deadlineStr ? `
          <div class="goal-deadline">
            ${icon('calendar', 13)}
            Target: ${deadlineStr}${deadlineWarning}
          </div>` : ''}
        <div class="goal-footer">
          <button class="btn-contrib" onclick="openGoalContrib('${g.id}')">+ Update Progress</button>
          ${pct >= 100 ? `<span class="goal-reached">${icon('check-circle', 15)} Goal Reached!</span>` : ''}
        </div>
      </div>`;
  }).join('');
  refreshIcons();
}

// ═══════════════════════════════════════════════
//  10. RENDER: REPORTS + CHARTS
// ═══════════════════════════════════════════════

let activeReportPeriod = 'month';
let chartCategory = null;
let chartBar      = null;
let chartLine     = null;

const CHART_COLORS = [
  '#1f6f5f','#2fa084','#6fcf97','#e74c3c','#e67e22',
  '#9b59b6','#f39c12','#3498db','#e91e63','#8e44ad',
  '#16a085','#27ae60','#d35400','#2980b9','#c0392b',
];

function destroyChart(chart) {
  if (chart) { try { chart.destroy(); } catch(e) {} }
}

function renderReports() {
  const { start, end } = getReportRange(activeReportPeriod);
  const txs = getTransactionsInRange(start, end);
  renderCategoryChart(txs);
  renderBarChart();
  renderLineChart();
  renderAllTransactions(txs);
}

function renderCategoryChart(txs) {
  const outflows = txs.filter(t => t.type === 'outflow');
  const byCategory = {};
  outflows.forEach(t => {
    byCategory[t.categoryId] = (byCategory[t.categoryId] || 0) + t.amount;
  });
  const entries = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
  const labels  = entries.map(([cid]) => getCategory(cid).name);
  const data    = entries.map(([, v]) => v);
  const colors  = entries.map(([cid], i) => getCategory(cid).color || CHART_COLORS[i % CHART_COLORS.length]);
  const total   = data.reduce((s, v) => s + v, 0);

  document.getElementById('doughnutTotal').textContent = formatCurrencyShort(total);

  const legend = document.getElementById('categoryLegend');
  legend.innerHTML = entries.map(([cid, val], i) => {
    const cat = getCategory(cid);
    const pct = total > 0 ? Math.round((val / total) * 100) : 0;
    return `<div class="legend-item">
      <div class="legend-dot" style="background:${cat.color || CHART_COLORS[i % CHART_COLORS.length]}"></div>
      ${cat.name} ${pct}%
    </div>`;
  }).join('');

  destroyChart(chartCategory);
  const ctx = document.getElementById('categoryChart').getContext('2d');
  if (data.length === 0) { ctx.clearRect(0, 0, 200, 200); return; }
  chartCategory = new Chart(ctx, {
    type: 'doughnut',
    data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 2, borderColor: '#ffffff' }] },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '68%',
      plugins: { legend: { display: false }, tooltip: {
        callbacks: { label: (ctx) => ` ${ctx.label}: ${formatCurrency(ctx.parsed)}` }
      }},
    },
  });
}

function renderBarChart() {
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ label: d.toLocaleDateString('en-PH', { month: 'short' }), year: d.getFullYear(), month: d.getMonth() });
  }
  const incomes  = months.map(m => state.transactions.filter(t => t.type === 'inflow'  && new Date(t.date + 'T00:00:00').getMonth() === m.month && new Date(t.date + 'T00:00:00').getFullYear() === m.year).reduce((s, t) => s + t.amount, 0));
  const expenses = months.map(m => state.transactions.filter(t => t.type === 'outflow' && new Date(t.date + 'T00:00:00').getMonth() === m.month && new Date(t.date + 'T00:00:00').getFullYear() === m.year).reduce((s, t) => s + t.amount, 0));

  destroyChart(chartBar);
  const ctx = document.getElementById('incomeExpenseChart').getContext('2d');
  chartBar = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: months.map(m => m.label),
      datasets: [
        { label: 'Income',   data: incomes,  backgroundColor: 'rgba(47,160,132,0.80)', borderRadius: 6, borderSkipped: false },
        { label: 'Expenses', data: expenses, backgroundColor: 'rgba(192,57,43,0.70)',  borderRadius: 6, borderSkipped: false },
      ],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { labels: { font: { size: 11, family: 'Inter' }, color: '#5a7268', boxWidth: 12, padding: 12 } },
        tooltip: { callbacks: { label: (ctx) => ` ${ctx.dataset.label}: ${formatCurrency(ctx.parsed.y)}` } } },
      scales: {
        y: { ticks: { callback: v => formatCurrencyShort(v), color: '#9ab5ad', font: { size: 10, family: 'Inter' } }, grid: { color: 'rgba(0,0,0,0.05)' } },
        x: { ticks: { color: '#9ab5ad', font: { size: 10, family: 'Inter' } }, grid: { display: false } },
      },
    },
  });
}

function renderLineChart() {
  const sorted = [...state.transactions].sort((a, b) => a.date.localeCompare(b.date));
  if (sorted.length === 0) return;

  let running = 0;
  const points = [];
  sorted.forEach(t => {
    running += t.type === 'inflow' ? t.amount : -t.amount;
    points.push({ x: t.date, y: running });
  });

  const byDate = {};
  points.forEach(p => { byDate[p.x] = p.y; });
  const labels = Object.keys(byDate).slice(-30);
  const data   = labels.map(d => byDate[d]);

  destroyChart(chartLine);
  const ctx = document.getElementById('cashflowChart').getContext('2d');
  chartLine = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels.map(d => formatDateShort(d)),
      datasets: [{
        label: 'Balance', data,
        borderColor: '#2fa084', backgroundColor: 'rgba(47,160,132,0.10)',
        borderWidth: 2.5, pointRadius: 3, pointBackgroundColor: '#2fa084',
        fill: true, tension: 0.4,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx) => ` Balance: ${formatCurrency(ctx.parsed.y)}` } } },
      scales: {
        y: { ticks: { callback: v => formatCurrencyShort(v), color: '#9ab5ad', font: { size: 10, family: 'Inter' } }, grid: { color: 'rgba(0,0,0,0.05)' } },
        x: { ticks: { color: '#9ab5ad', font: { size: 10, family: 'Inter' }, maxTicksLimit: 8 }, grid: { display: false } },
      },
    },
  });
}

function renderAllTransactions(txs) {
  const container = document.getElementById('allTransactions');
  const catFilter  = document.getElementById('txCategoryFilter').value;
  const typeFilter = document.getElementById('txTypeFilter').value;

  let filtered = [...txs].sort((a, b) => b.date.localeCompare(a.date));
  if (catFilter)  filtered = filtered.filter(t => t.categoryId === catFilter);
  if (typeFilter) filtered = filtered.filter(t => t.type === typeFilter);

  if (filtered.length === 0) {
    container.innerHTML = `<div class="empty-state"><p>No transactions found.</p></div>`;
    return;
  }
  container.innerHTML = filtered.map(t => renderTransactionItem(t)).join('');
  container.querySelectorAll('.tx-item').forEach(el => {
    el.addEventListener('click', () => openEditTransaction(el.dataset.id));
  });
  refreshIcons();
}

function populateCategoryFilters() {
  const sel = document.getElementById('txCategoryFilter');
  const used = [...new Set(state.transactions.map(t => t.categoryId))];
  sel.innerHTML = '<option value="">All Categories</option>' +
    used.map(cid => { const cat = getCategory(cid); return `<option value="${cid}">${cat.name}</option>`; }).join('');
}

// ═══════════════════════════════════════════════
//  11. MODAL HELPERS
// ═══════════════════════════════════════════════

function openModal(id) {
  const m = document.getElementById(id);
  const b = document.getElementById('modalBackdrop');
  m.classList.remove('hidden');
  b.classList.remove('hidden');
  requestAnimationFrame(() => {
    m.classList.add('visible');
    b.classList.add('visible');
  });
}

function closeModal(id) {
  const m = document.getElementById(id);
  const b = document.getElementById('modalBackdrop');
  m.classList.remove('visible');
  b.classList.remove('visible');
  setTimeout(() => {
    m.classList.add('hidden');
    if (!document.querySelector('.modal.visible')) b.classList.add('hidden');
  }, 320);
}

function closeAllModals() {
  document.querySelectorAll('.modal.visible').forEach(m => closeModal(m.id));
}

function showToast(msg, type = 'success') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = `toast ${type}`;
  setTimeout(() => { t.className = 'toast hidden'; }, 3000);
}

// ═══════════════════════════════════════════════
//  12. TRANSACTION CRUD
// ═══════════════════════════════════════════════

let editingTransId = null;
let currentTransType = 'outflow';

function openAddTransaction(defaultType = 'outflow') {
  editingTransId = null;
  currentTransType = defaultType;
  document.getElementById('transModalTitle').textContent = 'Add Transaction';
  document.getElementById('transAmount').value = '';
  document.getElementById('transDate').value = todayStr();
  document.getElementById('transNote').value = '';
  document.getElementById('transEditId').value = '';
  setTransType(currentTransType);
  populateTransCategorySelect(currentTransType);
  openModal('transactionModal');
  setTimeout(() => document.getElementById('transAmount').focus(), 350);
}

function openEditTransaction(id) {
  const tx = state.transactions.find(t => t.id === id);
  if (!tx) return;
  editingTransId = id;
  currentTransType = tx.type;
  document.getElementById('transModalTitle').textContent = 'Edit Transaction';
  document.getElementById('transAmount').value = tx.amount;
  document.getElementById('transDate').value = tx.date;
  document.getElementById('transNote').value = tx.note || '';
  document.getElementById('transEditId').value = id;
  setTransType(tx.type);
  populateTransCategorySelect(tx.type, tx.categoryId);
  openModal('transactionModal');
}

function setTransType(type) {
  currentTransType = type;
  document.querySelectorAll('#transTypeToggle .type-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.type === type);
  });
  populateTransCategorySelect(type);
}

function populateTransCategorySelect(type, selected = '') {
  const sel = document.getElementById('transCategory');
  const cats = state.categories.filter(c => c.type === type);
  sel.innerHTML = cats.map(c => `<option value="${c.id}" ${c.id === selected ? 'selected' : ''}>${c.name}</option>`).join('');
}

function saveTransaction() {
  const amount = parseFloat(document.getElementById('transAmount').value);
  const categoryId = document.getElementById('transCategory').value;
  const date  = document.getElementById('transDate').value;
  const note  = document.getElementById('transNote').value.trim();

  if (!amount || amount <= 0) { showToast('Enter a valid amount', 'error'); return; }
  if (!date) { showToast('Select a date', 'error'); return; }

  if (editingTransId) {
    const idx = state.transactions.findIndex(t => t.id === editingTransId);
    if (idx !== -1) state.transactions[idx] = { id: editingTransId, amount, type: currentTransType, categoryId, date, note };
    showToast('Transaction updated');
  } else {
    state.transactions.unshift({ id: uid(), amount, type: currentTransType, categoryId, date, note });
    showToast('Transaction added');
  }
  saveState();
  closeModal('transactionModal');
  renderAll();
}

function deleteTransaction(id) {
  state.transactions = state.transactions.filter(t => t.id !== id);
  saveState();
  renderAll();
  showToast('Transaction deleted');
}

// ═══════════════════════════════════════════════
//  13. BUDGET CRUD
// ═══════════════════════════════════════════════

let editingBudgetId = null;
let currentBudgetPeriod = 'monthly';

function openAddBudget() {
  editingBudgetId = null;
  currentBudgetPeriod = activeBudgetPeriod;
  document.getElementById('budgetModalTitle').textContent = 'Add Budget Limit';
  document.getElementById('budgetLimit').value = '';
  document.getElementById('budgetEditId').value = '';
  document.getElementById('budgetPeriodVal').value = currentBudgetPeriod;

  const outflowCats = state.categories.filter(c => c.type === 'outflow');
  document.getElementById('budgetCategory').innerHTML = outflowCats.map(c =>
    `<option value="${c.id}">${c.name}</option>`).join('');

  document.querySelectorAll('#budgetModal .type-btn[data-bperiod]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.bperiod === currentBudgetPeriod);
  });
  openModal('budgetModal');
}

function openEditBudget(id) {
  const b = state.budgets.find(b => b.id === id);
  if (!b) return;
  editingBudgetId = id;
  currentBudgetPeriod = b.period;

  const outflowCats = state.categories.filter(c => c.type === 'outflow');
  document.getElementById('budgetCategory').innerHTML = outflowCats.map(c =>
    `<option value="${c.id}" ${c.id === b.categoryId ? 'selected' : ''}>${c.name}</option>`).join('');
  document.getElementById('budgetLimit').value = b.limit;
  document.getElementById('budgetEditId').value = id;
  document.getElementById('budgetPeriodVal').value = b.period;
  document.getElementById('budgetModalTitle').textContent = 'Edit Budget Limit';

  document.querySelectorAll('#budgetModal .type-btn[data-bperiod]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.bperiod === b.period);
  });
  openModal('budgetModal');
}

function saveBudget() {
  const categoryId = document.getElementById('budgetCategory').value;
  const limit = parseFloat(document.getElementById('budgetLimit').value);
  const period = document.getElementById('budgetPeriodVal').value;

  if (!limit || limit <= 0) { showToast('Enter a valid limit', 'error'); return; }

  if (editingBudgetId) {
    const idx = state.budgets.findIndex(b => b.id === editingBudgetId);
    if (idx !== -1) state.budgets[idx] = { id: editingBudgetId, categoryId, limit, period };
    showToast('Budget updated');
  } else {
    const exists = state.budgets.find(b => b.categoryId === categoryId && b.period === period);
    if (exists) { showToast('Budget for this category already exists', 'error'); return; }
    state.budgets.push({ id: uid(), categoryId, limit, period });
    showToast('Budget added');
  }
  saveState();
  closeModal('budgetModal');
  renderBudgetList();
  renderBudgetSnapshot();
}

function deleteBudget(id) {
  state.budgets = state.budgets.filter(b => b.id !== id);
  saveState();
  renderBudgetList();
  renderBudgetSnapshot();
  showToast('Budget deleted');
}

// ═══════════════════════════════════════════════
//  14. GOAL CRUD
// ═══════════════════════════════════════════════

let editingGoalId = null;
let currentGoalType = 'savings';

function openAddGoal() {
  editingGoalId = null;
  currentGoalType = 'savings';
  document.getElementById('goalModalTitle').textContent = 'New Goal';
  document.getElementById('goalName').value = '';
  document.getElementById('goalTarget').value = '';
  document.getElementById('goalCurrent').value = '';
  document.getElementById('goalDeadline').value = '';
  document.getElementById('goalNote').value = '';
  document.getElementById('goalEditId').value = '';
  document.getElementById('goalTypeVal').value = 'savings';
  setGoalType('savings');
  openModal('goalModal');
}

function openEditGoal(id) {
  const g = state.goals.find(g => g.id === id);
  if (!g) return;
  editingGoalId = id;
  currentGoalType = g.type;
  document.getElementById('goalModalTitle').textContent = 'Edit Goal';
  document.getElementById('goalName').value = g.name;
  document.getElementById('goalTarget').value = g.target;
  document.getElementById('goalCurrent').value = g.current;
  document.getElementById('goalDeadline').value = g.deadline || '';
  document.getElementById('goalNote').value = g.note || '';
  document.getElementById('goalEditId').value = id;
  document.getElementById('goalTypeVal').value = g.type;
  setGoalType(g.type);
  openModal('goalModal');
}

function setGoalType(type) {
  currentGoalType = type;
  document.getElementById('goalTypeVal').value = type;
  document.querySelectorAll('#goalTypeToggle .type-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.gtype === type);
  });
  document.getElementById('goalTargetLabel').textContent = type === 'debt' ? 'Total Debt Amount (\u20B1)' : 'Target Amount (\u20B1)';
  document.getElementById('goalCurrentLabel').textContent = type === 'debt' ? 'Amount Paid Off (\u20B1)' : 'Amount Saved (\u20B1)';
}

function saveGoal() {
  const name    = document.getElementById('goalName').value.trim();
  const target  = parseFloat(document.getElementById('goalTarget').value);
  const current = parseFloat(document.getElementById('goalCurrent').value) || 0;
  const deadline= document.getElementById('goalDeadline').value;
  const note    = document.getElementById('goalNote').value.trim();
  const type    = document.getElementById('goalTypeVal').value;

  if (!name) { showToast('Enter a goal name', 'error'); return; }
  if (!target || target <= 0) { showToast('Enter a valid target', 'error'); return; }

  if (editingGoalId) {
    const idx = state.goals.findIndex(g => g.id === editingGoalId);
    if (idx !== -1) state.goals[idx] = { id: editingGoalId, name, type, target, current, deadline, note };
    showToast('Goal updated');
  } else {
    state.goals.push({ id: uid(), name, type, target, current, deadline, note });
    showToast('Goal added');
  }
  saveState();
  closeModal('goalModal');
  renderGoalsList();
  renderGoalsSnapshot();
}

function deleteGoal(id) {
  state.goals = state.goals.filter(g => g.id !== id);
  saveState();
  renderGoalsList();
  renderGoalsSnapshot();
  showToast('Goal deleted');
}

function openGoalContrib(id) {
  const g = state.goals.find(g => g.id === id);
  if (!g) return;
  document.getElementById('goalContribId').value = id;
  document.getElementById('goalContribTitle').textContent = `Update: ${g.name}`;
  document.getElementById('goalContribLabel').textContent = g.type === 'debt'
    ? `Amount Paid Off (\u20B1) \u2014 currently ${formatCurrency(g.current)}`
    : `Amount Saved (\u20B1) \u2014 currently ${formatCurrency(g.current)}`;
  document.getElementById('goalContribAmount').value = g.current;
  openModal('goalContribModal');
}

function saveGoalContrib() {
  const id = document.getElementById('goalContribId').value;
  const amount = parseFloat(document.getElementById('goalContribAmount').value);
  if (isNaN(amount) || amount < 0) { showToast('Enter a valid amount', 'error'); return; }
  const idx = state.goals.findIndex(g => g.id === id);
  if (idx !== -1) {
    state.goals[idx].current = amount;
    if (amount >= state.goals[idx].target) showToast(`Goal "${state.goals[idx].name}" achieved!`, 'success');
    else showToast('Progress updated');
    saveState();
    closeModal('goalContribModal');
    renderGoalsList();
    renderGoalsSnapshot();
  }
}

// ═══════════════════════════════════════════════
//  15. BILL CRUD
// ═══════════════════════════════════════════════

let editingBillId = null;
let currentBillFreq = 'monthly';

function openAddBill() {
  editingBillId = null;
  currentBillFreq = 'monthly';
  document.getElementById('billModalTitle').textContent = 'Add Bill';
  document.getElementById('billName').value = '';
  document.getElementById('billAmount').value = '';
  document.getElementById('billDay').value = '';
  document.getElementById('billAutoDeduct').checked = true;
  document.getElementById('billEditId').value = '';
  document.getElementById('billFreqVal').value = 'monthly';
  document.getElementById('billDayGroup').style.display = 'flex';
  setBillFreq('monthly');

  const outflowCats = state.categories.filter(c => c.type === 'outflow');
  document.getElementById('billCategory').innerHTML = outflowCats.map(c =>
    `<option value="${c.id}">${c.name}</option>`).join('');
  openModal('billModal');
}

function openEditBill(id) {
  const b = state.bills.find(b => b.id === id);
  if (!b) return;
  editingBillId = id;
  currentBillFreq = b.frequency;
  document.getElementById('billModalTitle').textContent = 'Edit Bill';
  document.getElementById('billName').value = b.name;
  document.getElementById('billAmount').value = b.amount;
  document.getElementById('billDay').value = b.dayOfMonth || '';
  document.getElementById('billAutoDeduct').checked = b.autoDeduct;
  document.getElementById('billEditId').value = id;
  document.getElementById('billFreqVal').value = b.frequency;
  setBillFreq(b.frequency);

  const outflowCats = state.categories.filter(c => c.type === 'outflow');
  document.getElementById('billCategory').innerHTML = outflowCats.map(c =>
    `<option value="${c.id}" ${c.id === b.categoryId ? 'selected' : ''}>${c.name}</option>`).join('');
  openModal('billModal');
}

function setBillFreq(freq) {
  currentBillFreq = freq;
  document.getElementById('billFreqVal').value = freq;
  document.querySelectorAll('#billFreqToggle .type-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.freq === freq);
  });
  document.getElementById('billDayGroup').style.display = freq === 'monthly' ? 'flex' : 'none';
}

function saveBill() {
  const name       = document.getElementById('billName').value.trim();
  const amount     = parseFloat(document.getElementById('billAmount').value);
  const categoryId = document.getElementById('billCategory').value;
  const frequency  = document.getElementById('billFreqVal').value;
  const dayOfMonth = parseInt(document.getElementById('billDay').value) || 1;
  const autoDeduct = document.getElementById('billAutoDeduct').checked;

  if (!name) { showToast('Enter a bill name', 'error'); return; }
  if (!amount || amount <= 0) { showToast('Enter a valid amount', 'error'); return; }

  const billData = { name, amount, categoryId, frequency, dayOfMonth, autoDeduct, lastDeducted: '' };
  if (editingBillId) {
    const idx = state.bills.findIndex(b => b.id === editingBillId);
    if (idx !== -1) { billData.id = editingBillId; billData.lastDeducted = state.bills[idx].lastDeducted || ''; state.bills[idx] = billData; }
    showToast('Bill updated');
  } else {
    billData.id = uid();
    state.bills.push(billData);
    showToast('Bill added');
  }
  saveState();
  closeModal('billModal');
  renderBillsList();
}

function deleteBill(id) {
  state.bills = state.bills.filter(b => b.id !== id);
  saveState();
  renderBillsList();
  showToast('Bill deleted');
}

// ═══════════════════════════════════════════════
//  16. NAVIGATION
// ═══════════════════════════════════════════════

let activeTab = 'dashboard';

function switchTab(tab) {
  activeTab = tab;
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item[data-tab]').forEach(b => b.classList.remove('active'));
  document.getElementById(`tab-${tab}`).classList.add('active');
  document.querySelector(`.nav-item[data-tab="${tab}"]`)?.classList.add('active');

  if (tab === 'reports') { populateCategoryFilters(); renderReports(); }
  if (tab === 'budget')  { renderBudgetList(); renderBillsList(); }
  if (tab === 'goals')   { renderGoalsList(); }
}

// ═══════════════════════════════════════════════
//  17. MASTER RENDER
// ═══════════════════════════════════════════════

function renderAll() {
  renderHeader();
  renderDashboard();
  if (activeTab === 'budget')  { renderBudgetList(); renderBillsList(); }
  if (activeTab === 'goals')   { renderGoalsList(); }
  if (activeTab === 'reports') { populateCategoryFilters(); renderReports(); }
  refreshIcons();
}

// ═══════════════════════════════════════════════
//  18. EVENT LISTENERS
// ═══════════════════════════════════════════════

function bindEvents() {

  // Tab navigation
  document.querySelectorAll('.nav-item[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Link buttons (e.g. "See all" on dashboard)
  document.querySelectorAll('[data-tab]').forEach(btn => {
    if (!btn.classList.contains('nav-item') && !btn.classList.contains('toggle-pill') && !btn.classList.contains('filter-chip') && !btn.classList.contains('period-mode-btn')) {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    }
  });

  // FAB
  document.getElementById('addTransFab').addEventListener('click', () => openAddTransaction('outflow'));

  // ─── Header Period Mode Buttons ───
  document.querySelectorAll('.period-mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      headerPeriodMode   = btn.dataset.mode;
      headerPeriodOffset = 0;            // reset to current period on mode switch
      renderHeader();
    });
  });

  // ─── Prev / Next Period ───
  document.getElementById('prevPeriodBtn').addEventListener('click', () => {
    headerPeriodOffset -= 1;
    renderHeader();
  });

  document.getElementById('nextPeriodBtn').addEventListener('click', () => {
    if (headerPeriodOffset < 0) {
      headerPeriodOffset += 1;
      renderHeader();
    }
  });

  // ─── Swipe on balance card ───
  const header = document.getElementById('appHeader');
  let touchStartX = 0;
  header.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
  header.addEventListener('touchend', e => {
    const diff = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(diff) < 40) return;     // ignore tiny movements
    if (diff < 0) {
      // Swipe left = next period (newer) — matches calendar/gallery convention
      if (headerPeriodOffset < 0) { headerPeriodOffset += 1; renderHeader(); }
    } else {
      // Swipe right = previous period (older)
      headerPeriodOffset -= 1;
      renderHeader();
    }
  }, { passive: true });

  // Sub tabs (Budget)
  document.querySelectorAll('.sub-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.sub-tab').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.sub-pane').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`sub-${btn.dataset.subtab}`).classList.add('active');
    });
  });

  // Budget period toggle
  document.querySelectorAll('#budgetPeriodToggle .toggle-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#budgetPeriodToggle .toggle-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeBudgetPeriod = btn.dataset.period;
      renderBudgetList();
    });
  });

  // Reports period toggle
  document.querySelectorAll('#reportsPeriodToggle .toggle-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#reportsPeriodToggle .toggle-pill').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeReportPeriod = btn.dataset.rperiod;
      renderReports();
    });
  });

  // Goal filter chips
  document.querySelectorAll('.filter-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeGoalFilter = btn.dataset.filter;
      renderGoalsList();
    });
  });

  // Add buttons
  document.getElementById('addBudgetBtn').addEventListener('click', openAddBudget);
  document.getElementById('addBillBtn').addEventListener('click', openAddBill);
  document.getElementById('addGoalBtn').addEventListener('click', openAddGoal);

  // Modal close buttons
  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => closeModal(btn.dataset.close));
  });

  // Backdrop close
  document.getElementById('modalBackdrop').addEventListener('click', closeAllModals);

  // Transaction type toggle
  document.querySelectorAll('#transTypeToggle .type-btn').forEach(btn => {
    btn.addEventListener('click', () => setTransType(btn.dataset.type));
  });

  // Budget period toggle (in modal)
  document.querySelectorAll('#budgetModal .type-btn[data-bperiod]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#budgetModal .type-btn[data-bperiod]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentBudgetPeriod = btn.dataset.bperiod;
      document.getElementById('budgetPeriodVal').value = btn.dataset.bperiod;
    });
  });

  // Goal type toggle
  document.querySelectorAll('#goalTypeToggle .type-btn').forEach(btn => {
    btn.addEventListener('click', () => setGoalType(btn.dataset.gtype));
  });

  // Bill frequency toggle
  document.querySelectorAll('#billFreqToggle .type-btn').forEach(btn => {
    btn.addEventListener('click', () => setBillFreq(btn.dataset.freq));
  });

  // Save buttons
  document.getElementById('saveTransBtn').addEventListener('click', saveTransaction);
  document.getElementById('saveBudgetBtn').addEventListener('click', saveBudget);
  document.getElementById('saveGoalBtn').addEventListener('click', saveGoal);
  document.getElementById('saveBillBtn').addEventListener('click', saveBill);
  document.getElementById('saveGoalContribBtn').addEventListener('click', saveGoalContrib);

  // Transaction filters
  document.getElementById('filterTransBtn').addEventListener('click', () => {
    document.getElementById('txFilterBar').classList.toggle('hidden');
  });
  document.getElementById('txCategoryFilter').addEventListener('change', () => {
    const { start, end } = getReportRange(activeReportPeriod);
    renderAllTransactions(getTransactionsInRange(start, end));
  });
  document.getElementById('txTypeFilter').addEventListener('change', () => {
    const { start, end } = getReportRange(activeReportPeriod);
    renderAllTransactions(getTransactionsInRange(start, end));
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeAllModals();
    if (e.key === 'ArrowLeft'  && !document.querySelector('.modal.visible')) { headerPeriodOffset -= 1; renderHeader(); }
    if (e.key === 'ArrowRight' && !document.querySelector('.modal.visible') && headerPeriodOffset < 0) { headerPeriodOffset += 1; renderHeader(); }
  });

  // Swipe-down to close modal
  document.querySelectorAll('.modal').forEach(modal => {
    let startY = 0;
    modal.addEventListener('touchstart', e => { startY = e.touches[0].clientY; }, { passive: true });
    modal.addEventListener('touchend', e => {
      const diff = e.changedTouches[0].clientY - startY;
      if (diff > 80) closeModal(modal.id);
    }, { passive: true });
  });
}

// ═══════════════════════════════════════════════
//  19. INIT
// ═══════════════════════════════════════════════

function init() {
  loadState();
  processBills();
  bindEvents();
  renderAll();
}

document.addEventListener('DOMContentLoaded', init);
