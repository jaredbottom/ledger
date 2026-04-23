import { useState } from 'react';
import Tag from '../components/Tag.jsx';
import TagPicker from '../components/TagPicker.jsx';
import { uid, fmt, toMonthly, FREQ_LABELS } from '../helpers.js';

const freqOptions = Object.entries(FREQ_LABELS);

function AddRowForm({ onAdd, placeholder, isIncome = false, tags = [] }) {
  const [show, setShow] = useState(false);
  const blank = { name: '', amount: '', frequency: 'monthly', taxRate: '', tags: [] };
  const [f, setF] = useState(blank);
  const sf = (k, v) => setF((p) => ({ ...p, [k]: v }));

  const add = () => {
    if (!f.name.trim() || !f.amount) return;
    onAdd({ id: uid(), name: f.name.trim(), amount: parseFloat(f.amount), frequency: f.frequency, taxRate: parseFloat(f.taxRate) || 0, tags: f.tags });
    setF(blank);
    setShow(false);
  };

  if (!show) {
    return (
      <button className="btn btn-ghost btn-sm" onClick={() => setShow(true)} style={{ marginBottom: 8 }}>
        + Add
      </button>
    );
  }

  return (
    <div className="inline-form">
      <div className="field" style={{ flex: 2, minWidth: 120 }}>
        <label>Name</label>
        <input className="input" placeholder={placeholder} value={f.name} onChange={(e) => sf('name', e.target.value)} />
      </div>
      <div className="field" style={{ maxWidth: 120 }}>
        <label>Amount</label>
        <input className="input" type="number" placeholder="0.00" value={f.amount} onChange={(e) => sf('amount', e.target.value)} />
      </div>
      <div className="field" style={{ maxWidth: 130 }}>
        <label>Frequency</label>
        <select className="select" value={f.frequency} onChange={(e) => sf('frequency', e.target.value)}>
          {freqOptions.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      {isIncome && (
        <div className="field" style={{ maxWidth: 90 }}>
          <label>Tax %</label>
          <input className="input" type="number" placeholder="0" min="0" max="100" value={f.taxRate} onChange={(e) => sf('taxRate', e.target.value)} />
        </div>
      )}
      {!isIncome && (
        <div className="field" style={{ minWidth: 140 }}>
          <label>Tags</label>
          <TagPicker tags={tags} selected={f.tags} onChange={(v) => sf('tags', v)} />
        </div>
      )}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', paddingTop: 18 }}>
        <button className="btn btn-primary" onClick={add}>Add</button>
        <button className="btn btn-ghost btn-sm" onClick={() => { setF(blank); setShow(false); }}>Cancel</button>
      </div>
    </div>
  );
}

function BudgetRow({ item, onUpdate, onDelete, isIncome, tags, amountColor }) {
  const [editing, setEditing] = useState(false);
  const [f, setF] = useState({ ...item, taxRate: item.taxRate ?? 0, tags: item.tags ?? [] });
  const sf = (k, v) => setF((p) => ({ ...p, [k]: v }));

  const save = () => {
    onUpdate({ ...f, amount: parseFloat(f.amount) || 0, taxRate: parseFloat(f.taxRate) || 0 });
    setEditing(false);
  };
  const cancel = () => {
    setF({ ...item, taxRate: item.taxRate ?? 0, tags: item.tags ?? [] });
    setEditing(false);
  };

  const itemTags = (tags || []).filter((t) => (item.tags || []).includes(t.id));
  const gross = toMonthly(item.amount, item.frequency);
  const netAmt = isIncome ? gross * (1 - (item.taxRate || 0) / 100) : gross;
  const showMonthly = item.frequency !== 'monthly';

  if (editing) {
    return (
      <div className="inline-form" style={{ marginBottom: 8 }}>
        <div className="field" style={{ flex: 2, minWidth: 100 }}>
          <label>Name</label>
          <input className="input" value={f.name} onChange={(e) => sf('name', e.target.value)} />
        </div>
        <div className="field" style={{ maxWidth: 120 }}>
          <label>Amount</label>
          <input className="input" type="number" value={f.amount} onChange={(e) => sf('amount', e.target.value)} />
        </div>
        <div className="field" style={{ maxWidth: 130 }}>
          <label>Frequency</label>
          <select className="select" value={f.frequency} onChange={(e) => sf('frequency', e.target.value)}>
            {freqOptions.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
        {isIncome && (
          <div className="field" style={{ maxWidth: 90 }}>
            <label>Tax %</label>
            <input className="input" type="number" min="0" max="100" value={f.taxRate} onChange={(e) => sf('taxRate', e.target.value)} />
          </div>
        )}
        {!isIncome && (
          <div className="field" style={{ minWidth: 140 }}>
            <label>Tags</label>
            <TagPicker tags={tags} selected={f.tags} onChange={(v) => sf('tags', v)} />
          </div>
        )}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', paddingTop: 18 }}>
          <button className="btn btn-primary btn-sm" onClick={save}>Save</button>
          <button className="btn btn-ghost btn-sm" onClick={cancel}>Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div className="budget-row">
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 500, fontSize: 13, marginBottom: itemTags.length ? 4 : 0 }}>{item.name}</div>
        {itemTags.length > 0 && (
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {itemTags.map((t) => <Tag key={t.id} tag={t} />)}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <span className="budget-row-freq">{FREQ_LABELS[item.frequency]}</span>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: amountColor, fontWeight: 500 }}>{fmt(item.amount)}</div>
          {(showMonthly || (isIncome && item.taxRate > 0)) && (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>
              {fmt(netAmt)}/mo{isIncome && item.taxRate > 0 ? ' net' : ''}
            </div>
          )}
          {isIncome && item.taxRate > 0 && !showMonthly && (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>{item.taxRate}% tax</div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 2 }}>
          <button className="del-btn" style={{ fontSize: 12, color: 'var(--text3)' }} onClick={() => setEditing(true)} title="Edit">✎</button>
          <button className="del-btn" onClick={onDelete} title="Delete">✕</button>
        </div>
      </div>
    </div>
  );
}

export default function BudgetPage({ expenses, tags, income, budgetItems, onAddIncome, onUpdateIncome, onDeleteIncome, onAddItem, onUpdateItem, onDeleteItem }) {
  const totalMonthlyGross = income.reduce((s, i) => s + toMonthly(i.amount, i.frequency), 0);
  const totalMonthlyIncome = income.reduce((s, i) => s + toMonthly(i.amount, i.frequency) * (1 - (i.taxRate || 0) / 100), 0);
  const totalMonthlyExpenses = budgetItems.reduce((s, i) => s + toMonthly(i.amount, i.frequency), 0);
  const net = totalMonthlyIncome - totalMonthlyExpenses;
  const savingsRate = totalMonthlyIncome > 0 ? (net / totalMonthlyIncome) * 100 : 0;
  const spendPct = totalMonthlyIncome > 0 ? Math.min((totalMonthlyExpenses / totalMonthlyIncome) * 100, 100) : 0;

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title">Budget Explorer</div>
        <div className="page-subtitle">Model your monthly cash flow</div>
      </div>

      {/* Net summary */}
      <div className="net-summary">
        <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }} className="net-summary-grid">
          <div>
            <div className="stat-label">Take-home / mo</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 26, color: 'var(--green)', fontWeight: 500, letterSpacing: -1 }}>{fmt(totalMonthlyIncome)}</div>
            {totalMonthlyGross !== totalMonthlyIncome && (
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{fmt(totalMonthlyGross)} gross</div>
            )}
          </div>
          <div>
            <div className="stat-label">Expenses / mo</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 26, color: 'var(--red)', fontWeight: 500, letterSpacing: -1 }}>{fmt(totalMonthlyExpenses)}</div>
          </div>
          <div>
            <div className="stat-label">Net / mo</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 26, color: net >= 0 ? 'var(--amber)' : 'var(--red)', fontWeight: 500, letterSpacing: -1 }}>{fmt(net)}</div>
          </div>
          <div>
            <div className="stat-label">Savings Rate</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 26, color: savingsRate >= 20 ? 'var(--green)' : 'var(--text2)', fontWeight: 500, letterSpacing: -1 }}>{savingsRate.toFixed(1)}%</div>
          </div>
        </div>
        <div className="net-bar">
          <div className="net-bar-fill" style={{ width: `${spendPct}%`, background: spendPct > 90 ? 'var(--red)' : spendPct > 70 ? 'var(--amber)' : 'var(--green)' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text3)' }}>
          <span>{spendPct.toFixed(1)}% of take-home allocated</span>
          <span>{fmt(Math.max(net, 0))} / mo surplus · {fmt(Math.max(net, 0) * 12)} / yr</span>
        </div>
      </div>

      {/* Income */}
      <div className="section-label">Income Streams</div>
      <AddRowForm placeholder="e.g. Salary" isIncome={true} tags={tags} onAdd={onAddIncome} />
      {income.map((item) => (
        <BudgetRow key={item.id} item={item} isIncome={true} tags={tags} amountColor="var(--green)"
          onUpdate={(updated) => onUpdateIncome(item.id, updated)}
          onDelete={() => onDeleteIncome(item.id)} />
      ))}
      {income.length === 0 && <div style={{ color: 'var(--text3)', fontSize: 13, padding: '8px 0' }}>No income streams added</div>}

      {/* Planned expenses */}
      <div className="section-label">Planned Expenses</div>
      <AddRowForm placeholder="e.g. Rent" isIncome={false} tags={tags} onAdd={onAddItem} />
      {budgetItems.map((item) => (
        <BudgetRow key={item.id} item={item} isIncome={false} tags={tags} amountColor="var(--red)"
          onUpdate={(updated) => onUpdateItem(item.id, updated)}
          onDelete={() => onDeleteItem(item.id)} />
      ))}
      {budgetItems.length === 0 && <div style={{ color: 'var(--text3)', fontSize: 13, padding: '8px 0' }}>No planned expenses added</div>}

      {/* Tag allocation breakdown */}
      {budgetItems.length > 0 && (() => {
        const tagTotals = tags
          .map((t) => ({
            tag: t,
            monthly: budgetItems
              .filter((i) => (i.tags || []).includes(t.id))
              .reduce((s, i) => s + toMonthly(i.amount, i.frequency), 0),
          }))
          .filter((x) => x.monthly > 0)
          .sort((a, b) => b.monthly - a.monthly);

        const untaggedMonthly = budgetItems
          .filter((i) => !(i.tags || []).length)
          .reduce((s, i) => s + toMonthly(i.amount, i.frequency), 0);

        if (!tagTotals.length && !untaggedMonthly) return null;

        return (
          <>
            <div className="section-label">Allocation by Tag</div>
            <div className="card" style={{ padding: '16px 20px' }}>
              {tagTotals.map(({ tag, monthly }) => {
                const pct = totalMonthlyExpenses > 0 ? (monthly / totalMonthlyExpenses) * 100 : 0;
                const incomePct = totalMonthlyIncome > 0 ? (monthly / totalMonthlyIncome) * 100 : 0;
                return (
                  <div key={tag.id} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                      <Tag tag={tag} />
                      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                        {totalMonthlyIncome > 0 && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text3)' }}>{incomePct.toFixed(1)}% of income</span>}
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--text2)', fontWeight: 500 }}>
                          {fmt(monthly)}<span style={{ color: 'var(--text3)', fontSize: 11 }}>/mo</span>
                        </span>
                      </div>
                    </div>
                    <div style={{ height: 5, background: 'var(--bg4)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: tag.color.text, borderRadius: 3, opacity: 0.7 }} />
                    </div>
                  </div>
                );
              })}
              {untaggedMonthly > 0 && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                    <span style={{ fontSize: 12, color: 'var(--text3)' }}>Untagged</span>
                    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                      {totalMonthlyIncome > 0 && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text3)' }}>{(untaggedMonthly / totalMonthlyIncome * 100).toFixed(1)}% of income</span>}
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--text3)', fontWeight: 500 }}>
                        {fmt(untaggedMonthly)}<span style={{ fontSize: 11 }}>/mo</span>
                      </span>
                    </div>
                  </div>
                  <div style={{ height: 5, background: 'var(--bg4)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${totalMonthlyExpenses > 0 ? (untaggedMonthly / totalMonthlyExpenses) * 100 : 0}%`, height: '100%', background: 'var(--text3)', borderRadius: 3, opacity: 0.5 }} />
                  </div>
                </div>
              )}
            </div>
          </>
        );
      })()}

      {/* Yearly projections */}
      {(income.length > 0 || budgetItems.length > 0) && (
        <>
          <div className="section-label">Yearly Projections</div>
          <div className="grid-3">
            {[
              { label: 'Annual Take-home', value: fmt(totalMonthlyIncome * 12), color: 'var(--green)' },
              { label: 'Annual Expenses', value: fmt(totalMonthlyExpenses * 12), color: 'var(--red)' },
              { label: 'Annual Net', value: fmt(net * 12), color: net >= 0 ? 'var(--amber)' : 'var(--red)' },
            ].map((s) => (
              <div key={s.label} className="card">
                <div className="stat-label">{s.label}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 500, color: s.color, letterSpacing: -0.5, marginTop: 4 }}>{s.value}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
