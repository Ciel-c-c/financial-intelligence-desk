# Live Financial News Feed Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the static demo-news homepage flow with an hourly, source-verified 24-hour financial news feed, a separate 24–72-hour continuing-impact feed, and dynamic news detail pages.

**Architecture:** GitHub Actions will fetch a strict source registry, normalize and validate records, cluster duplicate events, enrich eligible English items, classify and rank them, then atomically publish `public/data/news-feed.json`. React will load the snapshot through a typed data module, render the three news sections and filters, and resolve both live and retained detail records without disturbing the existing market and learning features.

**Tech Stack:** Node.js 22 ESM scripts, native `fetch`, React, TypeScript, React Router, Vitest, Testing Library, Vite, GitHub Actions, GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-09-14-live-financial-news-feed-design.md`

## Global Constraints

- The homepage main feed contains only records published in the rolling previous 24 hours.
- The continuing-impact area contains at most 6 records published 24–72 hours ago and must not duplicate the main feed.
- The normal target is 30–60 reliable 24-hour records; never add weak or unverified records to reach a quota.
- Public records must come from validated official, mainstream, or established-institution sources and retain an original URL and publication time.
- Classification uses event subjects, terms, event type, region, and causal evidence—not keyword presence alone.
- Chinese generated text is labeled `中文整理`; the original title, source, and link remain visible.
- A failed enrichment call falls back to cached Chinese text and then to the original language; it must not fabricate a translation.
- Do not copy protected article bodies or bypass paywalls.
- Reuse the existing Financial Lens typography, glass cards, colors, and responsive system.
- Do not refactor pages unrelated to the news feed.

---

### Task 1: Define and validate the news snapshot contract

**Files:**
- Create: `scripts/news/news-contract.mjs`
- Create: `src/data/newsFeedTypes.ts`
- Create: `public/data/news-feed.json`
- Modify: `scripts/snapshot-schema.mjs`
- Modify: `scripts/validate-snapshots.mjs`
- Test: `tests/news/newsContract.test.ts`

**Interfaces:**
- Produces: `validateNewsRecord(value): boolean`, `validateNewsSnapshot(value): boolean`, `NEWS_SCHEMA_VERSION`, and matching TypeScript types `LiveNewsItem`, `NewsFeedSnapshot`, `NewsFeedStatus`.
- Consumes: existing `isIso`-style validation and `writeJsonAtomic()` conventions from `scripts/snapshot-schema.mjs`.

- [ ] **Step 1: Write the failing contract tests**

Create a complete official-source fixture and assert required fields, enum validation, URL validation, multi-axis arrays, time fields, status fields, and the 24-hour/continuing arrays. Include negative cases for `javascript:` URLs, invalid dates, `unverified`, missing original title, duplicate IDs across arrays, and more than six continuing items.

```ts
expect(validateNewsSnapshot(validSnapshot)).toBe(true);
expect(validateNewsSnapshot({ ...validSnapshot, latest: [{ ...item, canonicalUrl: 'javascript:alert(1)' }] })).toBe(false);
expect(validateNewsSnapshot({ ...validSnapshot, latest: [{ ...item, verificationStatus: 'unverified' }] })).toBe(false);
expect(validateNewsSnapshot({ ...validSnapshot, continuing: Array(7).fill(item) })).toBe(false);
```

- [ ] **Step 2: Run the contract test and verify failure**

Run: `npm test -- --run tests/news/newsContract.test.ts`

Expected: FAIL because `scripts/news/news-contract.mjs` does not exist.

- [ ] **Step 3: Implement the runtime and TypeScript contracts**

Define these exact enums and shapes in both runtimes:

```ts
export type NewsSourceTier = 'official' | 'verified';
export type VerificationStatus = 'official' | 'verified' | 'cross-checked';
export type AnalysisLevel = '宏观' | '行业' | '公司';
export type EventType = '货币政策' | '财政政策' | '监管' | '贸易' | '经济数据' | '公司经营' | '地缘风险';
export type ImpactChannel = '利率' | '通胀' | '汇率' | '供需' | '盈利' | '估值' | '就业';
export type NewsRegion = '中国' | '美国' | '欧洲' | '全球' | 'A股相关' | '港股相关' | '美股相关';
export type TranslationStatus = 'original-zh' | 'generated' | 'cached' | 'unavailable';
export type DetailStatus = 'brief' | 'professional' | 'so-what';
```

`LiveNewsItem` must include every field listed in spec section 5. `NewsFeedSnapshot` must contain `schemaVersion`, `attemptedAt`, `lastSuccessfulAt`, `nextExpectedAt`, `status`, `latest`, `continuing`, `retainedDetails`, `sourceHealth`, and optional `message`. Reject duplicate IDs across all three record arrays.

- [ ] **Step 4: Add a valid empty bootstrap snapshot and register validation**

Create `public/data/news-feed.json` with empty arrays, `status: "source_error"`, and explicit bootstrap timestamps. Export `validateNewsSnapshot` from `snapshot-schema.mjs`, add it to `validate-snapshots.mjs`, and keep existing snapshot checks unchanged.

- [ ] **Step 5: Run tests and snapshot validation**

Run: `npm test -- --run tests/news/newsContract.test.ts tests/snapshotPipeline.test.ts`

Run: `npm run validate:data`

Expected: both commands PASS.

- [ ] **Step 6: Commit**

```bash
git add scripts/news/news-contract.mjs src/data/newsFeedTypes.ts public/data/news-feed.json scripts/snapshot-schema.mjs scripts/validate-snapshots.mjs tests/news/newsContract.test.ts
git commit -m "feat: define live news snapshot contract"
```

### Task 2: Add a verified source registry and feed adapters

**Files:**
- Create: `scripts/news/source-registry.mjs`
- Create: `scripts/news/feed-parser.mjs`
- Create: `scripts/news/fetch-news-sources.mjs`
- Create: `docs/news-source-registry.md`
- Test: `tests/news/sourceRegistry.test.ts`
- Test: `tests/news/feedParser.test.ts`

**Interfaces:**
- Produces: `newsSources`, `validateRegisteredSource(source)`, `parseNewsFeed(xml, source, fetchedAt)`, and `fetchNewsSource(source, fetchedAt, fetchImpl = fetch)`.
- Consumes: normalized raw item shape `{ sourceId, sourceName, sourceTier, sourceUrl, canonicalUrl, originalLanguage, originalTitle, originalSummary?, publishedAt, fetchedAt }`.

- [ ] **Step 1: Verify every candidate source before registering it**

For each candidate, open the official domain, confirm publisher identity, feed/API URL, publication timestamps, stable item URLs, and public metadata availability. Record the verification date and evidence URL in `docs/news-source-registry.md`. Start with the already functioning Federal Reserve, ECB, Bank of Japan, and UN feeds; then add only currently verified official or established sources needed to reach geographic and topic breadth. Do not add a source whose feed must be inferred from a third-party directory.

- [ ] **Step 2: Write failing source-registry tests**

Assert unique IDs, HTTPS URLs, an allowed tier, a verification date, a publisher-domain allowlist, and at least one enabled source for China, the United States, Europe, and global institutions.

```ts
expect(new Set(newsSources.map(source => source.id)).size).toBe(newsSources.length);
expect(newsSources.every(validateRegisteredSource)).toBe(true);
expect(newsSources.some(source => source.regions.includes('中国'))).toBe(true);
```

- [ ] **Step 3: Run the registry test and verify failure**

Run: `npm test -- --run tests/news/sourceRegistry.test.ts`

Expected: FAIL because the registry module does not exist.

- [ ] **Step 4: Implement the registry with explicit source metadata**

Each entry must have `id`, `name`, `tier`, `publisherDomains`, `feedUrl`, `homepageUrl`, `regions`, `defaultLanguage`, `enabled`, `verifiedAt`, and `parser: 'rss' | 'atom'`. `validateRegisteredSource` must reject non-HTTPS endpoints and must set sources whose verification is older than 90 days to disabled until their evidence is refreshed.

- [ ] **Step 5: Write parser and fetcher tests with local XML fixtures**

Cover RSS and Atom, CDATA, encoded entities, missing summaries, GUID-only records, invalid item URLs, cross-domain redirects, invalid dates, HTTP errors, timeouts, and an empty feed. Inject `fetchImpl`; never use live network calls in the test suite.

- [ ] **Step 6: Implement parsing and fetching**

`parseNewsFeed` must return only records with an original title, valid `publishedAt`, and a canonical URL whose final hostname is in `publisherDomains`. `fetchNewsSource` must return `{ id, name, ok, items, error? }`, use a 15-second timeout, identify the Financial Lens repository in its user agent, and cap items per source without changing timestamps.

- [ ] **Step 7: Run focused tests**

Run: `npm test -- --run tests/news/sourceRegistry.test.ts tests/news/feedParser.test.ts`

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add scripts/news/source-registry.mjs scripts/news/feed-parser.mjs scripts/news/fetch-news-sources.mjs docs/news-source-registry.md tests/news/sourceRegistry.test.ts tests/news/feedParser.test.ts
git commit -m "feat: add verified financial news sources"
```

