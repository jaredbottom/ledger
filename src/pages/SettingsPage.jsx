import TagsModal from '../components/TagsModal.jsx';

const ACCENT_PRESETS = [
  '#f5a623', '#60a5fa', '#4ade80', '#fb7185', '#a78bfa', '#22d3ee', '#f472b6', '#34d399',
];

export default function SettingsPage({ settings, onSetting, tags, onAddTag, onRemoveTag }) {
  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title">Settings</div>
        <div className="page-subtitle">Appearance &amp; preferences</div>
      </div>

      {/* Appearance */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-title">Appearance</div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10 }}>Theme</div>
          <div style={{ display: 'flex', gap: 10 }}>
            {[
              { label: 'Dark', val: false, bg: '#0f1117', fg: '#e8e9ed' },
              { label: 'Light', val: true, bg: '#f4f3ef', fg: '#1c1b18' },
            ].map((opt) => (
              <div
                key={opt.label}
                onClick={() => onSetting('lightMode', opt.val)}
                style={{
                  flex: 1, padding: '14px 16px', borderRadius: 10, background: opt.bg, color: opt.fg,
                  cursor: 'pointer',
                  border: `2px solid ${settings.lightMode === opt.val ? 'var(--amber)' : 'transparent'}`,
                  transition: 'border 0.15s',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}
              >
                <span style={{ fontSize: 18 }}>{opt.val ? '○' : '◑'}</span>
                <span style={{ fontWeight: 500, fontSize: 13 }}>{opt.label}</span>
                {settings.lightMode === opt.val && (
                  <span style={{ marginLeft: 'auto', color: 'var(--amber)', fontSize: 13 }}>✓</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 10 }}>Accent Color</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {ACCENT_PRESETS.map((c) => (
              <div
                key={c}
                onClick={() => onSetting('accentColor', c)}
                style={{
                  width: 32, height: 32, borderRadius: 8, background: c, cursor: 'pointer',
                  border: `2px solid ${settings.accentColor === c ? 'var(--text)' : 'transparent'}`,
                  transition: 'transform 0.1s, border 0.1s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.12)')}
                onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
              />
            ))}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 4 }}>
              <label style={{ fontSize: 12, color: 'var(--text3)' }}>Custom</label>
              <input
                type="color"
                value={settings.accentColor}
                onChange={(e) => onSetting('accentColor', e.target.value)}
                style={{ width: 32, height: 32, border: '1px solid var(--border2)', borderRadius: 8, cursor: 'pointer', background: 'none', padding: 2 }}
              />
            </div>
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>Text Size</div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text3)' }}>
              {settings.fontScale.toFixed(2)}×
            </span>
          </div>
          <input
            type="range"
            min="0.75"
            max="1.35"
            step="0.05"
            value={settings.fontScale}
            onChange={(e) => onSetting('fontScale', parseFloat(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--amber)' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
            <span>Smaller</span>
            <span>Larger</span>
          </div>
        </div>
      </div>

      {/* Tags */}
      <div className="card">
        <div className="card-title">Tags</div>
        <p style={{ fontSize: 13, color: 'var(--text2)', marginBottom: 16 }}>
          Tags can be assigned to expenses and budget items to track spending by category.
        </p>
        <TagsModal tags={tags} onAdd={onAddTag} onRemove={onRemoveTag} onClose={() => {}} embedded={true} />
      </div>
    </div>
  );
}
