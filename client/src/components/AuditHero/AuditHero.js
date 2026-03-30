'use client';

import { useState, useEffect } from 'react';

export default function AuditHero({ onSubmit, prefillData }) {
  const [activeTab, setActiveTab] = useState('url'); // 'url' | 'sitemap' | 'html'
  const [url, setUrl] = useState('');
  const [sitemapUrl, setSitemapUrl] = useState('');
  const [htmlSource, setHtmlSource] = useState('');
  const [htmlUrl, setHtmlUrl] = useState('');
  const [error, setError] = useState('');

  // Handle prefill (e.g., coming from a blocked crawl)
  useEffect(() => {
    if (prefillData) {
      if (prefillData.mode === 'html') {
        setActiveTab('html');
        setHtmlUrl(prefillData.url || '');
      } else if (prefillData.mode === 'sitemap') {
        setActiveTab('sitemap');
        setSitemapUrl(prefillData.url || '');
      } else {
        setUrl(prefillData.url || '');
      }
    }
  }, [prefillData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (activeTab === 'url') {
      if (!url.trim()) return setError('Please enter a website URL.');
      const finalUrl = url.startsWith('http') ? url : `https://${url}`;
      try { new URL(finalUrl); } catch { return setError('Invalid URL format.'); }
      onSubmit({ url: finalUrl, mode: 'url' });
    } 
    else if (activeTab === 'sitemap') {
      if (!sitemapUrl.trim()) return setError('Please enter a sitemap URL.');
      const finalUrl = sitemapUrl.startsWith('http') ? sitemapUrl : `https://${sitemapUrl}`;
      try { new URL(finalUrl); } catch { return setError('Invalid sitemap URL.'); }
      onSubmit({ url: finalUrl, mode: 'sitemap' });
    } 
    else if (activeTab === 'html') {
      if (!htmlSource.trim()) return setError('Please paste the HTML source.');
      if (htmlSource.length < 100) return setError('HTML source seems too short. Please paste the full page source.');
      
      let finalUrl = htmlUrl.trim();
      if (finalUrl && !finalUrl.startsWith('http')) finalUrl = `https://${finalUrl}`;
      if (finalUrl) { try { new URL(finalUrl); } catch { return setError('Invalid optional URL format.'); } }
      
      onSubmit({ 
        url: finalUrl, 
        mode: 'html', 
        htmlSource: htmlSource.trim() 
      });
    }
  };

  return (
    <main className="relative pt-16 min-h-screen flex flex-col items-center hero-gradient w-full">
      {/* Hero Section */}
      <section className="w-full max-w-5xl px-6 pt-20 md:pt-32 pb-12 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-high border border-outline-variant/15 mb-6 md:mb-8 flex">
          <span className="flex h-2 w-2 rounded-full bg-secondary animate-pulse"></span>
          <span className="font-label text-[10px] font-bold uppercase tracking-widest text-secondary">AI Auditor Active</span>
        </div>
        <h1 className="text-3xl sm:text-5xl md:text-7xl font-bold tracking-tight text-on-surface mb-6 max-w-4xl leading-[1.1]">
          Analyze Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary-container">SEO &amp; GEO</span> Visibility.
        </h1>
        <p className="text-base sm:text-lg md:text-xl text-on-surface-variant max-w-2xl mb-8 md:mb-12 leading-relaxed">
          AI-powered audits that go beyond rankings to understand how search engines and AI see your content.
        </p>
        
        {/* Input Card with Tabs */}
        <div className="w-full max-w-3xl bg-surface-container border border-outline-variant/20 rounded-2xl shadow-2xl overflow-hidden group">
          {/* Tab Headers */}
          <div className="flex border-b border-outline-variant/10 bg-surface-container-high/50 p-1">
            {[
              { id: 'url', label: 'Website URL', icon: 'language' },
              { id: 'sitemap', label: 'Sitemap', icon: 'account_tree' },
              { id: 'html', label: 'Paste HTML', icon: 'html' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setError(''); }}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl transition-all duration-300 font-label text-xs font-bold uppercase tracking-widest ${
                  activeTab === tab.id 
                  ? 'bg-primary text-on-primary shadow-lg' 
                  : 'text-on-surface-variant hover:bg-surface-bright hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <form onSubmit={handleSubmit} className="p-6 md:p-8">
            {activeTab === 'url' && (
              <div className="relative flex flex-col sm:flex-row items-center gap-4">
                <div className="w-full relative">
                  <div className="absolute inset-y-0 left-4 flex items-center text-outline/60 pointer-events-none">
                    <span className="material-symbols-outlined text-xl">link</span>
                  </div>
                  <input 
                    className="w-full bg-surface-container-lowest border border-outline-variant/15 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 rounded-xl text-on-surface placeholder:text-outline/40 font-medium py-4 pl-12 pr-4 text-lg outline-none transition-all" 
                    placeholder="https://yourwebsite.com/page-to-audit" 
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full sm:w-auto px-10 py-4 bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold rounded-xl shadow-xl hover:brightness-110 active:scale-[0.98] transition-all duration-200 whitespace-nowrap text-lg"
                >
                  Analyze Page
                </button>
              </div>
            )}

            {activeTab === 'sitemap' && (
              <div className="flex flex-col gap-4">
                <div className="relative flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-full relative">
                    <div className="absolute inset-y-0 left-4 flex items-center text-outline/60 pointer-events-none">
                      <span className="material-symbols-outlined text-xl">account_tree</span>
                    </div>
                    <input 
                      className="w-full bg-surface-container-lowest border border-outline-variant/15 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 rounded-xl text-on-surface placeholder:text-outline/40 font-medium py-4 pl-12 pr-4 text-lg outline-none transition-all" 
                      placeholder="https://yourwebsite.com/sitemap.xml" 
                      type="url"
                      value={sitemapUrl}
                      onChange={(e) => setSitemapUrl(e.target.value)}
                    />
                  </div>
                  <button 
                    type="submit"
                    className="w-full sm:w-auto px-10 py-4 bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold rounded-xl shadow-xl hover:brightness-110 active:scale-[0.98] transition-all duration-200 whitespace-nowrap text-lg"
                  >
                    Analyze Sitemap
                  </button>
                </div>
                <p className="text-xs text-on-surface-variant/60 ml-1">Discovery mode: We'll fetch the sitemap and audit the primary page.</p>
              </div>
            )}

            {activeTab === 'html' && (
              <div className="flex flex-col gap-6">
                <div className="relative">
                  <textarea 
                    className="w-full min-h-[220px] bg-surface-container-lowest border border-outline-variant/15 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 rounded-xl text-on-surface placeholder:text-outline/40 font-mono text-sm p-4 outline-none transition-all resize-none" 
                    placeholder="Paste full HTML source here... (View Page Source → Copy → Paste here)" 
                    value={htmlSource}
                    onChange={(e) => setHtmlSource(e.target.value)}
                  />
                  <div className="absolute top-4 right-4 flex items-center gap-2 pointer-events-none opacity-40">
                    <span className="text-[10px] font-bold uppercase tracking-tighter">Code Input</span>
                    <span className="material-symbols-outlined text-sm">code</span>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-full relative">
                    <div className="absolute inset-y-0 left-4 flex items-center text-outline/60 pointer-events-none">
                      <span className="material-symbols-outlined text-xl">language</span>
                    </div>
                    <input 
                      className="w-full bg-surface-container-lowest border border-outline-variant/15 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 rounded-xl text-on-surface placeholder:text-outline/40 font-medium py-3 pl-12 pr-4 outline-none transition-all" 
                      placeholder="Page URL (optional — enables PageSpeed data)" 
                      type="url"
                      value={htmlUrl}
                      onChange={(e) => setHtmlUrl(e.target.value)}
                    />
                  </div>
                  <button 
                    type="submit"
                    className="w-full sm:w-auto px-10 py-3 bg-gradient-to-br from-primary to-primary-container text-on-primary font-bold rounded-xl shadow-xl hover:brightness-110 active:scale-[0.98] transition-all duration-200 whitespace-nowrap"
                  >
                    Analyze HTML
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="mt-4 flex items-center gap-2 text-error animate-in fade-in slide-in-from-top-1">
                <span className="material-symbols-outlined text-sm">error</span>
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}
          </form>
        </div>
      </section>

      {/* Trust Signals */}
      <section className="w-full max-w-5xl px-6 py-12 md:py-20 border-t border-outline-variant/10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12 text-center md:text-left">
          <div className="flex flex-col gap-1 items-center md:items-start">
            <span className="font-label text-[10px] font-bold uppercase tracking-widest text-outline">Trusted Authority</span>
            <p className="text-on-surface-variant font-medium text-sm">Used by 1,000+ SEO experts</p>
          </div>
          <div className="flex flex-wrap justify-center gap-6 md:gap-16 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
            <img alt="logo1" className="h-4 sm:h-6 w-auto" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD9t5xYpgf2WlBpP-oQRBQFL3-0gKFhdCFqlmerLPvw5i8nq1HFnirVqxdcBP8dIGJC6rgZbd0b8cWM2CaIzqwIv-EW6dVAhC1FoKaCjUZ1RMdIeoSZtmIHpMOuQdvayj2pqVzuuAJU4xgYh-2RfqmQ8hcG78TA3J3klegcDesxtki4ITBL3TvasL2wEuEtdzh9F-AQXxsm-gokXn0JFcH6qiZU5M2Udo_aPXfniALBwW-uhZjdoXnb1xkvCjSdczOfgl12C_XYbmjF"/>
            <img alt="logo2" className="h-4 sm:h-6 w-auto" src="https://lh3.googleusercontent.com/aida-public/AB6AXuB31j83R6nwDeo16dFUKj1bQRh4wLDFxYSNHnIrlc6jHUAB49AO7aYiL-j3PTuTo71yKlN5HsHqrPpFJ-dZ7pFSxc55TbcQvZc_AdNIl43Q_84716G4H-CYP25Ux-1K_0O-IiG2xYbxPSqyslQQqwHdQUc16WrZR1S3O5_TRhUQr3ppNU-C-P9oaKQrDX3B7w4XhcyRzcO187F89aZ0bAWcaare9KJKu8al2W1RToBZNO8wpFQ0_FHLzzZuHoYjjZ3msdoJZ-UIgZkB"/>
            <img alt="logo3" className="h-4 sm:h-6 w-auto" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDH8fpSM0SjyyQbh0A0eanT44IFEE_TBlkEAuHeXIA3Nh-XDUNVHDys4FmILRUJPENEWT-9PNkcfqlQphrlk7iFMsopozJIphHfBjHjwRnSk7Cr49s5B50lJPpiMCZzod-ziw9imVer1FNpKz0-caonaEegstMchaBWDGD5s2r3ui11pLdrsseLwIc9vt1Ed5h9iHmGg5xyQdGOfZRQvhywSNMq8bTJ4m7VsaG2EAcvyBSGHI6996qEcDYCz-dMTQL6VdIWB7qV8W6A"/>
          </div>
        </div>
      </section>

      {/* Bento Content Grid Preview */}
      <section className="w-full max-w-7xl px-6 py-12 md:py-24">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-8 group relative overflow-hidden rounded-xl bg-surface-container border border-outline-variant/15 p-8 flex flex-col justify-between aspect-video md:aspect-auto h-auto md:h-[400px]">
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
