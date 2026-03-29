// server/src/services/crawler.service.js
// Multi-layer crawler: Direct → Google Cache → Common Crawl → Structured fallback

const CHROME_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  'Cache-Control': 'no-cache',
  'Pragma': 'no-cache',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
  'Upgrade-Insecure-Requests': '1',
  'DNT': '1'
};

// Detect Cloudflare / WAF block pages
function isBlockPage(html, statusCode) {
  if (statusCode === 403 || statusCode === 503) return true;
  if (!html) return true;
  const lower = html.toLowerCase();
  return (
    lower.includes('just a moment') ||
    lower.includes('cf-browser-verification') ||
    (lower.includes('cloudflare') && lower.includes('ray id')) ||
    lower.includes('enable javascript and cookies') ||
    (lower.includes('access denied') && lower.includes('403')) ||
    html.length < 500
  );
}

// LAYER 1: Direct fetch with Chrome headers
async function fetchDirect(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(url, {
      headers: CHROME_HEADERS,
      signal: controller.signal,
      redirect: 'follow'
    });
    clearTimeout(timeout);
    const html = await res.text();
    console.log(`[CRAWLER] Layer 1 (direct): status=${res.status}, html=${html.length} chars, finalUrl=${res.url}`);
    if (isBlockPage(html, res.status)) {
      console.warn(`[CRAWLER] Layer 1 BLOCKED (status=${res.status})`);
      return { success: false, layer: 'direct', reason: 'blocked', statusCode: res.status, finalUrl: res.url };
    }
    return { success: true, html, layer: 'direct', statusCode: res.status, finalUrl: res.url };
  } catch (e) {
    clearTimeout(timeout);
    const reason = e.name === 'AbortError' ? 'timeout' : 'network_error';
    console.warn(`[CRAWLER] Layer 1 FAILED: ${reason} - ${e.message}`);
    return { success: false, layer: 'direct', reason };
  }
}

// LAYER 2: Google Cache (2024 correct URL format)
async function fetchGoogleCache(url) {
  try {
    // Correct 2024 format - do NOT use old cache:URL shorthand
    const cacheUrl = `https://webcache.googleusercontent.com/search?q=cache:${encodeURIComponent(url)}&hl=en`;
    console.log(`[CRAWLER] Layer 2 (google-cache): ${cacheUrl}`);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(cacheUrl, {
      headers: {
        ...CHROME_HEADERS,
        'Referer': 'https://www.google.com/'
      },
      signal: controller.signal
    });
    clearTimeout(timeout);

    if (res.status === 404 || res.status === 503) {
      console.warn(`[CRAWLER] Layer 2 not cached (status=${res.status})`);
      return { success: false, layer: 'google_cache', reason: 'not_cached' };
    }

    const html = await res.text();
    console.log(`[CRAWLER] Layer 2 raw html=${html.length} chars`);

    // Extract inner content — skip Google's cache banner boilerplate
    const bodyStart = html.indexOf('<html');
    const cleanHtml = bodyStart > -1 ? html.substring(bodyStart) : html;

    if (isBlockPage(cleanHtml, res.status)) {
      console.warn(`[CRAWLER] Layer 2 response looks like a block page`);
      return { success: false, layer: 'google_cache', reason: 'blocked' };
    }

    console.log(`[CRAWLER] ✓ Layer 2 (google-cache) SUCCESS: ${cleanHtml.length} chars`);
    return { success: true, html: cleanHtml, layer: 'google_cache', statusCode: 200, finalUrl: url };
  } catch (e) {
    console.warn(`[CRAWLER] Layer 2 FAILED: ${e.message}`);
    return { success: false, layer: 'google_cache', reason: e.message };
  }
}

