'use client';

import styles from './Dashboard.module.css';
import ScorePlane from '../ScorePlane/ScorePlane';
import IssueList from '../IssueList/IssueList';
import RecommendationCard from '../RecommendationCard/RecommendationCard';
import SchemaViewer from '../SchemaViewer/SchemaViewer';
import GeoInsights from '../GeoInsights/GeoInsights';

export default function Dashboard({ report, onReset }) {
  const { scores, issues, recommendations, suggestedSchema, geoInsights, rawExtraction, url, processingTime } = report;

  return (
    <section className={styles.dashboard}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <span className="text-label-md text-muted">AUDIT REPORT</span>
            <h1 className={`text-headline-lg ${styles.url}`}>{url}</h1>
            <p className="text-body-md text-muted" style={{ marginTop: 'var(--sp-2)' }}>
              Completed in {((processingTime || 0) / 1000).toFixed(1)}s
            </p>
          </div>
          <button className="btn btn-secondary" onClick={onReset}>
            New Audit
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 7C1 3.68629 3.68629 1 7 1C10.3137 1 13 3.68629 13 7C13 10.3137 10.3137 13 7 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M4 7L1 10L-2 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>

        {/* Scores */}
        <ScorePlane scores={scores} />

        {/* Content Grid */}
        <div className={styles.grid}>
          <div className={styles.mainCol}>
            <IssueList issues={issues || []} />
            <RecommendationCard recommendations={recommendations || []} />
          </div>
          <div className={styles.sideCol}>
            <GeoInsights insights={geoInsights} />
            <SchemaViewer existingSchema={rawExtraction?.existingSchema} suggestedSchema={suggestedSchema} />
          </div>
        </div>
      </div>
    </section>
  );
}
