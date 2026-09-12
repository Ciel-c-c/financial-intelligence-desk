export type Region = 'A股' | '港股' | '美股' | '全球';
export type ContentMode = '演示' | '今日快照';

export interface MarketSnapshot {
  id: string;
  market: Exclude<Region, '全球'>;
  indexName: string;
  value: string;
  changePercent: number;
  status: string;
  timestamp: string;
  source: string;
  delayed: boolean;
  mode: ContentMode;
}

export interface SectorSnapshot {
  id: string;
  name: string;
  changePercent: number | null;
  direction: '领涨' | '上涨' | '下跌' | '领跌';
  reason: string;
  beginnerNote: string;
  relatedNewsId?: string;
  asOf?: string;
}

export interface PoliticalImpact {
  id: string;
  event: string;
  type: string;
  status: '高关注' | '关注';
  channel: string;
  affected: string[];
  watch: string;
  counterRisk: string;
  newsId?: string;
}

export interface CausalStep {
  title: string;
  explanation: string;
  condition: string;
}

export interface NewsItem {
  id: string;
  title: string;
  region: Region;
  topic: string;
  sourceName: string;
  sourceUrl: string;
  publishedAt: string;
  summary: string;
  excerpt: string;
  termIds: string[];
  facts: string[];
  consensus: string[];
  inference: string[];
  risks: string[];
  causalChain: CausalStep[];
  mode: ContentMode;
}

export interface KnowledgeCardData {
  id: string;
  term: string;
  definition: string;
  example: string;
  misconception: string;
  plainLanguage: string;
  marketChain: string[];
}

export type ImpactDimension = '投资' | '汇率' | '住房' | '工作' | '消费' | '企业经营';

export interface PersonalImpact {
  label: ImpactDimension;
  impact: string;
  why: string;
  condition: string;
}

export interface SoWhatData {
  analogy: { image: string; explanation: string };
  next: string[];
  condition: string[];
  why: { cause: string; mechanisms: string[]; result: string };
  surface: string;
  focus: string[];
  marketBet: string[];
  expectationGap: string;
  counterView: string;
  personalImpact: PersonalImpact[];
}

export interface Brief {
  date: string;
  generatedAt: string;
  headline: string;
  newsIds: string[];
  watchItems: string[];
  knowledgeId: string;
  mode: ContentMode;
}
