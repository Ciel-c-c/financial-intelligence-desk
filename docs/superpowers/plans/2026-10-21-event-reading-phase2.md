# Phase 2 event reading implementation plan

> For agentic workers: execute inline using executing-plans, then request a fresh whole-branch review.

Goal: integrate the accepted single-event reading flow, five honest historical samples, and existing courses without changing news producers.
Architecture: versioned static JSON event registry with explicit claims/evidence/graph, generic event reader, curated exact-URL/hash news associations. Existing AppShell, NewsFeedSections and LessonPage remain authoritative.
Tech stack: existing React, TypeScript, Vite, HashRouter, Vitest. No added packages.
Spec: user-approved work/product-design-20261021 and work/event-prototype-20261021 (outside this checkout); Phase 2 user requirements.

## Constraints and decisions
- Base main dfde1b83899fe36e55a59fd01cfba10d630135a8. Open PRs #5 and #6 are independent and unmerged; do not import their changes.
- No workflow, pipeline, market, public data or course-content changes. Preserve source-first publishing.
- Home cards explicitly say historical; only El Nino has full branching interaction. Four other stories say basic explanation.
- Entry may cite verified 2026 follow-up, but 2023/24 facts never become 2026 outcomes.
- Ruling: native worktree creation failed for missing ref in original repo; use independent local clone at the exact main commit to avoid dirty working trees.
- Ruling: implement in this session under the user's explicit execution request, without requesting approval of already-authorized routine choices.

## Review focus
Evidence changes must hide dependent claims in deep links too. Unknown IDs/unsafe return URLs must fail safely. Course return must restore open concept, selected node per branch and scroll even after refresh. News keyword overlap alone must never associate events. Invalid event content must not prevent current news from rendering.

## Tasks
- [x] 1. Add model/registry/validation tests: five valid samples, real lesson references, graph closure and DAG, withdrawn evidence, link hash mismatch, URL-only topic association. Observe RED, implement static models/data/validation, then GREEN.
  Files: src/data/worldEvents/{types,registry,validation,readingState}.ts, events.json; tests/events/model.test.ts.
- [x] 2. Add reading integration tests: five cards with historical/basic labels; El Nino three branches and per-branch nodes; safe course return; quiz rationale; invalid links. Observe RED, implement reader/components and minimal TodayPage/App/LessonPage/NewsDetailPage additions, then GREEN.
  Files: src/pages/WorldEventPage.tsx, src/components/{WorldEventCards,RelatedWorldEvents,EventReadingParts}.tsx, src/styles/eventReading.css, tests/events/reading.test.tsx.
- [x] 3. Run full existing suite, typecheck, build and validate:data; address regressions. No fixture time rewriting or tests pretending history is live.
- [x] 4. Serve branch on independent port, use real 390px Chromium. Verify current feed and details, five samples, branch persistence, concept/course/scroll round trip, learning persistence, quizzes, global situation, overflow and errors. Save screenshots and report.
- [ ] 5. Fresh whole-branch review, resolve material issues, verify again as needed. Commit/push only feature branch, open and attach PR, observe remote CI. Do not merge or dispatch deploy.

Verification commands: npm test -- --run --maxWorkers=4; npm run typecheck; npm run build; npm run validate:data.

