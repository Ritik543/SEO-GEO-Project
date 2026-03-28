'use client';

import { useState } from 'react';

export default function AuditHero({ onSubmit }) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!url.trim()) {
      setError('Please enter a URL.');
      return;
    }

    try {
      new URL(url.startsWith('http') ? url : `https://${url}`);
    } catch {
      setError('Please enter a valid URL.');
      return;
    }

    onSubmit(url.startsWith('http') ? url : `https://${url}`);
  };

  return (
    <main className="relative pt-16 min-h-screen flex flex-col items-center hero-gradient w-full">
      {/* Hero Section */}
      <section className="w-full max-w-5xl px-6 pt-24 pb-12 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-high border border-outline-variant/15 mb-8 hidden md:flex">
          <span className="flex h-2 w-2 rounded-full bg-secondary animate-pulse"></span>
          <span className="font-label text-[10px] font-bold uppercase tracking-widest text-secondary">AI Auditor Active</span>
        </div>
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-on-surface mb-6 max-w-4xl leading-[1.1]">
          Analyze Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-container">SEO &amp; GEO</span> Visibility.
        </h1>
        <p className="text-lg md:text-xl text-on-surface-variant max-w-2xl mb-12 leading-relaxed">
          AI-powered audits that go beyond rankings to understand how search engines and AI see your content.
        </p>
        
        {/* Prominent URL Input */}
        <form onSubmit={handleSubmit} className="w-full max-w-2xl relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-primary-container/20 rounded-xl blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500"></div>
          <div className="relative flex flex-col sm:flex-row items-center p-2 rounded-xl bg-surface-container border border-outline-variant/20 shadow-2xl">
            <div className="pl-4 pr-2 hidden sm:flex items-center text-outline">
              <span className="material-symbols-outlined text-xl">language</span>
            </div>
            <input 
              className="w-full bg-transparent border-none focus:ring-0 text-on-surface placeholder:text-outline/50 font-medium py-3 px-4 sm:px-0 text-lg outline-none" 
              placeholder="https://yourwebsite.com/blog-post-url" 
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            <button 
              type="submit"
              className="mt-2 sm:mt-0 ml-0 sm:ml-2 px-8 py-3 w-full sm:w-auto bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold rounded-lg shadow-lg hover:brightness-110 active:scale-95 transition-all duration-200 whitespace-nowrap"
            >
              Analyze Page
            </button>
          </div>
          {error && <p className="text-error mt-4 text-sm text-left px-2">{error}</p>}
        </form>
      </section>

      {/* Trust Signals */}
      <section className="w-full max-w-5xl px-6 py-20 border-t border-outline-variant/10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="flex flex-col gap-1 items-center md:items-start">
            <span className="font-label text-[10px] font-bold uppercase tracking-widest text-outline">Trusted Authority</span>
            <p className="text-on-surface-variant font-medium text-sm">Used by 1,000+ SEO experts</p>
          </div>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
            <img alt="logo1" className="h-6 w-auto" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD9t5xYpgf2WlBpP-oQRBQFL3-0gKFhdCFqlmerLPvw5i8nq1HFnirVqxdcBP8dIGJC6rgZbd0b8cWM2CaIzqwIv-EW6dVAhC1FoKaCjUZ1RMdIeoSZtmIHpMOuQdvayj2pqVzuuAJU4xgYh-2RfqmQ8hcG78TA3J3klegcDesxtki4ITBL3TvasL2wEuEtdzh9F-AQXxsm-gokXn0JFcH6qiZU5M2Udo_aPXfniALBwW-uhZjdoXnb1xkvCjSdczOfgl12C_XYbmjF"/>
            <img alt="logo2" className="h-6 w-auto" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB31j83R6nwDeo16dFUKj1bQRh4wLDFxYSNHnIrlc6jHUAB49AO7aYiL-j3PTuTo71yKlN5HsHqrPpFJ-dZ7pFSxc55TbcQvZc_AdNIl43Q_84716G4H-CYP25Ux-1K_0O-IiG2xYbxPSqyslQQqwHdQUc16WrZR1S3O5_TRhUQr3ppNU-C-P9oaKQrDX3B7w4XhcyRzcO187F89aZ0bAWcaare9KJKu8al2W1RToBZNO8wpFQ0_FHLzzZuHoYjjZ3msdoJZ-UIgZkB"/>
            <img alt="logo3" className="h-6 w-auto" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDH8fpSM0SjyyQbh0A0eanT44IFEE_TBlkEAuHeXIA3Nh-XDUNVHDys4FmILRUJPENEWT-9PNkcfqlQphrlk7iFMsopozJIphHfBjHjwRnSk7Cr49s5B50lJPpiMCZzod-ziw9imVer1FNpKz0-caonaEegstMchaBWDGD5s2r3ui11pLdrsseLwIc9vt1Ed5h9iHmGg5xyQdGOfZRQvhywSNMq8bTJ4m7VsaG2EAcvyBSGHI6996qEcDYCz-dMTQL6VdIWB7qV8W6A"/>
          </div>
        </div>
      </section>

      {/* Bento Content Grid Preview */}
      <section className="w-full max-w-7xl px-6 py-12 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-8 group relative overflow-hidden rounded-xl bg-surface-container border border-outline-variant/15 p-8 flex flex-col justify-between aspect-video md:aspect-auto h-[400px]">
            <div className="relative z-10">
              <span className="material-symbols-outlined text-primary mb-4 text-3xl">public</span>
              <h3 className="text-2xl font-bold text-on-surface mb-2">GEO Entity Graphing</h3>
              <p className="text-on-surface-variant max-w-md">Visualize how AI models map your brand entities across the global knowledge graph.</p>
            </div>
            <div className="absolute right-0 bottom-0 w-[90%] md:w-3/4 h-2/3 bg-surface-container-lowest rounded-tl-3xl border-t border-l border-outline-variant/20 overflow-hidden translate-x-12 translate-y-12 group-hover:translate-x-8 group-hover:translate-y-8 transition-transform duration-500 hidden sm:block">
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-2 w-24 bg-surface-bright rounded-full"></div>
                  <div className="h-2 w-12 bg-primary/30 rounded-full"></div>
                </div>
                <div className="space-y-3">
                  <div className="h-12 w-full bg-surface-bright/50 rounded-lg flex items-center px-4 gap-3">
                    <div className="h-6 w-6 rounded-md bg-secondary/20 border border-secondary/30"></div>
                    <div className="h-2 w-32 bg-outline-variant/40 rounded-full"></div>
                  </div>
                  <div className="h-12 w-full bg-surface-bright/50 rounded-lg flex items-center px-4 gap-3">
                    <div className="h-6 w-6 rounded-md bg-primary/20 border border-primary/30"></div>
                    <div className="h-2 w-48 bg-outline-variant/40 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="md:col-span-4 rounded-xl bg-surface-container-high border border-outline-variant/15 p-8 flex flex-col justify-end h-[400px] relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none transition-opacity group-hover:opacity-20">
              <div className="absolute inset-0 bg-gradient-to-br from-tertiary to-transparent"></div>
            </div>
            <span className="material-symbols-outlined text-tertiary mb-4 text-3xl">analytics</span>
            <h3 className="text-2xl font-bold text-on-surface mb-2">Semantic Density</h3>
            <p className="text-on-surface-variant">Analyze keyword clusters using LLM-native embeddings for perfect topical authority.</p>
          </div>
        </div>
      </section>

      {/* Basic Footer Element */}
      <footer className="w-full bg-surface-container-lowest border-t border-outline-variant/10 py-12 px-6 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col items-center md:items-start gap-2">
            <span className="text-lg font-bold tracking-tighter text-[#c0c1ff]">CognitiveLayer</span>
            <p className="text-[10px] font-label font-bold uppercase tracking-widest text-outline">© 2024 Lumen Audit. AI Engineered.</p>
          </div>
          <div className="flex gap-8">
            <a className="text-xs font-label font-bold uppercase tracking-widest text-outline hover:text-primary transition-colors" href="#">Privacy</a>
            <a className="text-xs font-label font-bold uppercase tracking-widest text-outline hover:text-primary transition-colors" href="#">Terms</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
