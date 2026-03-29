'use client';
import React from 'react';
import styles from './PerformancePanel.module.css';

const RADIAL_DATA = [
  { id: 'lcp', label: 'LCP', title: 'Largest Contentful Paint', unit: 'ms' },
  { id: 'fid', label: 'FID', title: 'First Input Delay', unit: 'ms' },
  { id: 'cls', label: 'CLS', title: 'Cumulative Layout Shift', unit: '' },
];

function MetricCard({ id, label, title, value, rating, unit }) {
  const getRatingStatus = (r) => {
    const rating = r?.toLowerCase().replace(/_/g, '-');
    switch (rating) {
      case 'good': return { label: 'Good', class: styles.good };
      case 'needs-improvement': return { label: 'Needs Improvement', class: styles.needsImprovement };
      case 'poor': return { label: 'Critical', class: styles.poor };
      default: return { label: 'Unknown', class: styles.unknown };
    }
  };

  const status = getRatingStatus(rating);
  const formattedValue = id === 'cls' ? (value || 0).toFixed(3) : value;

  return (
    <div className={styles.metricCard}>
      <div className={styles.metricHeader}>
        <span className={styles.metricLabel} title={title}>{label}</span>
        <span className={`${styles.statusBadge} ${status.class}`}>{status.label}</span>
      </div>
      <div className={styles.metricValue}>
        <span className="text-headline-sm">{formattedValue}</span>
        <span className="text-label-sm text-muted">{unit}</span>
      </div>
      <div className={styles.progressBar}>
        <div 
          className={`${styles.progressFill} ${status.class}`} 
          style={{ width: `${Math.min(100, Math.max(10, (value / (id === 'cls' ? 0.3 : 2500)) * 100))}%` }} 
        />
      </div>
    </div>
  );
}

export default function PerformancePanel({ performance }) {
  const [strategy, setStrategy] = React.useState('mobile');

  if (!performance || (!performance.mobile && !performance.desktop)) {
    return (
      <div className={`card ${styles.panel}`}>
        <h2 className="text-headline-sm" style={{ marginBottom: 'var(--sp-4)' }}>Performance</h2>
        <p className="text-body-md text-muted italic text-center">
          Performance data unavailable. Check Google PSI API key.
        </p>
      </div>
    );
  }

  const current = performance[strategy];

  const getScoreColor = (s) => {
    if (s >= 90) return '#22c55e';
    if (s >= 50) return '#eab308';
    return '#ef4444';
  };

  return (
    <div className={`card ${styles.panel}`}>
      <div className={styles.header}>
        <div className="flex flex-col gap-2">
          <h2 className="text-headline-sm">Core Web Vitals</h2>
          <div className="flex gap-2">
            <button 
              onClick={() => setStrategy('mobile')}
              className={`${styles.strategyBtn} ${strategy === 'mobile' ? styles.active : ''}`}
            >
              Mobile
            </button>
            <button 
              onClick={() => setStrategy('desktop')}
              className={`${styles.strategyBtn} ${strategy === 'desktop' ? styles.active : ''}`}
            >
              Desktop
            </button>
          </div>
        </div>
        <div className={styles.perfScore}>
          <span className="text-label-sm">LIGHTHOUSE SCORE</span>
          <span className="text-title-lg" style={{ color: getScoreColor(current?.score || 0) }}>
            {current?.score || 0}
          </span>
        </div>
      </div>

      <div className={styles.metricGrid}>
        <MetricCard 
          {...RADIAL_DATA[0]} 
          value={current?.lcp?.value} 
          rating={current?.lcp?.rating} 
        />
        <MetricCard 
          {...RADIAL_DATA[1]} 
          value={current?.fid?.value} 
          rating={current?.fid?.rating} 
        />
        <MetricCard 
          {...RADIAL_DATA[2]} 
          value={current?.cls?.value} 
          rating={current?.cls?.rating} 
        />
      </div>
      
      <p className="text-body-sm text-muted mt-4">
        Real-world metrics for {strategy.toUpperCase()} strategy as observed by Google.
      </p>
    </div>
  );
}
