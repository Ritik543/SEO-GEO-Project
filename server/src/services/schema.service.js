const cheerio = require('cheerio');

/**
 * Extracts all JSON-LD structured data from the page.
 * @param {string} html - Raw HTML string.
 * @returns {object[]} Array of parsed JSON-LD objects.
 */
function extractSchema(html) {
  const $ = cheerio.load(html);
  const schemas = [];

  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const raw = $(el).html();
      if (raw) {
        const parsed = JSON.parse(raw);
        schemas.push(parsed);
      }
    } catch {
      // Malformed JSON-LD — we'll flag this as an issue
    }
  });

  return schemas;
}

/**
 * Validates extracted JSON-LD for common issues.
 * @param {object[]} schemas
 * @returns {{ valid: boolean, issues: string[] }}
 */
function validateSchema(schemas) {
  const issues = [];

  if (schemas.length === 0) {
    issues.push('No JSON-LD structured data found on the page.');
    return { valid: false, issues };
  }

  schemas.forEach((schema, idx) => {
    if (!schema['@type']) {
      issues.push(`Schema block #${idx + 1} is missing @type.`);
    }
    if (!schema['@context']) {
      issues.push(`Schema block #${idx + 1} is missing @context (expected "https://schema.org").`);
    }
  });

  return { valid: issues.length === 0, issues };
}

module.exports = { extractSchema, validateSchema };
