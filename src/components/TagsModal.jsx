import { useState } from 'react';
import Tag from './Tag.jsx';
import { TAG_COLORS, uid } from '../helpers.js';

export default function TagsModal({ tags, onAdd, onRemove, onClose, embedded = false }) {
  const [name, setName] = useState('');
  const [colorIdx, setColorIdx] = useState(0);

  const add = () => {
    if (!name.trim()) return;
    onAdd({ id: uid(), name: name.trim(), color: TAG_COLORS[colorIdx] });
    setName('');
  };

  return (
    <div
      className={embedded ? '' : 'modal-overlay'}
      onClick={!embedded ? (e) => e.target === e.currentTarget && onClose() : undefined}
    >
      <div className={embedded ? '' : 'modal'}>
        {!embedded && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div className="modal-title" style={{ marginBottom: 0 }}>Manage Tags</div>
            <button className="btn btn-ghost btn-sm" onClick={onClose}>Close</button>
          </div>
        )}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              className="input"
              placeholder="Tag name…"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && add()}
              style={{ flex: 1 }}
            />
            <button className="btn btn-primary" onClick={add}>Add</button>
          </div>
          <div className="color-grid">
            {TAG_COLORS.map((c, i) => (
              <div
                key={i}
                className={`color-swatch ${colorIdx === i ? 'active' : ''}`}
                style={{ background: c.bg, border: `2px solid ${colorIdx === i ? c.text : 'transparent'}` }}
                onClick={() => setColorIdx(i)}
              />
            ))}
          </div>
        </div>
        <div>
          {tags.length === 0 && (
            <div style={{ color: 'var(--text3)', fontSize: 13, textAlign: 'center', padding: '20px 0' }}>
              No tags yet
            </div>
          )}
          {tags.map((t) => (
            <div
              key={t.id}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}
            >
              <Tag tag={t} />
              <button
                className="btn btn-danger btn-sm"
                style={{ marginLeft: 'auto' }}
                onClick={() => onRemove(t.id)}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
