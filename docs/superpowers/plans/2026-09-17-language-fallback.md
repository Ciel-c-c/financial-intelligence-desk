# Reviewed English Fallback Implementation Plan

> **For agentic workers:** Use test-driven implementation task-by-task. This plan is the language-fallback slice, not completion of the entire global pipeline.

**Goal:** Retain verified complete English analysis without mislabelling it Chinese.

**Architecture:** Explicit editorial language and language-specific display bindings. Existing body hash, identity, source, causal conditions and required analysis sections remain mandatory.

**Tech Stack:** React, TypeScript, Vitest.

**Spec:** ../specs/2026-09-15-global-content-pipeline-design.md

## Constraints

No UI redesign, no paid APIs, no title-only publication. This slice does not generate analysis or add a publisher adapter.

### Task 1: Admission and rendering

- [ ] Add tests in tests/app/content-admission.test.tsx using the existing complete-body fixture, explicit English editorial, English title/summary bindings and all required sections. Assert admission, untranslated label, and rejection of missing sections or mismatched title.
- [ ] Run `npx vitest run tests/app/content-admission.test.tsx --maxWorkers=4`; observe English rejected before implementation.
- [ ] Add optional language/titleEn/summaryEn fields to src/data/newsFeedTypes.ts; default old editorials to Chinese. In src/data/newsAdmission.ts select bindings based on explicit language; require nonempty language-appropriate strings and preserve all evidence checks.
- [ ] Pass language to src/components/NewsArticle.tsx through src/components/LiveNewsDetail.tsx; show the English label without changing CSS. Do not generate a Chinese generic SoWhat for English records lacking reviewed SoWhat.
- [ ] Run focused tests, full suite excluding .worktrees, build, and data validation. Report this slice separately from missing media adapters and analysis generation.

### Separate work still required

Publisher-specific Chinese adapters require real body/metadata samples and source review. Free inference requires an available provider credential or verified local runtime. Stock sources require actual adapters and independent date-aware refresh. These are not satisfied by language admission.