### Task 3: Normalize, classify, cluster, and select news

**Files:**
- Create: `scripts/news/news-normalizer.mjs`
- Create: `scripts/news/news-classifier.mjs`
- Create: `scripts/news/news-clusterer.mjs`
- Create: `scripts/news/news-ranking.mjs`
- Test: `tests/news/newsProcessing.test.ts`

**Interfaces:**
- Produces: `normalizeNewsItem(raw)`, `classifyNewsItem(item)`, `clusterNewsItems(items)`, `scoreNewsItem(item, now)`, and `selectNewsWindows(items, now)`.
- Consumes: raw records from Task 2 and produces contract-valid records from Task 1.

- [ ] **Step 1: Write failing normalization and classification tests**

Cover whitespace normalization, canonical URL cleanup, deterministic IDs, Chinese and English language detection, all four tag axes, and causal evidence. Include a CPI fixture where “housing” is mentioned without an interest-rate/mortgage transmission path and assert that no housing impact signal is produced.

```ts
const classified = classifyNewsItem(cpiFixture);
expect(classified.analysisLevels).toContain('宏观');
expect(classified.eventTypes).toContain('经济数据');
expect(classified.impactChannels).toEqual(expect.arrayContaining(['通胀', '利率']));
expect(classified.causalSignals).not.toContain('住房');
```

