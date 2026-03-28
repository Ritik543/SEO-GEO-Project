'use client';

import styles from './GeoInsights.module.css';

function MiniBar({ value, label, color }) {
  return (
    <div className={styles.miniBar}>
      <div className={styles.miniBarHeader}>
        <span className="text-label-sm">{label}</span>
        <span className="text-title-md" style={{ color }}>{value}</span>
      </div>
      <div className={styles.track}>
        <div className={styles.fill} style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  );
}

export default function GeoInsights({ insights }) {
  if (!insights) {
    return (
      <div className={`card ${styles.geoCard}`}>
        <h2 className="text-headline-sm" style={{ marginBottom: 'var(--sp-4)' }}>GEO Insights</h2>
        <p className="text-body-md text-muted">No GEO analysis available for this page.</p>
      </div>
    );
  }

  return (
    <div className={`card ${styles.geoCard}`}>
      <h2 className="text-headline-sm" style={{ marginBottom: 'var(--sp-6)' }}>GEO Insights</h2>

      <div className={styles.bars}>
        <MiniBar value={insights.entityClarity || 0} label="Entity Clarity" color="var(--secondary)" />
        <MiniBar value={insights.topicalAuthority || 0} label="Topical Authority" color="var(--primary)" />
        <MiniBar value={insights.citationReadiness || 0} label="Citation Readiness" color="var(--tertiary)" />
      </div>

      {insights.summary && (
        <div className={styles.summary}>
          <span className="text-label-sm text-muted">AI SUMMARY</span>
          <p className="text-body-md" style={{ marginTop: 'var(--sp-2)' }}>{insights.summary}</p>
        </div>
      )}

      {insights.entities?.length > 0 && (
        <div className={styles.section}>
          <span className="text-label-sm text-muted">DETECTED ENTITIES</span>
          <div className={styles.chips}>
            {insights.entities.map((entity, i) => (
              <span key={i} className="chip chip-success">{entity}</span>
            ))}
          </div>
        </div>
      )}

      {insights.improvements?.length > 0 && (
        <div className={styles.section}>
          <span className="text-label-sm text-muted">IMPROVEMENTS</span>
          <div className={styles.improvements}>
            {insights.improvements.map((imp, i) => (
              <div key={i} className={styles.improvement}>
                <span className={styles.impIcon}>→</span>
                <span className="text-body-md text-muted">{imp}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
