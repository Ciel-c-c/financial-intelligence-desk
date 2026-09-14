export type NewsSourceTier = 'official' | 'verified';
export type VerificationStatus = 'official' | 'verified' | 'cross-checked';
export type AnalysisLevel = '宏观' | '行业' | '公司';
export type EventType = '货币政策' | '财政政策' | '监管' | '贸易' | '经济数据' | '公司经营' | '地缘风险';
export type ImpactChannel = '利率' | '通胀' | '汇率' | '供需' | '盈利' | '估值' | '就业';
export type NewsRegion = '中国' | '美国' | '欧洲' | '全球' | 'A股相关' | '港股相关' | '美股相关';
export type TranslationStatus = 'original-zh' | 'generated' | 'cached' | 'unavailable';
export type DetailStatus = 'brief' | 'professional' | 'so-what';
export type NewsFeedStatus = 'fresh' | 'delayed' | 'source_error';
export interface RelatedNewsSource { name: string; url: string; publishedAt: string }
export interface LiveNewsItem { id:string; canonicalUrl:string; sourceName:string; sourceTier:NewsSourceTier; verificationStatus:VerificationStatus; sourceUrl:string; publishedAt:string; fetchedAt:string; originalLanguage:string; originalTitle:string; originalSummary?:string; titleZh?:string; summaryZh?:string; translationStatus:TranslationStatus; analysisLevels:AnalysisLevel[]; eventTypes:EventType[]; impactChannels:ImpactChannel[]; regions:NewsRegion[]; keyTerms:string[]; causalSignals:string[]; importanceScore:number; continuingImpactScore:number; clusterId:string; relatedSources:RelatedNewsSource[]; detailStatus:DetailStatus; facts:string[]; expectations:string[]; inferences:string[] }
export interface NewsSourceHealth { id:string; name:string; status:'ok'|'error'; itemCount:number; error?:string }
export interface NewsFeedSnapshot { schemaVersion:1; attemptedAt:string; lastSuccessfulAt:string; nextExpectedAt:string; status:NewsFeedStatus; latest:LiveNewsItem[]; continuing:LiveNewsItem[]; retainedDetails:LiveNewsItem[]; sourceHealth:NewsSourceHealth[]; message?:string }
