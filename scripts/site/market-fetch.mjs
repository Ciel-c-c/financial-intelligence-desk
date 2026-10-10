import {marketSources,assertSourceReviewCurrent} from './source-registry.mjs';
import {normalizeObservation} from './market-observations.mjs';
import {parseMarketReport} from './market-report-parser.mjs';
import {parseNewsFeed} from '../news/feed-parser.mjs';
const MAX_BYTES=2*1024*1024;
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
