import { headers } from 'next/headers';
import mongoose from 'mongoose';
import Report from '@/lib/models/Report';
import PDFReportView from '@/components/PDFReportView/PDFReportView';
import { notFound } from 'next/navigation';

export default async function ReportPrintPage({ params }) {
  const { id } = await params;
  
  // 1. Security Note: We're omitting the internal token check here so users 
  // can view their reports via the unguessable UUID link from the History page.

  // 2. Database Connection (Ensure we're connected in a Server Component context)
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lumen-audit');
  }

  // 3. Fetch Data Directly from MongoDB
  const report = await Report.findOne({ jobId: id }).lean();
  
  if (!report) {
    return notFound();
  }

  // Fetch the user to display their name on the report
  const reportUser = await mongoose.connection.db.collection('users').findOne({ _id: report.userId });
  if (reportUser) {
    report.preparedFor = reportUser.name || reportUser.email;
  }

  // 4. Render the static print view
  return (
    <main 
      className="bg-white min-h-screen"
      style={{ color: '#1a1a1a', padding: '0' }}
      data-pdf-ready="true" // Triggers Puppeteer capture
    >
      <PDFReportView report={JSON.parse(JSON.stringify(report))} />
      
      {/* Inline Print Fixes for the PDF Engine */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body { background: white !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .score-ring svg { animation: none !important; transition: none !important; }
          /* Ensure rings are fully visible without animation */
          .score-ring circle { stroke-dashoffset: 0 !important; }
        }
      `}} />
    </main>
  );
}
