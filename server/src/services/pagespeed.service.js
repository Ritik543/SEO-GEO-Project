/**
 * Google PageSpeed Insights Service.
 * Fetches Core Web Vitals (LCP, FID, CLS) and general performance scores.
 */
async function getPageSpeedData(url, strategy = 'mobile') {
  try {
    const apiKey = process.env.GOOGLE_PSI_KEY;
    if (!apiKey) {
      console.warn('PageSpeed API: Missing GOOGLE_PSI_KEY. Skipping performance audit.');
      return null;
    }

    const endpoint = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed`;
    const params = `?url=${encodeURIComponent(url)}&key=${apiKey}&strategy=${strategy}`;

    console.log(`[PSI] Requesting ${strategy.toUpperCase()} Core Web Vitals for: ${url}`);
    
    const res = await fetch(endpoint + params, {
      signal: AbortSignal.timeout(45000) // 45s safety timeout
    });
    
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`PSI Error ${res.status}: ${JSON.stringify(err)}`);
    }

    const data = await res.json();

    const cats = data.lighthouseResult?.categories;
    const rum = data.loadingExperience?.metrics; // Real User Metrics
    const lab = data.lighthouseResult?.audits;     // Synthetic Lab Data

    // Core Web Vitals extraction with high-fidelity fallbacks
    const lcp = rum?.LARGEST_CONTENTFUL_PAINT_MS?.percentile ?? lab?.['largest-contentful-paint']?.numericValue ?? null;
    const fid = rum?.FIRST_INPUT_DELAY_MS?.percentile ?? lab?.['total-blocking-time']?.numericValue ?? null; 
    const cls = rum?.CUMULATIVE_LAYOUT_SHIFT_SCORE?.percentile * 0.01 ?? lab?.['cumulative-layout-shift']?.numericValue ?? null;

    // Helper to normalize ratings to standard CSS-friendly strings
    const normalizeRating = (rumRating, val, type) => {
      let r = rumRating?.toLowerCase().replace(/_/g, '-') || '';
      
      // Map Google RUM labels to our internal labels
      if (r === 'fast') r = 'good';
      if (r === 'average') r = 'needs-improvement';
      if (r === 'slow') r = 'poor';

      if (r) return r;
      
      // Fallback to lab/synthetic data calculation
      if (val === null) return 'unknown';
      if (type === 'lcp') return val < 2500 ? 'good' : val < 4000 ? 'needs-improvement' : 'poor';
      if (type === 'fid') return val < 100 ? 'good' : val < 300 ? 'needs-improvement' : 'poor';
      if (type === 'cls') return val < 0.1 ? 'good' : val < 0.25 ? 'needs-improvement' : 'poor';
      return 'unknown';
    };

    const perfScore = Math.round((cats?.performance?.score ?? 0) * 100);
    
    console.log(`[PSI] ${strategy.toUpperCase()} Results: Score=${perfScore}, LCP=${lcp}ms, FID=${fid}ms, CLS=${cls}`);

    return {
      performance_score: perfScore,
      lcp_ms: lcp ? Math.round(lcp) : null,
      fid_ms: fid ? Math.round(fid) : null,
      cls_score: cls !== null ? parseFloat(Number(cls).toFixed(3)) : null, 
      lcp_rating: normalizeRating(rum?.LARGEST_CONTENTFUL_PAINT_MS?.category, lcp, 'lcp'),
      fid_rating: normalizeRating(rum?.FIRST_INPUT_DELAY_MS?.category, fid, 'fid'),
      cls_rating: normalizeRating(rum?.CUMULATIVE_LAYOUT_SHIFT_SCORE?.category, cls, 'cls'),
    };
  } catch (e) {
    console.error(`PageSpeed API (${strategy}) failed:`, e.message);
    return null; 
  }
}

module.exports = { getPageSpeedData };
