import { test, expect } from '@playwright/test';
import * as path from 'node:path';
import { pathToFileURL } from 'node:url';

const deckUrl = pathToFileURL(path.resolve(__dirname, '../ppt/index.html')).href;
const previewDir = path.resolve(__dirname, '../ppt/previews');

test.describe.configure({ mode: 'serial' });

for (let slide = 1; slide <= 10; slide += 1) {
  test(`汇报 PPT 第 ${slide} 页无可见内容越界`, async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.route(/^https?:/, (route) => route.abort());
    await page.goto(`${deckUrl}?slide=${slide}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1900);

    const result = await page.evaluate((slideNumber) => {
      const current = document.querySelectorAll<HTMLElement>('.slide')[slideNumber - 1];
      if (!current) return { missing: true, offenders: [] as string[] };
      const parent = current.getBoundingClientRect();
      const selector = 'h1,h2,h3,p,img,figcaption,[data-anim],.ledger-row,.bar-tower';
      const offenders = [...current.querySelectorAll<HTMLElement>(selector)]
        .filter((element) => {
          const style = getComputedStyle(element);
          if (style.display === 'none' || style.visibility === 'hidden') return false;
          const rect = element.getBoundingClientRect();
          return (
            rect.width > 0 &&
            rect.height > 0 &&
            (rect.left < parent.left - 3 ||
              rect.right > parent.right + 3 ||
              rect.top < parent.top - 3 ||
              rect.bottom > parent.bottom + 3)
          );
        })
        .map((element) => `${element.tagName}.${element.className}`);
      return { missing: false, offenders };
    }, slide);

    expect(result.missing).toBe(false);
    expect(result.offenders).toEqual([]);
    await page.screenshot({
      path: path.join(previewDir, `slide-${String(slide).padStart(2, '0')}.png`),
      fullPage: false,
    });
  });
}
