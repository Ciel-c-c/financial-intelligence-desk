import {marketSources,assertSourceReviewCurrent} from './source-registry.mjs';
import {normalizeObservation} from './market-observations.mjs';
import {parseMarketReport} from './market-report-parser.mjs';
import {parseNewsFeed} from '../news/feed-parser.mjs';
import {newsSources,validateRegisteredSource} from '../news/source-registry.mjs';
import {fetchNewsSource} from '../news/fetch-news-sources.mjs';
import {articleHash,fetchFullArticle} from '../news/full-article.mjs';
import {parseChineseIndex} from '../news/chinese-index.mjs';
const MAX_BYTES=2*1024*1024;
// Bounded public stock pagination; six body reads maximum across markets.
export const marketReportSources=newsSources.filter(source=>source.id==='cnfin').map(source=>({...source,feedUrl:'https://www.cnfin.com/in/stockdata/index.shtml',articlePolicy:{...source.articlePolicy,pathPrefix:'/gs-lb/detail/'}}));
function reportPolicy(source,now){
 // Reuse only the previously approved body reader, not arbitrary news feeds.
 if(source?.id!=='cnfin'||source.contentScope!=='body-read-no-reprint'||source.usagePolicy!=='original-analysis-and-source-link-no-full-reprint'||!validateRegisteredSource(source,now))return undefined;
 if(!['/yw-lb/detail/','/gs-lb/detail/'].includes(source.articlePolicy?.pathPrefix))return undefined;
 return {id:source.id,name:source.name,baseUrl:source.homepageUrl,enabled:true,usageMode:'report-facts',
  allowedHosts:source.publisherDomains,allowedPathPatterns:['^'+source.articlePolicy.pathPrefix],markets:['aShare','hongKong','us'],
  reviewedAt:source.verifiedAt+'T00:00:00Z',reviewExpiresAt:new Date(Date.parse(source.verifiedAt)+90*86400_000).toISOString()};
}
export function marketObservationsFromNews(records,source,now){
 const policy=reportPolicy(source,now);if(!policy)return [];
 return records.filter(record=>record.sourceId===source.id&&!record.invalidationReason&&record.article?.status==='complete'&&typeof record.article.text==='string'&&articleHash(record.article.text)===record.article.sha256)
  .flatMap(record=>parseMarketReport({sourceId:source.id,title:record.originalTitle,text:record.article.text,url:record.canonicalUrl,publishedAt:record.publishedAt},{now,policy}));
}
export async function fetchMarketReportSources({sources=marketReportSources,now=new Date().toISOString(),fetchImpl=fetch}={}){
 const results=[];
 for(const source of sources){
  const policy=reportPolicy(source,now);if(!policy)continue;
  let fetched;
  if(source.feedUrl==='https://www.cnfin.com/in/stockdata/index.shtml'){
   try{
    const records=[];let pages=0,discoveryFailures=0;
    for(const tail of ['','_2','_3','_4','_5','_6']){
     const page=source.feedUrl.replace('.shtml',tail+'.shtml');
     try{
      const html=await fetchSourceText({...policy,baseUrl:page,allowedPathPatterns:['^/in/stockdata/index(?:_[2-6])?\\.shtml$']},fetchImpl);
      records.push(...parseChineseIndex(html,source,now));pages++;
     }catch{discoveryFailures++;}
    }
    const eligible=records.filter((record,index,list)=>list.findIndex(item=>item.canonicalUrl===record.canonicalUrl)===index&&/^(?:收评|开盘)[：:]|(?:美股|港股|纽约股市|恒生).*(?:收盘|收涨|收跌|上涨|下跌)/.test(record.originalTitle));
    const pools=[eligible.filter(r=>/美股|纽约股市/.test(r.originalTitle)),eligible.filter(r=>/港股|恒生/.test(r.originalTitle)),eligible.filter(r=>/^(?:收评|开盘)[：:]/.test(r.originalTitle))];
    const preferred=pools.flatMap(pool=>pool.slice(0,2));
    const candidates=[...preferred,...eligible].filter((record,index,list)=>list.findIndex(item=>item.canonicalUrl===record.canonicalUrl)===index).slice(0,6);
    const items=[];
    for(const record of candidates){const article=await fetchFullArticle(record,source,now,fetchImpl);items.push({...record,...(article?{article}:{})});}
    fetched={ok:pages>0,items,discoveryFailures};
   }catch{fetched={ok:false,items:[]};}
  }else fetched=await fetchNewsSource(source,now,fetchImpl);
  const observations=fetched.ok?marketObservationsFromNews(fetched.items,source,now):[];
  for(const market of policy.markets){
   const instruments=observations.filter(item=>item.group===market);
   results.push({sourceId:source.id,market,status:instruments.length?'ok':'error',instruments,...(fetched.discoveryFailures?{discoveryFailures:fetched.discoveryFailures}:{}),
    ...(instruments.length?{}:{error:fetched.ok?'no-explicit-session-observations':'publisher-fetch-failed'})});
  }
 }
 return results;
}
async function boundedText(response){
 const declared=Number(response.headers?.get?.('content-length'));if(declared>MAX_BYTES)throw Error('oversized-source');
 if(response.body?.getReader){const reader=response.body.getReader(),chunks=[];let size=0;try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>MAX_BYTES)throw Error('oversized-source');chunks.push(value);}return Buffer.concat(chunks.map(value=>Buffer.from(value))).toString('utf8');}finally{await reader.cancel().catch(()=>{});}}
 const text=await response.text();if(Buffer.byteLength(text,'utf8')>MAX_BYTES)throw Error('oversized-source');return text;
}
async function fetchSourceText(source,fetchImpl){
 const url=new URL(source.baseUrl);
 if(url.protocol!=='https:'||url.username||url.password||url.port||!source.allowedHosts.includes(url.hostname)||!source.allowedPathPatterns?.some(pattern=>new RegExp(pattern).test(url.pathname)))throw Error('source-request-policy');
 for(let attempt=0;attempt<2;attempt++){
  let response;try{response=await fetchImpl(url.toString(),{redirect:'error',signal:AbortSignal.timeout(15000),headers:{'user-agent':'Financial-Lens-Market/1.0','accept':'application/xml,text/xml,application/rss+xml'}});}catch(error){if(attempt===0)continue;throw Error('network-or-timeout');}
  if(!response.ok){if(response.status>=500&&attempt===0)continue;throw Error('HTTP-'+response.status);}
  if(response.url&&response.url!==url.toString())throw Error('unapproved-redirect');
  return boundedText(response);
 }
 throw Error('source-fetch-failed');
}
function ecbObservations(xml,source,now){
 const tradingDate=xml.match(/\btime=['"]([^'"]+)['"]/)?.[1];
 return [...xml.matchAll(/currency=['"]([A-Z]{3})['"]\s+rate=['"]([0-9.]+)['"]/g)].filter(m=>['USD','JPY','GBP','CNY'].includes(m[1])).map(m=>normalizeObservation({id:'EUR'+m[1],group:'globalAssets',name:'欧元兑'+({USD:'美元',JPY:'日元',GBP:'英镑',CNY:'人民币'})[m[1]],symbol:'EUR'+m[1],value:Number(m[2]),currency:m[1],unit:m[1],session:'reference',tradingDate,timeZone:'UTC',timestampPrecision:'date',provenance:'reference',valuePrecision:m[2].split('.')[1]?.length??0,sourceUrl:source.baseUrl},source,now));
}
export async function fetchMarketSources({sources=marketSources,now=new Date().toISOString(),fetchImpl=fetch}={}){
 const results=[];
 // Sequential requests bound load on publishers; one retry only, no model calls.
 for(const source of sources.filter(s=>s.enabled)){
  try{
   assertSourceReviewCurrent(source,new Date(now));
   if(!['ecb-reference','publisher-feed'].includes(source.adapter))throw Error('missing-approved-adapter');
   const text=await fetchSourceText(source,fetchImpl);
   const instruments=source.adapter==='ecb-reference'?ecbObservations(text,source,now):parseNewsFeed(text,{...source,publisherDomains:source.allowedHosts,feedUrl:source.baseUrl,tier:source.kind==='official'?'official':'verified',defaultLanguage:source.defaultLanguage??'en'},now).slice(0,50).flatMap(record=>parseMarketReport({title:record.originalTitle,text:record.originalTitle+'\n'+(record.originalSummary??''),url:record.canonicalUrl,publishedAt:record.publishedAt,sourceId:source.id},{now,policy:source}));
   for(const market of source.markets)results.push({sourceId:source.id,market,status:instruments.some(o=>o.group===market)?'ok':'error',instruments:instruments.filter(o=>o.group===market),...(instruments.some(o=>o.group===market)?{}:{error:'no-explicit-session-observations'})});
  }catch(error){for(const market of source.markets??[])results.push({sourceId:source.id,market,status:'error',instruments:[],error:error.message});}
 }
 return results;
}
