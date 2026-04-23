import { useState, useEffect, useRef } from 'react';
import TagPicker from './TagPicker.jsx';
import { uid, today } from '../helpers.js';

export default function QuickAddModal({ tags, onAdd, onClose }) {
  const [form, setForm] = useState({ amount: '', place: '', card: '', date: today(), tags: [] });
  const amountRef = useRef();

  useEffect(() => {
    setTimeout(() => amountRef.current?.focus(), 50);
  }, []);

  const sf = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = () => {
    if (!form.amount || !form.place) return;
    onAdd({ id: uid(), ...form, amount: parseFloat(form.amount) });
    onClose();
  };

  const onKey = (e) => {
    if (e.key === 'Enter') submit();
    if (e.key === 'Escape') onClose();
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ width: 420 }} onKeyDown={onKey}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div className="modal-title" style={{ marginBottom: 0 }}>Quick Add</div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
          <div className="field" style={{ maxWidth: 130 }}>
            <label>Amount</label>
            <input
              ref={amountRef}
              className="input"
              type="number"
              placeholder="0.00"
              value={form.amount}
              onChange={(e) => sf('amount', e.target.value)}
            />
          </div>
          <div className="field">
            <label>Place</label>
            <input
              className="input"
              placeholder="Where?"
              value={form.place}
              onChange={(e) => sf('place', e.target.value)}
            />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
          <div className="field">
            <label>Card</label>
            <input
              className="input"
              placeholder="Card / account"
              value={form.card}
              onChange={(e) => sf('card', e.target.value)}
            />
          </div>
          <div className="field" style={{ maxWidth: 155 }}>
            <label>Date</label>
            <input
              className="input"
              type="date"
              value={form.date}
              onChange={(e) => sf('date', e.target.value)}
            />
          </div>
        </div>
        <div className="field" style={{ marginBottom: 18 }}>
          <label>Tags</label>
          <TagPicker tags={tags} selected={form.tags} onChange={(v) => sf('tags', v)} />
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={submit}>Add Expense</button>
        </div>
      </div>
    </div>
  );
}
