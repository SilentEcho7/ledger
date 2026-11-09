import { test, expect, addByUI, shDate } from './helpers';
import type { Page } from '@playwright/test';

async function jumpTo(page: Page, year: number, month: number) {
  await page.getByTestId('period-title').click();
  await expect(page.getByTestId('month-modal')).toHaveClass(/show/);
  await page.getByTestId('sel-year').selectOption(String(year));
  await page.getByTestId('sel-month').selectOption(String(month));
  await page.getByTestId('modal-ok').click();
}

test.describe('持久化与月份边界', () => {
  test('41 记完刷新，记录还在（localStorage 落地）', async ({ page }) => {
    await page.goto('/index.html');
    await addByUI(page, '咖啡 30');
    await page.reload();
    await expect(page.getByTestId('row')).toHaveCount(1);
    await expect(page.getByTestId('stat-expense')).toHaveText('¥30.00');
  });

  test('42 连记 3 笔后刷新，条数与金额都不变', async ({ page }) => {
    await page.goto('/index.html');
    await addByUI(page, '咖啡 30');
    await addByUI(page, '打车 20');
    await addByUI(page, '工资 5000');
    await page.reload();
    await expect(page.getByTestId('row')).toHaveCount(3);
    await expect(page.getByTestId('stat-expense')).toHaveText('¥50.00');
    await expect(page.getByTestId('stat-income')).toHaveText('¥5,000.00');
  });

  test('43 【坑1 回归】跳到 3 月，刷新后仍停在 3 月', async ({ page }) => {
    const { y } = shDate();
    await page.goto('/index.html');
    await jumpTo(page, y, 3);
    await expect(page.getByTestId('period-title')).toHaveText(`${y}年3月`);

    await page.reload();
    // 早期 bug：月份按 0-11 读，1 月会变 2 月，刷新后被"重置"回本月
    await expect(page.getByTestId('period-title')).toHaveText(`${y}年3月`);
  });

  test('44 【坑1 回归】1 月不会变成 2 月', async ({ page }) => {
    const { y } = shDate();
    await page.goto('/index.html');
    await jumpTo(page, y, 1);
    await expect(page.getByTestId('period-title')).toHaveText(`${y}年1月`);

    await page.reload();
    await expect(page.getByTestId('period-title')).toHaveText(`${y}年1月`);
  });

  test('45 【坑1 回归】12 月点"下个月"跨到次年 1 月，不溢出', async ({ page }) => {
    const { y } = shDate();
    await page.goto('/index.html');
    await jumpTo(page, y, 12);
    await expect(page.getByTestId('period-title')).toHaveText(`${y}年12月`);

    await page.getByTestId('btn-next').click();
    await expect(page.getByTestId('period-title')).toHaveText(`${y + 1}年1月`);
  });

  test('46 1 月点"上个月"回到上一年 12 月', async ({ page }) => {
    const { y } = shDate();
    await page.goto('/index.html');
    await jumpTo(page, y, 1);
    await page.getByTestId('btn-prev').click();
    await expect(page.getByTestId('period-title')).toHaveText(`${y - 1}年12月`);
  });

  test('47 弹层取消后视图不变', async ({ page }) => {
    const { y, m } = shDate();
    await page.goto('/index.html');
    await page.getByTestId('period-title').click();
    await page.getByTestId('sel-month').selectOption(String(m === 1 ? 2 : 1));
    await page.getByTestId('modal-cancel').click();
    await expect(page.getByTestId('period-title')).toHaveText(`${y}年${m}月`);
  });
});
