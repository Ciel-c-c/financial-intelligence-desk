# 金融资讯台

Financial Intelligence Desk — 手机端优先的个人财经资讯与学习网站。

直接通过浏览器使用，可添加到手机主屏幕，无需下载应用商店 App。

## 本地运行

```bash
npm install
npm run dev
```

生产检查使用 `npm test -- --run`、`npm run typecheck` 和 `npm run build`。部署到 HTTPS 后，可通过手机浏览器菜单添加到主屏幕。

## 发布

推送到 `main` 后，GitHub Actions 会自动构建并发布到 GitHub Pages。首次发布前，需要在仓库 **Settings → Pages → Build and deployment** 中把 Source 设为 **GitHub Actions**。

## MVP

- 全球财经新闻与 A股、港股、美股市场概览。
- 新闻原文链接、通俗摘要、术语标注、事件因果链及可能影响。
- 明确区分事实、市场共识、AI 推演和风险。
- 每日 Brief 与小白金融知识卡片。
- 移动端响应式布局及添加到主屏幕支持。

技术方案：React + TypeScript + Vite + CSS。第一版演示数据必须明确标识；真实聚合与 AI 接入通过独立数据适配层完成。

不包含账户、真实交易、复杂投资组合、社交或大型后端。

## 项目结构

```text
docs/           产品与技术方案
public/         图标与公开静态资源
src/app/        路由与应用壳
src/pages/      今日、详情、Brief、知识页
src/components/ 可复用阅读组件
src/data/       类型、数据与适配器
src/styles/     设计变量与响应式样式
tests/          后续关键交互与数据验证
```

详见 [产品与技术方案](docs/product-design.md)。当前没有运行脚本，待界面开发时配置。

## 独立性

本项目使用独立 Git 仓库。不得复制或修改“求职面板”及其他项目的代码、配置或历史。
