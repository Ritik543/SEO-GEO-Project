'use client';
import React, { useState } from 'react';
import styles from './SchemaViewer.module.css';

export default function SchemaViewer({ existingSchema, suggestedSchema }) {
  const [view, setView] = React.useState('suggested'); // 'existing' or 'suggested'
  const [copied, setCopied] = React.useState(false);

  if (!suggestedSchema && !existingSchema) return null;

  const currentSchema = view === 'suggested' ? suggestedSchema : existingSchema;
  const jsonString = JSON.stringify(currentSchema, null, 2);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`card ${styles.container}`}>
      <div className={styles.header}>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">data_object</span>
            <h2 className="text-headline-sm">Structured Data</h2>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setView('existing')}
              className={`${styles.viewBtn} ${view === 'existing' ? styles.active : ''}`}
              disabled={!existingSchema}
            >
              Current
            </button>
            <button 
              onClick={() => setView('suggested')}
              className={`${styles.viewBtn} ${view === 'suggested' ? styles.active : ''}`}
            >
              AI Optimized
            </button>
          </div>
        </div>
        <button 
          onClick={copyToClipboard}
          className={`${styles.copyBtn} ${copied ? styles.copied : ''}`}
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      
      <p className="text-body-sm text-muted mb-4 italic">
        {view === 'suggested' 
          ? 'AI-optimized JSON-LD with enhanced entity triples for maximum GEO visibility.' 
          : 'Original structured data detected on your page.'}
      </p>

      <div className={styles.codeWrap}>
        <pre className={styles.pre}>
          <code>{jsonString}</code>
        </pre>
      </div>
    </div>
  );
}
