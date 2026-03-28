require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { auditQueue } = require('./config/queue');
const { connection } = require('./config/redis');
const mongoose = require('mongoose');
const Report = require('./models/Report');

const { crawlPage } = require('./services/crawler.service');
const { extractContent } = require('./services/content.service');
const { extractSchema, validateSchema } = require('./services/schema.service');
const { compressForAI } = require('./services/compressor.service');
const { createLLMProvider } = require('./services/ai.service');
const { computeOverallScore } = require('./services/scoring.service');

// ─── MongoDB ────────────────────────────────────────────────
mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lumen-audit')
  .then(() => console.log('✓ Worker: MongoDB connected'))
  .catch((err) => {
    console.error('✗ Worker: MongoDB error:', err.message);
    process.exit(1);
  });

// ─── Helper: Publish progress via Redis Pub/Sub for SSE ─────
async function publishProgress(jobId, stage, message, progress) {
  const payload = JSON.stringify({ stage, message, progress, timestamp: Date.now() });
  await connection.publish(`audit:${jobId}`, payload);
}

// ─── Worker Definition ──────────────────────────────────────
auditQueue.process('audit', 2, async (job) => {
    const { url, jobId } = job.data;
    const startTime = Date.now();

    try {
      // 1. Update status: crawling
      await Report.findOneAndUpdate({ jobId }, { status: 'crawling' });
      await publishProgress(jobId, 'crawling', `Launching headless browser for ${url}...`, 10);

      const { html, statusCode, loadTimeMs, finalUrl } = await crawlPage(url);
      await publishProgress(jobId, 'crawling', `Page fetched (${statusCode}) in ${loadTimeMs}ms. Extracting content...`, 25);

      // 2. Extract content
      await Report.findOneAndUpdate({ jobId }, { status: 'extracting' });
      await publishProgress(jobId, 'extracting', 'Parsing DOM, headings, meta tags, and links...', 35);

      const content = extractContent(html);
      const schemas = extractSchema(html);
      const schemaValidation = validateSchema(schemas);

      await publishProgress(jobId, 'extracting', `Extracted ${content.wordCount} words, ${content.images.total} images, ${schemas.length} schema blocks.`, 45);

      // 3. Compress and send to AI
      await Report.findOneAndUpdate({ jobId }, { status: 'analyzing' });
      await publishProgress(jobId, 'analyzing', 'Compressing data and sending to AI for analysis...', 55);

      const compressedPayload = compressForAI(content, schemas);

      // Log extracted data to console
      console.log('\n' + '='.repeat(60));
      console.log('EXTRACTED PAYLOAD (first 2000 chars):');
      console.log('='.repeat(60));
      console.log(compressedPayload.slice(0, 2000));
      console.log('='.repeat(60) + '\n');

      let aiResult;
      if (process.env.MOCK_AI === 'true') {
        console.log('[MOCK_AI] Skipping AI Provider, using mock response');
        aiResult = {
          scores: { technical_seo: 72, onpage_seo: 65, schema: 55, geo: 60 },
          issues: [
            { category: 'technical_seo', severity: 'warning', title: 'Missing canonical tag', description: 'No canonical URL defined, risking duplicate content penalties.' },
            { category: 'onpage_seo', severity: 'critical', title: 'Thin meta description', description: 'Meta description is too short or missing.' },
            { category: 'schema', severity: 'warning', title: 'No FAQ schema', description: 'FAQ structured data missing, reducing rich result eligibility.' },
            { category: 'geo', severity: 'info', title: 'Low entity clarity', description: 'Brand entities are not consistently named across the page.' },
          ],
          recommendations: [
            { category: 'technical_seo', priority: 'high', problem: 'No canonical tag', why: 'Avoids duplicate content penalties', fix: 'Add <link rel="canonical"> in head', example: '<link rel="canonical" href="https://example.com/page">' },
            { category: 'onpage_seo', priority: 'high', problem: 'Short meta description', why: 'Improves CTR in search results', fix: 'Write a 130-160 char meta description', example: '<meta name="description" content="Your compelling description here.">' },
            { category: 'geo', priority: 'medium', problem: 'Brand entities unclear', why: 'AI models need clear entity signals to cite your brand', fix: 'Consistently use exact brand name and add Organization schema', example: '{"@type":"Organization","name":"YourBrand"}' },
          ],
          suggestedSchema: { '@context': 'https://schema.org', '@type': 'WebPage', 'name': content.title, 'description': content.metaDescription },
          geoInsights: { entityClarity: 60, topicalAuthority: 65, citationReadiness: 55, summary: 'Page has moderate GEO signals. Adding structured data and clearer entity references would improve AI citation potential.', entities: ['Brand', 'Product', 'Service'], improvements: ['Add Organization schema', 'Define clear topical clusters', 'Include author attribution'] },
        };
      } else {
        const llm = createLLMProvider();
        aiResult = await llm.analyze(compressedPayload);
      }

      await publishProgress(jobId, 'analyzing', 'AI analysis complete. Computing scores...', 80);

      // 4. Score
      await Report.findOneAndUpdate({ jobId }, { status: 'scoring' });
      await publishProgress(jobId, 'scoring', 'Compiling final audit report...', 90);

      const scores = computeOverallScore(aiResult.scores || {});

      // 5. Save completed report
      const processingTime = Date.now() - startTime;

      await Report.findOneAndUpdate(
        { jobId },
        {
          status: 'completed',
          url: finalUrl || url,
          pageType: aiResult.pageType || 'WebPage',
          entities: aiResult.entities || {},
          improvedSchema: aiResult.improvedSchema || aiResult.suggestedSchema || null,
          
          // Legacy fields mapping
          scores: computeOverallScore(aiResult.scores || {}),
          issues: aiResult.issues || [],
          recommendations: aiResult.recommendations || [],
          geoInsights: aiResult.geoInsights || null,
          
          rawExtraction: {
            title: content.title,
            metaDescription: content.metaDescription,
            headings: content.headings,
            wordCount: content.wordCount,
            existingSchema: schemas,
          },
          processingTime,
        }
      );

      await publishProgress(jobId, 'completed', `Audit complete in ${(processingTime / 1000).toFixed(1)}s.`, 100);

      return { reportId: jobId };
    } catch (err) {
      console.error(`Worker error for job ${jobId}:`, err.message);

      // Check if this is the final attempt
      const isFinalAttempt = job.attemptsMade >= (job.opts.attempts - 1) || job.opts.attempts <= 1;

      if (isFinalAttempt) {
        await Report.findOneAndUpdate(
          { jobId },
          { status: 'failed', error: err.message }
        );
        await publishProgress(jobId, 'failed', `Audit failed definitively: ${err.message}`, 0);
      } else {
        // Just a transient error (e.g. Rate Limit 429), let Bull retry
        await publishProgress(jobId, 'extracting', `Rate limited or transient error. Retrying... (${err.message.substring(0, 30)}...)`, 25);
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
