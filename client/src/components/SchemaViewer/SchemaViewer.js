'use client';

import { useState } from 'react';
import styles from './SchemaViewer.module.css';

export default function SchemaViewer({ existingSchema, suggestedSchema }) {
  const [tab, setTab] = useState('suggested');

  return (
    <div className={`card ${styles.schemaCard}`}>
      <h2 className="text-headline-sm" style={{ marginBottom: 'var(--sp-4)' }}>Structured Data</h2>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${tab === 'suggested' ? styles.active : ''}`}
          onClick={() => setTab('suggested')}
        >
          Suggested Schema
        </button>
        <button
          className={`${styles.tab} ${tab === 'existing' ? styles.active : ''}`}
          onClick={() => setTab('existing')}
        >
          Existing ({existingSchema?.length || 0})
        </button>
      </div>

      <div className={styles.codeWrap}>
        {tab === 'suggested' && (
          suggestedSchema ? (
            <pre className={styles.code}>
              {JSON.stringify(suggestedSchema, null, 2)}
            </pre>
          ) : (
            <p className="text-body-md text-muted" style={{ padding: 'var(--sp-4)' }}>
              No schema suggestion available.
            </p>
          )
        )}

        {tab === 'existing' && (
          existingSchema?.length > 0 ? (
            existingSchema.map((schema, i) => (
              <pre key={i} className={styles.code} style={{ marginBottom: 'var(--sp-3)' }}>
                {JSON.stringify(schema, null, 2)}
              </pre>
            ))
          ) : (
            <p className="text-body-md text-muted" style={{ padding: 'var(--sp-4)' }}>
              No existing JSON-LD found on this page.
            </p>
          )
        )}
      </div>

      {tab === 'suggested' && suggestedSchema && (
        <button
          className="btn btn-secondary"
          style={{ marginTop: 'var(--sp-4)', width: '100%' }}
          onClick={() => {
            navigator.clipboard.writeText(JSON.stringify(suggestedSchema, null, 2));
          }}
        >
          Copy Schema
        </button>
      )}
    </div>
  );
}
