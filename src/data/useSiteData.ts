import { useCallback, useEffect, useRef, useState } from 'react';
import { isDailyBriefSnapshot, isMarketOverviewSnapshot, isSectorPerformanceSnapshot, loadDataset, loadSiteSnapshot } from './snapshotRepository';
import type { DailyBriefSnapshot, MarketOverviewSnapshot, SectorPerformanceSnapshot, SiteSnapshot } from './siteSnapshotTypes';

export function shouldRefresh(lastCheckedAt: number, now: number, intervalMs: number) {
  return now - lastCheckedAt > intervalMs;
}

export function useSiteData({ fetcher = fetch, refreshIntervalMs = 3_600_000 }: { fetcher?: typeof fetch; refreshIntervalMs?: number } = {}) {
  const [site, setSite] = useState<SiteSnapshot>();
  const [market, setMarket] = useState<MarketOverviewSnapshot>();
  const [sectors, setSectors] = useState<SectorPerformanceSnapshot>();
  const [brief, setBrief] = useState<DailyBriefSnapshot>();
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const lastCheckedAt = useRef(0);

  const refresh = useCallback(async () => {
    setLoading(true);
    const nextErrors: Record<string, string> = {};
    try {
      const index = await loadSiteSnapshot(fetcher);
      setSite(index);
      lastCheckedAt.current = Date.now();
      const load = async <T,>(id: string, path: string, validate: (value: unknown) => value is T, setter: (value: T) => void) => {
        const summary = index.datasets.find(dataset => dataset.id === id);
        if (!summary || summary.status === 'unavailable') return;
        try { setter(await loadDataset(path, summary.lastSuccessfulAt ?? index.attemptedAt, validate, fetcher)); }
        catch (error) { nextErrors[id] = error instanceof Error ? error.message : String(error); }
      };
      await Promise.all([
        load('market-overview', 'market-overview.json', isMarketOverviewSnapshot, setMarket),
        load('sector-performance', 'sector-performance.json', isSectorPerformanceSnapshot, setSectors),
        load('daily-brief', 'daily-brief.json', isDailyBriefSnapshot, setBrief),
      ]);
    } catch (error) {
      nextErrors.site = error instanceof Error ? error.message : String(error);
    } finally {
      setErrors(nextErrors);
      setLoading(false);
    }
  }, [fetcher]);

  useEffect(() => { void refresh(); }, [refresh]);
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible' && shouldRefresh(lastCheckedAt.current, Date.now(), refreshIntervalMs)) void refresh();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [refresh, refreshIntervalMs]);

  return { site, market, sectors, brief, loading, errors, refresh };
}
