import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {expect,it,vi} from 'vitest';
const {feedFetch}=vi.hoisted(()=>({feedFetch:vi.fn(()=>{throw Error('all feed retrieval is offline');})}));
vi.mock('../../scripts/news/fetch-news-sources.mjs',()=>({fetchNewsSource:feedFetch}));
import {buildNewsSnapshot,updateNewsFeed} from '../../scripts/news/update-news-feed.mjs';
import {articleHash} from '../../scripts/news/full-article.mjs';
import {newsRunReport} from '../../scripts/news/run-report.mjs';
const now='2026-10-20T08:00:00Z';
const url='https://www.bbc.co.uk/news/articles/abc';
const raw={sourceId:'bbc-business',sourceName:'BBC News',sourceTier:'verified',originalLanguage:'en',originalTitle:'Company cancels its share sale',originalSummary:'The company cancelled its initial public offering because of recent market volatility and prevailing market conditions. No new revenue forecast was announced.',sourceUrl:url,canonicalUrl:url,publishedAt:now,fetchedAt:now};
async function base(){return buildNewsSnapshot({now,sourceResults:[{id:'bbc-business',name:'BBC News',ok:true,items:[raw]}],enrichmentOptions:{processingStage:'source'}});}
async function run(previous,extra={}){
 const dir=await mkdtemp(join(tmpdir(),'published-enrichment-'));
 try{return await updateNewsFeed({now,previous,outputPath:join(dir,'news.json'),enrichmentOptions:{processingStage:'published',apiKey:'test',waitImpl:async()=>{},fetchImpl:async()=>({ok:true,json:async()=>({choices:[{finish_reason:'stop',message:{content:JSON.stringify({language:'en',facts:[]})}}]})})},...extra});}
 finally{await rm(dir,{recursive:true,force:true});}
}
it('continues translation from the published source even when every feed is offline',async()=>{
 const result=await run(await base());
 expect(feedFetch).not.toHaveBeenCalled();
 expect(result.runMetrics.translation.attempted).toBe(1);
 expect(result.latest[0].factualSummary.language).toBe('en');
 expect(result.runMetrics.fetch).toMatchObject({attempted:0,succeeded:0,successRate:null});
 expect(result.processingMode).toBe('published');
 expect(result.lastSuccessfulAt).toBe(now);
 expect(newsRunReport(result).news.fetch).toBe('not_attempted');
 const failedAcquisition=await buildNewsSnapshot({now,previous:result,sourceResults:[{id:'bbc-business',name:'BBC News',ok:false,items:[],error:'offline'}]});
 expect(newsRunReport(failedAcquisition).news.fetch).toBe('failed');
 expect(failedAcquisition.processingMode).toBeUndefined();
});
it('preserves known withdrawals and skips model work for them',async()=>{
 const prior=await base();prior.latest[0]={...prior.latest[0],factualSummary:undefined,invalidationReason:'withdrawn'};
 const result=await run(prior);
 expect(result.latest[0].invalidationReason).toBe('withdrawn');
 expect(result.runMetrics.translation.attempted).toBe(0);
 expect(result.runMetrics.analysis.attempted).toBe(0);
});
it('does not reuse invalid hashes or expired sources for translation',async()=>{
 const prior=await base();prior.latest[0].article.text+='changed';
 await expect(run(prior)).rejects.toThrow(/snapshot/i);
 const result=await run(await base(),{now:'2027-02-01T08:00:00Z'});
 expect([...result.latest,...result.retainedDetails][0].invalidationReason).toBe('source-policy-expired');
 expect(result.runMetrics.translation.attempted).toBe(0);
 expect(result.runMetrics.analysis.attempted).toBe(0);
});
it('only refetches a selected missing body and invalidates confirmed withdrawals or revisions',async()=>{
 const bodyUrl='https://www.cnfin.com/yw-lb/detail/20261020/4485000_1.html';
 const text='The company reported its business plans and made its announcement available to readers. '.repeat(5);
 const bodyRaw={...raw,sourceId:'cnfin',sourceName:'新华财经',sourceUrl:bodyUrl,canonicalUrl:bodyUrl,originalSummary:undefined,article:{status:'complete',reader:'cnfin-body',text,characterCount:text.length,sha256:articleHash(text),sourceUrl:bodyUrl,checkedAt:now}};
 const prior=await buildNewsSnapshot({now,sourceResults:[{id:'cnfin',name:'新华财经',ok:true,items:[bodyRaw]}],enrichmentOptions:{processingStage:'source'}});
 const evidenceFetchImpl=vi.fn(async()=>({ok:false,status:410}));
 const result=await run(prior,{evidenceFetchImpl});
 expect(evidenceFetchImpl).toHaveBeenCalledTimes(1);
 expect(result.latest[0].invalidationReason).toBe('withdrawn');
 expect(result.runMetrics.translation.attempted).toBe(0);
 expect(result.runMetrics.analysis.attempted).toBe(0);
 const revised=await run(prior,{evidenceFetchImpl:async()=>({ok:true,text:async()=>'<h1>A revised title</h1>',headers:{get:()=>null}})});
 expect(revised.latest[0].invalidationReason).toBe('body-mismatch');
 const changed=await run(prior,{evidenceFetchImpl:async()=>({ok:true,text:async()=>'<h1>'+bodyRaw.originalTitle+'</h1><div class="xhcj_detail_main"><p>'+text+' More updated facts.</p><p class="app-statement">',headers:{get:()=>null}})});
 expect(changed.latest[0].invalidationReason).toBe('source-version-changed');
 const unavailable=await run(prior,{evidenceFetchImpl:async()=>{throw Error('offline');}});
 expect(unavailable.latest[0].invalidationReason).toBeUndefined();
 expect(unavailable.runMetrics.translation.attempted).toBe(0);
});
