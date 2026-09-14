import { describe, expect, it } from 'vitest';
import { validateNewsRecord, validateNewsSnapshot } from '../../scripts/news/news-contract.mjs';

const item = {
  id: 'fed-rate-2026-09-14', canonicalUrl: 'https://www.federalreserve.gov/newsevents/pressreleases/a.htm',
  sourceName: 'Federal Reserve', sourceTier: 'official', verificationStatus: 'official',
  sourceUrl: 'https://www.federalreserve.gov/feeds/press_all.xml', publishedAt: '2026-09-14T10:00:00Z', fetchedAt: '2026-09-14T10:17:00Z',
  originalLanguage: 'en', originalTitle: 'Federal Reserve issues FOMC statement', originalSummary: 'The Committee held rates.',
  titleZh: '美联储发布议息声明', summaryZh: '委员会维持利率不变。', translationStatus: 'generated',
  analysisLevels: ['宏观'], eventTypes: ['货币政策'], impactChannels: ['利率'], regions: ['美国', '全球'],
  keyTerms: ['联邦基金利率'], causalSignals: ['政策利率→融资成本'], importanceScore: 86, continuingImpactScore: 20,
  clusterId: 'fed-rate-2026-09-14', relatedSources: [], detailStatus: 'professional', facts: ['委员会维持利率不变。'], expectations: [], inferences: [],
};
const snapshot = { schemaVersion: 1, attemptedAt: '2026-09-14T10:17:00Z', lastSuccessfulAt: '2026-09-14T10:17:00Z', nextExpectedAt: '2026-09-14T11:17:00Z', status: 'fresh', latest: [item], continuing: [], retainedDetails: [], sourceHealth: [] };

describe('news snapshot contract', () => {
  it('accepts a complete verified record and snapshot', () => {
    expect(validateNewsRecord(item)).toBe(true);
    expect(validateNewsSnapshot(snapshot)).toBe(true);
  });
  it('rejects unsafe, unverified, duplicated, and oversized data', () => {
    expect(validateNewsRecord({ ...item, canonicalUrl: 'javascript:alert(1)' })).toBe(false);
    expect(validateNewsRecord({ ...item, verificationStatus: 'unverified' })).toBe(false);
    expect(validateNewsSnapshot({ ...snapshot, continuing: [item] })).toBe(false);
    expect(validateNewsSnapshot({ ...snapshot, latest: [], continuing: Array.from({ length: 7 }, (_, index) => ({ ...item, id: `old-${index}` })) })).toBe(false);
  });
});
