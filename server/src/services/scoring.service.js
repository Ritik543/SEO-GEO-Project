/**
 * Compiles individual category scores from the AI response into an overall score.
 * Weights reflect real-world SEO audit priorities.
 * @param {object} aiScores - { technical_seo, onpage_seo, schema, geo }
 * @returns {object} Scores with computed overall.
 */
function computeOverallScore(aiScores) {
  const weights = {
    technical_seo: 0.30,
    onpage_seo: 0.30,
    schema: 0.20,
    geo: 0.20,
  };

  const overall = Math.round(
    (aiScores.technical_seo || 0) * weights.technical_seo +
    (aiScores.onpage_seo || 0) * weights.onpage_seo +
    (aiScores.schema || 0) * weights.schema +
    (aiScores.geo || 0) * weights.geo
  );

  return {
    technical_seo: aiScores.technical_seo || 0,
    onpage_seo: aiScores.onpage_seo || 0,
    schema: aiScores.schema || 0,
    geo: aiScores.geo || 0,
    overall: Math.min(100, Math.max(0, overall)),
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

module.exports = { computeOverallScore, scoreToGrade };
