# BudgetFlow

A mobile-first personal finance tracker built with vanilla HTML, CSS, and JavaScript. No frameworks, no build tools, no backend — just open the file and go.

![BudgetFlow](https://img.shields.io/badge/version-1.0.0-2fa084?style=flat-square) ![License](https://img.shields.io/badge/license-MIT-1f6f5f?style=flat-square) ![PRs Welcome](https://img.shields.io/badge/PRs-welcome-6fcf97?style=flat-square)

---

## Features

- **Period-aware Net Balance** — Cumulative running balance as of any day, week, month, or year. Navigate backward in time to see exactly what your balance was at any past period.
- **Income & Expense Tracking** — Log inflows and outflows with 16 built-in categories, custom notes, and dates.
- **Budget Limits** — Set monthly or weekly spending caps per category with progress bars and over-budget alerts.
- **Recurring Bills** — Add monthly or daily bills with optional auto-deduction that fires on app load.
- **Savings & Debt Goals** — Track savings targets or debt payoff progress with circular arc indicators.
- **Charts & Reports** — Doughnut chart by category, 6-month income vs expenses bar chart, and a running cash flow line chart.
- **Period Navigation** — Switch between Daily, Weekly, Monthly, and Yearly views. Swipe left/right on the header or use the arrow buttons to go back and forward in time.
- **Offline-first** — All data is stored in `localStorage`. Nothing leaves your device.

---

## Getting Started

No installation required.

```bash
git clone https://github.com/your-username/budgetflow.git
cd budgetflow
```

Then open `index.html` in any modern browser. That's it.

> For the best experience, open it on a mobile device or use your browser's mobile emulator (DevTools > Toggle device toolbar).

### File Structure

```
budgetflow/
├── index.html      # App shell, layout, and all modals
├── styles.css      # Design tokens, component styles, responsive rules
└── app.js          # All state, logic, rendering, and event handling
```

---

## How the Balance Works

The **Net Balance** shown in the header is a **cumulative running total** — the sum of all transactions from the beginning of your history up to and including the end of the selected period.

| Scenario | Result |
|---|---|
| Earned ₱5,000 on May 1 | May 1 (daily) shows **₱5,000** |
| Spent ₱200 on May 2 | May 2 (daily) shows **₱4,800** |
| Viewing May (monthly) | Shows **₱4,800** (net of the whole month) |

The **Income** and **Expenses** pills below the balance show only what happened *within* the selected period, so you can see both the snapshot and the running total at the same time.

---

## Categories

### Income
`Allowance` `Salary` `Freelance` `Investment` `Gift` `Other Income`

### Expenses
`Food` `Transportation` `Housing` `Utilities` `Entertainment` `Shopping` `Healthcare` `Education` `Subscriptions` `Other`

---

## Usage

### Adding a Transaction
Tap the **+** button in the bottom navigation bar. Choose Income or Expense, enter an amount, pick a category, set a date, and optionally add a note.

### Setting a Budget Limit
Go to **Budget → Budget Limits**. Tap **+ Add Budget Limit**, choose a category and a cap amount, and pick Monthly or Weekly. The dashboard snapshot and the budget tab will both track your spending against the limit in real time.

### Adding a Recurring Bill
Go to **Budget → Bills**. Tap **+ Add Bill**. Set the name, amount, category, frequency (Monthly or Daily), and the day of month it falls on. Enable **Auto-Deduct** to have it automatically posted as an expense each time the app loads on or after the due date.

### Tracking a Goal
Go to **Goals**. Tap **+ New Goal**. Choose Savings or Debt Payoff, set a target amount and optional deadline. Tap **Update Progress** at any time to log how much you have saved or paid off.

### Navigating Time
Use the **Daily / Weekly / Monthly / Yearly** tabs in the header to change the period mode. Use the **chevron buttons** (or swipe left/right on the header) to move backward and forward between periods.

---

## Data & Privacy

All data is saved to your browser's `localStorage` under the key `budgetflow_v1`. Nothing is sent to any server.

To back up your data, open the browser console and run:

```js
copy(localStorage.getItem('budgetflow_v1'))
```

Then paste it somewhere safe. To restore, run:

```js
localStorage.setItem('budgetflow_v1', '<your pasted data here>')
```

To reset everything:

```js
localStorage.removeItem('budgetflow_v1')
```

---

## Keyboard Shortcuts

| Key | Action |
|---|---|
| `←` Arrow Left | Go to previous period |
| `→` Arrow Right | Go to next period |
| `Escape` | Close any open modal |

---

## Dependencies

Loaded via CDN — no npm or bundler needed.

| Library | Purpose |
|---|---|
| [Chart.js 4.4.1](https://www.chartjs.org/) | Doughnut, bar, and line charts |
| [Lucide Icons](https://lucide.dev/) | All UI icons |
| [Inter (Google Fonts)](https://fonts.google.com/specimen/Inter) | Typography |

---

## Browser Support

Works in any modern browser that supports CSS custom properties, `localStorage`, and `canvas`.

| Chrome | Firefox | Safari | Edge |
|---|---|---|---|
| 90+ | 88+ | 14+ | 90+ |

---

## Contributing

Pull requests are welcome. For significant changes, open an issue first to discuss what you'd like to change.

1. Fork the repo
2. Create your branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add your feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

---

## License

[MIT](LICENSE)
