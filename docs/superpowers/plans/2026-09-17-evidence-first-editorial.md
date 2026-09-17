# Evidence-first Editorial Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans inline, task-by-task. No delegation requested.

**Goal:** Publish complete analyses only after independently validated source evidence and mechanism review.
**Architecture:** Add a source-evidence boundary before the existing analysis and audit calls. Preserve existing public editorial interfaces, add a short evidence ledger and safe stage diagnostics.
**Tech Stack:** Node.js ESM, Vitest, existing GitHub Actions.
**Spec:** docs/superpowers/specs/2026-09-17-evidence-first-editorial-design.md

## Global Constraints

- Free Groq only, no paid fallback; no UI changes.
- Maximum two article attempts and six requests per run, minimum 60 seconds between Groq calls.
- Only verified complete bodies, identity/hash-bound evidence, no full-body public redistribution.
- No partial publication; retain verified older items with their real dates.

### Task 1: Evidence boundary and immutable facts

Files: scripts/news/editorial-evidence.mjs (create), scripts/news/cerebras-editorial.mjs (modify), tests/news/cerebrasPipeline.test.ts (modify).
Interface: validateEvidence(packet, body) returns boolean; evidence packet has facts [{text,evidence}], background [{text,evidence}], expectations [{text,evidence}], uncertainties [{text,evidence}].

- [ ] Add extraction-specific fake response; assert published editorial.evidence.facts[0].evidence equals '企业公布业务进展', and source health stages.evidence equals 1.
- [ ] Run `npx vitest run tests/news/cerebrasPipeline.test.ts --maxWorkers=2`; observe new assertions fail.
- [ ] Implement extraction request and packet validation; analysis consumes packet, facts are assigned from packet rather than generated anew. Audit compares source, packet and analysis, including chain adjacency and invalidating personal conditions.
- [ ] Run targeted suite; keep absent quotes and invented forecasts unpublished.
- [ ] Commit adapter, evidence helper and tests.

### Task 2: Budget, retry rotation and honest health

Files: scripts/news/update-news-feed.mjs, scripts/news/cerebras-editorial.mjs, tests/news/cerebrasPipeline.test.ts.
Interface: record.analysisAttempt = {sourceBodyHash,count,lastAttemptAt}; state.stages = {evidence,analysis,audit}; existing itemCount counts published results only.

- [ ] Add three complete candidate fixture records; assert attempted equals 2, and the third receives its first attempt next run. Assert all rejected results report error rather than ok.
- [ ] Run targeted suite and observe budget/health assertions fail.
- [ ] Sort candidates by hash-bound prior attempt count then freshness, carry count across matching bodies, stop retries after three attempts per unchanged body. Bound request count to six. Publish safe per-stage rejection categories and counters.
- [ ] Run targeted suite and commit.

### Task 3: Verification and release

Files: docs/operations/groq-editorial.md; update implementation checkboxes as verified.

- [ ] Document three stages, limits, evidence retention, failure rotation and remaining source/stock limitations.
- [ ] Run `npx vitest run --exclude '**/.worktrees/**' --maxWorkers=2`, `npm run build`, `npm run validate:data`; inspect git diff and confirm no frontend changes.
- [ ] Merge current remote data without force pushing; publish tested code through ordinary git or GitHub connector if transport fails.
- [ ] Inspect real Actions stage counters and at least one real generated item against its complete original report; unsupported results remain unpublished.
- [ ] Verify Pages deployment and public data; report actual results, not just workflow success.
