# 开收盘市场数据与总结 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 免费云端更新A股、港股、美股开收盘事实及分市场总结，保留可靠的旧数据与明确时间。

**Architecture:** 经核验的免费行情与可信开收盘报道分别转换为带来源的观察记录。交易会话合并器保存最近20个交易日，当前快照兼容现有卡片；总结仅关联有证据的已审核新闻。采集不调用模型、不占新闻模型额度。

**Tech Stack:** Node.js 22 ESM、TypeScript、React、Vitest、GitHub Actions，复用现有请求及快照工具；默认不新增依赖。

**Spec:** `docs/superpowers/specs/2026-10-10-market-sessions-design.md`

## Global Constraints

- 不新增费用、不使用付费兜底、不依赖每天人工运行。
- 保留现有市场分组、卡片、字体、CSS和响应式布局。
- session为open/close/reference；precision为date/minute/second；provenance为quote/report/reference。
- 保存每个市场最近20个有有效观察的交易日，不按抓取日创造交易记录。
- 不猜数字、交易日期或开收盘语义；旧快照不能自动提升为已确认会话。
- 未批准来源不启用；FRED SP500不启用；读取不到条款不是批准。
- 机构研报不在本计划范围；不改变新闻模型预算及既有新闻审核规则。
- 远端数据先合并再发布，不强推；自动化采用同一个 public-data-snapshots 写入锁。

## Review Focus

- 美股报道在北京时间次日发布：保留美国交易日，不能用发布时间推定交易日（Task 2）。
- 收盘竞价或提前收盘：只用来源明确会话，不依时钟把盘中变收盘（Task 3）。
- 部分工具缺失或冲突：保留该工具旧值，其他工具正常更新（Task 3）。
- 迟到或重复报道：幂等，迟到开盘不覆盖同日收盘（Task 3）。
- 新闻与行情提交交错：相同写入锁、最新远端合并，不丢新闻数据（Task 5）。

## 文件职责

`scripts/site/market-observations.mjs`及浏览器共享校验负责观察契约；`market-report-parser.mjs`只提取明确报道事实；`market-sessions.mjs`负责历史和冲突；`market-fetch.mjs`负责来源执行；`market-close-summary.mjs`负责事实及证据关联。既有market-pipeline只组装当前概览。UI只调整内容标签和会话数值，不重写布局。

### Task 1: 可执行来源与观察契约

**Files:** Create `scripts/site/market-observations.mjs`, `src/data/marketObservationValidation.mjs`, its `.d.mts`, `tests/site/marketObservations.test.ts`; Modify `scripts/site/source-registry.mjs`, `src/data/siteSnapshotTypes.ts`; update source audit documentation.

**Interfaces:** `validateObservation(value, now) -> boolean`; `normalizeObservation(raw, source, fetchedAt) -> observation`. Observation extends MarketInstrument with session, tradingDate (YYYY-MM-DD), timeZone, timestampPrecision, provenance, sourcePublishedAt, optional short evidence and valuePrecision. Required new observations carry all time/provenance fields; legacy instruments remain read-only compatible.

- [ ] Write tests rejecting future dates, missing report evidence, source host mismatch and a fetch time substituted for trade date; allow explicit date-only source precision without fabricated time. Hand fixture: US date `2026-10-09`, publication `2026-10-10T05:15:00+08:00` retains `2026-10-09`.
- [ ] Run `npx vitest run tests/site/marketObservations.test.ts --exclude '**/.worktrees/**' --maxWorkers=2`; verify expected RED.
- [ ] Implement contract and exact-host/path source policy. Probe existing CNFIN report discovery, official market pages and documented AKShare underlying providers read-only; record actual endpoint/date/terms/limits. Enable only candidates with a successful probe and acceptable use; otherwise record explicit blocked coverage, never a placeholder as enabled. Quote and report permissions remain separate.
- [ ] Run the test to GREEN; check real source evidence and whitelist records are reproducible without secrets.
- [ ] Commit `feat: define verified market observations and source policy`.

### Task 2: 确定性开收盘报道解析

**Files:** Create `scripts/site/market-report-parser.mjs`, `tests/site/marketReportParser.test.ts`, sanitized short fixtures under `tests/fixtures/market-reports/`.

