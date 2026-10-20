const { chromium } = require('playwright');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

async function main() {
  const projectRoot = path.resolve(__dirname, '..');
  const pageUrl = pathToFileURL(
    path.join(projectRoot, 'frontend', 'prototypes', 'week1', 'index.html'),
  ).href;
  const screenshotPath = path.join(
    projectRoot,
    'data',
    'raw',
    'screenshots',
    'member-b',
    'shop-original-1920x1092.png',
  );
  const outputDir = path.join(__dirname, 'images');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto(pageUrl, { waitUntil: 'domcontentloaded' });
  await page.locator('#screenshot-input').setInputFiles(screenshotPath);
  await page.locator('.status-dot').filter({ hasText: '真实识别完成' }).waitFor({ timeout: 30000 });
  await page.screenshot({
    path: path.join(outputDir, '06-live-recognition.png'),
    fullPage: false,
  });
  await page.screenshot({
    path: path.join(outputDir, '06-live-recognition-21x9.png'),
    clip: { x: 0, y: 150, width: 1920, height: 823 },
  });

  await page.getByRole('button', { name: /确认英雄并生成推荐/ }).click();
  await page.locator('#recommendations').waitFor({ state: 'visible' });
  await page.locator('#recommendations').scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
  await page.screenshot({
    path: path.join(outputDir, '07-live-recommendation.png'),
    fullPage: false,
  });
  await page.screenshot({
    path: path.join(outputDir, '07-live-recommendation-21x9.png'),
    clip: { x: 0, y: 120, width: 1920, height: 823 },
  });

  await browser.close();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
