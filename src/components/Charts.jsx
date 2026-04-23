import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

const TOOLTIP_OPTS = {
  backgroundColor: '#1e2028',
  titleColor: '#e8e9ed',
  bodyColor: '#9499a8',
  borderColor: '#252730',
  borderWidth: 1,
};

export function DonutChart({ data, labels, colors }) {
  const ref = useRef();
  const chartRef = useRef();

  useEffect(() => {
    chartRef.current?.destroy();
    if (!ref.current || !data.length) return;
    chartRef.current = new Chart(ref.current, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{ data, backgroundColor: colors, borderColor: 'transparent', borderWidth: 0, hoverOffset: 4 }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '68%',
        plugins: {
          legend: { display: false },
          tooltip: {
            ...TOOLTIP_OPTS,
            callbacks: { label: (c) => ` ${c.label}: ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(c.raw)}` },
          },
        },
      },
    });
    return () => chartRef.current?.destroy();
  }, [data.join(','), labels.join(',')]);

  return <canvas ref={ref} />;
}

export function BarChart({ labels, datasets }) {
  const ref = useRef();
  const chartRef = useRef();

  useEffect(() => {
    chartRef.current?.destroy();
    if (!ref.current) return;
    chartRef.current = new Chart(ref.current, {
      type: 'bar',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#5a5f70', font: { family: 'DM Mono', size: 11 } } },
          y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#5a5f70', font: { family: 'DM Mono', size: 11 }, callback: (v) => `$${v}` }, beginAtZero: true },
        },
        plugins: {
          legend: { display: false },
          tooltip: { ...TOOLTIP_OPTS, callbacks: { label: (c) => ` ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(c.raw)}` } },
        },
      },
    });
    return () => chartRef.current?.destroy();
  }, [JSON.stringify(datasets), labels.join(',')]);

  return <canvas ref={ref} />;
}

export function LineChart({ labels, datasets }) {
  const ref = useRef();
  const chartRef = useRef();

  useEffect(() => {
    chartRef.current?.destroy();
    if (!ref.current) return;
    chartRef.current = new Chart(ref.current, {
      type: 'line',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#5a5f70', font: { family: 'DM Mono', size: 11 } } },
          y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#5a5f70', font: { family: 'DM Mono', size: 11 }, callback: (v) => `$${v}` }, beginAtZero: true },
        },
        plugins: {
          legend: { display: false },
          tooltip: { ...TOOLTIP_OPTS, callbacks: { label: (c) => ` ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(c.raw)}` } },
        },
        elements: { point: { radius: 3, hoverRadius: 5 } },
      },
    });
    return () => chartRef.current?.destroy();
  }, [JSON.stringify(datasets), labels.join(',')]);

  return <canvas ref={ref} />;
}
