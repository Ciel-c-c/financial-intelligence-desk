# Free market display integration

User approved attributed free official components inside the existing market cards. This is a bounded frontend change, not a market-data API or a new analytical source. Preserve original stylesheet/layout, no account creation, payments or credential access.

## Decisions and evidence

- Use TradingView's publicly documented iframe symbol-overview widget. Official script `https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js` returned HTTP200 in this environment. The documented www-domain ES-module route returned403; no spoofing or access-control bypass attempted.
- Official integration documentation: https://www.tradingview.com/widget-docs/widget-formats/ and https://www.tradingview.com/widget-docs/widgets/charts/symbol-overview/ . Keep provider branding and original source links.
- Symbol identity checked on provider pages: SSE:000001, SZSE:399001, SZSE:399006, HSI:HSI, HSI:HSTECH, SP:SPX, DJ:DJI, NASDAQ:IXIC. Identity verification does not prove widget licensing/runtime availability for every symbol.
- A/HK sources are listed as EOD in https://www.tradingview.com/widget-docs/markets/asia-pacific/ . US index display can be restricted. No TVC, FOREXCOM, SPCFD or futures substituted: https://www.tradingview.com/support/solutions/43000709178-what-does-tvc-stand-for-in-the-instrument-ticker/ documents why lookalike instruments differ.
- Use components only when the active stock group has no validated local observations. Existing dated local observations and global ECB reference cards remain unchanged.
- Explicitly label external display as not the site's opening/closing snapshot. Never use load time as quote time; if provider does not expose an identifiable date, do not treat the value as verified closing data.
- Do not scrape frames, read prices, compute changes, store quotes or feed component values into analysis. Source health and backend market coverage remain independent.
- Loading failure is announced accessibly; an original-source link remains. Unsupported-symbol messages belong to the provider and must remain visible. Browser cannot read cross-origin frame contents to establish price availability.

## Verification status

- Component/overview tests cover attribution, actual index symbols, daily configuration, no synthetic alternatives, source fallback, accessible frame title, and global-reference isolation.
- Old homepage empty-state assertions were intentionally updated to require explicit external-display/non-snapshot semantics rather than a blank market area.
- Isolated headless Edge QA loaded A/HK provider content and preserved branding, glass cards and source links. US SP:SPX, DJ:DJI and NASDAQ:IXIC displayed the provider's restriction message (available only on TradingView); US quote coverage is **not accepted**. No synthetic replacement used. Network loading can vary and source links remain usable.
- The widget shows its own selected chart-range performance (currently one month), not an independently verified daily closing change. Backend open/close acceptance remains separate. No quote values were exported from the component or stored as analytical evidence.
- A regression test reproduced the inserted-but-never-loaded iframe bug before fixing it. The 15-second watchdog now waits for iframe transport load, not insertion; a later successful load can recover, while transport success is never labelled verified quotes.
- Final full regression: 333 tests across 77 files passed; build, snapshot validation and diff whitespace check passed. Browser QA exposed clipping inside the original mobile two-column cards. A scoped responsive rule now makes only third-party embed cards span the mobile row; original glass styling, typography and other cards are unchanged. The 390px screenshot confirms the loaded card fits without horizontal page overflow. Off-screen frames use lazy loading; screenshotting the whole grid does not prove every off-screen quote has rendered.
- This integration does not complete backend opening/closing coverage, institutional research or whole-site goals.
