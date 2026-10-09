import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { shouldRefresh, useSiteData } from '../../src/data/useSiteData';

describe('useSiteData', () => {
  afterEach(()=>{vi.useRealTimers();vi.restoreAllMocks();});
  it('updates an already visible page when the refresh interval expires', async () => {
    vi.useFakeTimers();
    vi.spyOn(document,'visibilityState','get').mockReturnValue('visible');
    let revision=0;
    const fetcher=async()=>({ok:true,json:async()=>({schemaVersion:1,attemptedAt:revision++?'2026-10-09T09:00:00Z':'2026-10-09T08:00:00Z',lastSuccessfulAt:null,status:'unavailable',datasets:[]})});
    const {result,unmount}=renderHook(()=>useSiteData({fetcher:fetcher as typeof fetch,refreshIntervalMs:1000}));
    await act(async()=>{});
    expect(result.current.site?.attemptedAt).toBe('2026-10-09T08:00:00Z');
    await act(async()=>{await vi.advanceTimersByTimeAsync(1000);});
    expect(result.current.site?.attemptedAt).toBe('2026-10-09T09:00:00Z');
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
  it('refreshes on focus only after the interval has elapsed', () => {
    expect(shouldRefresh(1_000, 3_000, 3_600_000)).toBe(false);
    expect(shouldRefresh(1_000, 3_700_001, 3_600_000)).toBe(true);
  });

  it('loads the site index and exposes a manual refresh', async () => {
    const site = { schemaVersion: 1, attemptedAt: '2026-09-14T02:00:00Z', lastSuccessfulAt: null, status: 'unavailable', datasets: [
      { id: 'market-overview', status: 'unavailable', freshness: 'historical', lastSuccessfulAt: null, dataAsOf: null, nextExpectedAt: '2026-09-14T03:00:00Z' },
    ] };
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => site });
    const { result } = renderHook(() => useSiteData({ fetcher: fetcher as unknown as typeof fetch }));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.site?.status).toBe('unavailable');
    await act(async () => result.current.refresh());
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});
