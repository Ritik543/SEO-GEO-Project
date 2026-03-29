'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar/Navbar';
import AuditHero from '@/components/AuditHero/AuditHero';
import AIPulseStatus from '@/components/AIPulseStatus/AIPulseStatus';
import Dashboard from '@/components/Dashboard/Dashboard';

export default function Home() {
  const [auditState, setAuditState] = useState('idle'); // idle | streaming | complete
  const [jobId, setJobId] = useState(null);
  const [report, setReport] = useState(null);
  const [sseMessages, setSseMessages] = useState([]);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5005';

  const handleStartAudit = async (url) => {
    setAuditState('streaming');
    setSseMessages([]);
    setReport(null);

    try {
      const res = await fetch(`${API_BASE}/api/v1/audits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
        credentials: 'include',
      });

      const data = await res.json();

      if (!res.ok) {
        setSseMessages([{ stage: 'failed', message: data.error || 'Failed to start audit.' }]);
        setAuditState('idle'); // Revert after brief error
        return;
      }

      setJobId(data.jobId);

      // Connect SSE
      const eventSource = new EventSource(`${API_BASE}/api/v1/audits/stream/${data.jobId}`, {
        withCredentials: true
      });

      eventSource.addEventListener('progress', (e) => {
        const parsed = JSON.parse(e.data);
        setSseMessages((prev) => [...prev, parsed]);
      });

      eventSource.addEventListener('completed', async () => {
        eventSource.close();
        // Fetch the full report
        const reportRes = await fetch(`${API_BASE}/api/v1/audits/report/${data.jobId}`, {
          credentials: 'include'
        });
        const reportData = await reportRes.json();
        setReport(reportData);
        setAuditState('complete');
      });

      eventSource.addEventListener('failed', (e) => {
        eventSource.close();
        const parsed = JSON.parse(e.data);
        setSseMessages((prev) => [...prev, { stage: 'failed', message: parsed.message || 'Audit failed.' }]);
      });

      eventSource.onerror = () => {
        eventSource.close();
        setAuditState('idle');
      };
    } catch (err) {
      setSseMessages([{ stage: 'failed', message: err.message }]);
      setAuditState('idle');
    }
  };

  const handleReset = () => {
    setAuditState('idle');
    setJobId(null);
    setReport(null);
    setSseMessages([]);
  };

  return (
    <>
      <Navbar disabled={auditState === 'streaming'} />

      {auditState === 'idle' && (
        <AuditHero onSubmit={handleStartAudit} />
      )}

      {auditState === 'streaming' && (
        <AIPulseStatus messages={sseMessages} />
      )}

      {auditState === 'complete' && report && (
        <Dashboard report={report} onReset={handleReset} />
      )}
    </>
  );
}
