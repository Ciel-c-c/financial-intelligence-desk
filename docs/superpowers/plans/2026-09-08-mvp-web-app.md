# 金融资讯台 MVP Web App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a runnable, mobile-first financial information website with market overview, explainable news detail, daily Brief, beginner knowledge cards, and add-to-home-screen support.

**Architecture:** A Vite React single-page application reads versioned demo data through typed selectors. Route-level pages compose focused components, while a small service worker and manifest provide installability and offline app-shell caching.

**Tech Stack:** React 19, TypeScript 5, Vite 7, React Router, Vitest, Testing Library, CSS, Web App Manifest, Service Worker.

**Spec:** `docs/product-design.md`

## Global Constraints

- Mobile-first layout for 360–430px screens; desktop content width is constrained.
- Every news, market, Brief, and AI analysis item visibly states that it is demo content and shows its data timestamp.
- News analysis must label facts, market consensus, AI inference, and risks in text.
- No accounts, trading, portfolio, social features, database, or large backend.
- Original sources remain links; the app does not reproduce full copyrighted articles.
- PWA uses a manifest, icons, and app-shell caching; stale market data must never appear current.

---

### Task 1: Typed demo-data foundation

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`
- Create: `src/data/types.ts`, `src/data/demoData.ts`, `src/data/selectors.ts`
- Test: `tests/data/selectors.test.ts`

**Interfaces:**
- Produces: `getNewsById(id: string): NewsItem | undefined`, `filterNews(items, query, region): NewsItem[]`, `getTodayBrief(): Brief`.

- [ ] Write selector tests for region filtering, case-insensitive search, missing IDs, and Brief/news references.
- [ ] Run `npm test -- --run tests/data/selectors.test.ts` and confirm failure because modules are missing.
- [ ] Add the minimal project configuration, types, demo records, and selectors.
- [ ] Run the selector test and confirm it passes.

### Task 2: Mobile app shell and Today page

**Files:**
- Create: `src/main.tsx`, `src/app/App.tsx`, `src/app/AppShell.tsx`
- Create: `src/components/MarketCard.tsx`, `src/components/NewsCard.tsx`, `src/pages/TodayPage.tsx`
- Create: `src/styles/global.css`
- Test: `tests/app/today-page.test.tsx`

**Interfaces:**
- Consumes: demo markets and `filterNews`.
- Produces: accessible `/` page with search, region chips, market cards, news links, and bottom navigation.

- [ ] Write a page test that checks demo/timestamp labels, three markets, search filtering, and a news-detail link.
- [ ] Run the test and confirm failure because the UI modules are missing.
- [ ] Implement the app shell and Today page with semantic controls and mobile-first CSS.
- [ ] Run the page test and confirm it passes.

### Task 3: Explainable news detail

**Files:**
- Create: `src/components/AnalysisBlock.tsx`, `src/components/CausalChain.tsx`, `src/components/TermExplanation.tsx`
- Create: `src/pages/NewsDetailPage.tsx`, `src/pages/NotFoundPage.tsx`
- Test: `tests/app/news-detail.test.tsx`

**Interfaces:**
- Consumes: `getNewsById` and related knowledge entries.
- Produces: `/news/:id` with source link, summary, term definitions, fact/consensus/inference/risk sections, and conditional causal nodes.

- [ ] Write tests for all four analysis labels, source URL, term expansion, causal-chain conditions, and a missing-news state.
- [ ] Run the test and confirm failure because the detail components are missing.
- [ ] Implement the detail components and route.
- [ ] Run the detail test and confirm it passes.

### Task 4: Brief and beginner learning pages

**Files:**
- Create: `src/pages/BriefPage.tsx`, `src/pages/LearnPage.tsx`
- Create: `src/components/KnowledgeCard.tsx`
- Test: `tests/app/brief-learn.test.tsx`

**Interfaces:**
- Consumes: demo Brief, news records, and knowledge cards.
- Produces: `/brief` with linked events and `/learn` with searchable, expandable cards and local learned state.

- [ ] Write tests for Brief date/content links, knowledge search, expansion, and learned-state toggling.
- [ ] Run the test and confirm failure because the pages are missing.
- [ ] Implement the two pages and resilient localStorage helpers.
- [ ] Run the test and confirm it passes.

### Task 5: PWA and final verification

**Files:**
- Create: `public/manifest.webmanifest`, `public/sw.js`, `public/icon.svg`, `public/offline.html`
- Modify: `index.html`, `src/main.tsx`, `README.md`
- Test: `tests/pwa-assets.test.ts`

**Interfaces:**
- Produces: install metadata, standalone display configuration, app-shell cache, offline fallback, and service-worker registration.

- [ ] Write tests that validate required manifest fields, referenced icons, offline fallback, cache versioning, and service-worker registration.
- [ ] Run the test and confirm failure because PWA assets are missing.
- [ ] Implement manifest, SVG icon, service worker, offline page, registration, and concise setup instructions.
- [ ] Run `npm test -- --run`, `npm run typecheck`, and `npm run build`.
- [ ] Inspect the production output for manifest, service worker, icon, and offline page.
- [ ] Check `git diff --check`, `git status --short`, and scan tracked files for secrets before committing.
