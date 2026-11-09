import { test, expect, addByUI, shDate } from './helpers';
import fs from 'node:fs';

test.describe('导入导出', () => {
  test('54 导出的文件名带日期，内容是合法 JSON', async ({ page }) => {
    await page.goto('/index.html');
    await addByUI(page, '咖啡 30');

    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByTestId('btn-export').click(),
    ]);

    expect(download.suggestedFilename()).toMatch(/^ledger-backup-\d{4}-\d{2}-\d{2}\.json$/);

    const file = await download.path();
    const json = JSON.parse(fs.readFileSync(file!, 'utf8'));
    expect(json.entries).toHaveLength(1);
    expect(json.entries[0]).toMatchObject({ amount: 30, type: 'expense', note: '咖啡' });
  });

  test('55 导入备份后条数增加，且金额参与统计', async ({ page }) => {
    await page.goto('/index.html');
    await addByUI(page, '咖啡 30');

    const { ymd } = shDate();
    const payload = {
      app: '记账小助手',
      version: 1,
      entries: [
        { id: 'imp-1', type: 'expense', amount: 120, category: 'transport', note: '导入的记录', date: ymd, ts: 1 },
        { id: 'imp-2', type: 'expense', amount: 80, category: 'food', note: '导入的咖啡', date: ymd, ts: 2 },
      ],
    };

    await page.locator('#fileInput').setInputFiles({
      name: 'backup.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(payload)),
    });

    await expect(page.getByTestId('row')).toHaveCount(3);
    await expect(page.getByTestId('stat-expense')).toHaveText('¥230.00');
  });

  test('56 导入格式错误时提示失败，且不破坏原有数据', async ({ page }) => {
    await page.goto('/index.html');
    await addByUI(page, '咖啡 30');

    await page.locator('#fileInput').setInputFiles({
      name: 'broken.json',
      mimeType: 'application/json',
      buffer: Buffer.from('{ not json at all '),
    });

    await expect(page.getByTestId('toast')).toContainText('导入失败');
    await expect(page.getByTestId('row')).toHaveCount(1);
    await expect(page.getByTestId('stat-expense')).toHaveText('¥30.00');
  });

  test('57 清空数据需要二次确认，取消后数据保留', async ({ page }) => {
    await page.goto('/index.html');
    await addByUI(page, '咖啡 30');

    page.once('dialog', (d) => d.dismiss());
    await page.getByTestId('btn-clear').click();

    await expect(page.getByTestId('row')).toHaveCount(1);
  });

  test('58 确认清空后回到空状态', async ({ page }) => {
    await page.goto('/index.html');
    await addByUI(page, '咖啡 30');

    page.once('dialog', (d) => d.accept());
    await page.getByTestId('btn-clear').click();

    await expect(page.getByTestId('empty-state')).toBeVisible();
    await expect(page.getByTestId('stat-expense')).toHaveText('¥0.00');
  });
});

test.describe('预算', () => {
  test('59 未设置预算时显示"未设置"，进度条为 0', async ({ page }) => {
    await page.goto('/index.html');
    await expect(page.getByTestId('budget-text')).toHaveText('未设置');
    const w = await page.getByTestId('budget-fill').evaluate((el) => el.getBoundingClientRect().width);
    expect(w).toBe(0);
  });

  test('60 设置预算后显示已用/总额与剩余', async ({ page }) => {
    await page.goto('/index.html');
    await addByUI(page, '咖啡 300');

    page.once('dialog', (d) => d.accept('1000'));
    await page.getByTestId('budget-edit').click();

    await expect(page.getByTestId('budget-text')).toContainText('¥300.00');
    await expect(page.getByTestId('budget-text')).toContainText('¥1,000.00');
    await expect(page.getByTestId('budget-text')).toContainText('剩');
  });

  test('61 超支时进度条切换为超支态，金额提示"超支"', async ({ page }) => {
    await page.goto('/index.html');
    await addByUI(page, '咖啡 1200');

    page.once('dialog', (d) => d.accept('1000'));
    await page.getByTestId('budget-edit').click();

    await expect(page.getByTestId('budget-fill')).toHaveClass(/over/);
    await expect(page.getByTestId('budget-text')).toContainText('超支');
  });

  test('62 周/年视图下不展示预算模块（预算按月才有意义）', async ({ page }) => {
    await page.goto('/index.html');
    await page.getByTestId('tab-week').click();
    await expect(page.getByTestId('budget-text')).toBeHidden();
  });
});
