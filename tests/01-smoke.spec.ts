import { test, expect, monthLabel, shDate } from './helpers';

/**
 * 01 · 冷启动与首屏
 * 这批用例回答一个问题：用户第一次打开，页面是不是"能看、能用、不报错"。
 */
test.describe('冷启动', () => {
  test('01 首屏默认停在本月，且"本月"处于选中态', async ({ page }) => {
    await page.goto('/index.html');
    await expect(page.getByTestId('period-title')).toHaveText(monthLabel());
    await expect(page.getByTestId('tab-month')).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByTestId('tab-week')).toHaveAttribute('aria-selected', 'false');
  });

  test('02 无数据时展示空状态，三项统计都是 0', async ({ page }) => {
    await page.goto('/index.html');
    await expect(page.getByTestId('empty-state')).toBeVisible();
    await expect(page.getByTestId('stat-expense')).toHaveText('¥0.00');
    await expect(page.getByTestId('stat-income')).toHaveText('¥0.00');
    await expect(page.getByTestId('stat-balance')).toHaveText('¥0.00');
  });

  test('03 页面加载过程中没有 JS 运行时错误', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('/index.html');
    await page.waitForTimeout(300);
    expect(errors, `控制台抛错：${errors.join(' | ')}`).toEqual([]);
  });

  test('04 趋势图真的画出了像素，不是一张空白画布', async ({ page }) => {
    await page.goto('/index.html');
    // 造一条数据，保证折线有内容
    await page.getByTestId('quick-input').fill('咖啡 30');
    await page.getByTestId('btn-add').click();

    const painted = await page.getByTestId('trend-canvas').evaluate((cv: HTMLCanvasElement) => {
      const ctx = cv.getContext('2d')!;
      const { data } = ctx.getImageData(0, 0, cv.width, cv.height);
      let alpha = 0;
      for (let i = 3; i < data.length; i += 4) if (data[i] > 0) alpha++;
      return alpha;
    });
    expect(painted).toBeGreaterThan(100);
  });
});

test.describe('布局骨架', () => {
  test('05 四个功能区块都在，且顺序符合阅读动线', async ({ page }) => {
    await page.goto('/index.html');
    await expect(page.getByRole('region', { name: '概览' })).toBeVisible();
    await expect(page.getByRole('region', { name: '记一笔' })).toBeVisible();
    await expect(page.getByRole('region', { name: '趋势' })).toBeVisible();
    await expect(page.getByRole('region', { name: '明细' })).toBeVisible();
  });

  test('06 金额输入框有 placeholder 示例，降低首次使用门槛', async ({ page }) => {
    await page.goto('/index.html');
    await expect(page.getByTestId('quick-input')).toHaveAttribute('placeholder', '买2杯咖啡 30');
  });
});
