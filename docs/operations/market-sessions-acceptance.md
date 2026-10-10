# Market sessions acceptance — 2026-10-10

## Implemented and locally verified

- Observation identity, source scope, trading date, session and timestamp precision validation.
- Chinese/English deterministic report parsing; withheld ambiguous dates, title-only/percent-only reports, forecasts, premarket values, futures and ETFs.
- Twenty observed trading dates per market, opening/closing separation, duplicate handling, cross-source conflicts and newer same-source corrections.
- Missing instruments retained, full failures retained, identical fetches do not advance successful observation time.
- Factual close summaries survive absent explanations; related editorial mechanisms are linked and labeled conditional references, not proven daily causes.
- Separate market cloud workflow without model credentials/calls; shared data writer lock and data-only non-force publication.
- Existing market UI/CSS preserved; precise dates, reported snapshots, reference observations and expandable close interpretation.
- Full suite after final review fixes: 324 tests / 75 files passing. Typecheck, build and snapshot validation passing. CSS asset unchanged: index-Dyg592-4.css.
- Independent reviewer identified five Important foundation bugs. Each was reproduced RED→GREEN: local date binding, monotonic same-source updates, revision collapse before cross-source conflict, final-news summary reconciliation, and truthful fetched-vs-retained source health. No deferred minor findings.

## Actual source probe

The new ECB adapter successfully retrieved EURUSD 1.1206, EURJPY 177.34, EURGBP 0.84763, EURCNY 7.4992 with reference date 2026-10-09. These are reference rates, not stock close prices; publication clock time is unknown and deliberately omitted.

## Outstanding release gates

- Final independent code review and Important/Critical regression fixes: passed the five-finding fix gate; no second reviewer round substituted for regression evidence.
- Actual cloud deployment and published JSON inspection.
- Browser desktop/mobile visual inspection: browser tool failed kernel initialization twice; component tests and unchanged CSS do not replace visual inspection.
- **A-share, Hong Kong and US stock source coverage has not passed acceptance.** No new stock provider is enabled. Numerical interface availability alone does not establish public redistribution permission. FRED SP500 is explicitly restricted; CNFIN own works restrict unauthorized excerpts; AKShare is not an underlying data license.
- Real opening and closing observations for each claimed covered stock market are still required. Pipeline tests are not live-source coverage. Existing index cards must not be populated with fabricated or relabeled old values.
- Institutional research is outside this release and remains unimplemented.

## Free alternative requiring a design decision

TradingView advertises official branded widgets free for embedding: https://www.tradingview.com/widget/ . Widgets must retain attribution and use the provider's supported instruments/data levels. They are not a general API to copy observations into our data store or model analysis. Accepting widgets would alter the inner market-card rendering and requires a separate user decision under the preserve-UI constraint; not implemented or claimed as current coverage.

## Completion status

Not complete. Do not send a whole-feature completion notification until the outstanding gates have evidence. News-phase three scheduled-cycle acceptance is independent of this document.
