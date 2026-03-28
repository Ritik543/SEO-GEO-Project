'use client';

import { useState } from 'react';
import styles from './RecommendationCard.module.css';

export default function RecommendationCard({ recommendations }) {
  const [expanded, setExpanded] = useState(null);

  const priorityColors = {
    high: 'var(--error)',
    medium: 'var(--tertiary)',
    low: 'var(--primary)',
  };

  return (
    <div className={`card ${styles.recCard}`}>
      <div className={styles.header}>
        <h2 className="text-headline-sm">Recommendations</h2>
        <span className={`chip ${styles.count}`}>{recommendations.length}</span>
      </div>

      <div className={styles.list}>
        {recommendations.map((rec, i) => (
          <div key={i} className={styles.item}>
            <button
              className={styles.itemHeader}
              onClick={() => setExpanded(expanded === i ? null : i)}
            >
              <div className={styles.priority} style={{ background: priorityColors[rec.priority] || 'var(--primary)' }} />
              <div className={styles.itemMeta}>
                <span className="text-label-sm text-muted">{rec.category?.replace('_', ' ')} · {rec.priority}</span>
                <h3 className="text-title-md">{rec.problem}</h3>
              </div>
              <svg
                className={`${styles.chevron} ${expanded === i ? styles.open : ''}`}
                width="16" height="16" viewBox="0 0 16 16" fill="none"
              >
                <path d="M4 6L8 10L12 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {expanded === i && (
              <div className={`${styles.detail} animate-in`}>
                {rec.why && (
                  <div className={styles.detailBlock}>
                    <span className="text-label-sm" style={{ color: 'var(--tertiary)' }}>WHY IT MATTERS</span>
                    <p className="text-body-md text-muted">{rec.why}</p>
                  </div>
                )}
                {rec.fix && (
                  <div className={styles.detailBlock}>
                    <span className="text-label-sm" style={{ color: 'var(--secondary)' }}>HOW TO FIX</span>
                    <p className="text-body-md text-muted">{rec.fix}</p>
                  </div>
                )}
                {rec.example && (
                  <div className={styles.detailBlock}>
                    <span className="text-label-sm" style={{ color: 'var(--primary)' }}>EXAMPLE</span>
                    <pre className={styles.code}>{rec.example}</pre>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
