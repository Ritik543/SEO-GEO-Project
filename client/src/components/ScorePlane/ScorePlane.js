'use client';

import styles from './ScorePlane.module.css';

function ScoreRing({ value, label, size = 120, color }) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className={styles.ringWrap}>
      <div className="score-ring" style={{ width: size, height: size }}>
        <svg width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--surface-container-high)"
            strokeWidth="6"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1s ease' }}
          />
        </svg>
        <span className="score-value" style={{ color, fontSize: size > 100 ? '2.5rem' : '1.25rem' }}>
          {value}
        </span>
      </div>
      <span className="text-label-md text-muted" style={{ marginTop: 'var(--sp-2)' }}>{label}</span>
    </div>
  );
}

function getScoreColor(score) {
  if (score >= 80) return 'var(--secondary)';
  if (score >= 60) return 'var(--tertiary)';
  return 'var(--error)';
}

export default function ScorePlane({ scores }) {
  if (!scores) return null;

  const categories = [
    { key: 'technical_seo', label: 'Technical SEO' },
    { key: 'onpage_seo', label: 'On-Page SEO' },
    { key: 'schema', label: 'Schema' },
    { key: 'geo', label: 'GEO' },
  ];

  return (
    <div className={`card card-ghost-border ${styles.plane}`}>
      <div className={styles.overall}>
        <ScoreRing
          value={scores.overall || 0}
          label="Overall Score"
          size={160}
          color={getScoreColor(scores.overall)}
        />
      </div>
      <div className={styles.categories}>
        {categories.map((cat) => (
          <ScoreRing
            key={cat.key}
            value={scores[cat.key] || 0}
            label={cat.label}
            size={100}
            color={getScoreColor(scores[cat.key])}
          />
        ))}
      </div>
    </div>
  );
}
