import { test, expect, addByUI } from './helpers';

test.describe('删除与 6 秒撤销', () => {
  test('30 删除后这一行立刻消失', async ({ page }) => {
    await page.goto('/index.html');
    await addByUI(page, '咖啡 30');
    await addByUI(page, '打车 20');
    await expect(page.getByTestId('row')).toHaveCount(2);

    await page.getByTestId('row').first().getByRole('button', { name: /^删除/ }).click();
    await expect(page.getByTestId('row')).toHaveCount(1);
  });

  test('31 删除后统计同步减少，不是只删了 DOM', async ({ page }) => {
    await page.goto('/index.html');
    await addByUI(page, '咖啡 30');
    await addByUI(page, '打车 20');
    await expect(page.getByTestId('stat-expense')).toHaveText('¥50.00');

    await page.getByTestId('row').first().getByRole('button', { name: /^删除/ }).click();
    await expect(page.getByTestId('stat-expense')).toHaveText('¥30.00');
  });

  test('32 点"撤销"能把记录原样放回去', async ({ page }) => {
    await page.goto('/index.html');
    await addByUI(page, '咖啡 30');

    await page.getByTestId('row').first().getByRole('button', { name: /^删除/ }).click();
    await expect(page.getByTestId('toast')).toHaveClass(/show/);

    await page.getByTestId('btn-undo').click();
    await expect(page.getByTestId('row')).toHaveCount(1);
    await expect(page.getByTestId('row').locator('.row-amount')).toHaveText('-¥30.00');
    await expect(page.getByTestId('toast')).not.toHaveClass(/show/);
  });

  test('33 提示文案里带上了被删记录的备注，用户知道撤销的是哪条', async ({ page }) => {
    await page.goto('/index.html');
    await addByUI(page, '咖啡 30');
    await page.getByTestId('row').first().getByRole('button', { name: /^删除/ }).click();
    await expect(page.getByTestId('toast')).toContainText('咖啡');
  });

  test('34 撤销后数据真的写回了 localStorage，刷新不丢', async ({ page }) => {
    await page.goto('/index.html');
    await addByUI(page, '咖啡 30');
    await page.getByTestId('row').first().getByRole('button', { name: /^删除/ }).click();
    await page.getByTestId('btn-undo').click();

    await page.reload();
    await expect(page.getByTestId('row')).toHaveCount(1);
    await expect(page.getByTestId('stat-expense')).toHaveText('¥30.00');
  });
});
