import { test, expect, addByUI, seedEntries, shDate } from './helpers';

/** 取上一个月的某一天，用来构造"环比"数据 */
function prevMonthDate() {
  const n = shDate();
  const y = n.m === 1 ? n.y - 1 : n.y;
  const m = n.m === 1 ? 12 : n.m - 1;
  return `${y}-${String(m).padStart(2, '0')}-15`;
}

test.describe('统计与区间', () => {
  test('16 同月两笔支出正确累加', async ({ page }) => {
    await page.goto('/index.html');
    await addByUI(page, '咖啡 30');
    await addByUI(page, '打车 25.5');
    await expect(page.getByTestId('stat-expense')).toHaveText('¥55.50');
    await expect(page.getByTestId('row')).toHaveCount(2);
  });

  test('17 收入不减支出，结余 = 收入 - 支出', async ({ page }) => {
    await page.goto('/index.html');
    await addByUI(page, '工资 8000');
    await addByUI(page, '房租 2500');
    await expect(page.getByTestId('stat-income')).toHaveText('¥8,000.00');
    await expect(page.getByTestId('stat-expense')).toHaveText('¥2,500.00');
    await expect(page.getByTestId('stat-balance')).toHaveText('¥5,500.00');
  });

  test('18 支出下降时环比显示 ↓ 和绿色语义', async ({ page }) => {
    await page.goto('/index.html');
    await addByUI(page, '咖啡 50');                       // 本月 50
    await seedEntries(page, [                              // 上月 100
      { date: prevMonthDate(), amount: 100, note: '上月支出' },
    ]);
    await expect(page.getByTestId('delta-expense')).toHaveText('↓50%');
    await expect(page.getByTestId('delta-expense')).toHaveClass(/down/);
  });

  test('19 支出上涨时环比显示 ↑', async ({ page }) => {
    await page.goto('/index.html');
    await addByUI(page, '咖啡 150');                       // 本月 150
    await seedEntries(page, [
      { date: prevMonthDate(), amount: 100, note: '上月支出' },
    ]);
    await expect(page.getByTestId('delta-expense')).toHaveText('↑50%');
    await expect(page.getByTestId('delta-expense')).toHaveClass(/up/);
  });

  test('20 切到"本年"能统计到 1 月的记录', async ({ page }) => {
    const { y, ymd } = shDate();
    await page.goto('/index.html');
    await seedEntries(page, [
      { date: `${y}-01-10`, amount: 100, note: '年初的支出' },
      { date: ymd, amount: 50, note: '今天的支出' },
    ]);
    await page.getByTestId('tab-year').click();
    await expect(page.getByTestId('stat-expense')).toHaveText('¥150.00');
  });

  test('21 切到"本周"不把上周的记录算进来', async ({ page }) => {
    await page.goto('/index.html');
    await page.getByTestId('quick-input').fill('咖啡 20');
    await page.getByTestId('btn-add').click();

    const d = new Date();
    d.setDate(d.getDate() - 7);
    const lastWeek = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(d);

    await seedEntries(page, [{ date: lastWeek, amount: 200, note: '上周支出' }]);
    await page.getByTestId('tab-week').click();
    await expect(page.getByTestId('stat-expense')).toHaveText('¥20.00');
  });

  test('22 区间切换后，选中态跟着走', async ({ page }) => {
    await page.goto('/index.html');
    await page.getByTestId('tab-week').click();
    await expect(page.getByTestId('tab-week')).toHaveAttribute('aria-selected', 'true');
    await expect(page.getByTestId('tab-month')).toHaveAttribute('aria-selected', 'false');

    await page.getByTestId('tab-year').click();
    await expect(page.getByTestId('tab-year')).toHaveAttribute('aria-selected', 'true');
  });

  test('23 本周模式下标题显示日期区间，不再是"年月"', async ({ page }) => {
    await page.goto('/index.html');
    await page.getByTestId('tab-week').click();
    await expect(page.getByTestId('period-title')).toHaveText(/月\d+日\s*-\s*\d+月\d+日/);
  });
});
