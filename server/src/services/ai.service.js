/**
 * AI Service for SEO & GEO Analysis.
 * Focused on semantic understanding, entity clarity, and GEO citation readiness.
 */

/**
 * Builds the AI prompt with deterministic rule results.
 * @param {string} compressedHTML - The cleaned HTML content.
 * @param {object} ruleResults - Facts from Cheerio analysis.
 */
const buildPrompt = (compressedHTML, ruleResults) => `
You are a world-class SEO and GEO (Generative Engine Optimization) analyst.

I have already run rule-based technical checks on this page. Here are the confirmed facts:
${JSON.stringify(ruleResults, null, 2)}

Your job is ONLY to analyze the semantic and GEO quality of this page's content.
Do NOT re-evaluate or override the technical facts above.

Analyze the following compressed HTML for:
1. ENTITY CLARITY: Are brand entities (company name, people, products) clearly defined
   so that AI engines like ChatGPT and Perplexity can identify and cite them?
2. TOPICAL AUTHORITY: Does the content demonstrate deep expertise on one clear topic,
   or is it vague and scattered?
3. CITATION READINESS: Would an AI assistant cite this page as a source? Are there
   specific facts, statistics, named authors, or quotable claims?
4. CONTENT QUALITY: Is the writing clear, structured, and free of keyword stuffing?
5. SCHEMA GAPS: What structured data is missing that would help AI engines understand
   this content?

For each issue found, you MUST provide:
- The exact broken element (current_code)
- The exact fixed version (suggested_code)

Respond ONLY with a valid JSON object. No preamble. No explanation outside the JSON.
Schema:
{
  "geo_score": 85,
  "entity_clarity": 70,
  "topical_authority": 90,
  "citation_readiness": 65,
  "detected_entities": ["Entity A", "Entity B"],
  "ai_summary": "<2 sentence plain-English summary of GEO readiness>",
  "issues": [
    {
      "category": "GEO",
      "severity": "CRITICAL",
      "title": "Title of issue",
      "description": "Detailed desc",
      "current_code": "...",
      "suggested_code": "..."
    }
  ],
  "schema_suggestion": "JSON-LD string"
}

Compressed HTML to analyze:
${compressedHTML}
`;

/**
 * Calls AI with a retry mechanism for robust JSON harvesting.
 * Supports both Mistral (direct) and OpenRouter based on AI_PROVIDER env.
 */
async function callAIWithRetry(prompt, attempts = 2) {
  // Primary Attempt: OpenRouter (Google Gemini 1.5 Flash)
  try {
    const rawKey = process.env.OPENROUTER_API_KEY || process.env.OPENROUTER_KEY;
    const openRouterKey = rawKey?.trim();

    if (openRouterKey && openRouterKey !== 'your_openrouter_key_here' && openRouterKey.length > 10) {
      console.log(`[AI] PRIMARY ATTEMPT: OpenRouter (stepfun/step-3.5-flash:free)...`);
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openRouterKey}`,
          'HTTP-Referer': process.env.CLIENT_URL || 'http://localhost:3000',
          'X-Title': 'GEO Audit',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'stepfun/step-3.5-flash:free',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1,
          response_format: { type: "json_object" }
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(`OpenRouter ${res.status}: ${JSON.stringify(errData)}`);
      }

      const data = await res.json();
      const text = data.choices[0]?.message?.content;
      if (!text) throw new Error('Empty AI response from OpenRouter');
      return JSON.parse(text.replace(/```json|```/g, '').trim());
    } else {
      console.log(`[AI] No OpenRouter API key found. Skipping primary AI.`);
    }
  } catch (err) {
    console.error(`[AI] Primary OpenRouter failed:`, err.message);
  }

  // Fallback Attempt: Mistral Direct
  console.log(`[AI] FALLBACK ATTEMPT: Mistral Direct (mistral-small-latest)...`);
  for (let i = 0; i < attempts; i++) {
    try {
      // Using the exact fallback key provided by the user
      const mistralKey = process.env.MISTRAL_API_KEY || 'oUgHHTZS9xmvPfTbWFzcCqnte04mvINS';
      
      const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${mistralKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'mistral-small-latest',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1,
          response_format: { type: "json_object" }
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(`Mistral ${res.status}: ${JSON.stringify(errData)}`);
      }

      const data = await res.json();
      const text = data.choices[0]?.message?.content;
      if (!text) throw new Error('Empty AI response from Mistral');
      return JSON.parse(text.replace(/```json|```/g, '').trim());
    } catch (err) {
      console.error(`[AI] Mistral fallback attempt ${i + 1} failed:`, err.message);
      if (i === attempts - 1) throw err;
    }
  }
}

// Global Fallback
const SAFE_FALLBACK_JSON = {
  geo_score: 50,
  entity_clarity: 50,
  topical_authority: 50,
  citation_readiness: 50,
  detected_entities: [],
  ai_summary: "AI analysis unavailable. Please check API configuration.",
  issues: [],
  schema_suggestion: ""
};

/**
 * Main analysis entry point triggered by worker.js
 */
async function analyzeSemantic(compressedHTML, ruleResults) {
  const prompt = buildPrompt(compressedHTML, ruleResults);
  try {
    return await callAIWithRetry(prompt);
  } catch (err) {
    console.error('[AI] Fatal Ref Error:', err.message);
    return SAFE_FALLBACK_JSON;
  }
}

module.exports = { buildPrompt, callAIWithRetry, analyzeSemantic, SAFE_FALLBACK_JSON };
