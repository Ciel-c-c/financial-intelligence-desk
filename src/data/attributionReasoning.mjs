// Narrow guard for an observed invented outside analyst/expert attribution.
// A mention in the source is not proof that every attributed view is correct;
// paired evidence and the model audit still remain necessary.
export function unsupportedAnalystAttribution(output,source){
 if(typeof source!=='string')return undefined;
 if(/分析师|专家|分析认为|\banalysts?\b|\bexperts?\b|\banalyses\b/i.test(source))return undefined;
 const strings=value=>typeof value==='string'?[value]:Array.isArray(value)?value.flatMap(strings):value&&typeof value==='object'?Object.values(value).flatMap(strings):[];
 const attributed=/(?:部分|一些|有)分析认为|(?:分析师|专家)(?:认为|表示|指出|预计)|(?:some\s+)?(?:analysts?|experts?)\s+(?:say|said|believe|expect)|according to (?:some )?(?:analysts?|experts?)|some analyses (?:suggest|argue)/gi;
 const disclaimer=/(?:未|没有|无法).{0,12}(?:提供|报道|显示|证实|表明|证明).{0,8}$|(?:does not|did not|no evidence that|no evidence of).{0,18}$/i;
 const unsupported=strings(output).flatMap(text=>text.split(/[。；.!?\n]/u)).some(clause=>[...clause.matchAll(attributed)].some(match=>!disclaimer.test(clause.slice(0,match.index))));
 if(unsupported)return 'unsupported-attribution';
}
export function editorialAttributionIssue(record){
 const e=record.editorial;
 // Do not infer absence from a private full body that is intentionally stripped.
 if(!e||record.article?.status!=='summary'||e.evidenceScope!=='summary')return undefined;
 const item=e.item??{};
 const narrative=Object.fromEntries(['title','summary','excerpt','topic','facts','consensus','inference','risks','causalChain'].map(key=>[key,item[key]]));
 const political=e.political?Object.fromEntries(['type','channel','affected','watch','counterRisk'].map(key=>[key,e.political[key]])):undefined;
 const impactAssessment=Array.isArray(e.impactAssessment)?e.impactAssessment.map(a=>({region:a?.region,path:a?.path,invalidation:a?.invalidation})):undefined;
 return unsupportedAnalystAttribution({...narrative,soWhat:e.soWhat,watchItems:e.watchItems,marketSignals:e.marketSignals,political,impactAssessment},record.article.text);
}
