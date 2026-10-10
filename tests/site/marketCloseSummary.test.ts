import {expect,it} from 'vitest';
import {buildMarketCloseSummary} from '../../scripts/site/market-close-summary.mjs';
import {articleHash} from '../../scripts/news/full-article.mjs';
import {runSiteUpdate} from '../../scripts/update-site-data.mjs';
import {mkdtemp,readFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
const now='2026-10-10T12:00:00Z',url='https://www.cnbc.com/2026/10/09/market-close.html';
const observed={id:'sp500',group:'us',name:'标普500',symbol:'SPX',value:7811.54,changePercent:0.59,currency:'NONE',unit:'点',session:'close',tradingDate:'2026-10-09',timeZone:'America/New_York',timestampPrecision:'date',provenance:'report',sourcePublishedAt:'2026-10-10T01:00:00Z',source:{id:'cn',name:'Source',url},evidence:'标普500在2026年10月9日收于7811.54点。',valuePrecision:2,dataAsOf:'2026-10-09T00:00:00.000Z',fetchedAt:now,freshness:'fresh',marketState:'close'};
const originalTitle='The S&P 500 reacts to borrowing costs',originalSummary='Higher borrowing costs affect the valuation of future earnings. This report describes the US equity market and distinguishes a common mechanism from a forecast about tomorrow.';
const body=originalTitle+'\n'+originalSummary,hash=articleHash(body);
const content={id:'us-news',sourceUrl:url,publishedAt:'2026-10-09T19:00:00Z',title:'美国市场利率变化',summary:'融资成本变化影响美国市场估值。',excerpt:'利率机制参考。',region:'美国',facts:['报道讨论美国借贷成本。'],consensus:['利率上升通常压低未来利润现值，但不是每日涨跌的唯一原因。'],inference:['需结合盈利预期判断。'],risks:['如果盈利改善，估值压力可能被抵消。'],causalChain:[{title:'利率变化',explanation:'融资成本可能变化。',condition:'利率变化持续。'},{title:'折现变化',explanation:'未来利润现值可能变化。',condition:'其他条件不变。'},{title:'估值变化',explanation:'估值可能承压。',condition:'盈利未改善。'}]};
const news:any={id:content.id,sourceId:'cnbc-markets',sourceTier:'verified',canonicalUrl:url,publishedAt:content.publishedAt,originalTitle,originalSummary,titleZh:content.title,summaryZh:content.summary,regions:['美国'],impactChannels:['利率'],article:{status:'summary',reader:'publisher-feed-summary',text:body,sha256:hash,sourceUrl:url,checkedAt:now},editorial:{language:'zh',sourceBodyHash:hash,originalTitle,evidenceScope:'summary',item:content,generator:{review:'edge-audit-v4'},watchItems:['观察企业盈利预期。']}};
const run=(items:any[]=[],observations:any[]=[observed])=>buildMarketCloseSummary({group:'us',tradingDate:'2026-10-09',observations,news:items,now});
it('keeps factual closing numbers even without an explanation',()=>{
 const result=run();expect(result.facts[0]).toContain('7,811.54');expect(result.facts[0]).toContain('0.59%');expect(result.explanations).toEqual([]);
});
it('includes only observations from the requested group, trade date and close session',()=>{
 const result=run([],[observed,{...observed,id:'open',session:'open'},{...observed,id:'old',tradingDate:'2026-10-08',dataAsOf:'2026-10-08T00:00:00.000Z'}]);expect(result.facts).toHaveLength(1);
});
it('links approved regional mechanism explanations without declaring them the daily cause',()=>{
 const result=run([news,news]);expect(result.explanations).toHaveLength(1);expect(result.explanations[0]).toMatchObject({newsId:'us-news',conditional:true,attribution:'机制参考，不代表已确认的当日涨跌原因'});expect(result.watchItems).toEqual(['观察企业盈利预期。']);expect(result.invalidationConditions).toEqual(content.risks);
});
it('does not link stale, invalidated, old-review, other-region or headline-only news',()=>{
 const items=[{...news,publishedAt:'2026-10-08T19:00:00Z'},{...news,invalidationReason:'withdrawn'},{...news,regions:['中国'],editorial:{...news.editorial,item:{...content,region:'中国'}}},{...news,editorial:undefined},{...news,editorial:{...news.editorial,generator:{review:'old'}}}];expect(run(items).explanations).toEqual([]);
});
it('reconciles market explanations against the final news result before publishing both datasets',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'market-news-consistency-'));try{
  const priorSummary=run([news]);expect(priorSummary.explanations).toHaveLength(1);
  const market={schemaVersion:1,attemptedAt:now,lastSuccessfulAt:now,dataAsOf:observed.dataAsOf,nextExpectedAt:'2026-10-10T13:00:00Z',status:'partial',freshness:'delayed',sourceHealth:[],groups:{aShare:[],hongKong:[],us:[observed],globalAssets:[]},groupHealth:{aShare:{status:'unavailable',sourceIds:[]},hongKong:{status:'unavailable',sourceIds:[]},us:{status:'fresh',sourceIds:['cn']},globalAssets:{status:'unavailable',sourceIds:[]}},sessionSummary:{us:priorSummary}};
  const result=await runSiteUpdate({now,dataDir:dir,datasetRunners:{'market-overview':async()=>market,'news-feed':async()=>({status:'fresh',attemptedAt:now,lastSuccessfulAt:now,latest:[{...news,invalidationReason:'withdrawn'}]})}});
  expect(result.datasets['market-overview'].snapshot.sessionSummary.us.explanations).toEqual([]);
  const published=JSON.parse(await readFile(join(dir,'market-overview.json'),'utf8'));expect(published.sessionSummary.us.explanations).toEqual([]);expect(published.sessionSummary.us.facts).toHaveLength(1);
 }finally{await rm(dir,{recursive:true,force:true});}
});
