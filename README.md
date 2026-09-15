# 金融透镜

Financial Lens — 手机端优先的市场解释与经济学习网站。

直接通过浏览器使用，可添加到手机主屏幕，无需下载应用商店 App。

## 本地运行

```bash
npm install
npm run dev
```

生产检查使用 `npm test -- --run`、`npm run typecheck` 和 `npm run build`。部署到 HTTPS 后，可通过手机浏览器菜单添加到主屏幕。

## 实时财经新闻

`npm run update:news` 从 `scripts/news/source-registry.mjs` 中已核验的白名单来源抓取新闻，生成 `public/data/news-feed.json`。首页主列表使用滚动 24 小时窗口；24–72 小时仍有明确传导信号的重大事件单独进入「持续影响」，最多 6 条。来源需每 90 天复核，验证证据记录在 `docs/news-source-registry.md`。

英文内容可通过 GitHub Secrets `NEWS_TRANSLATION_API_URL`、`NEWS_TRANSLATION_API_KEY`、`NEWS_TRANSLATION_MODEL` 接入结构化中文整理。未配置或生成校验失败时，页面保留英文原标题与原始链接，不猜测中文。密钥不得写入仓库或前端资源。

`npm run update:data` 统一更新新闻、市场、全球局势、行业和简报状态，`npm run validate:data` 会验证全部公开快照。单个来源失败时发布其他可靠来源并标记异常；全部来源失败时保留上一份成功快照，不把旧数据标成最新。`public/data/site-snapshot.json` 是全站健康状态入口，各业务 JSON 独立失败和降级。

## 发布

推送到 `main` 后，GitHub Actions 会运行测试、类型检查、生产构建并发布到 GitHub Pages。独立的 `Update public data snapshots` 工作流在每小时第 17 分钟运行；即使电脑关闭、Codex 不在线，也会抓取、校验并由 GitHub bot 提交独立业务快照及统一状态索引，再触发一次 Pages 发布。简报仅在北京时间 06 点和 16 点生成。

全球局势数据链路：

```text
Fed / ECB / BOJ / UN 官方 RSS
  → 解析与金融相关性筛选
  → 72 小时相似事件去重聚合
  → FACT / MARKET VIEW / SCENARIO 分层
  → 静态 JSON 快照
  → GitHub Pages
```

候选快照写入前必须通过 schema 校验。本轮全部主要来源失败、事件数异常为零或 JSON 不合法时，不覆盖 Last Successful Snapshot；`site-snapshot.json` 会标记 `partial`、`delayed` 或 `unavailable`。前端使用更新时间做 cache busting，并请求 `no-store`；Service Worker 不缓存动态 JSON。详见 [自动数据管线](docs/data-pipeline.md)、[数据来源注册表](docs/data-sources.md) 和 [动态数据运行手册](docs/operations/dynamic-data-runbook.md)。

## MVP

- 全球局势、A股、港股、美股与大类资产市场概览。
- 新闻原文链接、通俗摘要、术语标注、事件因果链及可能影响。
- 明确区分事实、市场共识、AI 推演和风险。
- 每日市场简报与完整的经济与市场学院。
- 全球局势事件、可点击因果链、敏感资产、反证条件和课程双向链接。
- 移动端响应式布局及添加到主屏幕支持。

技术方案：React + TypeScript + Vite + CSS。市场价格仅在有可靠来源与数据时间时展示；缺失时明确显示空状态。

不包含账户、真实交易、复杂投资组合、社交或大型后端。

## 项目结构

```text
docs/           产品与技术方案
public/         图标与公开静态资源
src/app/        路由与应用壳
src/pages/      市场、全球局势、事件详情、简报、学院
src/components/ 可复用阅读组件
src/data/       类型、数据与适配器
src/styles/     设计变量与响应式样式
scripts/        官方源抓取、筛选与快照生成
tests/          关键交互、数据契约与失败回退
```

详见 [产品与技术方案](docs/product-design.md) 与 [全球局势设计](docs/superpowers/specs/2026-09-11-global-situation-design.md)。

## 独立性

本项目使用独立 Git 仓库。不得复制或修改“求职面板”及其他项目的代码、配置或历史。
