import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { readJson, writeJsonAtomic } from '../snapshot-schema.mjs';
import { validateNewsSnapshot } from './news-contract.mjs';
import { newsSources } from './source-registry.mjs';
import { fetchNewsSource } from './fetch-news-sources.mjs';
import { normalizeNewsItem } from './news-normalizer.mjs';
import { classifyNewsItem } from './news-classifier.mjs';
import { clusterNewsItems } from './news-clusterer.mjs';
import { selectNewsWindows } from './news-ranking.mjs';
import { enrichNewsItems } from './news-enrichment.mjs';

const defaultPath=resolve('public/data/news-feed.json');
export async function buildNewsSnapshot({now,sourceResults,previous,enrichmentOptions={}}){
  const healthy=sourceResults.filter(result=>result.ok); const sourceHealth=sourceResults.map(result=>({id:result.id,name:result.name,status:result.ok?'ok':'error',itemCount:result.items.length,...(result.error?{error:result.error}:{})}));
  if(!healthy.length&&previous) return {...previous,attemptedAt:now,nextExpectedAt:new Date(Date.parse(now)+3600_000).toISOString(),status:'source_error',sourceHealth,message:'本轮全部新闻来源失败，继续使用最近一次成功快照。'};
  const normalized=healthy.flatMap(result=>result.items).map(normalizeNewsItem).map(classifyNewsItem); const clustered=clusterNewsItems(normalized); const enriched=await enrichNewsItems(clustered,enrichmentOptions); const {latest,continuing}=selectNewsWindows(enriched,now);
  const activeIds=new Set([...latest,...continuing].map(item=>item.id)); const retainedDetails=[...(previous?.latest??[]),...(previous?.continuing??[]),...(previous?.retainedDetails??[])].filter(item=>!activeIds.has(item.id)&&Date.parse(now)-Date.parse(item.publishedAt)<=7*86400_000).filter((item,index,array)=>array.findIndex(candidate=>candidate.id===item.id)===index);
  const status=sourceResults.some(result=>!result.ok)?'delayed':'fresh'; return {schemaVersion:1,attemptedAt:now,lastSuccessfulAt:now,nextExpectedAt:new Date(Date.parse(now)+3600_000).toISOString(),status,latest,continuing,retainedDetails,sourceHealth,...(status==='delayed'?{message:'部分新闻来源暂时异常，已发布其余可靠来源。'}:{})};
}
export async function updateNewsFeed({now=new Date().toISOString(),sourceResults,outputPath=defaultPath,statusPath=outputPath===defaultPath?resolve('public/data/update-status.json'):undefined,previous,enrichmentOptions}={}){
  const old=previous??await readJson(outputPath); const results=sourceResults??await Promise.all(newsSources.filter(source=>source.enabled).map(source=>fetchNewsSource(source,now))); const options=enrichmentOptions??{endpoint:process.env.NEWS_TRANSLATION_API_URL,apiKey:process.env.NEWS_TRANSLATION_API_KEY,model:process.env.NEWS_TRANSLATION_MODEL,fetchImpl:fetch,cache:{}}; const candidate=await buildNewsSnapshot({now,sourceResults:results,previous:old,enrichmentOptions:options}); if(!validateNewsSnapshot(candidate)) throw new Error('Generated news snapshot is invalid'); await writeJsonAtomic(outputPath,candidate);
  if(statusPath){const existing=await readJson(statusPath);const others=(existing?.datasets??[]).filter(dataset=>dataset.id!=='news-feed');const newsHealth=candidate.sourceHealth.map(source=>({...source,id:`news-${source.id}`,name:`${source.name}（新闻）`}));const oldHealth=(existing?.sourceHealth??[]).filter(source=>!source.id.startsWith('news-'));const status={schemaVersion:1,attemptedAt:now,lastSuccessfulAt:candidate.lastSuccessfulAt,status:candidate.status,datasets:[...others,{id:'news-feed',status:candidate.status,lastSuccessfulAt:candidate.lastSuccessfulAt}],sourceHealth:[...oldHealth,...newsHealth],...(candidate.message?{message:candidate.message}:{})};await writeJsonAtomic(statusPath,status);}
  return candidate;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href) updateNewsFeed().then(value=>process.stdout.write(`News: latest=${value.latest.length}, continuing=${value.continuing.length}, status=${value.status}\n`)).catch(error=>{console.error(error);process.exitCode=1;});
