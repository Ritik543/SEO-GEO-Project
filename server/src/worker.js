require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { auditQueue } = require('./config/queue');
const { connection } = require('./config/redis');
const mongoose = require('mongoose');
const Report = require('./models/Report');

const cheerio = require('cheerio');
const { crawlPage } = require('./services/crawler.service');
const { extractContent } = require('./services/content.service');
const { extractSchema } = require('./services/schema.service');
const { compressHTML } = require('./services/compressor.service');
const { callAIWithRetry, buildPrompt } = require('./services/ai.service');
const { runRuleChecks } = require('./services/rules.service');
const { getPageSpeedData } = require('./services/pagespeed.service');
const { computeScores } = require('./services/scoring.service');

// ─── MongoDB ────────────────────────────────────────────────
if (mongoose.connection.readyState === 0) {
  mongoose
    .connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lumen-audit')
    .then(() => console.log('✓ Worker: MongoDB connected'))
    .catch((err) => {
      console.error('✗ Worker: MongoDB error:', err.message);
      process.exit(1);
    });
}

// ─── Helper: Publish progress via Redis Pub/Sub for SSE ─────
async function updateProgress(jobId, progress, message, stage = 'processing') {
  const payload = JSON.stringify({ stage, message, progress, timestamp: Date.now() });
  await connection.publish(`audit:${jobId}`, payload);
}