- [ ] **Step 2: Write failing clustering, ranking, and time-window tests**

Use a fixed `now`. Assert that matching subject, key number, event type, and close timestamps merge; an official item becomes primary; a materially revised policy decision remains separate; exactly-24-hour and exactly-72-hour boundaries behave deterministically; latest and continuing IDs never overlap; and continuing results are capped at six.

- [ ] **Step 3: Run processing tests and verify failure**

Run: `npm test -- --run tests/news/newsProcessing.test.ts`

Expected: FAIL because the processing modules do not exist.

- [ ] **Step 4: Implement normalization and rule-based classification**

Use declarative rule tables that require combinations of subjects, event types, and causal phrases. Return `classificationReasons` internally so tests can explain why each label was selected. Never add a tag solely to increase tag count.

- [ ] **Step 5: Implement deterministic event clustering**

Generate `clusterId` from normalized subject, event type, date bucket, and material numbers. Merge `relatedSources`, set `cross-checked` only for independent reliable publishers, and preserve the official record as primary when present.

- [ ] **Step 6: Implement scoring and windows**

Score source credibility, breadth, event importance, freshness, cross-checking, and explicit expectation-gap signals. `selectNewsWindows` returns `{ latest, continuing }`; latest is sorted by score then publication time, while continuing requires a specific ongoing-policy, new-development, or expectation-adjustment signal.

- [ ] **Step 7: Run focused tests**

Run: `npm test -- --run tests/news/newsProcessing.test.ts`

Expected: PASS.

- [ ] **Step 8: Commit**

```bash
git add scripts/news/news-normalizer.mjs scripts/news/news-classifier.mjs scripts/news/news-clusterer.mjs scripts/news/news-ranking.mjs tests/news/newsProcessing.test.ts
git commit -m "feat: classify and rank financial news"
```

### Task 4: Add cached Chinese enrichment with safe fallback

