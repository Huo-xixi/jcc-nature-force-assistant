import { test, expect } from '@playwright/test';
import * as path from 'node:path';
import { pathToFileURL } from 'node:url';

const prototypeUrl = pathToFileURL(
  path.resolve(__dirname, '../frontend/prototypes/week1/index.html'),
).href;

test('成员 B 原型完成资源输入、推荐和人工确认流程', async ({ page }) => {
  const pageErrors: string[] = [];
  const externalRequests: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('request', (request) => {
    if (/^https?:/.test(request.url())) externalRequests.push(request.url());
  });

  await page.goto(prototypeUrl);
  await page.getByRole('link', { name: '开始手动选择' }).click();
  await page.locator('[data-action="add-champion"][data-id="1507"]').click();
  await expect(page.locator('[data-action="add-champion"][data-id="1507"]')).toBeDisabled();

  const item = page.locator('[data-action="add-item"][data-id="bf_sword"]');
  await item.click();
  await item.click();
  await page.getByRole('button', { name: '预览当前推荐请求', exact: true }).click();
  await expect(page.locator('pre')).toContainText('"bf_sword"');

  await page.getByRole('button', { name: '载入固定案例并看结果', exact: true }).click();
  await expect(page.locator('.recommendation')).toHaveCount(3);
  await expect(page.locator('.recommendation').first()).toContainText('射箭韦鲁斯');
  await page.locator('[data-action="detail"]').first().click();
  await expect(page.locator('h1')).toContainText('射箭韦鲁斯');

  await page.locator('nav a[href="#input"]').click();
  await page.getByRole('button', { name: '清空当前资源', exact: true }).click();
  await page.locator('nav a[href="#vision"]').click();
  await page.getByRole('button', { name: '载入模拟识别结果', exact: true }).click();
  const mergeButton = page.getByRole('button', {
    name: '将已确认购入的英雄合并到输入',
    exact: true,
  });
  await mergeButton.click();
  await expect(page.locator('#feedback')).toContainText('请先核对');

  await page.locator('[data-confirm="0"]').check();
  await page.locator('[data-candidate="0"]').selectOption('2512');
  await expect(page.locator('[data-confirm="0"]')).not.toBeChecked();
  await page.locator('[data-confirm="0"]').check();
  await mergeButton.click();
  await expect(page).toHaveURL(/#input$/);

  await expect(pageErrors).toEqual([]);
  await expect(externalRequests).toEqual([]);
});

test('桌面端与移动端页面均无水平溢出', async ({ page }) => {
  for (const width of [1366, 390]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ['home', 'input', 'results', 'detail', 'vision']) {
      await page.goto(`${prototypeUrl}#${route}`);
      const hasOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth,
      );
      expect(hasOverflow, `${width}px #${route}`).toBe(false);
    }
  }
});

