/**
 * Compresses extracted page data to reduce token usage before sending to an LLM.
 * Strips redundant whitespace, truncates long text, and flattens structures.
 * @param {object} content - Extracted content from content.service.
 * @param {object[]} schemas - Extracted JSON-LD from schema.service.
 * @returns {string} A compressed, structured text prompt payload.
 */
function compressHTML(content, schemas) {
  const sections = [];

  sections.push(`URL AUDIT DATA`);
  sections.push(`==============`);

  // Meta - Essential only
  sections.push(`\n[META]`);
  sections.push(`Title: ${content.title}`);
  sections.push(`Description: ${content.metaDescription}`);
  sections.push(`Canonical: ${content.canonical}`);
  sections.push(`OG Title: ${content.og?.title || 'N/A'}`);

  // Headings - Reduced count
  sections.push(`\n[HEADINGS]`);
  Object.entries(content.headings || {}).forEach(([tag, texts]) => {
    if (texts.length > 0) {
      sections.push(`${tag.toUpperCase()}: ${texts.slice(0, 3).join(' | ')}`);
    }
  });

  // Stats
  sections.push(`\n[STATS]`);
  sections.push(`Links: ${content.links?.internalCount || 0} int / ${content.links?.externalCount || 0} ext`);
  sections.push(`Images: ${content.images?.total || 0} (${content.images?.missingAlt || 0} missing alt)`);

  // Body preview (Highly truncated for Free Tier stability)
  sections.push(`\n[BODY PREVIEW — ${content.wordCount || 0} words]`);
  // Only send the most relevant parts of the body text (first 1500 chars)
  sections.push((content.bodyText || '').slice(0, 1500).replace(/\s+/g, ' '));

  // Schema - Aggressively limited to save tokens
  sections.push(`\n[STR_DATA]`);
  if (schemas.length === 0) {
    sections.push('None');
  } else {
    // Only send the first 2-3 schemas, and only the first 500 chars of each to keep the prompt small
    schemas.slice(0, 2).forEach((s, i) => {
      const cleanSchema = JSON.stringify(s).replace(/@context":\s*"https?:\/\/schema\.org",?/g, '');
      sections.push(`S#${i + 1}: ${cleanSchema.slice(0, 500)}`);
    });
    if (schemas.length > 2) {
      sections.push(`... (+${schemas.length - 2} more schema blocks omitted to save tokens)`);
    }
  }

  return sections.join('\n');
}

module.exports = { compressHTML };