**Files:**
- Create: `scripts/news/news-enrichment.mjs`
- Create: `scripts/news/enrichment-cache.mjs`
- Test: `tests/news/newsEnrichment.test.ts`
- Modify: `.gitignore`

**Interfaces:**
- Produces: `enrichNewsItems(items, options)`, `createTranslationRequest(item)`, `validateTranslation(item, response)`, `readEnrichmentCache(path)`, and `writeEnrichmentCache(path, cache)`.
- Consumes: environment-backed options `{ endpoint, apiKey, model, fetchImpl, cachePath }`; returns contract-valid items with `titleZh`, `summaryZh`, and `translationStatus`.

- [ ] **Step 1: Write failing enrichment tests**

Test original Chinese pass-through, successful structured JSON translation, content-fingerprint cache hits, preservation of every source number/date/entity, malformed model output, HTTP failure, cached fallback, and final English fallback.

```ts
expect(enriched.titleZh).toBe('美联储维持利率不变');
expect(enriched.translationStatus).toBe('generated');
expect(enriched.originalTitle).toBe(englishItem.originalTitle);
expect(fallback.translationStatus).toBe('unavailable');
expect(fallback.titleZh).toBeUndefined();
```

- [ ] **Step 2: Run enrichment tests and verify failure**

Run: `npm test -- --run tests/news/newsEnrichment.test.ts`

Expected: FAIL because the enrichment modules do not exist.

- [ ] **Step 3: Implement provider-configured enrichment**

Read `NEWS_TRANSLATION_API_URL`, `NEWS_TRANSLATION_API_KEY`, and `NEWS_TRANSLATION_MODEL` only in the Node workflow. Require a structured response with `titleZh` and `summaryZh`. The prompt must prohibit investment advice and require separate `fact`, `expectation`, and `inference` wording when those concepts occur.

- [ ] **Step 4: Implement numeric/entity guards and cache fallback**

Reject generated output when protected tokens from the original title/summary disappear or change. Store cache outside `public/` during a run, keyed by a SHA-256 content fingerprint. Add the local cache path to `.gitignore`; only enriched snapshot fields are publishable.

- [ ] **Step 5: Run focused tests**

Run: `npm test -- --run tests/news/newsEnrichment.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add scripts/news/news-enrichment.mjs scripts/news/enrichment-cache.mjs tests/news/newsEnrichment.test.ts .gitignore
git commit -m "feat: add safe Chinese news enrichment"
```

### Task 5: Build and publish the hourly news snapshot

**Files:**
- Create: `scripts/news/update-news-feed.mjs`
- Modify: `scripts/update-data-snapshots.mjs`
- Modify: `scripts/snapshot-schema.mjs`
- Modify: `package.json`
- Modify: `.github/workflows/update-data.yml`
- Test: `tests/news/newsPipeline.test.ts`

**Interfaces:**
- Produces: `buildNewsSnapshot({ now, sourceResults, previous, enrichmentOptions })` and `updateNewsFeed(options)`.
- Consumes: all Task 1–4 interfaces and existing atomic snapshot writer.

- [ ] **Step 1: Write failing end-to-end pipeline tests**

Use injected source results and a temporary output directory. Assert valid promotion, previous snapshot retention when every source fails, partial-source status, no half-written `.tmp` file, retained details for expired links, a two-hour delay condition, and `nextExpectedAt` exactly one hour after `attemptedAt`.

- [ ] **Step 2: Run the pipeline test and verify failure**

Run: `npm test -- --run tests/news/newsPipeline.test.ts`

Expected: FAIL because `update-news-feed.mjs` does not exist.

- [ ] **Step 3: Implement snapshot orchestration**

Fetch enabled sources concurrently, normalize, cluster, enrich, classify, rank, and select. Keep detail records for seven days in `retainedDetails`, deduplicated by ID, so recent shared URLs remain resolvable without a database. Validate the complete candidate before calling `writeJsonAtomic`.

- [ ] **Step 4: Connect the workflow and status metadata**

Add `update:news` to `package.json`. Call the news updater from `update:data` orchestration or as an explicit workflow step before `validate:data`. Pass translation secrets only as environment values:

