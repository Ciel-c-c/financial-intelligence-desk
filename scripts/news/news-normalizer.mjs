import { createHash } from 'node:crypto';
const clean = value => value?.replace(/\s+/g,' ').trim();
export function normalizeNewsItem(raw) {
  const url = new URL(raw.canonicalUrl); ['utm_source','utm_medium','utm_campaign','utm_term','utm_content'].forEach(key=>url.searchParams.delete(key)); url.hash='';
  const title = clean(raw.originalTitle);
  const id = createHash('sha256').update(`${raw.sourceId}|${url}|${title}`).digest('hex').slice(0,20);
  return { ...raw, id, canonicalUrl:url.toString(), originalTitle:title, originalSummary:clean(raw.originalSummary), verificationStatus:raw.sourceTier, titleZh:raw.originalLanguage==='zh'?title:undefined, summaryZh:raw.originalLanguage==='zh'?clean(raw.originalSummary):undefined, translationStatus:raw.originalLanguage==='zh'?'original-zh':'unavailable', relatedSources:[], keyTerms:[], causalSignals:[], analysisLevels:[], eventTypes:[], impactChannels:[], regions:[], importanceScore:0, continuingImpactScore:0, clusterId:id, detailStatus:'brief', facts:clean(raw.originalSummary)?[clean(raw.originalSummary)]:[], expectations:[], inferences:[] };
}
