/**
 * Main scoring interface for worker.js.
 * Technical SEO: 60% from rules, 40% from Core Web Vitals (PageSpeed)
 * On-Page SEO: 100% from rule-based checks
 * Schema: Evaluated by AI based on context
 * GEO: Weighted average of AI sub-scores (Entity, Topical, Citation)
 * Overall: Weighted composite of the above
 */
function computeScores(ruleResults, cwvData, aiResults) {
  // Technical SEO: 60% from rules, 40% from Core Web Vitals
  const cwvScore = cwvData ? cwvData.performance_score : 50;
  const technicalSEO = Math.round(
    (ruleResults.scores.technical_seo * 0.6) + (cwvScore * 0.4)
  );

  // On-Page SEO: purely from rule-based checks
  const onPageSEO = ruleResults.scores.on_page_seo;

  // Schema: from AI (it reads and evaluates structured data context)
  const schema = Math.min(100, Math.max(0, Number(aiResults?.geo_score || aiResults?.schema_score || 0)));

  // GEO: weighted average of AI's sub-scores
  const geo = Math.round(
    (Number(aiResults?.entity_clarity || 0) * 0.35) +
    (Number(aiResults?.topical_authority || 0) * 0.35) +
    (Number(aiResults?.citation_readiness || 0) * 0.30)
  );

  // Overall: weighted composite
  const overall = Math.round(
    ((technicalSEO || 0) * 0.25) +
    ((onPageSEO || 0) * 0.25) +
    ((schema || 0) * 0.20) +
    ((geo || 0) * 0.30)
  ) || 0;

  return { 
    overall, 
    technical_seo: technicalSEO, 
    onpage_seo: onPageSEO, // Maintain consistent naming for Frontend
    schema, 
    geo 
  };
}

/**
 * Returns a human-readable grade from a numeric score.
 */
function scoreToGrade(score) {
  if (score >= 90) return 'A+';
  if (score >= 80) return 'A';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  if (score >= 50) return 'D';
  return 'F';
}

module.exports = { computeScores, scoreToGrade };
