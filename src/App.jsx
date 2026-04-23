import { useState, useEffect, useCallback } from 'react';
import { api } from './api.js';
import { uid } from './helpers.js';
import QuickAddModal from './components/QuickAddModal.jsx';
import ExpensesPage from './pages/ExpensesPage.jsx';
import StatsPage from './pages/StatsPage.jsx';
import BudgetPage from './pages/BudgetPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';

const SETTINGS_KEY = 'ledger_settings';
const SETTINGS_DEFAULTS = { lightMode: false, accentColor: '#f5a623', fontScale: 1.0 };

function loadSettings() {
  try {
    const s = localStorage.getItem(SETTINGS_KEY);
    return s ? { ...SETTINGS_DEFAULTS, ...JSON.parse(s) } : SETTINGS_DEFAULTS;
  } catch {
    return SETTINGS_DEFAULTS;
  }
}

const NAV = [
  { id: 'expenses', label: 'Expenses', icon: '↓' },
  { id: 'stats', label: 'Stats', icon: '◈' },
  { id: 'budget', label: 'Budget', icon: '⊞' },
  { id: 'settings', label: 'Settings', icon: '⚙' },
];

export default function App() {
  const [page, setPage] = useState(() => localStorage.getItem('ledger_page') || 'expenses');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const stored = localStorage.getItem('ledger_sidebar');
    if (stored !== null) return stored === 'true';
    return window.innerWidth <= 640;
  });

  const [tags, setTags] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [income, setIncome] = useState([]);
  const [budgetItems, setBudgetItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [quickAdd, setQuickAdd] = useState(false);
  const [settings, setSettings] = useState(loadSettings);

  // Initial data load
  useEffect(() => {
    Promise.all([
      api.tags.list(),
      api.expenses.list(),
      api.budget.income.list(),
      api.budget.items.list(),
    ])
      .then(([t, e, i, b]) => {
        setTags(t);
        setExpenses(e);
        setIncome(i);
        setBudgetItems(b);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Persist page & sidebar state
  useEffect(() => { localStorage.setItem('ledger_page', page); }, [page]);

  const collapse = useCallback((v) => {
    setSidebarCollapsed(v);
    localStorage.setItem('ledger_sidebar', v);
  }, []);

  // Apply settings to DOM
  useEffect(() => {
    document.documentElement.style.setProperty('--amber', settings.accentColor);
    document.documentElement.style.setProperty('--amber-dim', settings.accentColor + '20');
    document.documentElement.style.setProperty('--amber-dim2', settings.accentColor + '10');
    document.body.style.fontSize = 14 * settings.fontScale + 'px';
    document.body.classList.toggle('light', !!settings.lightMode);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  const onSetting = (k, v) => setSettings((s) => ({ ...s, [k]: v }));

  // N key = quick add
  useEffect(() => {
    const h = (e) => {
      if (
        e.key === 'n' &&
        !e.metaKey &&
        !e.ctrlKey &&
        e.target.tagName !== 'INPUT' &&
        e.target.tagName !== 'TEXTAREA' &&
        e.target.tagName !== 'SELECT'
      ) {
        setQuickAdd(true);
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  // ── Expenses ───────────────────────────────────────────────────────────────
  const addExpense = (expense) => {
    setExpenses((prev) => [expense, ...prev]);
    api.expenses.create(expense).catch(() => setExpenses((prev) => prev.filter((e) => e.id !== expense.id)));
  };

  const updateExpense = (id, data) => {
    setExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, ...data } : e)));
    api.expenses.update(id, data).catch(() => {});
  };

  const deleteExpense = (id) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    api.expenses.remove(id).catch(() => {});
  };

  // ── Tags ───────────────────────────────────────────────────────────────────
  const addTag = (tag) => {
    setTags((prev) => [...prev, tag]);
    api.tags.create(tag).catch(() => setTags((prev) => prev.filter((t) => t.id !== tag.id)));
  };

  const removeTag = (id) => {
    setTags((prev) => prev.filter((t) => t.id !== id));
    // Clean up tag refs from all entities optimistically
    setExpenses((prev) => prev.map((e) => ({ ...e, tags: (e.tags || []).filter((t) => t !== id) })));
    setIncome((prev) => prev.map((i) => ({ ...i, tags: (i.tags || []).filter((t) => t !== id) })));
    setBudgetItems((prev) => prev.map((b) => ({ ...b, tags: (b.tags || []).filter((t) => t !== id) })));
    api.tags.remove(id).catch(() => {});
  };

  // ── Budget Income ──────────────────────────────────────────────────────────
  const addIncome = (item) => {
    setIncome((prev) => [...prev, item]);
    api.budget.income.create(item).catch(() => setIncome((prev) => prev.filter((i) => i.id !== item.id)));
  };

  const updateIncome = (id, data) => {
    setIncome((prev) => prev.map((i) => (i.id === id ? { ...i, ...data } : i)));
    api.budget.income.update(id, data).catch(() => {});
  };

  const deleteIncome = (id) => {
    setIncome((prev) => prev.filter((i) => i.id !== id));
    api.budget.income.remove(id).catch(() => {});
  };

  // ── Budget Items ───────────────────────────────────────────────────────────
  const addBudgetItem = (item) => {
    setBudgetItems((prev) => [...prev, item]);
    api.budget.items.create(item).catch(() => setBudgetItems((prev) => prev.filter((b) => b.id !== item.id)));
  };

  const updateBudgetItem = (id, data) => {
    setBudgetItems((prev) => prev.map((b) => (b.id === id ? { ...b, ...data } : b)));
    api.budget.items.update(id, data).catch(() => {});
  };

  const deleteBudgetItem = (id) => {
    setBudgetItems((prev) => prev.filter((b) => b.id !== id));
    api.budget.items.remove(id).catch(() => {});
  };

  const navigate = (id) => {
    setPage(id);
    if (window.innerWidth <= 640) collapse(true);
  };

  return (
    <div className="app">
      {/* Mobile backdrop */}
      {!sidebarCollapsed && (
        <div className="sidebar-backdrop" onClick={() => collapse(true)} />
      )}

      {/* Sidebar */}
      <div className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="sidebar-brand">
          <span className="sidebar-brand-text">
            ledger<em>.app</em>
          </span>
          <div className="sidebar-brand-sub">personal finance</div>
          <button
            className="collapse-btn"
            onClick={() => collapse(!sidebarCollapsed)}
            title={sidebarCollapsed ? 'Expand' : 'Collapse'}
          >
            {sidebarCollapsed ? '▶' : '◀'}
          </button>
        </div>

        {NAV.map((n) => (
          <div
            key={n.id}
            className={`nav-item ${page === n.id ? 'active' : ''}`}
            onClick={() => navigate(n.id)}
            title={sidebarCollapsed ? n.label : ''}
          >
            <span className="nav-icon">{n.icon}</span>
            <span className="nav-label">{n.label}</span>
          </div>
        ))}

        <div className="sidebar-bottom">
          <div
            style={{
              fontSize: 10, color: 'var(--text3)', textAlign: 'center', padding: '8px 0',
              letterSpacing: '0.06em', textTransform: 'uppercase',
              opacity: sidebarCollapsed ? 0 : 1, transition: 'opacity 0.15s',
            }}
          >
            v1.0
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="main">
        {loading ? (
          <div className="spinner">Loading…</div>
        ) : (
          <>
            {page === 'expenses' && (
              <ExpensesPage
                expenses={expenses}
                tags={tags}
                onAdd={addExpense}
                onUpdate={updateExpense}
                onDelete={deleteExpense}
              />
            )}
            {page === 'stats' && <StatsPage expenses={expenses} tags={tags} />}
            {page === 'budget' && (
              <BudgetPage
                expenses={expenses}
                tags={tags}
                income={income}
                budgetItems={budgetItems}
                onAddIncome={addIncome}
                onUpdateIncome={updateIncome}
                onDeleteIncome={deleteIncome}
                onAddItem={addBudgetItem}
                onUpdateItem={updateBudgetItem}
                onDeleteItem={deleteBudgetItem}
              />
            )}
            {page === 'settings' && (
              <SettingsPage
                settings={settings}
                onSetting={onSetting}
                tags={tags}
                onAddTag={addTag}
                onRemoveTag={removeTag}
              />
            )}
          </>
        )}
      </div>

      {/* Quick add modal */}
      {quickAdd && (
        <QuickAddModal
          tags={tags}
          onAdd={addExpense}
          onClose={() => setQuickAdd(false)}
        />
      )}

      {/* FAB */}
      {!quickAdd && (
        <button className="fab" onClick={() => setQuickAdd(true)} title="Quick add expense (N)">
          +
        </button>
      )}
    </div>
  );
}
