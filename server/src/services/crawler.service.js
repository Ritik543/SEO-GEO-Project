/**
 * Crawls a URL using native fetch (SEO HTML extraction).
 * Replaces Puppeteer to completely bypass Render Free Tier RAM limits and missing Chromium OS dependencies.
 * @param {string} url - The page URL to crawl.
 * @returns {Promise<{html: string, statusCode: number, loadTimeMs: number, finalUrl: string}>}
 */
async function crawlPage(url) {
  const start = Date.now();

  console.log(`[CRAWLER] Starting crawl for: ${url}`);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Sec-Ch-Ua': '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
        'Sec-Ch-Ua-Mobile': '?0',
        'Sec-Ch-Ua-Platform': '"Windows"',
        'Cache-Control': 'max-age=0'
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(30000) // 30s timeout
    });

    const html = await response.text();
    const loadTimeMs = Date.now() - start;

    // Extract title for logging
    const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
    const pageTitle = titleMatch ? titleMatch[1].trim() : '(no title)';

    console.log(`[CRAWLER] Response: status=${response.status}, finalUrl=${response.url}, loadTime=${loadTimeMs}ms`);
    console.log(`[CRAWLER] Page title: "${pageTitle}"`);
    console.log(`[CRAWLER] HTML length: ${html.length} chars`);

    // Detect bot-blocking pages
    if (pageTitle.includes('Just a moment') || pageTitle.includes('Attention Required') || pageTitle.includes('Access denied')) {
      console.warn(`[CRAWLER] ⚠ BOT BLOCKED! The site is showing a Cloudflare/security challenge instead of real content.`);
      console.warn(`[CRAWLER] ⚠ This means Render's IP is blocked by the target site's WAF. The audit will have limited data.`);
    }

    return { 
      html, 
      statusCode: response.status, 
      loadTimeMs, 
      finalUrl: response.url 
    };
  } catch (err) {
    console.error(`[CRAWLER] ✗ Crawl FAILED for ${url}: ${err.message}`);
    if (err.name === 'TimeoutError') {
      throw new Error(`Timeout: Server did not respond within 30s for ${url}`);
    }
    throw new Error(`Failed to fetch page: ${err.message}`);
  }
}

module.exports = { crawlPage };
