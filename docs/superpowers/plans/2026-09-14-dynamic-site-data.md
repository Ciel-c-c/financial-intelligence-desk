# Financial Lens 全站动态数据 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将首页市场、行业、摘要、核心传导、每日简报和全球局势全部切换到可追溯、可独立降级的动态快照，并让用户清楚看到数据时间与健康状态。

**Architecture:** 后台脚本从来源注册表读取官方或已核验的知名机构数据，分别生成市场、行业、全球局势和简报快照，再由 `site-snapshot.json` 汇总健康状态。前端通过带版本参数、禁止缓存优先的仓库层加载各快照；生产环境不再静默回退 `demoData.ts` 或种子事件，页面按 `fresh / partial / delayed / unavailable` 渐进呈现。

**Tech Stack:** Node.js 22 ESM、TypeScript、React、Vite、Vitest、Testing Library、GitHub Actions、GitHub Pages Service Worker

**Spec:** `docs/superpowers/specs/2026-09-14-dynamic-site-data-design.md`

## Global Constraints

- 生产数据只允许来自官方或经核验的知名公开市场数据源。
- 正式启用来源前必须核对发布主体、域名、标的与币种、时间戳、涨跌幅口径、频率限制及展示许可。
- 新闻和全球局势每小时更新；A股、港股、美股在交易时段每小时更新，收盘后保留当日收盘；简报每天生成北京时间早间版和主要市场收盘版。
- 数据集独立失败；失败时保留最后成功快照并明确标记，禁止用演示数据冒充当日数据。
- 市场原因和核心传导必须有新闻、政策或数据证据；证据不足时隐藏解释或明确说明无法确认。
- 复用现有 Financial Lens 字体、玻璃卡片和响应式系统，不大范围重写无关页面。
- 动态 JSON 不得使用缓存优先；页面恢复前台或超过刷新间隔时检查状态索引。
- 每一任务采用测试先行，并形成独立可验证提交。

---

## File Structure

- `scripts/site/site-contract.mjs`：全站快照共用状态、时间和来源契约。
- `scripts/site/source-registry.mjs`：市场与宏观来源白名单及复核元数据。
- `scripts/site/market-adapters.mjs`：将各来源响应转换成统一市场标的。
- `scripts/site/market-pipeline.mjs`：市场分组、交易状态、旧快照降级和发布。
- `scripts/site/sector-pipeline.mjs`：分市场行业表现与证据绑定。
- `scripts/site/brief-pipeline.mjs`：从有效快照生成事实型早晚简报。
- `scripts/site/site-status.mjs`：聚合各数据集状态，写入 `site-snapshot.json`。
- `scripts/update-site-data.mjs`：一次更新的编排入口。
- `src/data/siteSnapshotTypes.ts`：前端统一 TypeScript 数据类型。
- `src/data/snapshotRepository.ts`：版本化、无缓存加载及运行时校验。
- `src/data/useSiteData.ts`：页面聚焦和时间间隔驱动的统一刷新 hook。
- `src/components/SiteDataStatus.tsx`：全站数据状态入口。
- `src/components/MarketOverview.tsx`：市场摘要、标签和指数卡片组合。
- `src/components/SectorPerformance.tsx`：随市场切换的行业强弱。
- `src/components/CoreTransmission.tsx`：有证据才显示的动态传导链。
- `public/data/*.json`：经验证后原子发布的业务快照。

### Task 1: 建立统一快照契约与状态索引

**Files:**
- Create: `scripts/site/site-contract.mjs`
- Create: `scripts/site/site-status.mjs`
- Create: `tests/site/siteContract.test.ts`
- Modify: `scripts/snapshot-schema.mjs`
- Modify: `scripts/validate-snapshots.mjs`
- Create: `public/data/site-snapshot.json`

**Interfaces:**
- Produces: `validateDatasetEnvelope(value)`, `deriveDatasetStatus({ attemptedAt, lastSuccessfulAt, dataAsOf, expectedIntervalMs, available })`, `buildSiteSnapshot({ attemptedAt, datasets })`。
- Contract: 数据集状态只允许 `fresh | partial | delayed | unavailable`；`freshness` 只允许 `realtime | delayed | close | historical`。

