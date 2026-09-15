import { describe, expect, it, vi } from 'vitest';
import { isMarketOverviewSnapshot, loadDataset, loadSiteSnapshot } from '../../src/data/snapshotRepository';

describe('snapshot repository', () => {
  it('loads datasets with a version parameter and no-store', async () => {
    const payload = { schemaVersion: 1, attemptedAt: '2026-09-14T02:00:00Z', lastSuccessfulAt: null, dataAsOf: null, nextExpectedAt: '2026-09-14T03:00:00Z', status: 'unavailable', freshness: 'historical', sourceHealth: [], groups: { aShare: [], hongKong: [], us: [], globalAssets: [] }, groupHealth: { aShare: { status: 'unavailable', sourceIds: [] }, hongKong: { status: 'unavailable', sourceIds: [] }, us: { status: 'unavailable', sourceIds: [] }, globalAssets: { status: 'unavailable', sourceIds: [] } } };
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => payload });
    await loadDataset('market-overview.json', 'v123', isMarketOverviewSnapshot, fetcher as unknown as typeof fetch);
    expect(fetcher).toHaveBeenCalledWith(expect.stringContaining('market-overview.json?v=v123'), { cache: 'no-store' });
  });

  it('rejects invalid snapshots instead of returning demo data', async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ demo: true }) });
    await expect(loadSiteSnapshot(fetcher as unknown as typeof fetch)).rejects.toThrow(/Invalid snapshot/);
  });
});
