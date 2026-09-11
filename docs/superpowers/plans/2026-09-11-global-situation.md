# 全球局势 Implementation Plan

**Goal:** 在当前 Financial Lens UI 上加入可持续更新、可解释、可回退的全球局势板块，并把事件与经济与市场学院双向连接。

**Architecture:** 共享 TypeScript 快照契约和规则数据；Node 抓取脚本产出静态 JSON；React loader 读取 JSON 并回退到内置种子；GitHub Actions 定时刷新和部署。页面使用原生 React、CSS 和可访问 SVG，不引入大型图表依赖。

**Tech Stack:** React, TypeScript, Vite, Vitest, Testing Library, Node 22, GitHub Actions.

---

### Task 1: 快照契约、分类、评分与去重

**Files:**
- Create: `src/data/globalSituationTypes.ts`
- Create: `src/data/globalSituationRules.ts`
- Create: `tests/globalSituationRules.test.ts`

1. 写失败测试：十项关联度阈值、关键词分类、72 小时内相似事件聚合、多来源保留、FACT 与推演字段分离。
2. 运行目标测试，确认因缺少实现而失败。
3. 实现最小规则层并再次运行测试。

### Task 2: 真实抓取脚本和 Last Successful Snapshot

**Files:**
- Create: `scripts/fetch-global-situation.mjs`
- Create: `scripts/global-situation-core.mjs`
- Create: `tests/globalSituationSnapshot.test.ts`
- Create: `public/data/global-situation.json`
- Modify: `package.json`

1. 写失败测试：RSS/Atom 解析、全部失败保留旧事件、部分成功状态、字段完整性和去重。
2. 实现无依赖 XML 解析、官方源适配器、模板化解释与 JSON 写入。
3. 运行脚本测试；用实际官方源生成一次带来源时间的快照。

### Task 3: 数据加载与新鲜度

**Files:**
- Create: `src/data/globalSituation.ts`
- Create: `src/data/globalSituationSeed.ts`
- Create: `tests/globalSituation.test.ts`

1. 写失败测试：最新、延迟、异常、部分状态；远程 JSON 失败时返回种子快照。
2. 实现格式化、状态派生、知识点反向查询和数据 loader。
3. 运行目标测试。

### Task 4: 页面、地图、因果链和资产解释

**Files:**
- Create: `src/pages/GlobalSituationPage.tsx`
- Create: `src/pages/GlobalEventPage.tsx`
- Create: `src/components/SituationMap.tsx`
- Create: `src/components/EventCausalChain.tsx`
- Create: `src/components/FreshnessBanner.tsx`
- Create: `src/components/MarketRelevance.tsx`
- Create: `tests/globalSituationPages.test.tsx`
- Modify: `src/app/App.tsx`

1. 写组件测试：页面层级、FACT/MARKET VIEW/SCENARIO、事件路由、地图区域选择、节点和资产展开、无价格空状态、知识链接。
2. 实现移动端优先页面和交互组件。
3. 运行目标测试并检查键盘语义。

### Task 5: 导航专业化和学院双向闭环

**Files:**
- Modify: `src/app/AppShell.tsx`
- Modify: `src/pages/TodayPage.tsx`
- Modify: `src/pages/BriefPage.tsx`
- Modify: `src/pages/LearnPage.tsx`
- Modify: `src/pages/LessonPage.tsx`
- Modify: relevant tests

1. 写失败测试：专业导航名称、事件到课程、课程到事件。
2. 更新标题和反向关联列表，保留现有课程与视觉层。
3. 运行相关测试。

### Task 6: 视觉系统与响应式 QA

**Files:**
- Create: `src/styles/globalSituation.css`
- Modify: `src/main.tsx`
- Modify: `src/styles/global.css`

1. 补齐低饱和蓝紫样式、信息密度、点击态、长文本换行和无横向溢出。
2. 运行组件测试和构建。
3. 在 390px 与桌面实际浏览器检查地图、列表、详情、因果链和标签，并修正问题。

### Task 7: GitHub Actions 定时更新与发布

**Files:**
- Modify: `.github/workflows/deploy-pages.yml`
- Modify: `README.md`

1. 加入 `schedule` 与 `workflow_dispatch`，依次执行抓取、测试、类型检查、构建和 Pages 发布。
2. 用线上 JSON 作为可选 fallback，抓取器负责保留最后成功事件。
3. 用 actionlint/yaml 解析或人工核对工作流语法。

### Task 8: 完整验证、提交、推送和线上核验

1. 运行 `npm test -- --run`、`npm run typecheck`、`npm run build`。
2. 检查工作区 diff、快照内来源时间、敏感措辞和 FACT/MARKET VIEW/SCENARIO 边界。
3. 进行 390px、桌面、横向溢出、路由、双向映射、失败回退的浏览器 QA。
4. 提交并 push `main`。
5. 等待 GitHub Pages workflow 成功，打开线上 `/situation` 和事件详情核验。
