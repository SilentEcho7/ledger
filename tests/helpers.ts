import { test, expect, Page } from '@playwright/test';

/** 以北京时间格式化，避免 CI（UTC）与本地时区不一致导致断言漂移 */
export function shDate(d = new Date()) {
  const s = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
  const [y, m, day] = s.split('-').map(Number);
  return { y, m, d: day, ymd: s };
}

/** 当前视图标题，如 "2026年11月" */
export function monthLabel(d = new Date()) {
  const { y, m } = shDate(d);
  return `${y}年${m}月`;
}

/** 直接往 localStorage 追加记录（绕过 UI，用于构造历史数据） */
export async function seedEntries(page: Page, list: Array<{
  date: string; amount: number; type?: 'expense' | 'income';
  category?: string; note?: string;
}>) {
  const normalized = list.map((e, i) => ({
    id: `seed-${i}-${Math.random().toString(36).slice(2, 6)}`,
    type: e.type ?? 'expense',
    amount: e.amount,
    category: e.category ?? 'other',
    note: e.note ?? '测试记录',
    date: e.date,
    ts: Date.now() - i,
  }));
  await page.evaluate((items) => {
    let cur: unknown[] = [];
    try {
      const raw = JSON.parse(localStorage.getItem('ledger.entries.v1') || '[]');
      if (Array.isArray(raw)) cur = raw;
    } catch { /* 忽略损坏数据 */ }
    localStorage.setItem('ledger.entries.v1', JSON.stringify(cur.concat(items)));
  }, normalized);
  await page.reload();
}

/** 通过 UI 记一笔 */
export async function addByUI(page: Page, text: string) {
  await page.getByTestId('quick-input').fill(text);
  await page.getByTestId('btn-add').click();
}

/** 取列表里所有金额文本，便于断言顺序/条数 */
export async function rowAmounts(page: Page) {
  return page.getByTestId('row').locator('.row-amount').allInnerTexts();
}

export { test, expect };
