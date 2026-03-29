'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './HistoryList.module.css';

export default function HistoryList() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005';

  const fetchReports = async (pageNum = 1, searchQuery = '') => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/v1/history?page=${pageNum}&limit=10&search=${searchQuery}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      const data = await res.json();
      
      if (pageNum === 1) {
        setReports(data.reports || []);
      } else {
        setReports(prev => [...prev, ...(data.reports || [])]);
      }
      
      setHasMore(data.reports?.length === 10);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch history:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports(1, search);
  }, [search]);

  const handleDelete = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this audit?')) return;
    
    setDeletingId(jobId);
    try {
      const res = await fetch(`${API_BASE}/api/v1/history/${jobId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      
      if (res.ok) {
        setReports(prev => prev.filter(r => r.jobId !== jobId));
      }
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#4edea3'; // Green
    if (score >= 50) return '#f9bd22'; // Yellow
    return '#ffb4ab'; // Red
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className={styles.historyContainer}>
      <header className={styles.header}>
        <h1 className="text-headline-md">Audit History</h1>
        <div className={styles.searchWrapper}>
          <span className="material-symbols-outlined text-muted">search</span>
          <input 
            type="text" 
            placeholder="Search by URL..." 
            className={styles.searchInput}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </header>

      {reports.length === 0 && !loading ? (
        <div className={styles.empty}>
          <p className="text-body-lg text-muted">No audits found.</p>
          <Link href="/" className="btn btn-primary mt-4">Start New Audit</Link>
        </div>
      ) : (
        <div className={styles.list}>
          {reports.map((report) => (
            <div key={report.jobId} className={`card ${styles.reportCard}`}>
              <div className={styles.mainInfo}>
                <div className={styles.urlGroup}>
                  <h3 className={styles.url}>{report.url}</h3>
                  <span className={styles.date}>{formatDate(report.completedAt)}</span>
                </div>
                
                <div className={styles.scoresGrid}>
                  {Object.entries(report.scores || {}).map(([key, val]) => (
                    <div key={key} className={styles.scoreItem}>
                      <span className={styles.scoreLabel}>{key.replace('_', ' ')}</span>
                      <span 
                        className={styles.scoreValue}
                        style={{ color: getScoreColor(val) }}
                      >
                        {val}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className={styles.actions}>
                <Link 
                  href={`/report-print/${report.jobId}`} 
                  target="_blank"
                  className="btn btn-secondary text-sm"
                >
                  <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
                  PDF
                </Link>
                <button 
                  className={`btn btn-secondary ${styles.deleteBtn}`}
                  onClick={() => handleDelete(report.jobId)}
                  disabled={deletingId === report.jobId}
                >
                  <span className="material-symbols-outlined text-[18px]">
                    {deletingId === report.jobId ? 'refresh' : 'delete'}
                  </span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {hasMore && !loading && reports.length > 0 && (
        <button 
          className="btn btn-secondary mx-auto mt-8 block"
          onClick={() => {
            const nextPage = page + 1;
            setPage(nextPage);
            fetchReports(nextPage, search);
          }}
        >
          Load More
        </button>
      )}

      {loading && (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}
    </div>
  );
}
