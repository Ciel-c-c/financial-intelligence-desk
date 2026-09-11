import { describe, expect, it, vi } from 'vitest';
import { deriveFreshness, eventsForKnowledge, loadGlobalSituation } from '../src/data/globalSituation';
import { globalSituationSeed } from '../src/data/globalSituationSeed';

describe('global situation frontend data', () => {
  it('derives latest, delayed and source-error labels without changing timestamps', () => {
    const now = new Date('2026-09-11T05:00:00Z');
    expect(deriveFreshness({ ...globalSituationSeed, status: 'fresh', lastSuccessfulAt: '2026-09-11T04:15:00Z' }, now).label).toBe('最新');
    expect(deriveFreshness({ ...globalSituationSeed, status: 'fresh', lastSuccessfulAt: '2026-09-11T00:00:00Z' }, now).label).toBe('延迟');
    expect(deriveFreshness({ ...globalSituationSeed, status: 'source_error' }, now).label).toBe('数据源异常');
  });

  it('falls back to the checked-in snapshot when loading fails', async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error('offline'));
    const result = await loadGlobalSituation(fetcher);
    expect(result.events).toEqual(globalSituationSeed.events);
    expect(result.status).toBe('source_error');
  });

  it('maps live events back to academy knowledge points', () => {
    const inflationEvents = eventsForKnowledge(globalSituationSeed.events, 'cpi');
    expect(inflationEvents.length).toBeGreaterThan(0);
    expect(inflationEvents.every((event) => event.knowledgeIds.includes('cpi'))).toBe(true);
  });

  it('overlays a failed update status while keeping last successful events', async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce({ ok:true, json:async()=>({ status:'source_error', attemptedAt:'2026-09-11T06:00:00Z', lastSuccessfulAt:globalSituationSeed.lastSuccessfulAt }) })
      .mockResolvedValueOnce({ ok:true, json:async()=>globalSituationSeed });
    const result = await loadGlobalSituation(fetcher as unknown as typeof fetch);
    expect(result.status).toBe('source_error');
    expect(result.events.length).toBeGreaterThan(0);
    expect(String(fetcher.mock.calls[1][0])).toContain('?v=');
  });
});
