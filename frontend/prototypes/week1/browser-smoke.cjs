// Development-only browser verification. Prototype itself has no dependencies.
// Requires Playwright in node_modules or NODE_PATH. Optionally set BROWSER_EXECUTABLE.
// Run from repository root: node frontend/prototypes/week1/browser-smoke.cjs
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.BROWSER_EXECUTABLE ? { executablePath: process.env.BROWSER_EXECUTABLE } : {}),
  });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const errors = [];
    const requests = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('request', (request) => requests.push(request.url()));
    const base = pathToFileURL(path.join(__dirname, 'index.html')).href;
    const output = path.resolve(__dirname, '../../../docs/member-b/week1/screenshots');
    fs.mkdirSync(output, { recursive: true });
    async function screenshot(name) {
      await page.evaluate(() => {
        document.querySelector('#feedback').textContent = '';
        scrollTo(0, 0);
      });
      await page.screenshot({ path: path.join(output, name), fullPage: true });
    }
    await page.goto(base);
    await screenshot('01-home.png');
    await page.getByRole('link', { name: '开始手动选择' }).click();
    await page.locator('[data-action="add-champion"][data-id="1507"]').click();
    assert(await page.locator('[data-action="add-champion"][data-id="1507"]').isDisabled());
    const item = page.locator('[data-action="add-item"][data-id="bf_sword"]');
    await item.click();
    await item.click();
    await page.getByRole('button', { name: '预览当前推荐请求', exact: true }).click();
    assert.deepEqual(JSON.parse(await page.locator('pre').innerText()), {
      champion_ids: ['1507'], item_ids: ['bf_sword', 'bf_sword'], top_k: 3,
    });
    await screenshot('02-resources.png');
    await page.getByRole('button', { name: '载入固定案例并看结果', exact: true }).click();
    assert.equal(await page.locator('.recommendation').count(), 3);
    assert.match(await page.locator('.recommendation').first().innerText(), /射箭韦鲁斯/);
    await screenshot('03-recommendations.png');
    await page.locator('[data-action="detail"]').first().click();
    assert.match(await page.locator('h1').innerText(), /射箭韦鲁斯/);
    await screenshot('04-detail.png');
    await page.locator('nav a[href="#input"]').click();
    await page.getByRole('button', { name: '清空当前资源', exact: true }).click();
    await page.locator('nav a[href="#vision"]').click();
    await page.getByRole('button', { name: '载入模拟识别结果', exact: true }).click();
    const merge = () => page.getByRole('button', { name: '将已确认购入的英雄合并到输入', exact: true });
    await merge().click();
    assert.equal(new URL(page.url()).hash, '#vision');
    assert.match(await page.locator('#feedback').innerText(), /请先核对/);
    await page.locator('[data-confirm="0"]').check();
    await page.locator('[data-candidate="0"]').selectOption('2512');
    assert(!(await page.locator('[data-confirm="0"]').isChecked()));
    await page.locator('[data-confirm="0"]').check();
    await screenshot('05-confirmation.png');
    await merge().click();
    assert.equal(new URL(page.url()).hash, '#input');
    await page.getByRole('button', { name: '预览当前推荐请求', exact: true }).click();
    assert.deepEqual(JSON.parse(await page.locator('pre').innerText()).champion_ids, ['2512']);
    for (const width of [1366, 390]) {
      await page.setViewportSize({ width, height: 900 });
      for (const route of ['home', 'input', 'results', 'detail', 'vision']) {
        await page.goto(`${base}#${route}`);
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `overflow: ${width} ${route}`);
      }
    }
    assert.deepEqual(errors, []);
    assert(!requests.some((url) => /^https?:/.test(url)));
    console.log('PASS: five pages, request preview, ownership confirmation, resource quantities, responsive layout, file protocol; zero errors or network calls.');
  } finally {
    await browser.close();
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
