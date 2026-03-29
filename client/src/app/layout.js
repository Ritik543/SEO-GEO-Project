import './globals.css';
import Providers from '@/components/Providers';

export const metadata = {
  title: 'Lumen Audit — AI SEO + GEO Analysis Platform',
  description: 'Intelligent SEO and GEO auditing powered by AI. Analyze any webpage for technical SEO, on-page optimization, structured data, and generative engine readiness.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&amp;family=Manrope:wght@600;700;800&amp;display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet" />
      </head>
      <body className="bg-background text-on-surface font-body selection:bg-primary/30 selection:text-primary min-h-screen flex flex-col">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
