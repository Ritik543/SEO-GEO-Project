'use client';

export function CrawlWarningBanner({ crawlWarning, onTryHtml }) {
  if (!crawlWarning) return null;

  const isBlocked = crawlWarning.type === 'BLOCKED';

  const methodLabel = {
    google_cache: 'Google Cache',
    common_crawl: 'Common Crawl archive',
    blocked: 'direct access blocked'
  }[crawlWarning.crawlMethod] || crawlWarning.crawlMethod;

  return (
    <div className={`crawl-warning ${isBlocked ? 'blocked' : 'cached'}`}>
      <div className="warning-icon">
        {isBlocked ? '⚠' : 'ℹ'}
      </div>
      <div className="warning-content">
        <p className="warning-title">
          {isBlocked
            ? 'Firewall blocked direct access'
            : `Audit based on ${methodLabel}`}
        </p>
        <p className="warning-message">{crawlWarning.message}</p>
        {isBlocked && typeof onTryHtml === 'function' && (
          <button 
            className="mt-3 px-4 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded text-xs font-bold uppercase tracking-wider transition-colors"
            onClick={() => onTryHtml(crawlWarning.url)}
          >
            Try Paste HTML Instead
          </button>
        )}
      </div>
    </div>
  );
}
