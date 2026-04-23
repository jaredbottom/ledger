import { useState } from 'react';
import Tag from '../components/Tag.jsx';
import TagPicker from '../components/TagPicker.jsx';
import SwipeableRow from '../components/SwipeableRow.jsx';
import { uid, today, fmt, friendlyDate, monthLabel } from '../helpers.js';

function EditableExpenseRow({ e, tags, onSave, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [f, setF] = useState({ ...e });
  const sf = (k, v) => setF((p) => ({ ...p, [k]: v }));

  const save = () => {
    onSave({ ...f, amount: parseFloat(f.amount) || 0 });
    setEditing(false);
  };
  const cancel = () => {
    setF({ ...e });
    setEditing(false);
  };

  const eTags = tags.filter((t) => (e.tags || []).includes(t.id));

  return (
    <SwipeableRow onDelete={onDelete} disabled={editing}>
      {editing ? (
        <div style={{ padding: '12px 16px', background: 'var(--bg3)', borderBottom: '1px solid var(--border)' }}>
          <div className="input-row" style={{ marginBottom: 8 }}>
            <div className="field" style={{ maxWidth: 120 }}>
              <label>Amount</label>
              <input className="input" type="number" value={f.amount} onChange={(ev) => sf('amount', ev.target.value)} />
            </div>
            <div className="field">
              <label>Place</label>
              <input className="input" value={f.place} onChange={(ev) => sf('place', ev.target.value)} />
            </div>
            <div className="field" style={{ maxWidth: 150 }}>
              <label>Card</label>
              <input className="input" value={f.card} onChange={(ev) => sf('card', ev.target.value)} />
            </div>
            <div className="field" style={{ maxWidth: 155 }}>
              <label>Date</label>
              <input className="input" type="date" value={f.date} onChange={(ev) => sf('date', ev.target.value)} />
            </div>
          </div>
          <div className="field" style={{ marginBottom: 10 }}>
            <label>Tags</label>
            <TagPicker tags={tags} selected={f.tags || []} onChange={(v) => sf('tags', v)} />
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-primary btn-sm" onClick={save}>Save</button>
            <button className="btn btn-ghost btn-sm" onClick={cancel}>Cancel</button>
            <button className="btn btn-danger btn-sm" style={{ marginLeft: 'auto' }} onClick={() => { onDelete(); setEditing(false); }}>Delete</button>
          </div>
        </div>
      ) : (
        <div className="expense-row" onClick={() => setEditing(true)} style={{ cursor: 'pointer' }}>
          <div className="expense-row-left">
            <div className="expense-row-place">{e.place}</div>
            <div className="expense-row-meta">
              {e.card && <span className="expense-row-card">{e.card}</span>}
              {eTags.map((t) => <Tag key={t.id} tag={t} />)}
            </div>
          </div>
          <div className="expense-row-right">
            <span className="expense-row-amount">{fmt(e.amount)}</span>
            <span style={{ fontSize: 11, color: 'var(--text3)' }}>›</span>
          </div>
        </div>
      )}
    </SwipeableRow>
  );
}

export default function ExpensesPage({ expenses, tags, onAdd, onUpdate, onDelete }) {
  const [form, setForm] = useState({ amount: '', place: '', card: '', date: today(), tags: [] });
  const [filterTag, setFilterTag] = useState(null);
  const [search, setSearch] = useState('');

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const addExpense = () => {
    if (!form.amount || !form.place) return;
    const expense = { id: uid(), ...form, amount: parseFloat(form.amount) };
    onAdd(expense);
    setForm({ amount: '', place: '', card: form.card, date: today(), tags: [] });
  };

  const filtered = expenses.filter((e) => {
    if (filterTag && !(e.tags || []).includes(filterTag)) return false;
    if (search && !e.place.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const total = filtered.reduce((s, e) => s + e.amount, 0);

  // Group by date
  const sorted = [...filtered].sort((a, b) => b.date.localeCompare(a.date));
  const dateMap = {};
  sorted.forEach((e) => {
    if (!dateMap[e.date]) dateMap[e.date] = [];
    dateMap[e.date].push(e);
  });
  const dates = Object.keys(dateMap).sort((a, b) => b.localeCompare(a));

  return (
    <div className="page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="page-title">Expenses</div>
          <div className="page-subtitle">
            {expenses.length} entries · {fmt(expenses.reduce((s, e) => s + e.amount, 0))} total
          </div>
        </div>
      </div>

      {/* Add form */}
      <div className="add-form">
        <div className="form-title">New Entry</div>
        <div className="input-row" style={{ marginBottom: 10 }}>
          <div className="field" style={{ maxWidth: 140 }}>
            <label>Amount</label>
            <input
              className="input"
              type="number"
              placeholder="0.00"
              value={form.amount}
              onChange={(e) => set('amount', e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addExpense()}
            />
          </div>
          <div className="field">
            <label>Place</label>
            <input
              className="input"
              placeholder="Where?"
              value={form.place}
              onChange={(e) => set('place', e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addExpense()}
            />
          </div>
          <div className="field" style={{ maxWidth: 160 }}>
            <label>Card</label>
            <input
              className="input"
              placeholder="Card / account"
              value={form.card}
              onChange={(e) => set('card', e.target.value)}
            />
          </div>
          <div className="field" style={{ maxWidth: 160 }}>
            <label>Date</label>
            <input className="input" type="date" value={form.date} onChange={(e) => set('date', e.target.value)} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <div className="field" style={{ flex: 1 }}>
            <label>Tags</label>
            <TagPicker tags={tags} selected={form.tags} onChange={(v) => set('tags', v)} />
          </div>
          <button className="btn btn-primary" onClick={addExpense} style={{ marginBottom: 1 }}>
            Add
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="filter-bar">
        <div className="filter-bar-top">
          <input
            className="search-input"
            placeholder="Search place…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {filtered.length > 0 && (
            <span style={{ color: 'var(--text3)', fontSize: 12, fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
              {fmt(total)}
            </span>
          )}
        </div>
        <div className="filter-tags-row">
          <span className={`filter-tag ${filterTag === null ? 'active' : ''}`} onClick={() => setFilterTag(null)}>
            All
          </span>
          {tags.map((t) => (
            <span
              key={t.id}
              className={`filter-tag ${filterTag === t.id ? 'active' : ''}`}
              style={filterTag === t.id ? { borderColor: t.color.text, color: t.color.text, background: t.color.bg } : {}}
              onClick={() => setFilterTag(filterTag === t.id ? null : t.id)}
            >
              {t.name}
            </span>
          ))}
        </div>
      </div>

      {/* Grouped expense list */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {filtered.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">◎</div>
            <div className="empty-text">No expenses yet</div>
          </div>
        ) : (
          <div className="expense-list">
            {(() => {
              let lastMonth = null;
              return dates.map((date) => {
                const month = date.slice(0, 7);
                const showMonth = month !== lastMonth;
                lastMonth = month;
                const dayTotal = dateMap[date].reduce((s, e) => s + e.amount, 0);
                return (
                  <div key={date}>
                    {showMonth && <div className="month-divider">{monthLabel(date)}</div>}
                    <div className="day-header">
                      <span>{friendlyDate(date)}</span>
                      <span className="day-header-total">{fmt(dayTotal)}</span>
                    </div>
                    {dateMap[date].map((e) => (
                      <EditableExpenseRow
                        key={e.id}
                        e={e}
                        tags={tags}
                        onSave={(updated) => onUpdate(e.id, updated)}
                        onDelete={() => onDelete(e.id)}
                      />
                    ))}
                  </div>
                );
              });
            })()}
          </div>
        )}
      </div>
    </div>
  );
}
