import {expect,it} from 'vitest';
import {buildNewsSnapshot} from '../../scripts/news/update-news-feed.mjs';
const now='2026-10-09T14:00:00Z';
const raw={sourceId:'un-zh',sourceName:'UN News',sourceTier:'official',originalLanguage:'zh',originalTitle:'联合国介绍经济与就业变化',originalSummary:'联合国发布报告介绍冲突与经济变化对家庭生活及就业的影响。报告强调公共服务和政策落实的重要性，后续改善仍需要结合当地条件判断，不能从单条新闻推断所有资产的涨跌。报道没有提供具体的市场一致预期。',canonicalUrl:'https://news.un.org/feed/view/zh/story/2026/10/1142960',publishedAt:now,fetchedAt:now};
const sources=[{id:'un-zh',name:'UN News',ok:true,items:[raw]}];
it('publishes an allowed factual summary despite missing or rejected deep analysis',async()=>{
 const result=await buildNewsSnapshot({now,sourceResults:sources,enrichmentOptions:{}});
 expect(result.latest[0].factualSummary?.origin).toBe('publisher-zh');expect(result.latest[0].editorial).toBeUndefined();
 const failed=await buildNewsSnapshot({now,sourceResults:sources,enrichmentOptions:{apiKey:'test-secret',fetchImpl:async()=>({ok:false,status:429})}});
 expect(failed.latest[0].factualSummary?.summary).toBe(raw.originalSummary);
});
it('does not reuse a summary after a source version changes',async()=>{
 const previous=await buildNewsSnapshot({now,sourceResults:sources,enrichmentOptions:{}});
 const changed={...raw,originalSummary:raw.originalSummary+'报告同时提醒后续数据可能修订。'};
 const result=await buildNewsSnapshot({now,previous,sourceResults:[{...sources[0],items:[changed]}],enrichmentOptions:{}});
 expect(result.latest[0].factualSummary?.summary).toBe(changed.originalSummary);
 expect(result.latest[0].factualSummary?.sourceHash).not.toBe(previous.latest[0].factualSummary?.sourceHash);
});
it('bounds every generation stage under one twelve-request allowance',async()=>{
 let calls=0;
 const items=Array.from({length:8},(_,i)=>({...raw,sourceId:'cnbc-markets',sourceName:'CNBC',sourceTier:'verified',originalLanguage:'en',originalTitle:'Company '+i+' earnings report',originalSummary:'The company reported updated business operations, and said market conditions affected current plans. No new forecast for stock prices was provided.',canonicalUrl:`https://www.cnbc.com/2026/10/09/report-${i}.html`}));
 const result=await buildNewsSnapshot({now,sourceResults:[{id:'cnbc-markets',name:'CNBC',ok:true,items}],enrichmentOptions:{apiKey:'test-secret',waitImpl:async()=>{},fetchImpl:async()=>{calls++;return {ok:true,json:async()=>({choices:[{finish_reason:'stop',message:{content:'{}'}}]})};}}});
 expect(calls).toBeLessThanOrEqual(12);
 expect(result.sourceHealth.find(s=>s.id==='groq-summary')?.attempted).toBe(2);
});
it('does not let Chinese body summaries consume every slot while English news remains untranslated',async()=>{
 const zh={...raw,sourceId:'cnfin',sourceName:'新华财经',sourceTier:'verified',originalTitle:'央行利率变化与企业融资成本',canonicalUrl:'https://www.cnfin.com/yw-lb/detail/20261009/4474000_1.html'};
 const en={...raw,sourceId:'cnbc-markets',sourceName:'CNBC',sourceTier:'verified',originalLanguage:'en',originalTitle:'Company earnings change market expectations',originalSummary:'The company reported updated earnings and said market conditions affected its financing plans. Investors will monitor future guidance rather than assume a guaranteed stock price direction.',canonicalUrl:'https://www.cnbc.com/2026/10/09/earnings.html'};
 const summarized:string[]=[];
 await buildNewsSnapshot({now,sourceResults:[{id:'cnfin',name:'新华财经',ok:true,items:[zh]},{id:'cnbc-markets',name:'CNBC',ok:true,items:[en]}],enrichmentOptions:{apiKey:'test-secret',waitImpl:async()=>{},fetchImpl:async(_url,init)=>{const payload=JSON.parse(init.body);if(payload.messages[0].content.startsWith('SUMMARY_ONLY'))summarized.push(JSON.parse(payload.messages[1].content).title);return {ok:true,json:async()=>({choices:[{finish_reason:'stop',message:{content:'{}'}}]})};}}});
 expect(summarized[0]).toBe(en.originalTitle);
});
