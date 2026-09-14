import { describe, expect, it } from 'vitest';
import { buildMarketOverview, resolveMarketState, validateMarketOverview } from '../../scripts/site/market-pipeline.mjs';

const now = '2026-09-14T02:00:00Z';
const instrument = (id: string, group: string, dataAsOf = '2026-09-14T01:55:00Z') => ({
  id, group, name: id, symbol: id, value: 100, change: 1, changePercent: 1,
  currency: 'USD', unit: '点', marketState: 'delayed', dataAsOf,
  fetchedAt: now, freshness: 'fresh', source: { id: 'test', name: 'Test', url: 'https://example.test' },
});

describe('market overview pipeline', () => {
  it('keeps healthy groups when one market fails and falls back independently', () => {
    const previous = buildMarketOverview({
      attemptedAt: '2026-09-13T02:00:00Z',
      sourceResults: [{ sourceId: 'old-hk', market: 'hongKong', status: 'ok', instruments: [instrument('hsi', 'hongKong', '2026-09-13T01:00:00Z')] }],
    });
    const snapshot = buildMarketOverview({
      attemptedAt: now,
      sourceResults: [
        { sourceId: 'cn', market: 'aShare', status: 'ok', instruments: [instrument('sse', 'aShare')] },
        { sourceId: 'hk', market: 'hongKong', status: 'error', error: 'timeout', instruments: [] },
        { sourceId: 'us', market: 'us', status: 'ok', instruments: [instrument('nasdaq', 'us')] },
        { sourceId: 'global', market: 'globalAssets', status: 'ok', instruments: [instrument('us10y', 'globalAssets')] },
      ],
      previous,
    });
    expect(snapshot.status).toBe('partial');
    expect(snapshot.groups.aShare).toHaveLength(1);
    expect(snapshot.groups.hongKong[0].id).toBe('hsi');
    expect(snapshot.groupHealth.hongKong.status).toBe('delayed');
    expect(snapshot.groupHealth.hongKong.fallbackReason).toContain('timeout');
    expect(validateMarketOverview(snapshot)).toBe(true);
  });

  it('marks never populated groups unavailable without demo values', () => {
    const snapshot = buildMarketOverview({ attemptedAt: now, sourceResults: [] });
    expect(snapshot.status).toBe('unavailable');
    expect(snapshot.groups.aShare).toEqual([]);
    expect(snapshot.groupHealth.aShare.status).toBe('unavailable');
  });

  it('marks a market observation on Saturday as previous close', () => {
    expect(resolveMarketState('hongKong', '2026-09-12T04:00:00Z', '2026-09-11T08:00:00Z')).toBe('previous_close');
  });
});
