import {expect,it} from 'vitest';
import {needsReview} from '../../scripts/news/review-migration.mjs';
import {EDITORIAL_REVIEW_VERSION} from '../../scripts/news/editorial-audit.mjs';
import {buildNewsSnapshot} from '../../scripts/news/update-news-feed.mjs';
import {prepareNewsEvidence} from '../../scripts/news/summary-evidence.mjs';
const now='2026-10-09T14:00:00Z';
const raw={id:'old-summary',sourceId:'un-zh',sourceName:'UN News',sourceTier:'official',originalLanguage:'zh',originalTitle:'联合国发布经济与就业报告',originalSummary:'联合国发布报告介绍冲突与经济变化对家庭生活及就业的影响。报告强调公共服务和政策落实的重要性，后续改善仍需要结合当地条件判断，不能从单条新闻推断所有资产的涨跌。报道没有提供具体的市场一致预期。',canonicalUrl:'https://news.un.org/feed/view/zh/story/2026/10/1142960',publishedAt:now,fetchedAt:now};
const base=prepareNewsEvidence(raw);
const old={...base,editorial:{originalTitle:raw.originalTitle,sourceBodyHash:base.article.sha256,language:'zh',generator:{review:'old-audit'},item:{id:raw.id,publishedAt:now,sourceUrl:raw.canonicalUrl,title:raw.originalTitle,summary:raw.originalSummary}}};
it('recognizes an old cache without granting the current audit version',()=>{
 expect(needsReview(old,EDITORIAL_REVIEW_VERSION)).toBe(true);
 expect(needsReview({...old,editorial:undefined},EDITORIAL_REVIEW_VERSION)).toBe(false);
});
it('keeps old content explicitly pending during a quota outage while preserving the summary and date',async()=>{
 const snapshot=await buildNewsSnapshot({now,sourceResults:[{id:'un-zh',name:'UN News',ok:true,items:[raw]}],reviewedNews:[old],enrichmentOptions:{apiKey:'test-secret',fetchImpl:async()=>({ok:false,status:429})}});
 const record=snapshot.latest[0];expect(record.reviewMigration?.state).toBe('pending');expect(record.publishedAt).toBe(now);expect(record.factualSummary?.origin).toBe('publisher-zh');
});
it('withdraws a rejected old interpretation without dropping a valid factual summary',async()=>{
 const snapshot=await buildNewsSnapshot({now,sourceResults:[{id:'un-zh',name:'UN News',ok:true,items:[raw]}],reviewedNews:[old],enrichmentOptions:{apiKey:'test-secret',waitImpl:async()=>{},fetchImpl:async()=>({ok:true,json:async()=>({choices:[{finish_reason:'stop',message:{content:'{}'}}]})})}});
 expect(snapshot.latest[0].editorial).toBeUndefined();expect(snapshot.latest[0].reviewMigration?.state).toBe('rejected');expect(snapshot.latest[0].factualSummary).toBeDefined();
});
it('does not mistake a provider JSON-generation failure for a rejected old interpretation',async()=>{
 const snapshot=await buildNewsSnapshot({now,sourceResults:[{id:'un-zh',name:'UN News',ok:true,items:[raw]}],reviewedNews:[old],enrichmentOptions:{apiKey:'test-secret',fetchImpl:async()=>({ok:false,status:400,json:async()=>({error:{code:'json_validate_failed'}})})}});
 expect(snapshot.latest[0].reviewMigration?.state).toBe('pending');expect(snapshot.latest[0].editorial).toBeDefined();
});
it('queues retained generated content even when it has disappeared from the current feed',async()=>{
 let calls=0;
 const previous={latest:[],continuing:[],retainedDetails:[{...old,publishedAt:'2026-10-07T14:00:00Z',editorial:{...old.editorial,item:{...old.editorial.item,publishedAt:'2026-10-07T14:00:00Z'}}}]};
 const snapshot=await buildNewsSnapshot({now,previous,sourceResults:[{id:'un-zh',name:'UN News',ok:true,items:[{...raw,canonicalUrl:raw.canonicalUrl.replace('1142960','1142961'),originalTitle:'联合国另一篇经济报告'}]}],enrichmentOptions:{apiKey:'test-secret',waitImpl:async()=>{},maxArticles:1,fetchImpl:async()=>{calls++;return {ok:true,json:async()=>({choices:[{finish_reason:'stop',message:{content:'{}'}}]})};}}});
 expect(snapshot.retainedDetails.find(r=>r.id===old.id)?.reviewMigration).toBeDefined();
});
it('does not retain an obsolete title version of the same publisher URL',async()=>{
 const previous={latest:[old],continuing:[],retainedDetails:[]};
 const snapshot=await buildNewsSnapshot({now,previous,sourceResults:[{id:'un-zh',name:'UN News',ok:true,items:[{...raw,originalTitle:'修订后的经济与就业报告'}]}],enrichmentOptions:{}});
 expect(snapshot.retainedDetails.some(r=>r.canonicalUrl===raw.canonicalUrl&&r.originalTitle===old.originalTitle)).toBe(false);
 const superseded=[...snapshot.latest,...snapshot.continuing,...snapshot.retainedDetails].find(r=>r.id===old.id);
 expect(superseded?.invalidationReason).toBe('superseded-source-version');expect(superseded?.editorial).toBeUndefined();
});
it('does not resurrect a previously rejected reviewed-file interpretation during a source outage',async()=>{
 const rejected={...old,editorial:undefined,reviewMigration:{state:'rejected',sourceHash:old.article.sha256,reviewVersion:EDITORIAL_REVIEW_VERSION}};
 const snapshot=await buildNewsSnapshot({now,previous:{latest:[rejected],continuing:[],retainedDetails:[],lastSuccessfulAt:now},sourceResults:[{id:'un-zh',name:'UN News',ok:false,items:[]}],reviewedNews:[old]});
 expect([...snapshot.latest,...snapshot.continuing,...snapshot.retainedDetails].find(r=>r.id===old.id)?.editorial).toBeUndefined();
});
