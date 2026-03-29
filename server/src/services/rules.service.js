const cheerio = require('cheerio');

/**
 * Performs deterministic SEO checks using Cheerio.
 * These checks are 100% accurate because they read the actual HTML directly.
 * @param {object} $ - Loaded Cheerio instance
 * @param {string} url - Target URL
 * @returns {object} { issues, scores, facts }
 */
function runRuleChecks($, url) {
  const issues = [];
  let technicalScore = 100;
  let onPageScore = 100;

  // --- H1 checks ---
  const h1Tags = $('h1');
  const h1Count = h1Tags.length;
  if (h1Count === 0) {
    issues.push({ category: 'TECHNICAL_SEO', severity: 'CRITICAL',
      title: 'Missing H1 tag',
      description: 'No H1 found. Search engines use H1 as the primary topic signal.',
      current_code: '(no H1 tag found)',
      suggested_code: `<h1>Your primary keyword phrase here</h1>`
    });
    technicalScore -= 20;
  } else if (h1Count > 1) {
    issues.push({ category: 'TECHNICAL_SEO', severity: 'WARNING',
      title: `Multiple H1 tags (${h1Count} found)`,
      description: 'Only one H1 should exist per page.',
      current_code: h1Tags.map((i, el) => $(el).text()).get().join(' | '),
      suggested_code: 'Keep only the most important H1, convert others to H2'
    });
    technicalScore -= 10;
  }

  // --- Meta description ---
  const metaDesc = $('meta[name="description"]').attr('content') || '';
  if (!metaDesc) {
    issues.push({ category: 'TECHNICAL_SEO', severity: 'CRITICAL',
      title: 'Missing meta description',
      description: 'No meta description found. Used by search engines and AI as page summary.',
      current_code: '(no meta description)',
      suggested_code: `<meta name="description" content="150-160 char summary here">`
    });
    technicalScore -= 15;
  } else if (metaDesc.length > 160) {
    issues.push({ category: 'ON_PAGE_SEO', severity: 'WARNING',
      title: `Meta description too long (${metaDesc.length} chars)`,
      description: 'Google truncates meta descriptions over 160 characters.',
      current_code: metaDesc,
      suggested_code: metaDesc.substring(0, 157) + '...'
    });
    onPageScore -= 8;
  }

  // --- Image alt text ---
  const allImgs = $('img');
  const missingAlt = $('img:not([alt]), img[alt=""]');
  if (missingAlt.length > 0) {
    issues.push({ category: 'TECHNICAL_SEO', severity: 'WARNING',
      title: `${missingAlt.length} of ${allImgs.length} images missing alt text`,
      description: 'Alt text is used by screen readers and search engine image crawlers.',
      current_code: `<img src="..."> (${missingAlt.length} instances)`,
      suggested_code: `<img src="..." alt="Descriptive text about the image">`
    });
    technicalScore -= Math.min(15, missingAlt.length * 2);
  }

  // --- Title tag ---
  const title = $('title').text().trim();
  const ogTitle = $('meta[property="og:title"]').attr('content') || '';
  if (!title) {
    issues.push({ category: 'TECHNICAL_SEO', severity: 'CRITICAL',
      title: 'Missing title tag',
      current_code: '(no title tag)',
      suggested_code: `<title>Primary Keyword | Brand Name</title>`
    });
    technicalScore -= 20;
  } else if (title.length > 60) {
    issues.push({ category: 'ON_PAGE_SEO', severity: 'WARNING',
      title: `Title too long (${title.length} chars)`,
      description: 'Google truncates titles over 60 characters in search results.',
      current_code: title,
      suggested_code: title.substring(0, 57) + '...'
    });
    onPageScore -= 8;
  }

  // --- OG / Social meta ---
  if (!$('meta[property="og:description"]').attr('content')) {
    issues.push({ category: 'GEO', severity: 'INFO',
      title: 'Missing og:description',
      description: 'AI engines like Perplexity pull og:description when summarizing pages.',
      current_code: '(no og:description)',
      suggested_code: `<meta property="og:description" content="...">`
    });
    onPageScore -= 5;
  }

  // --- Canonical ---
  const canonical = $('link[rel="canonical"]').attr('href');
  if (!canonical) {
    issues.push({ category: 'TECHNICAL_SEO', severity: 'INFO',
      title: 'No canonical tag',
      description: 'Canonical tags prevent duplicate content issues.',
      current_code: '(no canonical tag)',
      suggested_code: `<link rel="canonical" href="${url}">`
    });
  }

  // --- H2 structure ---
  const h2Count = $('h2').length;
  const wordCount = $('body').text().trim().split(/\s+/).length;

  return {
    issues,
    scores: {
      technical_seo: Math.max(0, technicalScore),
      on_page_seo: Math.max(0, onPageScore)
    },
    facts: {
      h1_count: h1Count,
      h1_text: h1Count > 0 ? $('h1').first().text().trim() : null,
      title_text: title,
      og_title: ogTitle,
      meta_description: metaDesc,
      h2_count: h2Count,
      image_count: allImgs.length,
      images_missing_alt: missingAlt.length,
      word_count: wordCount,
      has_canonical: !!canonical,
      has_schema: $('script[type="application/ld+json"]').length > 0
    }
  };
}

module.exports = { runRuleChecks };
