/**
 * Crawls a URL using native fetch (SEO HTML extraction).
 * Replaces Puppeteer to completely bypass Render Free Tier RAM limits and missing Chromium OS dependencies.
 * @param {string} url - The page URL to crawl.
 * @returns {Promise<{html: string, statusCode: number, loadTimeMs: number, finalUrl: string}>}
 */
async function crawlPage(url) {
  const start = Date.now();

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Referer': 'https://www.google.com/'
      },
      signal: AbortSignal.timeout(30000) // 30s timeout
    });

    const html = await response.text();
    const loadTimeMs = Date.now() - start;

    return { 
      html, 
      statusCode: response.status, 
      loadTimeMs, 
      finalUrl: response.url 
    };
  } catch (err) {
    if (err.name === 'TimeoutError') {
      throw new Error(`Timeout: Server did not respond within 30s for ${url}`);
    }
    throw new Error(`Failed to fetch page: ${err.message}`);
  }
}

module.exports = { crawlPage };
