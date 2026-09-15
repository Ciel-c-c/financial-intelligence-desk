import { describe, expect, it } from 'vitest';
import { buildDailyBrief, validateDailyBrief } from '../../scripts/site/brief-pipeline.mjs';

const snapshot = (version: string, dataAsOf: string) => ({ version, dataAsOf, status: 'fresh' });

describe('daily brief pipeline', () => {
  it('keeps clickable story identity and actual publication date', () => {
    const stories = [{ id:'news-1', title:'8月经济数据于今日发布', publishedAt:'2026-09-15T02:00:00Z', sourceName:'国家统计局', sourceUrl:'https://www.stats.gov.cn/news' }];
    const result = buildDailyBrief({ edition:'morning', generatedAt:'2026-09-15T03:00:00Z', facts:['8月经济数据于今日发布'], stories });
    expect(result.stories).toEqual(stories);
  });
  it('records input versions and keeps fact, interpretation and inference separate', () => {
    const result = buildDailyBrief({
      edition: 'morning', generatedAt: '2026-09-14T22:30:00Z',
      snapshots: { market: snapshot('m1', '2026-09-14T20:00:00Z'), sectors: snapshot('s1', '2026-09-14T08:00:00Z'), news: snapshot('n1', '2026-09-14T22:00:00Z'), situation: snapshot('g1', '2026-09-14T21:00:00Z') },
      facts: ['美股上一交易日收盘'], focus: { text: '市场关注政策路径', evidenceIds: ['n1'] }, watchItems: ['下一次政策发布'], invalidationConditions: ['若政策口径不变，重估幅度可能有限'],
    });
    expect(result.snapshotVersions).toEqual({ market: 'm1', sectors: 's1', news: 'n1', situation: 'g1' });
    expect(result.dataAsOf).toBe('2026-09-14T22:00:00.000Z');
    expect(validateDailyBrief(result)).toBe(true);
  });

  it('rejects unsupported editions and unsourced focus text', () => {
    expect(() => buildDailyBrief({ edition: 'midday', generatedAt: '2026-09-14T02:00:00Z', snapshots: {}, facts: [] })).toThrow(/edition/);
    expect(() => buildDailyBrief({ edition: 'close', generatedAt: '2026-09-14T10:00:00Z', snapshots: {}, facts: [], focus: { text: '猜测', evidenceIds: [] } })).toThrow(/evidence/);
  });
});
