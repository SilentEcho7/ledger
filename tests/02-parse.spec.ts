import { test, expect, addByUI } from './helpers';

/**
 * 02 · 自然语言解析
 * 这里的 07 号用例是坑 2 的回归测试：
 * "买2杯咖啡 30" 早期被解析成 2 元（取了第一个数字），
 * 修复后必须取结尾金额 30。
 */
test.describe('自然语言记账', () => {
  test('07 【坑2 回归】"买2杯咖啡 30" 记成 30 元，不是 2 元', async ({ page }) => {
    await page.goto('/index.html');
    await addByUI(page, '买2杯咖啡 30');

    await expect(page.getByTestId('row')).toHaveCount(1);
    await expect(page.getByTestId('row').locator('.row-amount')).toHaveText('-¥30.00');
    await expect(page.getByTestId('row').locator('.row-amount')).not.toHaveText('-¥2.00');
  });

  test('08 小数金额保留两位，"打车 25.5" → 25.50', async ({ page }) => {
    await page.goto('/index.html');
    await addByUI(page, '打车 25.5');
    await expect(page.getByTestId('row').locator('.row-amount')).toHaveText('-¥25.50');
    await expect(page.getByTestId('row').locator('.row-sub')).toHaveText('交通');
  });

  test('09 "工资 8000" 识别为收入，金额带千分位', async ({ page }) => {
    await page.goto('/index.html');
    await addByUI(page, '工资 8000');
    await expect(page.getByTestId('row').locator('.row-amount')).toHaveText('+¥8,000.00');
    await expect(page.getByTestId('row').locator('.row-sub')).toHaveText('收入');
  });

  test('10 带"元"字也能解析："教材 88元"', async ({ page }) => {
    await page.goto('/index.html');
    await addByUI(page, '教材 88元');
    await expect(page.getByTestId('row').locator('.row-amount')).toHaveText('-¥88.00');
    await expect(page.getByTestId('row').locator('.row-sub')).toHaveText('学习');
  });

  test('11 回车可以直接提交，提交后输入框自动清空', async ({ page }) => {
    await page.goto('/index.html');
    const input = page.getByTestId('quick-input');
    await input.fill('地铁 4');
    await input.press('Enter');
    await expect(page.getByTestId('row')).toHaveCount(1);
    await expect(input).toHaveValue('');
  });

  test('12 不含数字的文本不会产生脏数据', async ({ page }) => {
    await page.goto('/index.html');
    await addByUI(page, '今天心情不错');
    await expect(page.getByTestId('row')).toHaveCount(0);
    await expect(page.getByTestId('empty-state')).toBeVisible();
  });

  test('13 只有数字"30"时，按"其他"兜底，不丢记录', async ({ page }) => {
    await page.goto('/index.html');
    await addByUI(page, '30');
    await expect(page.getByTestId('row').locator('.row-amount')).toHaveText('-¥30.00');
    await expect(page.getByTestId('row').locator('.row-sub')).toHaveText('其他');
  });

  test('14 金额写在中间时，取最后一个数字而不是第一个', async ({ page }) => {
    await page.goto('/index.html');
    await addByUI(page, '3个人吃火锅 240');
    await expect(page.getByTestId('row').locator('.row-amount')).toHaveText('-¥240.00');
  });

  test('15 备注会去掉金额，保留描述文本', async ({ page }) => {
    await page.goto('/index.html');
    await addByUI(page, '买2杯咖啡 30');
    await expect(page.getByTestId('row').locator('.row-title')).toHaveText('买2杯咖啡');
  });
});
