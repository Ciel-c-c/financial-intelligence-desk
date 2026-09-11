export type SnapshotStatus = 'latest' | 'partial' | 'source_error';
export type RelevanceLevel = 'high' | 'medium' | 'low';

export interface EventSource { name: string; url: string; publishedAt: string }
export interface Relevance { level: RelevanceLevel; score: number; criteria: string[] }
export interface CausalNode { id: string; title: string; beginnerExplanation: string; condition: string; uncertain: boolean }
export interface RelatedAsset { name: string; symbol?: string; explanation: string }
export interface MarketReaction { asset: string; change: string; window: string; asOf: string; sourceName: string; sourceUrl: string }

export interface GlobalEvent {
  id: string;
  headline: string;
  sourceHeadline?: string;
  oneLine: string;
  summary: string;
  publishedAt: string;
  fetchedAt: string;
  region: string;
  topic: string;
  eventType: string;
  relevance: Relevance;
  fact: string[];
  marketView: string[];
  scenarios: string[];
  simpleExample: string;
  professionalConcept: string;
  causalChain: CausalNode[];
  relatedAssets: RelatedAsset[];
  relatedIndustries: string[];
  knowledgeIds: string[];
  relatedKnowledgePoints?: string[];
  conditionsThatChangeView: string[];
  marketReaction: MarketReaction[];
  sources: EventSource[];
}

export interface SourceHealth { id: string; name: string; status: 'ok' | 'error'; itemCount: number; error?: string }
export interface GlobalSituationSnapshot {
  schemaVersion: 1;
  attemptedAt: string;
  lastSuccessfulAt: string;
  status: SnapshotStatus;
  sourceHealth: SourceHealth[];
  events: GlobalEvent[];
}