// LAYER 3: Common Crawl (free, no auth, recent crawl data)
async function fetchCommonCrawl(url) {
  try {
    console.log(`[CRAWLER] Layer 3 (common-crawl): looking up index for ${url}`);
    const indexUrl = `https://index.commoncrawl.org/CC-MAIN-2024-10-index?url=${encodeURIComponent(url)}&output=json&limit=1`;
    const indexRes = await fetch(indexUrl, { headers: CHROME_HEADERS, signal: AbortSignal.timeout(10000) });

    if (!indexRes.ok) {
      console.warn(`[CRAWLER] Layer 3 index lookup failed: ${indexRes.status}`);
      return { success: false, layer: 'common_crawl', reason: 'index_failed' };
    }

    const text = await indexRes.text();
    const lines = text.trim().split('\n').filter(Boolean);
    if (!lines.length) {
      console.warn(`[CRAWLER] Layer 3: URL not indexed in Common Crawl`);
      return { success: false, layer: 'common_crawl', reason: 'not_indexed' };
    }

    const entry = JSON.parse(lines[0]);
    const { filename, offset, length } = entry;
    console.log(`[CRAWLER] Layer 3: found WARC entry, fetching chunk...`);

    // Fetch the specific WARC chunk
    const warcUrl = `https://data.commoncrawl.org/${filename}`;
    const warcRes = await fetch(warcUrl, {
      headers: {
        ...CHROME_HEADERS,
        'Range': `bytes=${offset}-${parseInt(offset) + parseInt(length) - 1}`
      },
      signal: AbortSignal.timeout(15000)
    });

    if (!warcRes.ok) {
      console.warn(`[CRAWLER] Layer 3 WARC fetch failed: ${warcRes.status}`);
      return { success: false, layer: 'common_crawl', reason: 'warc_failed' };
    }

    // WARC is gzip-compressed — decompress it
    const buffer = await warcRes.arrayBuffer();
    const { DecompressionStream } = require('stream/web');
    const ds = new DecompressionStream('gzip');
    const writer = ds.writable.getWriter();
    const reader = ds.readable.getReader();
    writer.write(buffer);
    writer.close();

    let raw = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      raw += new TextDecoder().decode(value);
    }

    // Extract HTML from WARC record (after the WARC/HTTP headers block)
    const htmlStart = raw.indexOf('<!DOCTYPE') !== -1 ? raw.indexOf('<!DOCTYPE') : raw.indexOf('<html');
    const html = htmlStart > -1 ? raw.substring(htmlStart) : raw;

    if (isBlockPage(html, 200)) {
      return { success: false, layer: 'common_crawl', reason: 'blocked' };
    }

    console.log(`[CRAWLER] ✓ Layer 3 (common-crawl) SUCCESS: ${html.length} chars`);
    return { success: true, html, layer: 'common_crawl', statusCode: 200, finalUrl: url };
  } catch (e) {
    console.warn(`[CRAWLER] Layer 3 FAILED: ${e.message}`);
    return { success: false, layer: 'common_crawl', reason: e.message };
  }
}

// Main entry point — tries all layers in order
async function crawlWithFallback(url) {
  const start = Date.now();
  console.log(`[CRAWLER] Starting multi-layer crawl for: ${url}`);

  // Layer 1: Direct
  const direct = await fetchDirect(url);
  if (direct.success) {
    return { ...direct, loadTimeMs: Date.now() - start, isBlocked: false };
  }

  // Layer 2: Google Cache
  const googleCache = await fetchGoogleCache(url);
  if (googleCache.success) {
    return { ...googleCache, loadTimeMs: Date.now() - start, isBlocked: false };
  }

  // Layer 3: Common Crawl
  const commonCrawl = await fetchCommonCrawl(url);
  if (commonCrawl.success) {
    return { ...commonCrawl, loadTimeMs: Date.now() - start, isBlocked: false };
  }

  // All layers failed — return structured blocked result
  console.error(`[CRAWLER] ✗ All 3 layers failed for ${url}. Returning blocked result.`);
  return {
    html: '<html><head><title>Access Blocked</title></head><body></body></html>',
    statusCode: direct.statusCode || 403,
    loadTimeMs: Date.now() - start,
    finalUrl: url,
    isBlocked: true,
    blockedReason: `direct:${direct.reason}, google_cache:${googleCache.reason}, common_crawl:${commonCrawl.reason}`
  };
}

// Keep crawlPage as alias for backwards compatibility
const crawlPage = crawlWithFallback;

module.exports = { crawlWithFallback, crawlPage };