```yaml
env:
  NEWS_TRANSLATION_API_URL: ${{ secrets.NEWS_TRANSLATION_API_URL }}
  NEWS_TRANSLATION_API_KEY: ${{ secrets.NEWS_TRANSLATION_API_KEY }}
  NEWS_TRANSLATION_MODEL: ${{ secrets.NEWS_TRANSLATION_MODEL }}
```

Extend `update-status.json` with a `news-feed` dataset entry without changing the meaning of existing datasets.

- [ ] **Step 5: Run pipeline and validation tests**

Run: `npm test -- --run tests/news/newsPipeline.test.ts tests/snapshotPipeline.test.ts`

Run: `npm run update:news -- --fixtures`

Run: `npm run validate:data`

Expected: tests PASS; fixture mode produces a valid snapshot without network or secrets.

- [ ] **Step 6: Commit**

```bash
git add scripts/news/update-news-feed.mjs scripts/update-data-snapshots.mjs scripts/snapshot-schema.mjs package.json .github/workflows/update-data.yml tests/news/newsPipeline.test.ts public/data/news-feed.json public/data/update-status.json
git commit -m "feat: publish hourly financial news feed"
```

### Task 6: Add the typed frontend news repository

**Files:**
- Create: `src/data/newsFeed.ts`
- Create: `src/data/useNewsFeed.ts`
- Create: `src/data/newsFeedSeed.ts`
- Modify: `src/data/selectors.ts`
- Test: `tests/data/newsFeed.test.ts`

**Interfaces:**
- Produces: `loadNewsFeed(fetchImpl = fetch)`, `useNewsFeed()`, `findLiveNewsById(snapshot, id)`, and `filterLiveNews(items, filters)`.
- Consumes: `NewsFeedSnapshot` and `LiveNewsItem` from Task 1.

- [ ] **Step 1: Write failing repository tests**

Test relative URL loading under the Vite base path, runtime rejection of malformed data, seed fallback, lookup across `latest`, `continuing`, and `retainedDetails`, query matching across Chinese/original title/source/tags, and combined region/level/type filters.

- [ ] **Step 2: Run the repository tests and verify failure**

Run: `npm test -- --run tests/data/newsFeed.test.ts`

Expected: FAIL because the frontend repository does not exist.

- [ ] **Step 3: Implement loader, hook, seed, and selectors**

The hook state must expose `{ snapshot, loading, error, reload }`. Keep `filterNews` and static selectors required by Brief/Learn tests; add live selectors instead of globally replacing unrelated demo data in this task.

- [ ] **Step 4: Run focused tests**

Run: `npm test -- --run tests/data/newsFeed.test.ts tests/data/selectors.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/data/newsFeed.ts src/data/useNewsFeed.ts src/data/newsFeedSeed.ts src/data/selectors.ts tests/data/newsFeed.test.ts
git commit -m "feat: load and query live news snapshots"
```

### Task 7: Replace the homepage news area with live sections and filters

**Files:**
- Create: `src/components/NewsFeedStatus.tsx`
- Create: `src/components/NewsFilters.tsx`
- Create: `src/components/LiveNewsCard.tsx`
- Create: `src/components/NewsFeedSections.tsx`
- Modify: `src/pages/TodayPage.tsx`
- Modify: `src/styles/global.css`
- Test: `tests/app/today-page.test.tsx`

**Interfaces:**
- Produces presentational components consuming `LiveNewsItem[]`, `NewsFeedSnapshot`, and controlled `NewsFilters` values.
- Consumes: `useNewsFeed()` and `filterLiveNews()` from Task 6.

- [ ] **Step 1: Rewrite homepage news tests to describe the live experience**

Mock `news-feed.json` loading and assert: update state, latest count, 5–8 item “正在发生” cap, complete “全部新闻”, separate “持续影响”, no duplicate ID across sections, source and time display, Chinese整理 badge, multi-axis tags, combined filters, clear filters, loading/error states, and absence of the old “演示” news grouping.

- [ ] **Step 2: Run the homepage tests and verify failure**

Run: `npm test -- --run tests/app/today-page.test.tsx`

