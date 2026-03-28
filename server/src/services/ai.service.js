const { GoogleGenerativeAI } = require('@google/generative-ai');

// ═══════════════════════════════════════════════════════════
// Strict Free Mode Configuration
// ═══════════════════════════════════════════════════════════

const ALLOWED_FREE_MODELS = [
  'google/gemma-3-27b-it:free',
  'google/gemma-3-12b-it:free',
  'meta-llama/llama-3.2-3b-instruct:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'nousresearch/hermes-3-llama-3.1-405b:free',
  'openrouter/auto', // Auto is allowed but will attempt to be free
];

const BLOCKED_PROVIDERS = ['google/', 'openai/', 'anthropic/', 'cohere/', 'anthropic/'];

/**
 * Validates that a model ID is strictly free and not from a paid provider.
 * OpenRouter uses the ':free' suffix for its 100% free tier.
 */
function validateFreeModel(modelId) {
  if (process.env.FREE_MODE !== 'true') return;

  // OpenRouter's :free suffix is the most reliable "Free Forever" indicator
  const isExplicitlyFree = modelId.toLowerCase().endsWith(':free');
  
  // Extra security: still block known paid prefixes if they DON'T have the :free suffix
  const isPaidProvider = BLOCKED_PROVIDERS.some(p => modelId.toLowerCase().startsWith(p)) && !isExplicitlyFree;

  if (isPaidProvider || (!isExplicitlyFree && !ALLOWED_FREE_MODELS.includes(modelId))) {
    throw new Error(`[SECURITY] MODEL BLOCKED: ${modelId} is a paid or non-whitelisted model. Billing prevention active.`);
  }
}

const SAFE_FALLBACK_JSON = {
  pageType: "WebPage",
  entities: {
    who: ["Unknown Brand"],
    what: ["Content Services"],
    how: ["Direct Search"],
    result: ["General Information"]
  },
  issues: [
    { category: "technical_seo", severity: "info", title: "AI analysis unavailable", description: "The AI service returned an empty state. Page was crawled but not fully analyzed." }
  ],
  recommendations: [
    { category: "technical_seo", priority: "low", problem: "Analysis incomplete", why: "Ensures some report data is still visible", fix: "Verify AI provider availability", example: "" }
  ],
  improvedSchema: {}
};

// ═══════════════════════════════════════════════════════════
// LLM Provider Interface & Implementations
// ═══════════════════════════════════════════════════════════

class BaseLLMProvider {
  constructor(name) {
    this.name = name;
  }
  async analyze(compressedPayload) {
    throw new Error(`analyze() not implemented for provider: ${this.name}`);
  }
}

/**
 * Google Gemini Provider (Legacy / Optional).
 */
class GeminiProvider extends BaseLLMProvider {
  constructor(apiKey) {
    super('gemini');
    if (process.env.FREE_MODE === 'true') {
      throw new Error('GeminiProvider (Direct SDK) is blocked in FREE_MODE.');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  }

  async analyze(compressedPayload) {
    const prompt = buildSEOGEOPrompt(compressedPayload);
    this.model = this.genAI.getGenerativeModel({ model: this.modelName });
    const result = await this.model.generateContent(prompt);
    const text = result.response.text();
    return parseAIResponse(text);
  }
}

/**
 * OpenRouter Provider (Strict Free Mode with Fallback).
 */
class OpenRouterProvider extends BaseLLMProvider {
  constructor(apiKey) {
    super('openrouter');
    this.apiKey = apiKey;
    this.models = [
      process.env.OPENROUTER_PRIMARY_MODEL || 'mistralai/mistral-7b-instruct:free',
      process.env.OPENROUTER_FALLBACK_MODEL || 'meta-llama/llama-3.1-8b-instruct:free'
    ];
  }

  async analyze(compressedPayload) {
    const prompt = buildSEOGEOPrompt(compressedPayload);
    let lastError = null;

    for (const modelId of this.models) {
      try {
        validateFreeModel(modelId);
        console.log(`[AI] Free Mode: Attempting model ${modelId}`);

        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'HTTP-Referer': process.env.CLIENT_URL || 'http://localhost:3000',
            'X-Title': 'Lumen Audit',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: modelId,
            messages: [{ role: 'user', content: prompt }],
            max_tokens: parseInt(process.env.MAX_TOKENS || '1500'),
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`OpenRouter ${response.status}: ${JSON.stringify(errorData.error || errorData)}`);
        }

        const data = await response.json();
        const text = data.choices[0]?.message?.content;
        
        if (!text) throw new Error('Empty response content');
        
        return parseAIResponse(text);
      } catch (err) {
        console.error(`[AI] Failed with ${modelId}:`, err.message);
        lastError = err;
        continue; // Fallback to next model
      }
    }

    console.warn('[AI] CRITICAL FAILURE: Both free models failed. Returning safe placeholder JSON.');
    return SAFE_FALLBACK_JSON;
  }
}

// ═══════════════════════════════════════════════════════════
// Factory
// ═══════════════════════════════════════════════════════════

function createLLMProvider() {
  const provider = process.env.AI_PROVIDER || 'openrouter';

  switch (provider) {
    case 'gemini':
      return new GeminiProvider(process.env.GEMINI_API_KEY);
    case 'openrouter':
      return new OpenRouterProvider(process.env.OPENROUTER_API_KEY);
    default:
      throw new Error(`Unknown AI_PROVIDER: ${provider}`);
  }
}

// ═══════════════════════════════════════════════════════════
// Prompt Engineering
// ═══════════════════════════════════════════════════════════

function buildSEOGEOPrompt(compressedPayload) {
  return `You are an expert SEO and GEO (Generative Engine Optimization) auditor.
Analyze the following webpage data and return a STRICT JSON response.

Input Page Data:
${compressedPayload}

──────────────────────────────────────────────
REQUIRED JSON STRUCTURE (Return ONLY valid JSON):

{
  "pageType": "Article|Product|Service|LandingPage|... ",
  "entities": {
    "who": ["Main Brand", "Author", "Organization"],
    "what": ["Main Topic", "Key Offering", "Niche"],
    "how": ["Solution provided", "Benefit delivered"],
    "result": ["Specific Outcome", "Target Result"]
  },
  "issues": [
    {
      "category": "technical_seo|onpage_seo|schema|geo",
      "severity": "critical|warning|info",
      "title": "Short title",
      "description": "What is wrong"
    }
  ],
  "recommendations": [
    {
      "category": "technical_seo|onpage_seo|schema|geo",
      "priority": "high|medium|low",
      "problem": "Problem desc",
      "why": "Business Impact",
      "fix": "Specific fix instructions",
      "example": "Snippet or text example"
    }
  ],
  "improvedSchema": { 
    "@context": "https://schema.org",
    "@type": "...",
    "info": "Optimized version of existing schema or new suggested block"
  }
}

Rules:
- Score 0-100 logic is gone; focus on Entity Clarity and GEO Readiness.
- Entities are CRITICAL for GEO (AI engine understanding).
- improvedSchema must be 100% valid JSON-LD.
- Return ONLY JSON. No explanations. No markdown fences.`;
}

// ═══════════════════════════════════════════════════════════
// Response Parser
// ═══════════════════════════════════════════════════════════

function parseAIResponse(rawText) {
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('AI response parse error:', err.message);
    return SAFE_FALLBACK_JSON;
  }
}

module.exports = { createLLMProvider, GeminiProvider, OpenRouterProvider, SAFE_FALLBACK_JSON };
