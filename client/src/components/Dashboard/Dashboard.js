'use client';
import React, { useRef } from 'react';
import styles from './Dashboard.module.css';
import ScorePlane from '../ScorePlane/ScorePlane';
import IssueList from '../IssueList/IssueList';
import RecommendationCard from '../RecommendationCard/RecommendationCard';
import SchemaViewer from '../SchemaViewer/SchemaViewer';
import GeoInsights from '../GeoInsights/GeoInsights';
import PerformancePanel from '../PerformancePanel/PerformancePanel';
import PDFReportView from '../PDFReportView/PDFReportView';
import { CrawlWarningBanner } from '../CrawlWarningBanner/CrawlWarningBanner';

// Dynamically import html2pdf to avoid SSR issues
const html2pdf = typeof window !== 'undefined' ? require('html2pdf.js') : null;

export default function Dashboard({ report, onReset }) {
  const pdfRef = useRef();
  
  const { 
    scores, 
    issues, 
    recommendations, 
    improvedSchema, 
    geoInsights, 
    url, 
    performance, 
    processingTime,
    crawlWarning
  } = report;

  const handleDownloadPDF = () => {
    if (!html2pdf) return;

    const element = pdfRef.current;
    const hostname = new URL(url).hostname;
    
    // Professional A4 Export Settings
    const opt = {
      margin: [10, 10], // Proper margins
      filename: `Geo-Audit-${hostname}.pdf`,
      image: { type: 'jpeg', quality: 1.0 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        letterRendering: true,
        backgroundColor: '#ffffff' // White background for PDF
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    html2pdf().from(element).set(opt).save();
  };

  return (
    <>
      <section className={styles.dashboard}>
        <div className={styles.container}>
          <div className={styles.header}>
            <div>
              <span className="text-label-md text-muted">AUDIT REPORT</span>
              <h1 className={`text-headline-lg ${styles.url}`}>{url}</h1>
              <p className="text-body-md text-muted" style={{ marginTop: 'var(--sp-2)' }}>
                Completed in {((processingTime || 0) / 1000).toFixed(1)}s
              </p>
            </div>
            <div className="flex gap-4">
              <button className="btn btn-secondary" onClick={handleDownloadPDF}>
                Download PDF
                <span className="material-symbols-outlined text-[18px] ml-2">download</span>
              </button>
              <button className="btn btn-primary" onClick={onReset}>
                New Audit
                <span className="material-symbols-outlined text-[18px] ml-2">refresh</span>
              </button>
            </div>
          </div>

          {/* Crawl Warning Banner — shown before scores so user understands any low scores */}
          <CrawlWarningBanner crawlWarning={crawlWarning} />

          {/* Scores */}
          <ScorePlane scores={scores} />

          {/* Content Grid */}
          <div className={styles.grid}>
            <div className={styles.mainCol}>
              <PerformancePanel performance={performance} />
              <IssueList issues={issues || []} />
            </div>
            <div className={styles.sideCol}>
              <GeoInsights insights={geoInsights} />
              <SchemaViewer 
                existingSchema={report.rawExtraction?.existingSchema} 
                suggestedSchema={improvedSchema} 
              />
              <RecommendationCard recommendations={recommendations || []} />
            </div>
          </div>
        </div>
      </section>

      {/* Hidden PDF Container - Rendered purely for capture */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <div ref={pdfRef}>
          <PDFReportView report={report} />
        </div>
      </div>
    </>
  );
}
