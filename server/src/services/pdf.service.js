const puppeteer = require('puppeteer');

async function generatePDF(reportId) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',  // Required on Render
      '--disable-gpu'
    ]
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 2 });

  // Set internal auth header so the print page can load data
  await page.setExtraHTTPHeaders({
    'x-internal-token': process.env.INTERNAL_PDF_TOKEN
  });

  const printUrl =
    `${process.env.FRONTEND_URL}/report-print/${reportId}`;

  await page.goto(printUrl, {
    waitUntil: 'networkidle0',
    timeout: 30000
  });

  // Wait for data to load — your print page must set this attr
  await page.waitForSelector('[data-pdf-ready="true"]', {
    timeout: 15000
  });

  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: '15mm', bottom: '15mm', left: '12mm', right: '12mm' }
  });

  await browser.close();
  return pdfBuffer;
}

module.exports = { generatePDF };
