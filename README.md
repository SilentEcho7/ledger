# 记账小助手

[![E2E](https://github.com/SilentEcho7/ledger/actions/workflows/e2e.yml/badge.svg)](https://github.com/SilentEcho7/ledger/actions/workflows/e2e.yml)
[![Live Demo](https://img.shields.io/badge/demo-online-4f46e5)](https://silentecho7.github.io/ledger/)

自己用的记账网页。不想装 App，也不想为记一笔钱注册个账号，就写了个单文件的：双击 `index.html` 就能打开，数据存在浏览器里，不联网。

在线版：<https://silentecho7.github.io/ledger/>

## 功能

- **记一笔**：直接打「买2杯咖啡 30」，自己认金额、猜分类，剩下的当备注
- **统计**：本周 / 本月 / 今年三档切换，带环比
- **预算**：设个月度额度，超了进度条变红
- **搜索**：关键词加金额条件，比如 `吃饭 >50`、`100-500`
- **撤销**：删错了 6 秒内能撤回
- **导入导出**：JSON 备份，换设备时用
- **主题**：浅色 / 深色 / 跟着系统走

## 三个坑

**月份 1-12 和 0-11 混着用了**

`Date.getMonth()` 返回 0-11，我存的时候按 1-12 存。有一版直接把 1-12 的数塞进 `new Date(y, m, 1)`，结果 1 月变 2 月，12 月跳到下一年，最明显的是刷新之后自己回到本月。后来定了个规矩：对外一律 1-12，进 Date 之前减 1，取出来加 1。1 月、12 月、刷新恢复这三处各写了一条测试。

**「买2杯咖啡 30」记成了 2 元**

最早的正则取第一个数字，2 杯的 2 就被当成金额了。改成从末尾找——人说话习惯把钱放最后；末尾找不到，再退一步取最后一个数字。改完补了 9 条解析用例，小数、带「元」、金额在中间这些情况都覆盖了。

**390px 下分类按钮把页面撑宽了**

手机上那排分类按钮放不下，直接把整页撑出横向滚动条。改成让容器自己横向滚（`overflow-x: auto`），页面不再溢出。判据是 `document.scrollWidth <= innerWidth`。

## 跑起来

双击 `index.html` 就行。想走 http 的话：

```bash
python3 -m http.server 4173
```

## 跑测试

改代码改怕了，所以补了一套端到端测试。

```bash
npm install
npx playwright install chromium
npm test
npm run report
```

62 条，跑一遍 19 秒左右。按功能分成 9 个文件，定位用 `data-testid` 和 aria 角色，不依赖 class 名——改样式不会让测试红一片。

push 之后 GitHub Actions 会自动跑，结果看顶部那个徽章。

## 说明

没上框架。这个项目想做到"发给谁都能直接打开"，加个构建步骤反而麻烦。1500 行原生 JS，改起来也还算清楚。

测试目前只覆盖主流程，跨年、闰月、数据量特别大这些还没测，后面补。

## License

MIT
