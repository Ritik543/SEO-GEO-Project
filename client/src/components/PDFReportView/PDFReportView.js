'use client';
import React from 'react';
import styles from './PDFReportView.module.css';

export default function PDFReportView({ report }) {
  if (!report) return null;

  const { 
    url, 
    scores, 
    issues, 
    recommendations, 
    geoInsights, 
    performance, 
    improvedSchema,
    processingTime,
    createdAt
  } = report;

  const formatDate = (d) => new Date(d).toLocaleDateString() + ' ' + new Date(d).toLocaleTimeString();

  return (
    <div id="pdf-report-container" className={styles.pdfContainer}>
      <header className={styles.header}>
        <div className={styles.brandGroup}>
          <h1 className={styles.brand}>GeoAudit</h1>
          <span className={styles.tagline}>Advanced SEO & GEO Visibility Report</span>
        </div>
        <div className={styles.meta}>
          <p><strong>URL:</strong> {url}</p>
          <p><strong>Generated:</strong> {formatDate(createdAt || Date.now())}</p>
          <p><strong>Audit Time:</strong> {((processingTime || 0) / 1000).toFixed(1)}s</p>
        </div>
      </header>

      <section className={styles.scoreSummary}>
        <h2 className={styles.sectionTitle}>Performance Summary</h2>
        <div className={styles.scoreGrid}>
          {Object.entries(scores || {})
            .filter(([key]) => key !== '_id') // Correctly filters out the raw MongoDB _id component
            .map(([key, val]) => (
            <div key={key} className={styles.scoreItem}>
              <span className={styles.scoreLabel}>{key.replace('_', ' ').toUpperCase()}</span>
              <span className={styles.scoreValue} style={{ color: val > 80 ? '#22c55e' : val > 50 ? '#eab308' : '#ef4444' }}>
                {val}
              </span>
            </div>
          ))}
          
          {/* Custom Username Display Component - Injecting this right where the old ID was */}
          {report.preparedFor && (
            <div className={styles.scoreItem} style={{ borderLeft: '2px dashed #cbd5e1', paddingLeft: '1.5rem', marginLeft: 'auto', background: '#f8fafc', borderRadius: '8px', padding: '12px 24px' }}>
              <span className={styles.scoreLabel} style={{ color: '#475569' }}>AUDITED FOR</span>
              <span style={{ display: 'block', fontSize: '1.1rem', fontWeight: '700', color: '#0f172a', paddingTop: '4px' }}>
                {report.preparedFor}
              </span>
            </div>
          )}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>GEO Insights</h2>
        <div className={styles.geoBox}>
          <div className={styles.geoGrid}>
            <div className={styles.geoStat}>
              <span>Entity Clarity:</span> <strong>{geoInsights?.entityClarity}/100</strong>
            </div>
            <div className={styles.geoStat}>
              <span>Topical Authority:</span> <strong>{geoInsights?.topicalAuthority}/100</strong>
            </div>
            <div className={styles.geoStat}>
              <span>Citation Readiness:</span> <strong>{geoInsights?.citationReadiness}/100</strong>
            </div>
          </div>
          <div className={styles.geoSummary}>
            <h3>AI Semantic Summary</h3>
            <p>{geoInsights?.ai_summary}</p>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Core Web Vitals</h2>
        <div className={styles.perfTable}>
          <div className={styles.perfItem}>
            <p><strong>Mobile Score:</strong> <span style={{ color: (performance?.mobile?.score || 0) > 80 ? '#22c55e' : (performance?.mobile?.score || 0) > 50 ? '#eab308' : '#ef4444' }}>{performance?.mobile?.score || 0}</span></p>
            <p>LCP: {performance?.mobile?.lcp?.value || 'N/A'}ms ({performance?.mobile?.lcp?.rating?.toUpperCase()?.replace(/-/g, ' ') || 'UNKNOWN'})</p>
          </div>
          <div className={styles.perfItem}>
            <p><strong>Desktop Score:</strong> <span style={{ color: (performance?.desktop?.score || 0) > 80 ? '#22c55e' : (performance?.desktop?.score || 0) > 50 ? '#eab308' : '#ef4444' }}>{performance?.desktop?.score || 0}</span></p>
            <p>LCP: {performance?.desktop?.lcp?.value || 'N/A'}ms ({performance?.desktop?.lcp?.rating?.toUpperCase()?.replace(/-/g, ' ') || 'UNKNOWN'})</p>
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Technical SEO Issues ({issues?.length || 0})</h2>
        <div className={styles.issueList}>
          {(issues || []).map((issue, idx) => (
            <div key={idx} className={styles.issueItem}>
              <div className={styles.issueHeader}>
                <span className={`${styles.severity} ${styles[issue.severity]}`}>{issue.severity?.toUpperCase()}</span>
                <span className={styles.issueCategory}>{issue.category?.replace('_', ' ')}</span>
                <h3 className={styles.issueTitle}>{issue.title}</h3>
              </div>
              <p className={styles.issueDesc}>{issue.description}</p>
              {issue.suggested_code && (
                <div className={styles.fixBox}>
                  <strong>Suggested Fix:</strong>
                  <pre className={styles.code}>{issue.suggested_code}</pre>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {report.rawExtraction?.existingSchema && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Current Schema Detected</h2>
          <pre className={styles.schemaCode} style={{ background: '#f8fafc', color: '#64748b', border: '1px solid #e2e8f0' }}>
            {JSON.stringify(report.rawExtraction.existingSchema, null, 2)}
          </pre>
        </section>
      )}

      {improvedSchema && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>AI-Optimized Suggested Schema</h2>
          <pre className={styles.schemaCode}>
            {JSON.stringify(improvedSchema, null, 2)}
          </pre>
        </section>
      )}

      <footer className={styles.footer}>
        <p>© {new Date().getFullYear()} GeoAudit Pro. Confidential Audit Report.</p>
        <p>Page 1 of 1</p>
      </footer>
    </div>
  );
}