// ─── Worker Definition ──────────────────────────────────────
auditQueue.process('audit', 2, async (job) => {
    const { url, jobId } = job.data;
    const startTime = Date.now();

    try {
      // Step 1: Crawl (10%)
      await Report.findOneAndUpdate({ jobId }, { status: 'crawling' });
      await updateProgress(jobId, 10, 'Fetching page HTML...', 'crawling');
      const { html, finalUrl, statusCode, loadTimeMs } = await crawlPage(url);
      console.log(`[WORKER] Step 1 DONE: Crawled ${finalUrl || url} | status=${statusCode} | HTML=${html.length} chars | ${loadTimeMs}ms`);
      const $ = cheerio.load(html);

      // Step 2: Rule-based checks (25%) — FAST, 100% accurate
      await Report.findOneAndUpdate({ jobId }, { status: 'extracting' });
      await updateProgress(jobId, 25, 'Running technical SEO checks...', 'extracting');
      const ruleResults = runRuleChecks($, finalUrl || url);
      console.log(`[WORKER] Step 2 DONE: Rule checks | title="${ruleResults.facts.title_text}" | wordCount=${ruleResults.facts.word_count} | issues=${ruleResults.issues.length} | techSEO=${ruleResults.scores.technical_seo} | onPage=${ruleResults.scores.on_page_seo}`);

      // Step 3: PageSpeed (40%) — Dual Strategy
      await updateProgress(jobId, 40, 'Fetching Mobile & Desktop performance metrics...', 'extracting');
      const [cwvMobile, cwvDesktop] = await Promise.all([
        getPageSpeedData(finalUrl || url, 'mobile'),
        getPageSpeedData(finalUrl || url, 'desktop')
      ]);

      // Step 4: Compress + AI (70%) — GEO + semantic analysis only
      await Report.findOneAndUpdate({ jobId }, { status: 'analyzing' });
      await updateProgress(jobId, 55, 'Running AI semantic analysis...', 'analyzing');
      const content = extractContent(html);
      console.log(`[WORKER] Step 4a: Content extracted | title="${content.title}" | headings.h1=${content.headings?.h1?.length || 0} | headings.h2=${content.headings?.h2?.length || 0}`);
      
      // Explicit Block Detection
      if (content.title && (content.title.includes('Just a moment') || content.title.includes('Cloudflare') || content.title.includes('Attention'))) {
        console.warn(`[WORKER] ⚠ BLOCKED PAGE DETECTED for ${url}. Title: "${content.title}". AI analysis will be limited.`);
      }

      const schemas = extractSchema(html);
      console.log(`[WORKER] Step 4b: Schema extracted | found ${schemas.length} JSON-LD blocks`);
      
      const compressed = compressHTML(content, schemas);
      console.log(`[WORKER] Step 4c: Compressed HTML length: ${compressed.length} chars (sending to AI)`);

      const { analyzeSemantic } = require('./services/ai.service');
      const aiResults = await analyzeSemantic(compressed, ruleResults.facts) || {};
      console.log(`[WORKER] Step 4d: AI Results received | keys=${Object.keys(aiResults).join(',')}`);
      console.log(`[WORKER] Step 4d: AI Scores | geo_score=${aiResults.geo_score} | entity_clarity=${aiResults.entity_clarity} | topical_authority=${aiResults.topical_authority} | citation_readiness=${aiResults.citation_readiness}`);

      // Step 5: Score (90%)
      await Report.findOneAndUpdate({ jobId }, { status: 'scoring' });
      await updateProgress(jobId, 90, 'Calculating final scores...', 'scoring');
      const finalScores = computeScores(ruleResults, cwvMobile, aiResults);
      console.log(`[WORKER] Step 5 DONE: Final Scores | overall=${finalScores.overall} | techSEO=${finalScores.technical_seo} | onPage=${finalScores.onpage_seo} | schema=${finalScores.schema} | geo=${finalScores.geo}`);

      // Step 6: Save to MongoDB (100%)
      const processingTime = Date.now() - startTime;
      const reportPayload = {
        url: finalUrl || url,
        status: 'completed',
        scores: finalScores,
        issues: [...ruleResults.issues, ...(aiResults?.issues || [])].map(i => ({
          ...i,
          category: (i.category || 'SEO').toLowerCase()
        })),
        geoInsights: {
          entityClarity: Number(aiResults?.entity_clarity || aiResults?.entityClarity || 0),
          topicalAuthority: Number(aiResults?.topical_authority || aiResults?.topicalAuthority || 0),
          citationReadiness: Number(aiResults?.citation_readiness || aiResults?.citationReadiness || 0),
          detected_entities: aiResults?.detected_entities || aiResults?.entities || [],
          ai_summary: aiResults?.ai_summary || aiResults?.summary || 'AI analysis completed.',
        },
        improvedSchema: (() => {
          let schema = aiResults.schema_suggestion;
          if (typeof schema === 'string') {
            try {
              // Handle AI double-stringification or literal escaping
              const cleaned = schema.replace(/\\"/g, '"').replace(/^"/, '').replace(/"$/, '');
              return JSON.parse(cleaned);
            } catch (e) {
              console.warn('AI Schema parsing failed, returning raw string.');
              return schema;
            }
          }
          return schema || [];
        })(),
        performance: {
          mobile: cwvMobile ? {
            score: cwvMobile.performance_score,
            lcp: { value: cwvMobile.lcp_ms, rating: cwvMobile.lcp_rating },
            fid: { value: cwvMobile.fid_ms, rating: cwvMobile.fid_rating },
            cls: { value: cwvMobile.cls_score, rating: cwvMobile.cls_rating },
          } : undefined,
          desktop: cwvDesktop ? {
            score: cwvDesktop.performance_score,
            lcp: { value: cwvDesktop.lcp_ms, rating: cwvDesktop.lcp_rating },
            fid: { value: cwvDesktop.fid_ms, rating: cwvDesktop.fid_rating },
            cls: { value: cwvDesktop.cls_score, rating: cwvDesktop.cls_rating },
          } : undefined,
        },
        rawExtraction: {
          title: ruleResults.facts.title_text,
          metaDescription: ruleResults.facts.meta_description,
          headings: content.headings,
          wordCount: ruleResults.facts.word_count,
          existingSchema: schemas,
        },
        processingTime,
        completedAt: new Date(),
      };

      await Report.findOneAndUpdate({ jobId }, reportPayload);
      await updateProgress(jobId, 100, 'completed', 'completed');

      return { reportId: jobId };
    } catch (err) {
      console.error(`Worker error for job ${jobId}:`, err.message);
      const isFinalAttempt = job.attemptsMade >= (job.opts.attempts - 1) || job.opts.attempts <= 1;

      if (isFinalAttempt) {
        await Report.findOneAndUpdate({ jobId }, { status: 'failed', error: err.message });
        await updateProgress(jobId, 0, `Audit failed: ${err.message}`, 'failed');
      }
      throw err;
    }
  }
);

auditQueue.on('completed', (job) => {
  console.log(`✓ Audit completed: ${job.data.jobId}`);
});

auditQueue.on('failed', (job, err) => {
  console.error(`✗ Audit failed: ${job?.data?.jobId}`, err.message);
});

console.log('✓ Audit worker started. Waiting for jobs...');
