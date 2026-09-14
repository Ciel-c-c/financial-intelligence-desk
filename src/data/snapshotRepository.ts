import type { DailyBriefSnapshot, MarketGroup, MarketOverviewSnapshot, SectorPerformanceSnapshot, SiteSnapshot } from './siteSnapshotTypes';

const statuses = ['fresh', 'partial', 'delayed', 'unavailable'];
const groups: MarketGroup[] = ['aShare', 'hongKong', 'us', 'globalAssets'];
const isIso = (value: unknown) => typeof value === 'string' && Number.isFinite(new Date(value).valueOf());

export function isSiteSnapshot(value: unknown): value is SiteSnapshot {
  if (!value || typeof value !== 'object') return false;
  const item = value as SiteSnapshot;
  return item.schemaVersion === 1 && isIso(item.attemptedAt) && statuses.includes(item.status) && Array.isArray(item.datasets)
    && item.datasets.every(dataset => typeof dataset.id === 'string' && statuses.includes(dataset.status) && isIso(dataset.nextExpectedAt));
}

export function isMarketOverviewSnapshot(value: unknown): value is MarketOverviewSnapshot {
  if (!value || typeof value !== 'object') return false;
  const item = value as MarketOverviewSnapshot;
  return item.schemaVersion === 1 && statuses.includes(item.status) && groups.every(group => Array.isArray(item.groups?.[group]));
}

export function isSectorPerformanceSnapshot(value: unknown): value is SectorPerformanceSnapshot {
  if (!value || typeof value !== 'object') return false;
  const item = value as SectorPerformanceSnapshot;
  return item.schemaVersion === 1 && statuses.includes(item.status) && groups.every(group => Array.isArray(item.groups?.[group]));
}

export function isDailyBriefSnapshot(value: unknown): value is DailyBriefSnapshot {
  if (!value || typeof value !== 'object') return false;
  const item = value as DailyBriefSnapshot;
  return item.schemaVersion === 1 && statuses.includes(item.status) && ['morning', 'close'].includes(item.edition) && Array.isArray(item.facts);
}

export async function loadDataset<T>(path: string, version: string, validate: (value: unknown) => value is T, fetcher: typeof fetch = fetch): Promise<T> {
  const response = await fetcher(`${import.meta.env.BASE_URL}data/${path}?v=${encodeURIComponent(version)}`, { cache: 'no-store' });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${path}`);
  const value: unknown = await response.json();
  if (!validate(value)) throw new Error(`Invalid snapshot: ${path}`);
  return value;
}

export async function loadSiteSnapshot(fetcher: typeof fetch = fetch): Promise<SiteSnapshot> {
  const response = await fetcher(`${import.meta.env.BASE_URL}data/site-snapshot.json?t=${Date.now()}`, { cache: 'no-store' });
  if (!response.ok) throw new Error(`HTTP ${response.status}: site-snapshot.json`);
  const value: unknown = await response.json();
  if (!isSiteSnapshot(value)) throw new Error('Invalid snapshot: site-snapshot.json');
  return value;
}
