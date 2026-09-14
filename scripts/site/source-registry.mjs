const REVIEW_WINDOW_MS = 90 * 24 * 60 * 60 * 1_000;

export const marketSources = [
  {
    id: 'ecb-reference-rates',
    name: 'European Central Bank Reference Rates',
    owner: 'European Central Bank',
    baseUrl: 'https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml',
    allowedHosts: ['www.ecb.europa.eu'],
    kind: 'official',
    markets: ['globalAssets'],
    reviewedAt: '2026-09-14T00:00:00Z',
    reviewExpiresAt: '2026-12-13T00:00:00Z',
    termsUrl: 'https://www.ecb.europa.eu/services/disclaimer/html/index.en.html',
    enabled: true,
    cadence: 'business-day',
    latency: 'reference-date',
  },
  {
    id: 'fred-market-series',
    name: 'Federal Reserve Economic Data',
    owner: 'Federal Reserve Bank of St. Louis',
    baseUrl: 'https://fred.stlouisfed.org/graph/fredgraph.csv',
    allowedHosts: ['fred.stlouisfed.org'],
    kind: 'official',
    markets: ['us', 'globalAssets'],
    reviewedAt: '2026-09-14T00:00:00Z',
    reviewExpiresAt: '2026-12-13T00:00:00Z',
    termsUrl: 'https://fred.stlouisfed.org/legal/',
    enabled: true,
    cadence: 'business-day',
    latency: 'end-of-day',
  },
  {
    id: 'sse-public-index',
    name: '上海证券交易所指数行情',
    owner: '上海证券交易所',
    baseUrl: 'https://www.sse.com.cn/market/sseindex/quotation/',
    allowedHosts: ['www.sse.com.cn'],
    kind: 'official',
    markets: ['aShare'],
    reviewedAt: '2026-09-14T00:00:00Z',
    reviewExpiresAt: '2026-12-13T00:00:00Z',
    termsUrl: 'https://www.sse.com.cn/aboutus/mediacenter/hotandd/c/c_20210519_5399081.shtml',
    enabled: false,
    disabledReason: '公开页面已核验；自动抓取稳定性与指数数据再展示许可仍需确认',
  },
  {
    id: 'hkex-index-data',
    name: 'HKEX Index Market Data',
    owner: 'Hong Kong Exchanges and Clearing Limited',
    baseUrl: 'https://www.hkex.com.hk/Services/Market-Data-Services/Index-Services',
    allowedHosts: ['www.hkex.com.hk'],
    kind: 'official',
    markets: ['hongKong'],
    reviewedAt: '2026-09-14T00:00:00Z',
    reviewExpiresAt: '2026-12-13T00:00:00Z',
    termsUrl: 'https://www.hkex.com.hk/Global/Exchange/Terms-of-Use',
    enabled: false,
    disabledReason: 'HKEX 明确提示指数再分发可能需要指数编制商许可',
  },
  {
    id: 'known-delayed-market-provider',
    name: 'Known delayed market provider',
    owner: 'Pending contracted provider',
    baseUrl: 'https://example.invalid',
    allowedHosts: ['example.invalid'],
    kind: 'known-institution',
    markets: ['aShare', 'hongKong', 'us'],
    reviewedAt: '2026-09-14T00:00:00Z',
    reviewExpiresAt: '2026-12-13T00:00:00Z',
    termsUrl: 'https://example.invalid/terms',
    enabled: false,
    disabledReason: '等待选择具有明确公开展示许可的供应商和密钥',
  },
];

export function assertSourceReviewCurrent(source, now = new Date()) {
  if (!source?.enabled) throw new Error(`source disabled: ${source?.id ?? 'unknown'}`);
  if (!Array.isArray(source.allowedHosts) || !source.allowedHosts.includes(new URL(source.baseUrl).hostname)) {
    throw new Error(`source domain mismatch: ${source.id}`);
  }
  const reviewedAt = new Date(source.reviewedAt).valueOf();
  const reviewExpiresAt = new Date(source.reviewExpiresAt).valueOf();
  if (!Number.isFinite(reviewedAt) || !Number.isFinite(reviewExpiresAt) || reviewExpiresAt - reviewedAt > REVIEW_WINDOW_MS) {
    throw new Error(`invalid source review window: ${source.id}`);
  }
  if (reviewExpiresAt < now.valueOf()) throw new Error(`source review expired: ${source.id}`);
  return source;
}

export function getEnabledMarketSources(now = new Date()) {
  return marketSources.filter(source => source.enabled).map(source => assertSourceReviewCurrent(source, now));
}
