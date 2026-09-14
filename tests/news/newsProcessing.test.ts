import { describe, expect, it } from 'vitest';
import { normalizeNewsItem } from '../../scripts/news/news-normalizer.mjs';
import { classifyNewsItem } from '../../scripts/news/news-classifier.mjs';
import { clusterNewsItems } from '../../scripts/news/news-clusterer.mjs';
import { selectNewsWindows } from '../../scripts/news/news-ranking.mjs';

const raw = { sourceId:'nbs-cn', sourceName:'国家统计局', sourceTier:'official', sourceUrl:'https://www.stats.gov.cn/sj/zxfb/rss.xml', canonicalUrl:'https://www.stats.gov.cn/a?utm_source=x', originalLanguage:'zh', originalTitle:' CPI 同比上涨，住房分类价格另行公布 ', originalSummary:'居民消费价格上涨，市场关注通胀和利率。', publishedAt:'2026-09-14T10:00:00Z', fetchedAt:'2026-09-14T10:17:00Z' };

describe('news processing', () => {
  it('normalizes URLs and classifies from mechanism evidence', () => {
    const item = classifyNewsItem(normalizeNewsItem(raw));
    expect(item.canonicalUrl).toBe('https://www.stats.gov.cn/a');
    expect(item.analysisLevels).toContain('宏观');
    expect(item.eventTypes).toContain('经济数据');
    expect(item.impactChannels).toEqual(expect.arrayContaining(['通胀','利率']));
    expect(item.causalSignals).not.toContain('住房');
  });
  it('clusters duplicate events with official source first', () => {
    const official = classifyNewsItem(normalizeNewsItem(raw));
    const media = { ...official, id:'media', sourceName:'Known Media', sourceTier:'verified', verificationStatus:'verified', canonicalUrl:'https://media.test/cpi' };
    const result = clusterNewsItems([media, official]);
    expect(result).toHaveLength(1);
    expect(result[0].sourceTier).toBe('official');
    expect(result[0].verificationStatus).toBe('cross-checked');
  });
  it('separates rolling 24 hour news and capped continuing impact', () => {
    const base = classifyNewsItem(normalizeNewsItem(raw));
    const latest = { ...base, publishedAt:'2026-09-13T12:01:00Z' };
    const old = Array.from({length:7},(_,i)=>({ ...base, id:`old-${i}`, clusterId:`old-${i}`, publishedAt:'2026-09-12T12:00:00Z', continuingImpactScore:80, causalSignals:['政策仍待落地'] }));
    const selected = selectNewsWindows([latest,...old], '2026-09-14T12:00:00Z');
    expect(selected.latest.map(item=>item.id)).toContain(latest.id);
    expect(selected.continuing).toHaveLength(6);
    expect(selected.continuing.map(item=>item.id)).not.toContain(latest.id);
  });
});
