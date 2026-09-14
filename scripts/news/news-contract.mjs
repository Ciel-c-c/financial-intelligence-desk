export const NEWS_SCHEMA_VERSION = 1;
const values = {
  sourceTier: ['official', 'verified'], verificationStatus: ['official', 'verified', 'cross-checked'],
  translationStatus: ['original-zh', 'generated', 'cached', 'unavailable'], detailStatus: ['brief', 'professional', 'so-what'],
  analysisLevels: ['宏观', '行业', '公司'], eventTypes: ['货币政策', '财政政策', '监管', '贸易', '经济数据', '公司经营', '地缘风险'],
  impactChannels: ['利率', '通胀', '汇率', '供需', '盈利', '估值', '就业'], regions: ['中国', '美国', '欧洲', '全球', 'A股相关', '港股相关', '美股相关'],
};
const iso = value => typeof value === 'string' && Number.isFinite(Date.parse(value));
const https = value => { try { return new URL(value).protocol === 'https:'; } catch { return false; } };
const strings = value => Array.isArray(value) && value.every(item => typeof item === 'string');
const enums = (value, allowed) => Array.isArray(value) && value.length > 0 && value.every(item => allowed.includes(item));

export function validateNewsRecord(value) {
  return !!value && typeof value.id === 'string' && https(value.canonicalUrl) && https(value.sourceUrl)
    && typeof value.sourceName === 'string' && values.sourceTier.includes(value.sourceTier) && values.verificationStatus.includes(value.verificationStatus)
    && iso(value.publishedAt) && iso(value.fetchedAt) && typeof value.originalLanguage === 'string' && typeof value.originalTitle === 'string' && value.originalTitle.trim().length > 0
    && values.translationStatus.includes(value.translationStatus) && enums(value.analysisLevels, values.analysisLevels) && enums(value.eventTypes, values.eventTypes)
    && enums(value.impactChannels, values.impactChannels) && enums(value.regions, values.regions) && strings(value.keyTerms) && strings(value.causalSignals)
    && Number.isFinite(value.importanceScore) && Number.isFinite(value.continuingImpactScore) && typeof value.clusterId === 'string'
    && Array.isArray(value.relatedSources) && values.detailStatus.includes(value.detailStatus) && strings(value.facts) && strings(value.expectations) && strings(value.inferences);
}

export function validateNewsSnapshot(value) {
  if (!value || value.schemaVersion !== NEWS_SCHEMA_VERSION || !iso(value.attemptedAt) || !iso(value.lastSuccessfulAt) || !iso(value.nextExpectedAt)
    || !['fresh', 'delayed', 'source_error'].includes(value.status) || !Array.isArray(value.latest) || !Array.isArray(value.continuing)
    || value.continuing.length > 6 || !Array.isArray(value.retainedDetails) || !Array.isArray(value.sourceHealth)) return false;
  const all = [...value.latest, ...value.continuing, ...value.retainedDetails];
  return all.every(validateNewsRecord) && new Set(all.map(item => item.id)).size === all.length;
}
