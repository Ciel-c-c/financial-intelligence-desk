export type DatasetStatus = 'fresh' | 'partial' | 'delayed' | 'unavailable';
export type DataFreshness = 'realtime' | 'delayed' | 'close' | 'historical';
export type MarketGroup = 'aShare' | 'hongKong' | 'us' | 'globalAssets';

export interface DatasetSummary { id: string; status: DatasetStatus; freshness: DataFreshness; lastSuccessfulAt: string | null; dataAsOf: string | null; nextExpectedAt: string; fallbackReason?: string }
export interface SiteSnapshot { schemaVersion: 1; attemptedAt: string; lastSuccessfulAt: string | null; status: DatasetStatus; datasets: DatasetSummary[] }
export interface SnapshotSource { id?: string; name: string; url: string }
export interface SourceHealth { id: string; status: string; itemCount: number; error?: string }
export interface DatasetEnvelope { schemaVersion: 1; attemptedAt: string; lastSuccessfulAt: string | null; dataAsOf: string | null; nextExpectedAt: string; status: DatasetStatus; freshness: DataFreshness; sourceHealth: SourceHealth[]; fallbackReason?: string }
export interface MarketInstrument { id: string; group: MarketGroup; name: string; symbol: string; value: number; change?: number; changePercent?: number; currency: string; unit: string; marketState: 'trading' | 'delayed' | 'close' | 'previous_close'; dataAsOf: string; fetchedAt: string; freshness: 'fresh' | 'delayed'; source: SnapshotSource }
export interface MarketOverviewSnapshot extends DatasetEnvelope { groups: Record<MarketGroup, MarketInstrument[]>; groupHealth: Record<MarketGroup, { status: DatasetStatus; sourceIds: string[]; fallbackReason?: string }> }
export interface SectorItem { id: string; market: MarketGroup; classification: string; name: string; changePercent: number; rank: number; dataAsOf: string; source: SnapshotSource; driver?: { summary: string; evidenceIds: string[]; confidence: 'supported' } }
export interface SectorPerformanceSnapshot extends DatasetEnvelope { groups: Record<MarketGroup, SectorItem[]> }
export interface DailyBriefSnapshot extends DatasetEnvelope { edition: 'morning' | 'close'; generatedAt: string; snapshotVersions: Record<string, string>; facts: string[]; stories?: { id:string; title:string; publishedAt:string; sourceName:string; sourceUrl:string }[]; marketFocus?: { text: string; evidenceIds: string[] }; watchItems: string[]; invalidationConditions: string[] }
