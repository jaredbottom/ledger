import { useState, useEffect, useRef } from 'react';
import Tag from './Tag.jsx';

export default function TagPicker({ tags, selected, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const h = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const selectedTags = tags.filter((t) => selected.includes(t.id));
  const toggle = (id) =>
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);

  return (
    <div className="tag-picker" ref={ref}>
      <div className="tag-picker-input" onClick={() => setOpen((o) => !o)}>
        {selectedTags.map((t) => (
          <Tag key={t.id} tag={t} onRemove={(id) => onChange(selected.filter((x) => x !== id))} />
        ))}
        {selectedTags.length === 0 && (
          <span style={{ color: 'var(--text3)', fontSize: 13 }}>Add tags…</span>
        )}
      </div>
      {open && (
        <div className="tag-picker-dropdown">
          {tags.length === 0 && (
            <div style={{ padding: '10px 12px', color: 'var(--text3)', fontSize: 13 }}>
              No tags yet — create some in Settings
            </div>
          )}
          {tags.map((t) => (
            <div
              key={t.id}
              className={`tag-option ${selected.includes(t.id) ? 'selected' : ''}`}
              onClick={() => toggle(t.id)}
            >
              <Tag tag={t} />
              {selected.includes(t.id) && (
                <span style={{ marginLeft: 'auto', color: 'var(--amber)', fontSize: 12 }}>✓</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
