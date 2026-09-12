import { describe, expect, it } from 'vitest';
import { news } from '../../src/data/demoData';
import { soWhatForNews } from '../../src/data/soWhat';
import type { NewsItem } from '../../src/data/types';

const allowedDimensions = ['投资', '汇率', '住房', '工作', '消费', '企业经营'];

describe('So What personal relevance', () => {
  it('uses transmission evidence instead of adding housing for CPI alone', () => {
    const cpi = news.find((item) => item.id === 'china-cpi')!;
    const labels = soWhatForNews(cpi).personalImpact.map((impact) => impact.label);

    expect(labels).toContain('消费');
    expect(labels).not.toContain('住房');
  });

  it('selects several strongly related dimensions for a company earnings event', () => {
    const earnings = news.find((item) => item.id === 'nvidia-results')!;
    const labels = soWhatForNews(earnings).personalImpact.map((impact) => impact.label);

    expect(labels).toHaveLength(3);
    expect(labels).toEqual(expect.arrayContaining(['投资', '工作', '企业经营']));
  });

  it('allows one result when only one dimension crosses the relevance threshold', () => {
    const currencyEvent: NewsItem = {
      id: 'currency-only', title: '两种货币的交换价格发生变化', region: '全球', topic: '外汇',
      sourceName: '测试来源', sourceUrl: 'https://example.com', publishedAt: '2026-09-12',
      summary: '货币交换价格变化。', excerpt: '外汇市场报价出现变化。', termIds: [],
      facts: ['汇率发生变化。'], consensus: [], inference: [], risks: ['若价差迅速恢复，影响可能消失。'],
      causalChain: [{ title: '货币供求变化', explanation: '兑换价格调整。', condition: '资金流持续。' }], mode: '演示',
    };

    expect(soWhatForNews(currencyEvent).personalImpact.map((impact) => impact.label)).toEqual(['汇率']);
  });

  it('returns only supported, complete, threshold-qualified dimensions', () => {
    for (const item of news) {
      const impacts = soWhatForNews(item).personalImpact;
      expect(impacts.length).toBeGreaterThanOrEqual(1);
      expect(impacts.length).toBeLessThanOrEqual(5);
      for (const impact of impacts) {
        expect(allowedDimensions).toContain(impact.label);
        expect(impact.impact.trim()).not.toBe('');
        expect(impact.why.trim()).not.toBe('');
        expect(impact.condition.trim()).not.toBe('');
      }
    }
  });
});
