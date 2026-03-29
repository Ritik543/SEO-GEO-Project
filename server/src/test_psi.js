require('dotenv').config({ path: '../.env' });
const { getPageSpeedData } = require('./services/pagespeed.service');

async function test() {
  const url = 'https://innostax.com/';
  console.log('Testing PSI for:', url);
  const data = await getPageSpeedData(url, 'mobile');
  console.log('EXTRACTED DATA:', JSON.stringify(data, null, 2));
}

test();
