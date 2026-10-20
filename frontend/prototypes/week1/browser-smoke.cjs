const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    const base = pathToFileURL(path.join(__dirname, 'index.html')).href;
    const output = path.resolve(__dirname, '../../../docs/member-b/week1/screenshots');
    fs.mkdirSync(output, { recursive: true });
    await page.goto(base);
    await page.getByRole('button', { name: '没有截图？使用演示图片流程' }).click();
    await page.waitForSelector('.candidate');
    assert.equal(await page.locator('.candidate').count(), 5);
    await page.screenshot({ path: path.join(output, '01-image-review.png'), fullPage: true });
    await page.locator('[data-candidate="3"]').selectOption('1501');
    await page.locator('[data-include="4"]').check();
    await page.getByRole('button', { name: '确认英雄并生成推荐 →' }).click();
    assert.equal(await page.locator('.recommendation').count(), 3);
    await page.screenshot({ path: path.join(output, '02-image-recommendations.png'), fullPage: true });
    assert.deepEqual(errors, []);
    console.log('PASS: image upload, simulated recognition, manual correction and recommendations work on one page.');
  } finally {
    await browser.close();
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
