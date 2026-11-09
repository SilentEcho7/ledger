# 记账小助手

一个单文件、零依赖的本地记账工具，配一套 62 条用例的 Playwright 端到端测试。

> 所有数据存在浏览器 `localStorage`，不联网、不上传、没有后端。

**在线地址**：<https://silentecho7.github.io/ledger/>　（已部署，直接可访问）

---

## 功能

| 模块 | 说明 |
| --- | --- |
| 自然语言记账 | 输入「买2杯咖啡 30」，自动拆出金额、分类、备注；金额取**结尾**那个数字 |
| 统计区间 | 周 / 月 / 年三档，带环比（较上期涨跌百分比） |
| 主题三态 | 浅色 / 深色 / 跟随系统，首屏内联脚本预设颜色，刷新不闪白 |
| 月度预算 | 进度条 + 剩余/超支提示，80% 转黄、100% 转红 |
| 搜索 | 关键词搜备注与分类；金额支持 `>100`、`100-500`、`<50` |
| 删除撤销 | 删除后 6 秒内可撤销，数据真正落盘在撤销窗口结束后 |
| 导入导出 | JSON 备份，可跨设备迁移 |
| 趋势图 | Canvas 手绘，跟随主题换色，零图表库 |
| 响应式 | 390px 下单页无横向滚动，分类栏改为横向滚动 |

## 目录结构

```
.
├── index.html            # 应用本体，HTML + CSS + JS 全在这一个文件里
├── tests/                # Playwright 用例，按功能域拆分
│   ├── helpers.ts        # 公共方法：记账、造历史数据、时区安全的日期
│   ├── 01-smoke.spec.ts
│   ├── 02-parse.spec.ts
│   ├── 03-stats.spec.ts
│   ├── 04-search.spec.ts
│   ├── 05-crud.spec.ts
│   ├── 06-theme.spec.ts
│   ├── 07-persistence.spec.ts
│   ├── 08-responsive.spec.ts
│   └── 09-io.spec.ts
├── playwright.config.ts
└── package.json
```

## 本地打开

直接双击 `index.html` 就行。注意：`file://` 协议下 localStorage 可用，但如果你想跑测试，必须走 http。

```bash
python3 -m http.server 4173
# 打开 http://127.0.0.1:4173/index.html
```

---

## 一、部署到 GitHub Pages

### 1. 建仓库并推代码

> **先改提交身份**：当前仓库的提交作者是占位值，推之前换成你自己的，否则 GitHub 上显示的不是你。
>
> ```bash
> git config user.name "你的名字"
> git config user.email "你的GitHub邮箱"
> git commit --amend --reset-author --no-edit
> ```

先在 GitHub 网页上新建一个 **public** 仓库，名字随意，例如 `ledger`。然后在项目目录执行：

```bash
git init
git add .
git commit -m "feat: 记账小助手 v1.0，含 62 条 Playwright 用例"
git branch -M main
git remote add origin https://github.com/SilentEcho7/ledger.git
git push -u origin main
```

装了 `gh` 的话可以一行搞定：

```bash
gh repo create ledger --public --source=. --remote=origin --push
```

### 2. 打开 Pages

仓库页 → **Settings** → 左侧 **Pages** → **Build and deployment**

- Source 选 `Deploy from a branch`
- Branch 选 `main`，目录选 `/ (root)`
- 点 **Save**

等 1～2 分钟，地址就是 `https://silentecho7.github.io/ledger/`。

### 3. 验证

打开地址，`F12 → Console` 应该没有任何红色报错；`Application → Local Storage` 里能看到 `ledger.entries.v1`。

> 常见坑：仓库必须是 public（private 仓库用 Pages 要付费）；`index.html` 必须在根目录；中文文件名虽然能访问，但入口一定要叫 `index.html`，否则根路径 404。

### 4. 以后每次改完

```bash
git add .
git commit -m "fix: 修复 xx"
git push
```

Pages 会自动重新构建，大概 30 秒生效。

---

## 二、跑测试

### 1. 装依赖

```bash
npm install
npx playwright install chromium
```

> 国内下载慢可以设镜像：
> `PLAYWRIGHT_DOWNLOAD_HOST=https://npmmirror.com/mirrors/playwright npx playwright install chromium`

### 2. 跑

```bash
npm test                # 无头模式，跑全部 62 条
npm run test:headed     # 有头模式，能看见浏览器在点
npm run test:ui         # 可视化界面，可单条重跑、看每一步快照
```

配置里已经写了 `webServer`，**不需要手动起服务**，Playwright 会自己拉一个静态服务再跑。

### 3. 看报告

```bash
npm run report
```

浏览器会打开 `playwright-report/index.html`。这个文件是自包含的，可以直接发给别人看，也可以截图放进简历附件。

失败时在 `test-results/` 里还有截图、录屏（trace）和 DOM 快照：

```bash
npx playwright show-trace test-results/<用例名>/trace.zip
```

### 4. 三条最该看的用例

| 用例 | 对应哪个坑 |
| --- | --- |
| `02-parse.spec.ts` #07 | 「买2杯咖啡 30」被解析成 2 元 |
| `07-persistence.spec.ts` #43 #44 #45 | 月份存 1-12、读成 0-11，刷新跳回本月 |
| `08-responsive.spec.ts` #48 | 390px 下分类按钮把页面撑出横向滚动条 |

---

## 三、技术说明

**为什么不用框架？** 这个项目的目标是"能发给任何人、双击就能用"。引入 React/Vite 会带来构建步骤和 node_modules，反而让分享变难。1500 行原生 JS 足够撑起这些交互。

**为什么测试不依赖 CSS 类名？** 用例统一用 `data-testid`、ARIA role 和可见文案定位。改样式、调布局不会导致测试大面积飘红，只有行为变了才失败。

**月份为什么统一存 1-12？** `Date.getMonth()` 返回 0-11，这是 JS 的历史包袱。项目里立了一条铁律：**出站 +1，入站 -1，格式化时再 +1**，所有跨层传递的月份都是 1-12。三处边界（1 月、12 月、刷新恢复）都有专门的回归用例。

## License

MIT
