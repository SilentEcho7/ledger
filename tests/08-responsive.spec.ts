import { test, expect, addByUI } from './helpers';

/**
 * 08 · 响应式约束
 * 48 号是坑 3 的回归测试：390px（iPhone 12/13 mini 宽度）下，
 * 分类按钮曾经把整页撑出横向滚动条。
 */
test.describe('响应式 · 390px', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('48 【坑3 回归】390px 下整页没有横向溢出', async ({ page }) => {
    await page.goto('/index.html');
    const overflow = await page.evaluate(() => ({
      doc: document.documentElement.scrollWidth,
      win: window.innerWidth,
    }));
    expect(overflow.doc).toBeLessThanOrEqual(overflow.win + 1);
  });

  test('49 分类按钮在窄屏改为横向滚动，而不是换行撑高', async ({ page }) => {
    await page.goto('/index.html');
    const chips = page.getByTestId('category-chips');
    const metrics = await chips.evaluate((el: HTMLElement) => ({
      scroll: el.scrollWidth,
      client: el.clientWidth,
      overflowX: getComputedStyle(el).overflowX,
    }));
    expect(metrics.overflowX).toBe('auto');
    expect(metrics.scroll).toBeGreaterThan(metrics.client);
  });

  test('50 390px 下统计仍是三列，金额不溢出格子', async ({ page }) => {
    await page.goto('/index.html');
    await addByUI(page, '工资 12345');

    const cols = await page.locator('.stats').evaluate((el) =>
      getComputedStyle(el).gridTemplateColumns.split(' ').filter(Boolean).length
    );
    expect(cols).toBe(3);

    const overflow = await page.locator('.stat-value').evaluateAll((els) =>
      els.some((e) => e.scrollWidth > e.clientWidth + 1)
    );
    expect(overflow).toBe(false);
  });

  test('51 390px 下删除按钮常驻可见（没有 hover 也能点）', async ({ page }) => {
    await page.goto('/index.html');
    await addByUI(page, '咖啡 30');
    const opacity = await page.getByTestId('row').first()
      .getByRole('button', { name: /^删除/ })
      .evaluate((el) => getComputedStyle(el).opacity);
    expect(opacity).toBe('1');
  });

  test('52 窄屏下输入框和按钮不互相挤压', async ({ page }) => {
    await page.goto('/index.html');
    const ok = await page.evaluate(() => {
      const input = document.querySelector('.quick-input') as HTMLElement;
      const btn = document.querySelector('#btnAdd') as HTMLElement;
      return input.getBoundingClientRect().width > 180 &&
             btn.getBoundingClientRect().right <= window.innerWidth;
    });
    expect(ok).toBe(true);
  });
});

test.describe('响应式 · 桌面', () => {
  test('53 桌面宽度下页面居中，最大宽度受控', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/index.html');
    const w = await page.locator('.app').evaluate((el) => el.getBoundingClientRect().width);
    expect(w).toBeLessThanOrEqual(760 + 1);
  });
});
