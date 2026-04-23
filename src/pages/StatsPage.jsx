import { useState } from 'react';
import Tag from '../components/Tag.jsx';
import { DonutChart, BarChart, LineChart } from '../components/Charts.jsx';
import { fmt } from '../helpers.js';

export default function StatsPage({ expenses, tags }) {
  const [period, setPeriod] = useState('month');

  const now = new Date();
  const filtered = expenses.filter((e) => {
    const d = new Date(e.date);
    if (period === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    if (period === 'year') return d.getFullYear() === now.getFullYear();
    return true;
  });

  const total = filtered.reduce((s, e) => s + e.amount, 0);
  const avg = filtered.length ? total / filtered.length : 0;
  const biggest = filtered.reduce((m, e) => (e.amount > (m?.amount || 0) ? e : m), null);

  // By tag
  const byTag = tags
    .map((t) => ({
      tag: t,
      amount: filtered.filter((e) => (e.tags || []).includes(t.id)).reduce((s, e) => s + e.amount, 0),
    }))
    .filter((x) => x.amount > 0)
    .sort((a, b) => b.amount - a.amount);

  const untagged = filtered.filter((e) => !(e.tags || []).length).reduce((s, e) => s + e.amount, 0);
  const donutData = [...byTag.map((x) => x.amount), untagged > 0 ? untagged : null].filter(Boolean);
  const donutLabels = [...byTag.map((x) => x.tag.name), untagged > 0 ? 'Untagged' : null].filter(Boolean);
  const donutColors = [...byTag.map((x) => x.tag.color.text), untagged > 0 ? '#5a5f70' : null].filter(Boolean);

  // By card
  const cardMap = {};
  filtered.forEach((e) => {
    if (e.card) cardMap[e.card] = (cardMap[e.card] || 0) + e.amount;
  });
  const cardEntries = Object.entries(cardMap).sort((a, b) => b[1] - a[1]);

  // Daily trend (last 30 days)
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return d.toISOString().slice(0, 10);
  });
  const dailyTotals = days.map((d) =>
    expenses.filter((e) => e.date === d).reduce((s, e) => s + e.amount, 0)
  );

  // Top places
  const placeMap = {};
  filtered.forEach((e) => {
    placeMap[e.place] = (placeMap[e.place] || 0) + e.amount;
  });
  const topPlaces = Object.entries(placeMap).sort((a, b) => b[1] - a[1]).slice(0, 6);

  const periodLabel = period === 'month' ? 'This month' : period === 'year' ? 'This year' : 'All time';

  return (
    <div className="page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div className="page-title">Stats</div>
          <div className="page-subtitle">{periodLabel} · {filtered.length} transactions</div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['month', 'year', 'all'].map((p) => (
            <button key={p} className={`btn btn-sm ${period === p ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setPeriod(p)}>
              {p === 'month' ? 'Month' : p === 'year' ? 'Year' : 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Compact summary strip */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 20, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
        {[
          { label: 'Total', value: fmt(total) },
          { label: 'Avg', value: fmt(avg) },
          { label: 'Count', value: filtered.length },
          { label: 'Largest', value: biggest ? fmt(biggest.amount) : '—' },
        ].map((s, i) => (
          <div key={s.label} style={{ flex: 1, padding: '12px 14px', borderLeft: i > 0 ? '1px solid var(--border)' : 'none' }}>
            <div style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text3)', marginBottom: 4 }}>
              {s.label}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 500, color: 'var(--amber)', letterSpacing: -0.5, whiteSpace: 'nowrap' }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ marginBottom: 20 }}>
        {/* By tag donut */}
        <div className="card">
          <div className="card-title">Spending by Tag</div>
          {donutData.length === 0 ? (
            <div className="empty" style={{ padding: 24 }}>
              <div className="empty-text">No tagged data</div>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }} className="donut-row">
              <div style={{ width: 140, height: 140, flexShrink: 0 }} className="donut-chart-wrap">
                <DonutChart data={donutData} labels={donutLabels} colors={donutColors} />
              </div>
              <div style={{ flex: 1 }}>
                {byTag.map(({ tag, amount }) => (
                  <div key={tag.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <Tag tag={tag} />
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text2)' }}>{fmt(amount)}</span>
                  </div>
                ))}
                {untagged > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, color: 'var(--text3)' }}>Untagged</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text3)' }}>{fmt(untagged)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* By card */}
        <div className="card">
          <div className="card-title">By Card</div>
          {cardEntries.length === 0 ? (
            <div className="empty" style={{ padding: 24 }}>
              <div className="empty-text">No card data</div>
            </div>
          ) : (
            <div className="chart-wrap">
              <BarChart
                labels={cardEntries.map(([k]) => (k.length > 12 ? k.slice(0, 12) + '…' : k))}
                datasets={[{ data: cardEntries.map(([, v]) => v), backgroundColor: 'rgba(245,166,35,0.5)', hoverBackgroundColor: '#f5a623', borderRadius: 4 }]}
              />
            </div>
          )}
        </div>
      </div>

      {/* Daily trend */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-title">Daily Spend — Last 30 Days</div>
        <div className="chart-wrap-tall">
          <LineChart
            labels={days.map((d) => d.slice(5))}
            datasets={[{
              data: dailyTotals,
              borderColor: '#f5a623',
              backgroundColor: 'rgba(245,166,35,0.08)',
              fill: true,
              tension: 0.4,
              borderWidth: 2,
              pointBackgroundColor: '#f5a623',
            }]}
          />
        </div>
      </div>

      {/* Top places */}
      {topPlaces.length > 0 && (
        <div className="card">
          <div className="card-title">Top Places</div>
          {topPlaces.map(([place, amount], i) => {
            const pct = total > 0 ? (amount / total) * 100 : 0;
            return (
              <div key={place} style={{ marginBottom: i < topPlaces.length - 1 ? 12 : 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 13 }}>{place}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text2)' }}>{fmt(amount)}</span>
                </div>
                <div style={{ height: 4, background: 'var(--bg4)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: 'var(--amber)', borderRadius: 2 }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