**Interfaces:** `parseMarketReport({title,text,url,publishedAt,sourceId}, {now,policy}) -> observation[]`; consumes Task1 contract. Instrument catalog explicitly maps 上证/深证/创业板, 恒生/恒生科技, S&P500/Dow/Nasdaq; no automatic fuzzy mapping to futures, ETFs or individual shares.

- [ ] Write paired Chinese/English tests: explicit close `3,888.11`, `-1.18%` preserved; US explicit Oct9 trading date not Oct10 publication. Reject title-only, percent-only, year-to-date comparison, futures, ambiguous date, forecast and premarket value as official open.
- [ ] Run parser tests to expected RED.
- [ ] Implement bounded sentence/paragraph extraction with exact instrument/session/date patterns and paired short evidence; require explicit year or unambiguous date context within article, not guessed from fetch time. Do not use model inference. Preserve value precision for conflict handling; no full article in public output.
- [ ] Run tests to GREEN, include a changed HTML layout fixture that yields no observation rather than an incorrect one.
- [ ] Commit `feat: extract evidenced opening and closing report facts`.

### Task 3: 会话合并、保留与更正

**Files:** Create `scripts/site/market-sessions.mjs`, `tests/site/marketSessions.test.ts`; Modify `scripts/site/market-pipeline.mjs`, `scripts/site/market-adapters.mjs`, existing tests.

**Interfaces:** `mergeMarketSessions({previous,observations,attemptedAt}) -> {snapshot,conflicts,newObservationCount}`; snapshot `{schemaVersion:1,attemptedAt,groups}` where each group contains tradingDate records with open/close/reference observations keyed by instrument. `selectCurrentMarketItems(sessions) -> MarketInstrument[]`. Compatible buildMarketOverview accepts validated session-derived instruments and previous data.

- [ ] Write tests for idempotence, late opening vs confirmed close, 20-date retention, partial gaps, full failures, same-source explicit newer correction, different-source conflict, date-only observations and legacy snapshots. Different-source values `100.00` vs `110.00` must conflict and preserve prior `99.00`, not pick a winner.
- [ ] Run new/existing market tests to expected RED.
- [ ] Implement per-instrument merge. Compare values at source precision: combined half-unit rounding tolerances; explicitly supplied conflicting percentages also block promotion. Newer publication only corrects same-source/same-session observation with changed evidence; cross-source disagreement remains a conflict. Derive previous-close changes only from prior valid close of identical instrument/unit. Preserve unknown calendar state neutrally.
- [ ] Run to GREEN. Add US DST, explicit early close and HK closing-auction fixtures showing session remains source-authoritative; weekend fetch does not alter trade date.
- [ ] Commit `feat: retain and reconcile market session snapshots`.

### Task 4: 分市场收盘事实与解读关联

**Files:** Create `scripts/site/market-close-summary.mjs`, `tests/site/marketCloseSummary.test.ts`; Modify `scripts/site/summary-pipeline.mjs` only if needed to reuse helpers, `src/data/siteSnapshotTypes.ts`.

**Interfaces:** `buildMarketCloseSummary({group,tradingDate,observations,news,now}) -> {tradingDate,session:'close',facts,explanations,watchItems,invalidationConditions,sources}`. Explanation includes newsId, sourceUrl, attribution and conditional flag. No model calls.

- [ ] Write tests: factual summary counts only matching-date close observations; no news leaves explanations empty but facts visible; unrelated or stale news produces no cause; valid same-region transmission links to existing newsId. Duplicate sources not counted as independent confirmation.
- [ ] Run to RED.
- [ ] Implement deterministic facts and select only previously publishable, date-compatible regional news with explicit related instrument/channel. Reuse accepted editorial explanation text with attribution, not invent new causes. Factual summaries alone cannot become mechanism explanations; omit explanation where association is weak.
- [ ] Run to GREEN, verify condition/watch/invalidation are copied with their approved meaning and preserve their source links.
- [ ] Commit `feat: build evidence-linked per-market closing summaries`.

### Task 5: 云端获取、独立调度及发布

