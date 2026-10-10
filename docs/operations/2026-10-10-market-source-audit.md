# Market source audit — 2026-10-10

## Scope and current state

User requirements: no added fees; preserve Financial Lens UI; A-share, Hong Kong, US and global assets; opening and closing observations rather than live ticks; market-specific closing summaries; retain dated latest observations during holidays and failures.

Read-only audit confirms `fetchMarket` in `scripts/update-data-snapshots.mjs` only executes ECB FX retrieval. FRED is enabled in the registry but has no fetch implementation. SSE and HKEX sources remain disabled. The delayed-provider entry is a placeholder, not an executable source. Existing normalizer, grouped snapshot, cards and summary helpers can be reused.

## Verified candidates and exclusions

| Candidate | Evidence | Decision |
| --- | --- | --- |
| FRED SP500 | https://fred.stlouisfed.org/series/SP500 provides dated daily closing observations, but series notes prohibit reproduction without prior written permission from S&P. | Do not enable public numerical republication under the current no-fee/no-new-permission constraints. FRED access is not blanket permission for all series. |
| AKShare | https://github.com/akfamily/akshare and https://github.com/akfamily/akshare/blob/main/docs/data/index/index.md document A-share and Hong Kong index adapters to underlying providers. | Reuse documented collection patterns only after reviewing underlying provider terms and real endpoint behavior. Library licensing does not establish market-data redistribution rights. |
| Stooq | https://stooq.com/t/ did not yield readable terms in this verification. | Permission unresolved, not approved. An unreadable page is not permission or proof of a prohibition. |
| Existing ECB FX | Current code retrieves dated reference rates. | Preserve this source; distinguish reference date from intraday quote time. FX reference data does not satisfy stock-market coverage. |
| Mainstream opening/closing reports | A dated report was readable at https://finance.eastmoney.com/a/202610103891632088.html. | A candidate for attributed short factual reporting, not approval to redistribute its complete article or a bulk quote feed. Source/original publisher review and extraction checks remain necessary. |

## Recommended next design

Use separate provenance for (a) approved quote observations and (b) brief opening/closing facts extracted from trusted reports. Never label report facts as a live exchange feed. Prefer a genuine approved quote observation; otherwise use an attributed report snapshot only when its trade date, session, instrument identity and quoted values are explicit. Do not infer missing opening values from a close or intraday level.

Each observation must retain trading date in the market's local zone, session (open/close/reference), source observation precision, fetch time, source URL and provenance. Previous close comparisons must concern the same instrument and unit. New fetch timestamps must not make old observations current.

Opening/closing processing must be independent per market and idempotent per instrument/trade-date/session. Handle US daylight saving and early closes, HK closing auction, holidays, partial source failures and source corrections. An absence of data is not sufficient evidence of a holiday; use neutral dated-retention language unless the calendar confirms closure.

A factual close summary can be generated without a model from verified observations. Explanations require linked, date-compatible news evidence and must distinguish source-attributed explanations from conditional mechanisms. No evidence means no fabricated cause. News generation must not lose its existing free-model budget to market jobs.

Acceptance requires actual cloud retrieval for every claimed covered group, date/session validation, stale-data retention tests, source-conflict tests, source URLs on cards, successful deployment, and inspection of published JSON. A passing fixture test alone is not live-source acceptance.

Institutional research is a separate subsequent subsystem. It must use public material, label institutional forecasts as opinions, preserve publication dates and original links, and avoid paywalls and full-document redistribution.

## Status

Implementation probe 2026-10-10: CNFIN copyright page https://www.cnfin.com/bqsm/index.html explicitly restricts unauthorized reproduction/excerpts of its own works; no new market report adapter enabled on that basis. AKShare README explicitly limits its supplied data to academic research; no blanket public quote permission inferred. ECB disclaimer was read at https://www.ecb.europa.eu/services/using-our-site/disclaimer/html/index.en.html and permits accurate source-attributed use of directly obtained information, excluding named-author papers. ECB reference adapter is the only currently approved executable market source; this does not establish A/HK/US coverage.

This document records investigation, not an implementation or deployment claim. No production source, code, public snapshot or UI was changed by this audit.