Expected: FAIL because the page still renders `demoData.news`.

- [ ] **Step 3: Implement the four focused components**

`LiveNewsCard` shows title, summary, source, original publication time, and the top 3–5 tags. `NewsFilters` controls query, region, analysis level, and event type. `NewsFeedStatus` displays last success, next expected update, count, and normal/partial/delayed wording. `NewsFeedSections` owns section headings and prevents the same record from rendering twice.

- [ ] **Step 4: Integrate into TodayPage without changing market panels**

Remove only the static-news imports and old news grouping. Preserve market overview, sectors, transmission, and policy/geopolitical panels. Use the live hook for the new news area.

- [ ] **Step 5: Add responsive styles**

Desktop filters may remain inline; below the existing mobile breakpoint, render a compact filter disclosure/drawer, allow tag-row horizontal scrolling, keep readable summaries, and maintain minimum touch target sizing. Use existing CSS variables and glass-card classes.

- [ ] **Step 6: Run homepage and theme tests**

Run: `npm test -- --run tests/app/today-page.test.tsx tests/app/theme-css.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/NewsFeedStatus.tsx src/components/NewsFilters.tsx src/components/LiveNewsCard.tsx src/components/NewsFeedSections.tsx src/pages/TodayPage.tsx src/styles/global.css tests/app/today-page.test.tsx
git commit -m "feat: show live 24 hour news on homepage"
```

### Task 8: Resolve live news detail pages and preserve evidence boundaries

**Files:**
- Create: `src/components/NewsSourcePanel.tsx`
- Create: `src/components/LiveNewsDetail.tsx`
- Modify: `src/pages/NewsDetailPage.tsx`
- Modify: `src/data/soWhat.ts`
- Modify: `src/styles/global.css`
- Test: `tests/app/news-detail.test.tsx`

**Interfaces:**
- Produces: `LiveNewsDetail({ item }: { item: LiveNewsItem })` and `soWhatForLiveNews(item): SoWhatData | undefined`.
- Consumes: `useNewsFeed()`, `findLiveNewsById()`, existing `AnalysisBlock`, `TermExplanation`, and `SoWhatSection`.

- [ ] **Step 1: Add failing live-detail tests**

Assert dynamic lookup from latest and retained records, original source link, English original title, `中文整理`, verification status, related sources, multi-axis tags, fact/expectation/inference separation, loading/error/not-found states, and no redirect to demo content. Include one `brief` record that omits 「所以呢？」 and one `so-what` record that renders it.

- [ ] **Step 2: Run detail tests and verify failure**

Run: `npm test -- --run tests/app/news-detail.test.tsx`

Expected: FAIL because detail lookup is still synchronous and demo-only.

- [ ] **Step 3: Implement live detail presentation and source panel**

Show the primary source, publication time, verification label, related-source links, and original title. Render generated Chinese text only when present. Use explicit headings for facts, market expectations, and inference; do not populate missing sections with invented prose.

- [ ] **Step 4: Adapt the route with a compatibility fallback**

Resolve live records first after the snapshot loads. Retain demo lookup only for deliberately retained learning/example routes such as the existing NVIDIA fixture, label them as examples, and never use them to fill the live homepage or a missing live ID.

- [ ] **Step 5: Add live 「所以呢？」 mapping guards**

`soWhatForLiveNews` returns `undefined` unless required causal, analogy, focus, expectation-gap, counter-view, and personal-impact fields are supported. When present, personal impacts must use the existing relevance scoring and may return one strong dimension or normally 2–5 strong dimensions; every dimension retains impact, reason, and invalidating condition.

- [ ] **Step 6: Run detail and So What tests**