**Files:** Create `scripts/site/market-fetch.mjs`, `scripts/update-market-data.mjs`, `tests/site/marketFetch.test.ts`, `tests/site/marketUpdate.test.ts`, `.github/workflows/update-market.yml`; Modify `scripts/update-data-snapshots.mjs`, `.github/workflows/update-data.yml`, `.github/workflows/deploy-pages.yml`, `scripts/validate-snapshots.mjs`, `package.json`.

**Interfaces:** `fetchMarketSources({sources,now,fetchImpl}) -> sourceResults[]`; `updateMarketData({now,dataDir,fetchImpl}) -> {market,sessions}` with no news generation. Main update calls the same market updater, no duplicate ECB-only path.

- [ ] Write tests for timeout, oversized body, failed one source, source expiry and all failures preserving snapshots; key test: successful aggregate job cannot refresh dataAsOf or lastSuccessfulAt when observations did not advance. Update command leaves all news JSON byte-identical.
- [ ] Run to RED.
- [ ] Implement 15-second requests, maximum 2MB source body, one retry only for transient network/5xx, 429 stops that source, no access-control workarounds. Reuse validated existing ECB fetch as reference observation. Apply Task1 enabled-source policy. Add market-only schedule UTC `47 1,7,8,13,14,20,21 * * 1-5` and `47 */3 * * *` late-publication recovery; derive local session from source, not cron. Both data workflows share existing lock and checkout main after lock acquisition; before push fetch/rebase only allowed data commits, abort non-data conflicts. Pages accepts either data workflow completion.
- [ ] Run to GREEN; parse workflow config, validate published session contract, ensure no Groq credential or model request used by market-only task.
- [ ] Commit `feat: schedule isolated market session refreshes`.

### Task 6: 既有卡片展示会话及总结

**Files:** Modify `src/components/MarketOverview.tsx`, `src/data/snapshotRepository.ts`, `src/data/siteSnapshotTypes.ts`; Create `tests/app/market-sessions.test.tsx`; extend existing market tests without CSS changes.

**Interfaces:** MarketOverview consumes optional session metadata and group summaries from existing overview snapshot; summary news link uses existing `#/news/{newsId}` route.

- [ ] Write UI tests for dated open/close, report-snapshot label, date-only formatting, retained prior close, legacy compatibility, and clickable evidence-linked closing explanation. No-data group cannot display numeric demo values.
- [ ] Run to RED.
- [ ] Render labels “开盘快照 / 收盘快照 / 报道快照 / 参考数据” and trade date within existing card/hero elements; explicit unknown freshness stays neutral. Reuse current responsive classes. Show fact summary even without explanation. Preserve group navigation and current design.
- [ ] Run to GREEN and inspect mobile width without horizontal overflow; confirm CSS file unchanged.
- [ ] Commit `feat: present dated market sessions in existing overview`.

### Task 7: 在线验收与部署

**Files:** Create `docs/operations/market-sessions-acceptance.md`; no fabricated public snapshots.

- [ ] Run full suite `npx vitest run --exclude '**/.worktrees/**' --maxWorkers=2`, `npm run build`, `npm run validate:data`, `git diff --check`; inspect each exit code separately.
- [ ] Run permitted live source retrieval in cloud and compare a real opening and close for each claimed covered stock market, plus global reference observations. Record URLs, trade dates, source precision and dataset timestamps. A disabled/unavailable source is a gap, not a passed test.
- [ ] Perform one final code review using existing user-selected inline implementation method; fix findings with regression tests. Do not spawn implementation agents without user request.
- [ ] Merge/push preserving remote bot data, verify both Actions update families and Pages success, then inspect actual published JSON and desktop/mobile cards. Do not declare deployed from a push alone.
- [ ] Notify completion only for verified coverage; explicitly separate waiting-for-trading-day, unresolved source permission and institutional research gaps. If source approval blocks coverage, report the concrete source decision required rather than pretending the feature is complete.

## 自检

所有设计要求分别对应契约/来源（1）、明确证据（2）、会话/冲突/保留（3）、总结（4）、云端执行/隔离（5）、UI（6）、真实验收（7）。新闻与研报未混入范围；来源审核没有以“可下载”替代授权；不要求模型猜数值。

## 执行方式

沿用用户已选择的本对话内直接实施，最终整体审核。先审阅本计划，再进入执行；若来源核验无法满足公开展示约束，允许完成基础管线，但必须明确在线覆盖未完成。
