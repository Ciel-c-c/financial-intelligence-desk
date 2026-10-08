# Source summaries and conditional market signals

Approved on 2026-10-08: publish source summaries with accessible economic explanations and original links. Full-body reading is optional. Preserve the existing Financial Lens layout. Macro, industry and company news all matter.

The implementation reuses this repository's RSS, scheduling and editorial components, following the source registry and discovery patterns reviewed in DailyBrief and WorldMonitor. No external project was installed. CNBC's official business feed was directly verified: 30 dated articles, 27 with descriptions of at least 80 characters. Yahoo and Guardian requests failed and remain disabled.

Summary evidence requires an official/verified source, a real date and at least 80 characters of summary. Title plus summary is hashed; article.status=summary and editorial.evidenceScope=summary. The UI labels this basis accurately. Missing background and prior consensus must be identified as unavailable. Changed summaries invalidate cached interpretations. Existing full-body evidence remains supported.

New analyses have 1–4 conditional marketSignals: asset, direction (上行/下行/分化/中性), reason, condition, invalidation and timeframe. They express potential market pressure rather than guaranteed prices or trade instructions. Code checks structure, language and numeric grounding; model audit checks factual support and mechanism. Same-model audit is not independent verification.

The UI reuses reading cards. Daily briefs and global events derive from the same audited editorial. Headline-only records remain unpublished. Source rounds reduce concentration without publishing weak items to meet quotas. Keep free-only limits, paced requests and no paid fallback.

Separate market opening/closing snapshots, long-body chunking and higher daily model throughput remain outside this change.
