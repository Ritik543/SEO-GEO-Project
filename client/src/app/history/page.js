import React from 'react';
import Navbar from '@/components/Navbar/Navbar';
import HistoryList from '@/components/HistoryList/HistoryList';

export const metadata = {
  title: 'Audit History | GeoAudit Pro',
  description: 'Manage and review your past GeoSEO and AI Visibility audits.',
};

export default function HistoryPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <HistoryList />
      </main>
    </div>
  );
}
