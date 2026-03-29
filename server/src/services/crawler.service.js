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
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'max-age=0',
        'Referer': 'https://www.google.com/',
        'Sec-Ch-Ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'cross-site',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1'
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
