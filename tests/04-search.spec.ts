import { test, expect, addByUI } from './helpers';

test.describe('搜索与金额筛选', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/index.html');
    await addByUI(page, '咖啡 30');
    await addByUI(page, '打车 200');
    await addByUI(page, '教材 88');
  });

  test('24 关键词命中备注，只留一条', async ({ page }) => {
    await page.getByTestId('search-keyword').fill('咖啡');
    await expect(page.getByTestId('row')).toHaveCount(1);
    await expect(page.getByTestId('row').locator('.row-title')).toHaveText('咖啡');
  });

  test('25 关键词也能搜分类名', async ({ page }) => {
    await page.getByTestId('search-keyword').fill('交通');
    await expect(page.getByTestId('row')).toHaveCount(1);
  });

  test('26 ">100" 只留大于 100 的记录', async ({ page }) => {
    await page.getByTestId('search-amount').fill('>100');
    await expect(page.getByTestId('row')).toHaveCount(1);
    await expect(page.getByTestId('row').locator('.row-amount')).toHaveText('-¥200.00');
  });

  test('27 "50-100" 是闭区间，边界值 88 能命中、30 不命中', async ({ page }) => {
    await page.getByTestId('search-amount').fill('50-100');
    await expect(page.getByTestId('row')).toHaveCount(1);
    await expect(page.getByTestId('row').locator('.row-amount')).toHaveText('-¥88.00');
  });

  test('28 搜索和金额筛选取交集，不是并集', async ({ page }) => {
    await page.getByTestId('search-keyword').fill('咖啡');
    await page.getByTestId('search-amount').fill('>100');
    await expect(page.getByTestId('row')).toHaveCount(0);
    await expect(page.getByTestId('empty-state')).toContainText('没有符合条件的记录');
  });

  test('29 清空筛选后记录全部回来', async ({ page }) => {
    await page.getByTestId('search-keyword').fill('咖啡');
    await expect(page.getByTestId('row')).toHaveCount(1);
    await page.getByTestId('search-keyword').fill('');
    await expect(page.getByTestId('row')).toHaveCount(3);
  });
});
