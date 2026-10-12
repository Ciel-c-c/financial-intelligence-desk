import {expect,it} from 'vitest';
import {needsReview} from '../../scripts/news/review-migration.mjs';
import {EDITORIAL_REVIEW_VERSION} from '../../scripts/news/editorial-audit.mjs';
import {buildNewsSnapshot} from '../../scripts/news/update-news-feed.mjs';
import {prepareNewsEvidence} from '../../scripts/news/summary-evidence.mjs';
const now='2026-10-09T14:00:00Z';
const raw={id:'old-summary',sourceId:'un-zh',sourceName:'UN News',sourceTier:'official',originalLanguage:'zh',originalTitle:'联合国发布经济与就业报告',originalSummary:'联合国发布报告介绍冲突与经济变化对家庭生活及就业的影响。报告强调公共服务和政策落实的重要性，后续改善仍需要结合当地条件判断，不能从单条新闻推断所有资产的涨跌。报道没有提供具体的市场一致预期。',canonicalUrl:'https://news.un.org/feed/view/zh/story/2026/10/1142960',publishedAt:now,fetchedAt:now};
const base=prepareNewsEvidence(raw);
const old={...base,editorial:{originalTitle:raw.originalTitle,sourceBodyHash:base.article.sha256,language:'zh',generator:{review:'old-audit'},item:{id:raw.id,publishedAt:now,sourceUrl:raw.canonicalUrl,title:raw.originalTitle,summary:raw.originalSummary}}};
it('reviews a current pending story before an older static baseline',async()=>{
 const archiveInput={...raw,id:'archive',originalTitle:'历史报告',publishedAt:'2026-10-06T14:00:00Z',canonicalUrl:raw.canonicalUrl.replace('1142960','1142961')};
 const archiveBody=prepareNewsEvidence(archiveInput),archive={...archiveBody,editorial:{...old.editorial,originalTitle:archiveInput.originalTitle,sourceBodyHash:archiveBody.article.sha256}};
 const requested:string[]=[];
 await buildNewsSnapshot({now,sourceResults:[{id:'un-zh',name:'UN News',ok:true,items:[raw]}],reviewedNews:[archive,old],enrichmentOptions:{apiKey:'test-secret',waitImpl:async()=>{},fetchImpl:async(_url,init)=>{
  const request=JSON.parse(init.body);if(request.messages[0].content.startsWith('EVIDENCE_ONLY'))requested.push(JSON.parse(request.messages[1].content).title);
  return {ok:true,json:async()=>({choices:[{finish_reason:'stop',message:{content:'{}'}}]})};
 }}});
 expect(requested[0]).toBe(raw.originalTitle);
});
it('uses both available deep slots for two current pending reviews before a new analysis',async()=>{
 const secondInput={...raw,id:'pending-two',originalTitle:'第二条今日待审核',canonicalUrl:raw.canonicalUrl.replace('1142960','1142961')};
 const secondBody=prepareNewsEvidence(secondInput),second={...secondBody,editorial:{...old.editorial,originalTitle:secondInput.originalTitle,sourceBodyHash:secondBody.article.sha256}};
 const fresh={...raw,id:'fresh',originalTitle:'今日新报道',canonicalUrl:raw.canonicalUrl.replace('1142960','1142962')};
 const requested:string[]=[];
 await buildNewsSnapshot({now,sourceResults:[{id:'un-zh',name:'UN News',ok:true,items:[raw,fresh]}],reviewedNews:[old,second],enrichmentOptions:{apiKey:'test-secret',waitImpl:async()=>{},fetchImpl:async(_url,init)=>{
  const request=JSON.parse(init.body);if(request.messages[0].content.startsWith('EVIDENCE_ONLY'))requested.push(JSON.parse(request.messages[1].content).title);
  return {ok:true,json:async()=>({choices:[{finish_reason:'stop',message:{content:'{}'}}]})};
 }}});
 expect(requested).toEqual([raw.originalTitle,secondInput.originalTitle]);
});
it('publishes an independently audited factual summary before attempting a blocked deep review',async()=>{
 const input={...raw,id:'english-pending',sourceId:'cnbc-markets',sourceTier:'verified',originalLanguage:'en',originalTitle:'Data centre company cancels IPO',originalSummary:'The company cancelled its initial public offering because of recent market volatility and prevailing market conditions. No new revenue forecast was announced.',canonicalUrl:'https://www.cnbc.com/2026/10/09/ai-ipo.html'};
 const evidence=prepareNewsEvidence(input),pending={...evidence,editorial:{...old.editorial,originalTitle:input.originalTitle,sourceBodyHash:evidence.article.sha256}};
 const stages:string[]=[];
 const fetchImpl=async(_url,init)=>{
  const request=JSON.parse(init.body),stage=request.messages[0].content.split(':')[0];stages.push(stage);
  let value;
  if(stage==='SUMMARY_ONLY'){
   const source=JSON.parse(request.messages[1].content),id=Object.entries(source.evidenceFragments).find(([,quote])=>String(quote).includes('cancelled'))![0];
   value={language:'zh',title:'数据中心企业取消上市',summary:'这家企业宣布取消首次公开募股，并将决定归因于近期市场波动和整体市场环境。报道还说明没有发布新的收入预测。',facts:[{text:'公司取消首次公开募股。',evidence:id}]};
  }else if(stage==='SUMMARY_AUDIT')value={approved:true,title:true,summary:true,preservesMeaning:true,facts:[true]};
  else return {ok:false,status:400,json:async()=>({error:{code:'json_validate_failed'}})};
  return {ok:true,json:async()=>({choices:[{finish_reason:'stop',message:{content:JSON.stringify(value)}}]})};
 };
 const snapshot=await buildNewsSnapshot({now,sourceResults:[{id:input.sourceId,name:'CNBC',ok:true,items:[input]}],reviewedNews:[pending],enrichmentOptions:{apiKey:'test-secret',waitImpl:async()=>{},fetchImpl}});
 const record=snapshot.latest.find(r=>r.id===input.id)!;
 expect(record.factualSummary?.title).toBe('数据中心企业取消上市');expect(stages[0]).toBe('SUMMARY_ONLY');expect(record.reviewMigration?.state).toBe('pending');
 expect(snapshot.sourceHealth.find(h=>h.id==='review-queue')).toMatchObject({selectedId:'english-pending',selectedPublishedAt:now,selectedIsCurrent:true});
 expect(JSON.stringify(snapshot.sourceHealth)).not.toContain('test-secret');
});
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
 const snapshot=await buildNewsSnapshot({now,sourceResults:[{id:'un-zh',name:'UN News',ok:true,items:[raw]}],reviewedNews:[old],enrichmentOptions:{apiKey:'test-secret',waitImpl:async()=>{},fetchImpl:async()=>({ok:false,status:400,json:async()=>({error:{code:'json_validate_failed'}})})}});
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
