'use client';

import { useState } from 'react';
import styles from './IssueList.module.css';

const severityOrder = { critical: 0, warning: 1, info: 2 };

export default function IssueList({ issues }) {
  const [filter, setFilter] = useState('all');

  const sorted = [...issues].sort((a, b) => (severityOrder[a.severity] || 9) - (severityOrder[b.severity] || 9));
  const filtered = filter === 'all' ? sorted : sorted.filter((i) => i.severity === filter);

  const counts = {
    all: issues.length,
    critical: issues.filter((i) => i.severity === 'critical').length,
    warning: issues.filter((i) => i.severity === 'warning').length,
    info: issues.filter((i) => i.severity === 'info').length,
  };

  return (
    <div className={`card ${styles.issueCard}`}>
      <div className={styles.header}>
        <h2 className="text-headline-sm">Issues Found</h2>
        <span className={`chip ${styles.count}`}>{issues.length}</span>
      </div>

      <div className={styles.filters}>
        {['all', 'critical', 'warning', 'info'].map((f) => (
          <button
            key={f}
            className={`${styles.filterBtn} ${filter === f ? styles.active : ''}`}
            onClick={() => setFilter(f)}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            <span className={styles.filterCount}>{counts[f]}</span>
          </button>
        ))}
      </div>

      <div className={styles.list}>
        {filtered.length === 0 && (
          <p className="text-body-md text-muted" style={{ padding: 'var(--sp-4)' }}>
            No issues in this category. 🎉
          </p>
        )}
        {filtered.map((issue, i) => (
          <div key={i} className={styles.item}>
            <div className={styles.itemHeader}>
              <span className={`chip chip-${issue.severity}`}>
                {issue.severity}
              </span>
              <span className="text-label-sm text-muted">{issue.category?.replace('_', ' ')}</span>
            </div>
            <h3 className={`text-title-md ${styles.itemTitle}`}>{issue.title}</h3>
            {issue.description && (
              <p className="text-body-md text-muted">{issue.description}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
