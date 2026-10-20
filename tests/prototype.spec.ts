import { test, expect } from '@playwright/test';
import * as path from 'node:path';
import { pathToFileURL } from 'node:url';

const prototypeUrl = pathToFileURL(path.resolve(__dirname, '../frontend/prototypes/week1/index.html')).href;

test('截图识别、人工修正和推荐在一个页面完成', async ({ page }) => {
  const pageErrors: string[] = [];
  const externalRequests: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('request', (request) => {
    if (/^https?:/.test(request.url())) externalRequests.push(request.url());
  });

  await page.goto(prototypeUrl);
  await expect(page.getByRole('heading', { name: '阵容建议', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '没有截图？使用演示图片流程' }).click();
  await expect(page.locator('.candidate')).toHaveCount(5);

  await page.locator('[data-candidate="3"]').selectOption('1501');
  await expect(page.locator('[data-candidate="3"]')).toHaveValue('1501');
  await page.locator('[data-include="4"]').check();
  await page.getByRole('button', { name: '＋ 人工补录英雄' }).click();
  await expect(page.locator('.candidate')).toHaveCount(6);
  await page.locator('.candidate').last().getByRole('button').click();
  await expect(page.locator('.candidate')).toHaveCount(5);

  await page.getByRole('button', { name: '确认英雄并生成推荐 →' }).click();
  await expect(page.locator('.recommendation')).toHaveCount(3);
  await expect(page.locator('.recommendation').first()).toContainText('射箭韦鲁斯');
  await expect(pageErrors).toEqual([]);
  await expect(externalRequests).toEqual([]);
});

test('真实图片上传后可预览并进入人工确认', async ({ page }) => {
  await page.route('http://127.0.0.1:8000/api/v1/vision/recognize-one-cost', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({
        results: [
          { id: '1507', name: '韦鲁斯', confidence: 0.81, accepted: true },
          { id: '1502', name: '蕾欧娜', confidence: 0.78, accepted: true },
          { id: null, name: '未知', confidence: 0.52, accepted: false },
          { id: null, name: '未知', confidence: 0.49, accepted: false },
          { id: null, name: '未知', confidence: 0.44, accepted: false },
        ],
      }),
    });
  });
  await page.goto(prototypeUrl);
  await page.locator('#screenshot-input').setInputFiles({
    name: 'mumu-test.png',
    mimeType: 'image/png',
    buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64'),
  });
  await expect(page.getByAltText('已上传的游戏截图')).toBeVisible();
  await expect(page.locator('.candidate')).toHaveCount(5);
  await expect(page.locator('.file-meta')).toContainText('mumu-test.png');
  await expect(page.locator('.file-meta')).toContainText('真实识别完成');
  await expect(page.locator('[data-candidate="0"]')).toHaveValue('1507');
  await expect(page.locator('[data-candidate="2"]')).toHaveValue('');
});

test('桌面端与移动端均无水平溢出', async ({ page }) => {
  for (const width of [1366, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(prototypeUrl);
    await page.getByRole('button', { name: '没有截图？使用演示图片流程' }).click();
    await expect(page.locator('.candidate')).toHaveCount(5);
    const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(hasOverflow, `${width}px`).toBe(false);
  }
});
