# 金融透镜

Financial Lens — 手机端优先的市场解释与经济学习网站。

直接通过浏览器使用，可添加到手机主屏幕，无需下载应用商店 App。

## 本地运行

```bash
npm install
npm run dev
```

生产检查使用 `npm test -- --run`、`npm run typecheck` 和 `npm run build`。部署到 HTTPS 后，可通过手机浏览器菜单添加到主屏幕。

## 发布

推送到 `main` 后，GitHub Actions 会运行测试、类型检查、生产构建并发布到 GitHub Pages。工作流也会在每小时第 17 分钟抓取一次官方公开源，生成 `public/data/global-situation.json` 后重新发布。

全球局势数据链路：

```text
Fed / ECB / BOJ / UN 官方 RSS
  → 解析与金融相关性筛选
  → 72 小时相似事件去重聚合
  → FACT / MARKET VIEW / SCENARIO 分层
  → 静态 JSON 快照
  → GitHub Pages
```

抓取开始前，工作流会下载线上最近一次快照。本轮全部来源失败时保留其事件，写入 `source_error` 状态和本次尝试时间；页面继续展示 Last Successful Snapshot，并明确标记异常。部分来源失败时状态为 `partial`。本地可运行 `npm run fetch:situation` 刷新快照。

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
