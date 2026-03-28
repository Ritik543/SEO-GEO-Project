const cheerio = require('cheerio');

/**
 * Extracts structured content from raw HTML.
 * @param {string} html - Raw HTML string.
 * @returns {object} Extracted metadata: title, meta, headings, links, images, text, word count.
 */
function extractContent(html) {
  const $ = cheerio.load(html);

  // ─── Meta ─────────────────────────────────────────────
  const title = $('title').text().trim();
  const metaDescription = $('meta[name="description"]').attr('content') || '';
  const metaKeywords = $('meta[name="keywords"]').attr('content') || '';
  const canonical = $('link[rel="canonical"]').attr('href') || '';
  const robots = $('meta[name="robots"]').attr('content') || '';
  const ogTitle = $('meta[property="og:title"]').attr('content') || '';
  const ogDescription = $('meta[property="og:description"]').attr('content') || '';
  const ogImage = $('meta[property="og:image"]').attr('content') || '';
  const viewport = $('meta[name="viewport"]').attr('content') || '';
  const lang = $('html').attr('lang') || '';

  // ─── Headings ─────────────────────────────────────────
  const headings = {};
  ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].forEach((tag) => {
    headings[tag] = [];
    $(tag).each((_, el) => {
      headings[tag].push($(el).text().trim());
    });
  });

  // ─── Links ────────────────────────────────────────────
  const links = { internal: [], external: [] };
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') || '';
    const text = $(el).text().trim();
    const nofollow = ($(el).attr('rel') || '').includes('nofollow');
    if (href.startsWith('http')) {
      links.external.push({ href, text, nofollow });
    } else if (href.startsWith('/')) {
      links.internal.push({ href, text });
    }
  });

  // ─── Images ───────────────────────────────────────────
  const images = [];
  $('img').each((_, el) => {
    images.push({
      src: $(el).attr('src') || '',
      alt: $(el).attr('alt') || '',
      hasAlt: !!($(el).attr('alt')),
    });
  });

  // ─── Body text ────────────────────────────────────────
  $('script, style, noscript, svg, iframe').remove();
  const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
  const wordCount = bodyText.split(/\s+/).filter(Boolean).length;

  return {
    title,
    metaDescription,
    metaKeywords,
    canonical,
    robots,
    og: { title: ogTitle, description: ogDescription, image: ogImage },
    viewport,
    lang,
    headings,
    links: {
      internal: links.internal.slice(0, 50),
      external: links.external.slice(0, 50),
      internalCount: links.internal.length,
      externalCount: links.external.length,
    },
    images: {
      list: images.slice(0, 30),
      total: images.length,
      missingAlt: images.filter((i) => !i.hasAlt).length,
    },
    bodyText: bodyText.slice(0, 8000), // cap for token efficiency
    wordCount,
  };
}

module.exports = { extractContent };
