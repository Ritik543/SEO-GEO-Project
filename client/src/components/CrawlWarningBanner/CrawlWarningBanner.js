'use client';

export function CrawlWarningBanner({ crawlWarning }) {
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
      </div>
    </div>
  );
}
