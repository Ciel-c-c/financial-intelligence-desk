import { describe, expect, it } from 'vitest';
import { normalizeInstrument } from '../../scripts/site/market-adapters.mjs';

const source = {
  id: 'official-test', name: 'Official Test', baseUrl: 'https://data.example.gov',
};

describe('market adapters', () => {
  it('does not invent a zero price or previous close from empty source fields', () => {
    const raw={id:'x',group:'us',name:'X',symbol:'X',timestamp:'2026-09-14T01:00:00Z'};
    expect(() => normalizeInstrument({...raw,value:null},source,'2026-09-14T02:00:00Z')).toThrow(/value/);
    expect(() => normalizeInstrument({...raw,value:''},source,'2026-09-14T02:00:00Z')).toThrow(/value/);
    const result=normalizeInstrument({...raw,value:10,previousClose:null,change:null,changePercent:''},source,'2026-09-14T02:00:00Z');
    expect(result.change).toBeUndefined();
    expect(result.changePercent).toBeUndefined();
  });
  it('rejects a source observation from the future', () => {
    expect(() => normalizeInstrument({id:'x',group:'us',name:'X',symbol:'X',value:10,timestamp:'2026-09-15T01:00:00Z'},source,'2026-09-14T02:00:00Z')).toThrow(/future/);
  });
  it('uses the source timestamp instead of the fetch timestamp', () => {
    const item = normalizeInstrument({
      id: 'sp500', group: 'us', name: '标普500', symbol: 'SPX', value: 6000,
      previousClose: 5940, timestamp: '2026-09-14T01:00:00Z', currency: 'USD', unit: '点',
    }, source, '2026-09-14T02:00:00Z');
    expect(item.dataAsOf).toBe('2026-09-14T01:00:00.000Z');
    expect(item.change).toBe(60);
    expect(item.changePercent).toBeCloseTo(1.0101, 4);
    expect(item.source).toMatchObject({ id: 'official-test', url: 'https://data.example.gov' });
  });

  it('rejects missing timestamps and inconsistent change direction', () => {
    expect(() => normalizeInstrument({ id: 'x', group: 'us', name: 'X', symbol: 'X', value: 10 }, source, '2026-09-14T02:00:00Z')).toThrow(/timestamp/);
    expect(() => normalizeInstrument({ id: 'x', group: 'us', name: 'X', symbol: 'X', value: 10, previousClose: 9, change: -1, changePercent: -10, timestamp: '2026-09-14T01:00:00Z', currency: 'USD', unit: '点' }, source, '2026-09-14T02:00:00Z')).toThrow(/direction/);
  });

  it('marks stale observations as delayed', () => {
    const item = normalizeInstrument({ id: 'x', group: 'globalAssets', name: 'X', symbol: 'X', value: 10, timestamp: '2026-09-10T01:00:00Z', currency: 'USD', unit: '点' }, source, '2026-09-14T02:00:00Z');
    expect(item.freshness).toBe('delayed');
  });
});