Run: `npm test -- --run tests/app/news-detail.test.tsx tests/data/soWhat.test.ts`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/components/NewsSourcePanel.tsx src/components/LiveNewsDetail.tsx src/pages/NewsDetailPage.tsx src/data/soWhat.ts src/styles/global.css tests/app/news-detail.test.tsx
git commit -m "feat: add verified live news detail pages"
```

### Task 9: Add operational and regression coverage

**Files:**
- Modify: `README.md`
- Modify: `.github/workflows/deploy-pages.yml`
- Create: `tests/app/news-mobile-css.test.ts`
- Modify: `tests/snapshotPipeline.test.ts`

**Interfaces:**
- Consumes: all prior tasks; produces documented operating and deployment checks.

- [ ] **Step 1: Add failing operational tests**

Assert `validate:data` includes `news-feed.json`, update status includes the news dataset, mobile CSS contains the filter disclosure and horizontally scrollable tags, and Pages deployment runs validation before tests/build.

- [ ] **Step 2: Run regression tests and verify the new assertions fail**

Run: `npm test -- --run tests/snapshotPipeline.test.ts tests/app/news-mobile-css.test.ts`

Expected: FAIL until all operational hooks and responsive selectors exist.

- [ ] **Step 3: Document setup and failure recovery**

In `README.md`, document source-registry review, hourly schedule, fixture mode, the three translation environment variables, behavior without them, snapshot fields, partial-source behavior, the two-hour delayed state, and how to run local validation. Do not include secret values.

- [ ] **Step 4: Confirm deployment ordering**

Keep the deployment sequence `validate:data → tests → typecheck → build → deploy`. Ensure workflow changes that affect news processing trigger the data workflow and that bot snapshot commits trigger Pages deployment exactly once.

- [ ] **Step 5: Run the full verification suite**

Run: `npm test -- --run`

Run: `npm run typecheck`

Run: `npm run build`

Run: `npm run validate:data`

Expected: all commands exit 0.

- [ ] **Step 6: Commit**

```bash
git add README.md .github/workflows/deploy-pages.yml tests/app/news-mobile-css.test.ts tests/snapshotPipeline.test.ts
git commit -m "test: verify live news operations"
```

### Task 10: Verify real sources, deploy, and audit the published site

**Files:**
- Modify if source verification finds drift: `scripts/news/source-registry.mjs`
- Modify if documentation evidence changes: `docs/news-source-registry.md`
- Modify generated snapshots: `public/data/news-feed.json`, `public/data/update-status.json`

**Interfaces:**
- Consumes: production workflow and deployed Pages URL.
- Produces: a verified public news snapshot and an evidence-backed deployment report.

- [ ] **Step 1: Run one real-source update locally or through workflow dispatch**

Run locally only when network access and translation secrets are available:

```bash
npm run update:news
npm run validate:data
```

Otherwise dispatch the GitHub data workflow after repository secrets are configured. Do not commit credentials or command output containing them.

- [ ] **Step 2: Audit the generated snapshot before publishing**

Check every enabled source health entry, count the rolling 24-hour records, confirm continuing count is at most six, ensure no duplicate IDs, open a sample from each source tier, compare original timestamps and numbers, and confirm generated Chinese records retain their English originals.

- [ ] **Step 3: Correct verified source drift and rerun checks**

If a source endpoint, publisher domain, or parser has changed, update only the affected registry/adapter and its fixture test, then rerun:

```bash
npm test -- --run tests/news
npm run validate:data
```

- [ ] **Step 4: Commit source evidence or generated snapshot changes**

```bash
git add scripts/news/source-registry.mjs docs/news-source-registry.md public/data/news-feed.json public/data/update-status.json tests/news
git commit -m "data: verify live financial news sources"
```

Skip this commit when there are no tracked changes.

- [ ] **Step 5: Push main and verify both workflows**

```bash
git push origin main
```

Confirm the data workflow succeeds, the Pages workflow checks out the resulting snapshot commit, and the deployed asset hash changes.

- [ ] **Step 6: Audit the published desktop and mobile experience**

At `https://ciel-c-c.github.io/financial-intelligence-desk/`, verify the displayed successful-update time and 24-hour count match `news-feed.json`; filter by region, level, and event type; open a latest item and a continuing item; check original links; confirm no demo story fills a missing ID; and inspect a mobile viewport for readable cards, usable filters, scrollable tags, and progressive 「所以呢？」 sections.

- [ ] **Step 7: Record final evidence**

Report the tested commit, workflow run result, deployed snapshot timestamp, latest/continuing counts, sampled source links, and the four verification command exit statuses. Do not claim completion until these checks pass.
