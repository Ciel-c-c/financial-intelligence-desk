import { describe, expect, it } from 'vitest';
import { buildMarketOverview, resolveMarketState, validateMarketOverview } from '../../scripts/site/market-pipeline.mjs';

const now = '2026-09-14T02:00:00Z';
const instrument = (id: string, group: string, dataAsOf = '2026-09-14T01:55:00Z') => ({
  id, group, name: id, symbol: id, value: 100, change: 1, changePercent: 1,
  currency: 'USD', unit: '点', marketState: 'delayed', dataAsOf,
  fetchedAt: now, freshness: 'fresh', source: { id: 'test', name: 'Test', url: 'https://example.test' },
});

describe('market overview pipeline', () => {
  it('preserves a missing instrument when another instrument in the same group refreshes',()=>{
    const previous={lastSuccessfulAt:now,groups:{aShare:[instrument('sse','aShare'),instrument('szse','aShare')]}};
    const result=buildMarketOverview({attemptedAt:now,previous,sourceResults:[{market:'aShare',sourceId:'new',status:'ok',instruments:[{...instrument('sse','aShare'),value:101}]}]});
    expect(result.groups.aShare.map(x=>x.id)).toEqual(['sse','szse']);expect(result.groupHealth.aShare.status).toBe('partial');
  });
  it('does not refresh successful time when a fetched quote repeats the same observation',()=>{
    const old=instrument('sse','aShare'),previous={lastSuccessfulAt:'2026-09-14T01:56:00Z',groups:{aShare:[old]}};
    const result=buildMarketOverview({attemptedAt:now,previous,sourceResults:[{market:'aShare',sourceId:'test',status:'ok',instruments:[{...old,fetchedAt:now}]}]});
    expect(result.lastSuccessfulAt).toBe('2026-09-14T01:56:00Z');
  });
  it('does not relabel intraday observations as a closing snapshot', () => {
    expect(resolveMarketState('aShare', '2026-10-09T02:00:00Z', '2026-10-09T01:55:00Z')).toBe('delayed');
    expect(resolveMarketState('hongKong', '2026-10-09T07:30:00Z', '2026-10-09T07:25:00Z')).toBe('delayed');
    expect(resolveMarketState('us', '2026-10-09T18:00:00Z', '2026-10-09T17:55:00Z')).toBe('delayed');
    expect(resolveMarketState('aShare', '2026-10-09T08:00:00Z', '2026-10-09T07:00:00Z')).toBe('close');
    expect(resolveMarketState('aShare', '2026-10-09T08:00:00Z', '2026-10-09T02:00:00Z')).toBe('delayed');
    expect(resolveMarketState('globalAssets','2026-10-09T10:00:00Z','2026-10-09T09:55:00Z')).toBe('delayed');
  });

  it('keeps the last successful fetch time when only retaining older quotes', () => {
    const previous = {lastSuccessfulAt:'2026-10-08T08:00:00Z', groups:{aShare:[instrument('sse','aShare','2026-10-08T07:00:00Z')]}};
    const result = buildMarketOverview({attemptedAt:'2026-10-09T08:00:00Z',sourceResults:[],previous});
    expect(result.lastSuccessfulAt).toBe('2026-10-08T08:00:00Z');
    expect(result.groups.aShare[0].dataAsOf).toBe('2026-10-08T07:00:00Z');
  });
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
