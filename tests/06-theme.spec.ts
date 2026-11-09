import { test, expect } from './helpers';

test.describe('主题三态', () => {
  test('35 首次打开是"跟随系统"，并已提前上好色（不闪白）', async ({ page }) => {
    await page.goto('/index.html');
    const btn = page.getByTestId('theme-toggle');
    await expect(btn).toHaveAttribute('data-mode', 'auto');
    // 内联脚本在 <head> 里就写好了 data-theme，所以首帧就有值
    await expect(page.locator('html')).toHaveAttribute('data-theme', /light|dark/);
  });

  test('36 auto → light：点一次切到浅色', async ({ page }) => {
    await page.goto('/index.html');
    await page.getByTestId('theme-toggle').click();
    await expect(page.getByTestId('theme-toggle')).toHaveAttribute('data-mode', 'light');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });

  test('37 light → dark：再点一次切深色，背景真的变了', async ({ page }) => {
    await page.goto('/index.html');
    const btn = page.getByTestId('theme-toggle');
    await btn.click();                       // light
    await btn.click();                       // dark
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

    // body 上有 0.2s 的背景过渡，用轮询等它稳定，避免取到中间色值
    await expect.poll(
      () => page.evaluate(() => getComputedStyle(document.body).backgroundColor),
      { timeout: 3000 }
    ).toBe('rgb(15, 17, 21)'); // #0f1115，深色页面底色
  });

  test('38 三态循环一圈回到 auto', async ({ page }) => {
    await page.goto('/index.html');
    const btn = page.getByTestId('theme-toggle');
    await btn.click();
    await btn.click();
    await btn.click();
    await expect(btn).toHaveAttribute('data-mode', 'auto');
  });

  test('39 刷新后主题保持，不会闪回浅色', async ({ page }) => {
    await page.goto('/index.html');
    await page.getByTestId('theme-toggle').click();  // light
    await page.getByTestId('theme-toggle').click();  // dark
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });

  test('40 切主题后趋势图会重绘（颜色跟着变量走）', async ({ page }) => {
    await page.goto('/index.html');
    await page.getByTestId('quick-input').fill('咖啡 30');
    await page.getByTestId('btn-add').click();

    const before = await page.getByTestId('trend-canvas')
      .evaluate((cv: HTMLCanvasElement) => cv.toDataURL().slice(-200));

    await page.getByTestId('theme-toggle').click();
    await page.getByTestId('theme-toggle').click();

    const after = await page.getByTestId('trend-canvas')
      .evaluate((cv: HTMLCanvasElement) => cv.toDataURL().slice(-200));
    expect(after).not.toBe(before);
  });
});