- [ ] **Step 1: 写契约失败测试**

```ts
import { describe, expect, it } from 'vitest';
import { buildSiteSnapshot, deriveDatasetStatus, validateDatasetEnvelope } from '../../scripts/site/site-contract.mjs';

it('区分数据时间、成功时间和尝试时间', () => {
  const value = { schemaVersion: 1, attemptedAt: '2026-09-14T02:00:00Z', lastSuccessfulAt: '2026-09-14T01:00:00Z', dataAsOf: '2026-09-14T00:00:00Z', nextExpectedAt: '2026-09-14T03:00:00Z', status: 'delayed', freshness: 'delayed', sourceHealth: [], fallbackReason: 'source timeout' };
  expect(validateDatasetEnvelope(value)).toBe(true);
});

it('从未成功的数据集必须不可用', () => {
  expect(deriveDatasetStatus({ attemptedAt: '2026-09-14T02:00:00Z', lastSuccessfulAt: null, dataAsOf: null, expectedIntervalMs: 3600000, available: false })).toBe('unavailable');
});

it('状态索引不复制业务数据', () => {
  const value = buildSiteSnapshot({ attemptedAt: '2026-09-14T02:00:00Z', datasets: [{ id: 'market-overview', status: 'fresh', lastSuccessfulAt: '2026-09-14T02:00:00Z', dataAsOf: '2026-09-14T01:55:00Z', nextExpectedAt: '2026-09-14T03:00:00Z' }] });
  expect(value.datasets[0]).not.toHaveProperty('instruments');
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- tests/site/siteContract.test.ts --run`

Expected: FAIL，提示 `scripts/site/site-contract.mjs` 不存在。

- [ ] **Step 3: 实现最小契约与状态构建器**

```js
const isIso = value => typeof value === 'string' && Number.isFinite(new Date(value).valueOf());

export const DATASET_STATUSES = ['fresh', 'partial', 'delayed', 'unavailable'];
export const FRESHNESS_VALUES = ['realtime', 'delayed', 'close', 'historical'];

export function validateDatasetEnvelope(value) {
  return value?.schemaVersion === 1 && isIso(value.attemptedAt) &&
    (value.lastSuccessfulAt === null || isIso(value.lastSuccessfulAt)) &&
    (value.dataAsOf === null || isIso(value.dataAsOf)) && isIso(value.nextExpectedAt) &&
    DATASET_STATUSES.includes(value.status) && FRESHNESS_VALUES.includes(value.freshness) &&
    Array.isArray(value.sourceHealth);
}
```

在 `buildSiteSnapshot` 中只复制 `id/status/lastSuccessfulAt/dataAsOf/nextExpectedAt/fallbackReason`，并在 `validate-snapshots.mjs` 加入 `site-snapshot.json` 校验。

- [ ] **Step 4: 运行契约与现有快照测试**

Run: `npm test -- tests/site/siteContract.test.ts tests/snapshotPipeline.test.ts --run`

Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add scripts/site scripts/snapshot-schema.mjs scripts/validate-snapshots.mjs tests/site/siteContract.test.ts public/data/site-snapshot.json
git commit -m "feat: add unified site snapshot contract"
```

### Task 2: 建立来源注册表与市场适配器

**Files:**
- Create: `scripts/site/source-registry.mjs`
- Create: `scripts/site/market-adapters.mjs`
- Create: `tests/site/sourceRegistry.test.ts`
- Create: `tests/site/marketAdapters.test.ts`
- Create: `docs/data-sources.md`

**Interfaces:**
- Produces: `getEnabledMarketSources(now)`, `assertSourceReviewCurrent(source, now)`, `normalizeInstrument(raw, source, fetchedAt)`。
- `SourceRecord`: `{ id, name, owner, baseUrl, allowedHosts, kind, markets, reviewedAt, reviewExpiresAt, termsUrl, enabled }`。
- `MarketInstrument`: `{ id, group, name, symbol, value, change, changePercent, currency, unit, marketState, dataAsOf, freshness, source }`。

- [ ] **Step 1: 写白名单和规范化失败测试**

```ts
const source = { id: 'official-test', name: 'Official Test', owner: 'Official Test', baseUrl: 'https://data.example.gov', allowedHosts: ['data.example.gov'], kind: 'official', markets: ['globalAssets'], reviewedAt: '2026-09-01T00:00:00Z', reviewExpiresAt: '2026-11-30T00:00:00Z', termsUrl: 'https://data.example.gov/terms', enabled: true };

