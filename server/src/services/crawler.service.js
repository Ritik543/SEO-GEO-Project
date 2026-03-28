const puppeteer = require('puppeteer');

/**
 * Crawls a URL using Puppeteer with optimised settings.
 * @param {string} url - The page URL to crawl.
 * @returns {Promise<{html: string, statusCode: number, loadTimeMs: number, finalUrl: string}>}
 */
async function crawlPage(url) {
  const start = Date.now();

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-extensions',
      '--no-first-run',
      '--disable-background-networking',
    ],
  });

  let page;
  try {
    page = await browser.newPage();

    // Set a realistic user agent
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    // Block heavy resources via CDP instead of request interception
    // (request interception is known to cause "frame detached" on Windows)
    const session = await page.createCDPSession();
    await session.send('Network.enable');
    await session.send('Network.setBlockedURLs', {
      urls: ['*.png', '*.jpg', '*.jpeg', '*.gif', '*.webp', '*.svg', '*.ico', '*.woff', '*.woff2', '*.ttf', '*.eot', '*.mp4', '*.mp3']
    });

    let statusCode = 200;
    page.on('response', (response) => {
      if (response.url() === url || response.url() === page.url()) {
        statusCode = response.status();
      }
    });

    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    const finalUrl = page.url();
    const html = await page.content();
    const loadTimeMs = Date.now() - start;

    return { html, statusCode, loadTimeMs, finalUrl };
  } finally {
    if (browser) await browser.close();
  }
}

module.exports = { crawlPage };
