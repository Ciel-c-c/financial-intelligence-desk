import {expect,it} from 'vitest';
import {buildNewsSnapshot} from '../../scripts/news/update-news-feed.mjs';
import {articleHash} from '../../scripts/news/full-article.mjs';
import {isVerifiedSourceNews} from '../../src/data/sourceNewsAdmission.mjs';
import {buildSourcePolicies} from '../../scripts/news/source-policy.mjs';
import {newsSources} from '../../scripts/news/source-registry.mjs';
import {validateNewsSnapshot,validateRunMetrics} from '../../scripts/news/news-contract.mjs';
import {newsRunReport} from '../../scripts/news/run-report.mjs';
const now='2026-10-19T08:00:00Z';
const raw={sourceId:'bbc-business',sourceName:'BBC News',sourceTier:'verified',originalLanguage:'en',originalTitle:'Company cancels its share sale',originalSummary:'The company cancelled its initial public offering because of recent market volatility and prevailing market conditions. No new revenue forecast was announced.',sourceUrl:'https://www.bbc.co.uk/news/articles/abc',canonicalUrl:'https://www.bbc.co.uk/news/articles/abc',publishedAt:now,fetchedAt:now};
const source={id:'bbc-business',name:'BBC News',ok:true,items:[raw]};
it('publishes a verified source checkpoint before translation and deep model requests',async()=>{
 const events:string[]=[];
 const result=await buildNewsSnapshot({now,sourceResults:[source],onNewsReady:async s=>{expect(validateNewsSnapshot(s)).toBe(true);events.push('publish:'+s.publicationPhase);},enrichmentOptions:{apiKey:'test-key',waitImpl:async()=>{},fetchImpl:async()=>{events.push('model');throw Error('offline');}}});
 expect(events[0]).toBe('publish:source');
 expect(result.latest[0].factualSummary.language).toBe('en');
 expect(result.latest[0].chineseSummary.status).toBe('failed');
 expect(result.runMetrics.translation).toMatchObject({attempted:1,succeeded:0,failed:1,successRate:0});
 expect(result.runMetrics.analysis.attempted).toBe(0);
 expect(result.runMetrics.analysis.failed).toBe(0);
 expect(result.runMetrics.analysis.successRate).toBeNull();
});
it('defaults to reviewed Chinese before optional failed deep analysis, preserving original text',async()=>{
 const checkpoints:any[]=[];
 const result=await buildNewsSnapshot({now,sourceResults:[source],onNewsReady:async s=>checkpoints.push(s),enrichmentOptions:{apiKey:'test-key',waitImpl:async()=>{},fetchImpl:async(_url,init)=>{
  const req=JSON.parse(init.body),stage=req.messages[0].content;
  if(!stage.startsWith('SUMMARY_'))throw Error('deep unavailable');
  const body=JSON.parse(req.messages[1].content);
  const fragment=Object.entries(body.evidenceFragments??{}).find(([,v])=>String(v).includes('cancelled'))?.[0];
  const value=stage.startsWith('SUMMARY_AUDIT')?{approved:true,title:true,summary:true,preservesMeaning:true,facts:[true]}:{language:'zh',title:'企业取消首次公开募股',summary:'这家企业取消首次公开募股，将决定归因于近期市场波动及整体市场环境。报道没有宣布新的收入预测，后续计划仍需查看原始来源。',facts:[{text:'企业取消首次公开募股。',evidence:fragment}]};
  return {ok:true,json:async()=>({choices:[{finish_reason:'stop',message:{content:JSON.stringify(value)}}]})};
 }}});
 expect(checkpoints[0].latest[0].factualSummary.language).toBe('en');
 expect(checkpoints[1].latest[0].factualSummary.language).toBe('zh');
 expect(result.latest[0].originalTitle).toBe(raw.originalTitle);
 expect(result.runMetrics.translation).toMatchObject({attempted:1,succeeded:1,successRate:1});
 expect(result.runMetrics.analysis).toMatchObject({attempted:1,succeeded:0,failed:1,successRate:0});
 expect(result.sourceHealth.find(h=>h.id==='groq-summary').error).toBeUndefined();
});
it('source stage never calls models and reports no attempts without a fictitious success rate',async()=>{
 let calls=0;
 const result=await buildNewsSnapshot({now,sourceResults:[source],enrichmentOptions:{processingStage:'source',apiKey:'test-key',fetchImpl:async()=>{calls++;throw Error();}}});
 expect(calls).toBe(0);
 expect(result.publicationPhase).toBe('source');
 expect(result.runMetrics.translation.successRate).toBeNull();
});
it('publishes source-only original titles for verified full bodies without manufacturing a summary',async()=>{
 const url='https://www.cnfin.com/yw-lb/detail/20261019/4485000_1.html',text='The company reported its business plans. Further details remain subject to its own public announcements. '.repeat(3);
 const article={status:'complete',reader:'cnfin-body',text,characterCount:text.length,sha256:articleHash(text),checkedAt:now,sourceUrl:url};
 const item={...raw,sourceId:'cnfin',sourceName:'新华财经',canonicalUrl:url,originalSummary:undefined,article};
 const result=await buildNewsSnapshot({now,sourceResults:[{id:'cnfin',name:'新华财经',ok:true,items:[item]}],enrichmentOptions:{processingStage:'source'}});
 const record=result.latest[0];
 expect(record.factualSummary).toBeUndefined();
 expect(record.editorial).toBeUndefined();
 expect(isVerifiedSourceNews(record,buildSourcePolicies(newsSources,now),now)).toBe(true);
 expect(isVerifiedSourceNews({...record,invalidationReason:'withdrawn'},buildSourcePolicies(newsSources,now),now)).toBe(false);
 expect(newsRunReport(result).news.publishedCurrent).toBe(1);
});
it('validates stage rates and replaces previous success metrics when all sources fail',async()=>{
 const previous=await buildNewsSnapshot({now,sourceResults:[source],enrichmentOptions:{processingStage:'source'}});
 const failed=await buildNewsSnapshot({now,previous,sourceResults:[{...source,ok:false,items:[],error:'offline'}]});
 expect(failed.runMetrics.fetch).toMatchObject({attempted:1,succeeded:0,failed:1,successRate:0});
 expect(failed.runMetrics.translation.successRate).toBeNull();
 expect(newsRunReport(failed).news.fetch).toBe('failed');
 expect(validateRunMetrics({...failed.runMetrics,translation:{...failed.runMetrics.translation,successRate:1}})).toBe(false);
});