it('停用超过复核期的来源', () => {
  expect(() => assertSourceReviewCurrent({ ...source, reviewedAt: '2026-01-01T00:00:00Z', reviewExpiresAt: '2026-04-01T00:00:00Z' }, new Date('2026-09-14T00:00:00Z'))).toThrow(/review expired/);
});

it('保留来源时间而非抓取时间', () => {
  const item = normalizeInstrument({ symbol: 'TEST', price: 10, timestamp: '2026-09-14T01:00:00Z' }, source, '2026-09-14T02:00:00Z');
  expect(item.dataAsOf).toBe('2026-09-14T01:00:00.000Z');
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- tests/site/sourceRegistry.test.ts tests/site/marketAdapters.test.ts --run`

Expected: FAIL，两个模块尚不存在。

- [ ] **Step 3: 实现严格来源门禁**

注册表只加入已人工核验并记录证据的来源。`getEnabledMarketSources` 必须同时检查 `enabled === true`、域名匹配和 `reviewExpiresAt >= now`；适配器拒绝无数值、无来源时间、未知币种、绝对涨跌与百分比方向矛盾的记录。

```js
export function assertSourceReviewCurrent(source, now = new Date()) {
  if (!source.enabled) throw new Error(`source disabled: ${source.id}`);
  if (new Date(source.reviewExpiresAt) < now) throw new Error(`source review expired: ${source.id}`);
  if (!source.allowedHosts.includes(new URL(source.baseUrl).hostname)) throw new Error(`source domain mismatch: ${source.id}`);
}
```

在 `docs/data-sources.md` 对每项启用来源记录标的、口径、延迟、许可页和复核日期；尚未完成核验的候选来源保持 `enabled: false`。

- [ ] **Step 4: 运行来源测试**

Run: `npm test -- tests/site/sourceRegistry.test.ts tests/site/marketAdapters.test.ts --run`

Expected: PASS，且过期来源测试明确失败关闭来源。

- [ ] **Step 5: 提交**

```bash
git add scripts/site/source-registry.mjs scripts/site/market-adapters.mjs tests/site/sourceRegistry.test.ts tests/site/marketAdapters.test.ts docs/data-sources.md
git commit -m "feat: verify market data sources"
```

### Task 3: 生成分市场行情快照并正确处理交易状态

**Files:**
- Create: `scripts/site/market-pipeline.mjs`
- Create: `tests/site/marketPipeline.test.ts`
- Modify: `scripts/update-data-snapshots.mjs`
- Create: `public/data/market-overview.json`
- Delete after migration: `public/data/market-snapshot.json`

**Interfaces:**
- Consumes: `getEnabledMarketSources`, `normalizeInstrument`, `deriveDatasetStatus`。
- Produces: `buildMarketOverview({ attemptedAt, sourceResults, previous })`、`resolveMarketState(group, now, dataAsOf)`，输出 `{ ...envelope, groups: { aShare, hongKong, us, globalAssets } }`。

- [ ] **Step 1: 写市场分组、休市和独立降级测试**

```ts
it('一个市场失败不会丢弃其他市场', () => {
  const snapshot = buildMarketOverview({ attemptedAt: now, sourceResults: [aShareSuccess, hkFailure, usSuccess, globalSuccess], previous });
  expect(snapshot.status).toBe('partial');
  expect(snapshot.groups.aShare.length).toBeGreaterThan(0);
  expect(snapshot.groups.hongKong).toEqual(previous.groups.hongKong);
  expect(snapshot.groupHealth.hongKong.status).toBe('delayed');
});

it('休市数据标记上一交易日收盘', () => {
  expect(resolveMarketState('hongKong', saturday, fridayClose)).toBe('previous_close');
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- tests/site/marketPipeline.test.ts --run`

Expected: FAIL，`buildMarketOverview` 不存在。

- [ ] **Step 3: 实现市场管线**

以 `aShare/hongKong/us/globalAssets` 独立构建、校验和降级；每组只保留固定观察池中的标的。交易状态按市场时区计算 `trading/delayed/close/previous_close`，不得把周末抓取时间显示成行情时间。

```js
const REQUIRED_GROUPS = ['aShare', 'hongKong', 'us', 'globalAssets'];
export function buildMarketOverview({ attemptedAt, sourceResults, previous }) {
  const groups = Object.fromEntries(REQUIRED_GROUPS.map(id => [id, selectValidOrPrevious(id, sourceResults, previous)]));
  const unavailable = REQUIRED_GROUPS.filter(id => groups[id].items.length === 0);
  const delayed = REQUIRED_GROUPS.filter(id => groups[id].usedPrevious);
  return assembleMarketEnvelope({ attemptedAt, groups, status: unavailable.length || delayed.length ? 'partial' : 'fresh' });
}
```

- [ ] **Step 4: 运行市场及旧管线测试**

Run: `npm test -- tests/site/marketPipeline.test.ts tests/snapshotPipeline.test.ts --run`

Expected: PASS；ECB 数据可作为全球资产输入但不再代表完整市场，旧 `market-snapshot.json` 不再被发布或消费。

- [ ] **Step 5: 提交**

```bash
git add scripts/site/market-pipeline.mjs scripts/update-data-snapshots.mjs tests/site/marketPipeline.test.ts public/data/market-overview.json public/data/market-snapshot.json
git commit -m "feat: publish multi-market snapshots"
```

### Task 4: 生成行业表现与有证据的市场解释

**Files:**
- Create: `scripts/site/sector-pipeline.mjs`
- Create: `tests/site/sectorPipeline.test.ts`
- Create: `public/data/sector-performance.json`
- Modify: `scripts/snapshot-schema.mjs`
- Modify: `scripts/validate-snapshots.mjs`

**Interfaces:**
- Consumes: 当前市场数据、`news-feed.json`、`global-situation.json`。
- Produces: `buildSectorPerformance({ attemptedAt, marketInputs, evidence })` 与 `matchDriverEvidence(sector, evidence)`。
- 每项行业输出 `{ id, market, classification, name, changePercent, rank, dataAsOf, source, driver?: { summary, evidenceIds, confidence } }`。

- [ ] **Step 1: 写分类隔离和证据门禁测试**

```ts
it('不会把美股行业放入 A 股页', () => {
  const result = buildSectorPerformance(fixtures);
  expect(result.groups.aShare.every(item => item.market === 'aShare')).toBe(true);
});

it('没有传导证据时不生成涨跌原因', () => {
  expect(matchDriverEvidence(oilSector, [])).toBeUndefined();
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- tests/site/sectorPipeline.test.ts --run`

Expected: FAIL，行业管线不存在。

- [ ] **Step 3: 实现行业快照**

每个市场使用单一明确分类；全球资产生成资产类别排名而非股票行业。只有证据地区、主题、发布时间和因果节点均匹配时才写入 `driver`，否则省略该字段。

```js
export function matchDriverEvidence(sector, evidence) {
  const matches = evidence.filter(item => item.regionMatches(sector.market) && item.topicIds.some(id => sector.driverTopicIds.includes(id)) && item.causalNodes.includes(sector.requiredMechanism));
  return matches.length ? { summary: matches[0].explanation, evidenceIds: matches.map(item => item.id), confidence: 'supported' } : undefined;
}
```

- [ ] **Step 4: 运行行业和快照校验测试**

Run: `npm test -- tests/site/sectorPipeline.test.ts tests/snapshotPipeline.test.ts --run`

Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add scripts/site/sector-pipeline.mjs scripts/snapshot-schema.mjs scripts/validate-snapshots.mjs tests/site/sectorPipeline.test.ts public/data/sector-performance.json
git commit -m "feat: publish evidence-backed sector performance"
```

### Task 5: 生成动态摘要、核心传导和早晚简报

**Files:**
- Create: `scripts/site/summary-pipeline.mjs`
- Create: `scripts/site/brief-pipeline.mjs`
- Create: `tests/site/summaryPipeline.test.ts`
- Create: `tests/site/briefPipeline.test.ts`
- Create: `public/data/daily-brief.json`

**Interfaces:**
- Consumes: 市场、行业、新闻和全球局势有效快照。
- Produces: `buildMarketSummary(marketGroup, sectorGroup, evidence)`、`selectCoreTransmission(evidence)`、`buildDailyBrief({ edition, generatedAt, snapshots })`。
- `edition` 只允许 `morning | close`；简报必须保存输入快照版本和 `dataAsOf`。

- [ ] **Step 1: 写事实/解释分层、传导证据和版本测试**

```ts
it('无证据时摘要只输出事实', () => {
  const summary = buildMarketSummary(market, sectors, []);
  expect(summary.fact).toContain('上涨');
  expect(summary.explanation).toBeUndefined();
});

it('核心传导必须有 3 至 6 个节点和反例', () => {
  const chain = selectCoreTransmission([supportedEvent]);
  expect(chain.nodes.length).toBeGreaterThanOrEqual(3);
  expect(chain.nodes.length).toBeLessThanOrEqual(6);
  expect(chain.condition).toBeTruthy();
});

it('简报记录所有输入版本', () => {
  expect(buildDailyBrief(input).snapshotVersions).toEqual(expect.objectContaining({ market: expect.any(String), news: expect.any(String) }));
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- tests/site/summaryPipeline.test.ts tests/site/briefPipeline.test.ts --run`

Expected: FAIL，新模块不存在。

- [ ] **Step 3: 实现确定性事实摘要和证据解释**

事实层由涨跌、市场广度、最强与最弱项确定性生成。解释层只引用带来源的 `evidenceIds`。简报无解释证据时生成事实清单；输入版本与上次相同且没有新内容时保留旧简报，并标记 `noMaterialUpdate: true`。

```js
export function buildDailyBrief({ edition, generatedAt, snapshots }) {
  assertEdition(edition);
  const facts = collectVerifiedFacts(snapshots);
  return { schemaVersion: 1, edition, generatedAt, dataAsOf: maxDataAsOf(snapshots), snapshotVersions: collectVersions(snapshots), facts, marketFocus: supportedFocus(snapshots), watchItems: verifiedWatchItems(snapshots), invalidationConditions: collectConditions(snapshots) };
}
```

- [ ] **Step 4: 运行摘要与简报测试**

Run: `npm test -- tests/site/summaryPipeline.test.ts tests/site/briefPipeline.test.ts --run`

Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add scripts/site/summary-pipeline.mjs scripts/site/brief-pipeline.mjs tests/site/summaryPipeline.test.ts tests/site/briefPipeline.test.ts public/data/daily-brief.json
git commit -m "feat: generate verified market briefs"
```

### Task 6: 编排独立发布、统一状态与计划任务

**Files:**
- Create: `scripts/update-site-data.mjs`
- Create: `tests/site/updateSiteData.test.ts`
- Modify: `package.json`
- Modify: `.github/workflows/update-data.yml`
- Modify: `.github/workflows/deploy-pages.yml`

**Interfaces:**
- Consumes: `updateNewsFeed`, `updateSnapshots`, `buildMarketOverview`, `buildSectorPerformance`, `buildDailyBrief`, `buildSiteSnapshot`。
- Produces: `runSiteUpdate({ now, edition, fetchers, dataDir })`，返回每个数据集的 `promoted/status/error`。

- [ ] **Step 1: 写数据集独立失败与单次部署测试**

```ts
it('市场失败时仍发布新闻和全球局势状态', async () => {
  const result = await runSiteUpdate({ ...fixture, fetchers: { market: rejects, news: succeeds, situation: succeeds } });
  expect(result.datasets.news.promoted).toBe(true);
  expect(result.datasets.market.status).toBe('delayed');
  expect(result.siteSnapshot.datasets).toHaveLength(5);
});
```

同时读取工作流文本，断言定时表达式保留每小时任务、简报 edition 由北京时间窗口决定，且 bot 数据提交只触发一次 Pages 部署。

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- tests/site/updateSiteData.test.ts --run`

Expected: FAIL，编排入口不存在。

- [ ] **Step 3: 实现编排与脚本命令**

```json
{
  "scripts": {
    "update:data": "node scripts/update-site-data.mjs",
    "validate:data": "node scripts/validate-snapshots.mjs"
  }
}
```

`runSiteUpdate` 使用 `Promise.allSettled` 隔离数据集错误；先原子发布独立文件，最后写 `site-snapshot.json`。工作流仍每小时执行，并在北京时间早间或主要市场收盘窗口生成对应简报；同一 `edition + dataAsOf` 不重复提交。

- [ ] **Step 4: 运行编排、校验和真实 dry run**

Run: `npm test -- tests/site/updateSiteData.test.ts tests/snapshotPipeline.test.ts --run`

Run: `npm run update:data -- --dry-run`

Run: `npm run validate:data`

Expected: 全部 PASS；dry run 不改 `public/data`，并打印各数据集状态和启用来源。

- [ ] **Step 5: 提交**

```bash
git add scripts/update-site-data.mjs tests/site/updateSiteData.test.ts package.json package-lock.json .github/workflows/update-data.yml .github/workflows/deploy-pages.yml
git commit -m "feat: orchestrate hourly site data updates"
```

### Task 7: 建立前端仓库、条件刷新和无演示兜底

**Files:**
- Create: `src/data/siteSnapshotTypes.ts`
- Create: `src/data/snapshotRepository.ts`
- Create: `src/data/useSiteData.ts`
- Create: `tests/data/snapshotRepository.test.ts`
- Create: `tests/data/useSiteData.test.tsx`
- Modify: `src/data/globalSituation.ts`
- Modify: `src/data/useGlobalSituation.ts`
- Modify: `public/sw.js`
- Modify: `tests/pwa-assets.test.ts`

**Interfaces:**
- Produces: `loadSiteSnapshot(fetcher)`, `loadDataset<T>(path, version, validate, fetcher)`, `isMarketOverviewSnapshot(value)`, `useSiteData()`。
- `useSiteData()` 返回 `{ site, market, sectors, brief, situation, loading, errors, refresh }`。

- [ ] **Step 1: 写版本请求、聚焦刷新和生产无种子回退测试**

```ts
it('业务 JSON 使用 no-store 和版本参数', async () => {
  await loadDataset('market-overview.json', 'v123', isMarketOverviewSnapshot, fetcher);
  expect(fetcher).toHaveBeenCalledWith(expect.stringContaining('market-overview.json?v=v123'), expect.objectContaining({ cache: 'no-store' }));
});

it('生产全球局势失败返回 unavailable 而不是 seed', async () => {
  const result = await loadGlobalSituation(rejectingFetch);
  expect(result.status).toBe('unavailable');
  expect(result.events).toEqual([]);
});
```

在 hook 测试中触发 `visibilitychange`，断言只有页面重新可见且超过刷新间隔才重新获取 `site-snapshot.json`。

- [ ] **Step 2: 运行测试确认失败**

Run: `npm test -- tests/data/snapshotRepository.test.ts tests/data/useSiteData.test.tsx tests/pwa-assets.test.ts --run`

Expected: FAIL，仓库和 hook 不存在，Service Worker 仍可能缓存 JSON。

- [ ] **Step 3: 实现仓库和网络优先规则**

```ts
export async function loadDataset<T>(path: string, version: string, validate: (value: unknown) => value is T, fetcher = fetch): Promise<T> {
  const response = await fetcher(`${import.meta.env.BASE_URL}data/${path}?v=${encodeURIComponent(version)}`, { cache: 'no-store' });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const value: unknown = await response.json();
  if (!validate(value)) throw new Error(`Invalid snapshot: ${path}`);
  return value;
}
```

Service Worker 对 URL pathname 包含 `/data/` 的请求直接 `fetch`，失败时不返回任意旧 shell；其他静态资源保持现有离线策略。开发测试可显式注入 seed，生产加载器不得导入 seed。

- [ ] **Step 4: 运行前端仓库和 PWA 测试**

Run: `npm test -- tests/data/snapshotRepository.test.ts tests/data/useSiteData.test.tsx tests/globalSituationData.test.ts tests/pwa-assets.test.ts --run`

Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add src/data/siteSnapshotTypes.ts src/data/snapshotRepository.ts src/data/useSiteData.ts src/data/globalSituation.ts src/data/useGlobalSituation.ts tests/data/snapshotRepository.test.ts tests/data/useSiteData.test.tsx tests/globalSituationData.test.ts tests/pwa-assets.test.ts public/sw.js
git commit -m "feat: load versioned live site snapshots"
```

### Task 8: 将首页、简报和全球局势切换到动态数据

**Files:**
- Create: `src/components/SiteDataStatus.tsx`
- Create: `src/components/MarketOverview.tsx`
- Create: `src/components/SectorPerformance.tsx`
- Create: `src/components/CoreTransmission.tsx`
- Modify: `src/app/AppShell.tsx`
- Modify: `src/pages/TodayPage.tsx`
- Modify: `src/pages/BriefPage.tsx`
- Modify: `src/pages/GlobalSituationPage.tsx`
- Modify: `src/pages/GlobalEventPage.tsx`
- Modify: `src/styles/global.css`
- Modify: `src/styles/globalSituation.css`
- Modify: `tests/app/today-page.test.tsx`
- Modify: `tests/app/brief-learn.test.tsx`
- Modify: `tests/globalSituationPages.test.tsx`
- Create: `tests/app/site-data-status.test.tsx`

**Interfaces:**
- Consumes: `useSiteData()` 和动态快照类型。
- UI rule: 不可用显示“暂无可靠数据”；延迟显示数据截止时间和原因；解释缺乏证据时不渲染传导链。

- [ ] **Step 1: 改写页面测试，禁止演示数据进入生产页面**

```ts
it('首页按市场快照切换 A股、港股、美股和全球资产', async () => {
  render(<TodayPage />, { wrapper: routerWrapper });
  expect(await screen.findByText('上证指数')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: '港股' }));
  expect(screen.getByText('恒生指数')).toBeInTheDocument();
});

it('弱证据不显示核心市场传导', () => {
  render(<CoreTransmission chain={undefined} />);
  expect(screen.queryByText('核心市场传导')).not.toBeInTheDocument();
});

it('首页不再导入 demoData 的市场、行业或政治事件', () => {
  expect(readFileSync('src/pages/TodayPage.tsx', 'utf8')).not.toMatch(/marketGroups|sectors|politicalImpacts/);
});
```

增加移动端可见性断言：数据时间、来源和延迟状态不是仅靠 `title` 或 hover 呈现；行业默认前 5 和后 5，其余按钮展开。

- [ ] **Step 2: 运行页面测试确认失败**

Run: `npm test -- tests/app/today-page.test.tsx tests/app/brief-learn.test.tsx tests/globalSituationPages.test.tsx tests/app/site-data-status.test.tsx --run`

Expected: FAIL，页面仍读取演示数据或种子内容。

- [ ] **Step 3: 实现动态页面和状态入口**

`TodayPage` 只组合 `MarketOverview`、`SectorPerformance`、`CoreTransmission` 和既有新闻流；政策/地缘区读取全球局势快照。`BriefPage` 展示 morning/close 最新有效版本及输入数据时间。全站状态入口放入 `AppShell`，支持展开数据集健康和手动“检查更新”。

```tsx
const { site, market, sectors, brief, situation, loading, errors, refresh } = useSiteData();
return <>
  <SiteDataStatus snapshot={site} errors={errors} onRefresh={refresh} />
  <MarketOverview snapshot={market} activeGroup={marketTab} onGroupChange={setMarketTab} />
  <SectorPerformance snapshot={sectors} activeGroup={marketTab} />
  <CoreTransmission chain={market?.groups[marketTab]?.coreTransmission} />
</>;
```

CSS 沿用现有变量和玻璃卡片；移动端标签横向滚动、状态文字常显、地图退化为地区列表。

- [ ] **Step 4: 运行页面、样式和可访问性相关测试**

Run: `npm test -- tests/app/today-page.test.tsx tests/app/brief-learn.test.tsx tests/globalSituationPages.test.tsx tests/app/site-data-status.test.tsx tests/app/theme-css.test.ts tests/app/news-mobile-css.test.ts --run`

Expected: PASS。

- [ ] **Step 5: 提交**

```bash
git add src/app/AppShell.tsx src/components/SiteDataStatus.tsx src/components/MarketOverview.tsx src/components/SectorPerformance.tsx src/components/CoreTransmission.tsx src/pages/TodayPage.tsx src/pages/BriefPage.tsx src/pages/GlobalSituationPage.tsx src/pages/GlobalEventPage.tsx src/styles/global.css src/styles/globalSituation.css tests/app tests/globalSituationPages.test.tsx
git commit -m "feat: render live data across the site"
```

### Task 9: 全量验证、线上抽查与文档交接

**Files:**
- Modify: `README.md`
- Modify: `docs/data-sources.md`
- Create: `docs/operations/dynamic-data-runbook.md`

**Interfaces:**
- Produces: 更新失败排查、来源过期处理、手动刷新、回滚单一数据集和线上验收步骤。

- [ ] **Step 1: 写运行手册与验收清单**

手册必须给出精确命令：

```bash
npm run update:data -- --dry-run
npm run validate:data
npm test -- --run
npm run typecheck
npm run build
```

并列出线上检查项：A股、港股、美股、全球资产各至少一个标的；行业分类与市场一致；早晚简报版本；全球局势无 seed；状态入口时间一致；手机宽度下状态与来源可见。

- [ ] **Step 2: 运行完整本地验证**

Run: `npm run validate:data`

Run: `npm test -- --run`

Run: `npm run typecheck`

Run: `npm run build`

Expected: 全部退出码 0，不出现未处理 warning 或快照契约错误。

- [ ] **Step 3: 检查生产代码不存在静默演示回退**

Run: `rg -n "marketGroups|politicalImpacts|globalSituationSeed|brief, knowledge, news" src/pages src/data`

Expected: 生产页面和生产 hook 中没有命中；只允许测试、课程静态内容或明确开发 fixture 使用演示数据。

- [ ] **Step 4: 本地预览抽查桌面和移动端**

Run: `npm run dev -- --host 127.0.0.1`

检查 1440px 与 390px：四市场切换、行业展开、状态面板、简报、全球局势列表、恢复前台后的条件刷新。每一处数据均显示 `dataAsOf`、来源或降级说明。

- [ ] **Step 5: 提交文档**

```bash
git add README.md docs/data-sources.md docs/operations/dynamic-data-runbook.md
git commit -m "docs: add dynamic data operations runbook"
```

- [ ] **Step 6: 推送后验证 GitHub Actions 与线上快照**

Run: `git push origin main`

Run: `gh run list --workflow "Update public data snapshots" --limit 1`

Run: `gh run watch <run-id> --exit-status`

Run: `gh run list --workflow "Deploy Financial Lens to GitHub Pages" --limit 1`

Run: `gh run watch <deploy-run-id> --exit-status`

Expected: 数据和 Pages 工作流均成功；线上 `site-snapshot.json` 版本与页面状态入口一致，各业务 JSON 可追溯到注册表来源。
