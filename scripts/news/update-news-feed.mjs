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
import { refreshReviewedNews } from './reviewed-news.mjs';
import { toPublicEvidence } from './full-article.mjs';
import { reviewChineseArticle } from './chinese-editorial.mjs';
import {analyzeWithCerebras} from './cerebras-editorial.mjs';

const defaultPath=resolve('public/data/news-feed.json');
export async function buildNewsSnapshot({now,sourceResults,previous,enrichmentOptions={},reviewedNews=[]}){
  const healthy=sourceResults.filter(result=>result.ok); const sourceHealth=sourceResults.map(result=>({id:result.id,name:result.name,status:result.ok?'ok':'error',itemCount:result.items.length,...(result.error?{error:result.error}:{})}));
  if(!healthy.length&&previous){
    const replacements=new Map(reviewedNews.map(item=>[item.canonicalUrl,item]));
    const cached=[...(previous.latest??[]),...(previous.continuing??[]),...(previous.retainedDetails??[])].filter(item=>!replacements.has(item.canonicalUrl));
    const all=[...reviewedNews,...cached].map(toPublicEvidence);
    const windows=selectNewsWindows(all,now),active=new Set([...windows.latest,...windows.continuing].map(item=>item.id));
    return {...previous,...windows,retainedDetails:all.filter(item=>!active.has(item.id)),attemptedAt:now,nextExpectedAt:new Date(Date.parse(now)+3600_000).toISOString(),status:'source_error',sourceHealth,message:'本轮新闻列表来源失败，保留此前已核验报道；正文复核变化与失效标记已同步。'};
  }
  const normalized=healthy.flatMap(result=>result.items).filter(raw=>!reviewedNews.some(item=>item.canonicalUrl===raw.canonicalUrl)).map(normalizeNewsItem).map(classifyNewsItem);
  const clustered=clusterNewsItems(normalized),state={attempted:0,generated:0,rejected:0,failures:0,stopped:false};
  const enriched=[...reviewedNews];
  const prior=[...(previous?.latest??[]),...(previous?.continuing??[]),...(previous?.retainedDetails??[])];
  for(const raw of clustered.sort((a,b)=>Date.parse(b.publishedAt)-Date.parse(a.publishedAt))){
   let record=reviewChineseArticle(raw);
   const cached=record.article?.status==='complete'&&record.article.sha256?prior.find(old=>old.editorial&&old.canonicalUrl===record.canonicalUrl&&old.originalTitle===record.originalTitle&&old.publishedAt===record.publishedAt&&old.editorial.sourceBodyHash===record.article.sha256):undefined;
   if(!record.editorial&&cached) record={...record,...(cached.editorial.language==='en'?{titleEn:cached.titleEn,summaryEn:cached.summaryEn}:{titleZh:cached.titleZh,summaryZh:cached.summaryZh}),translationStatus:cached.translationStatus,detailStatus:cached.detailStatus,editorial:cached.editorial};
   const age=Date.parse(now)-Date.parse(record.publishedAt);
   if(age>=0&&age<=86400_000) record=await analyzeWithCerebras(record,enrichmentOptions,state);
   enriched.push(toPublicEvidence(record));
  }
  if(enrichmentOptions.apiKey) sourceHealth.push({id:enrichmentOptions.provider==='groq'?'groq-editorial':'cerebras-editorial',name:enrichmentOptions.provider==='groq'?'Groq 完整正文解读':'Cerebras 完整正文解读',status:state.stopped||state.failures?'error':'ok',itemCount:state.generated,...(state.reason?{error:state.reason}:{}),attempted:state.attempted,rejected:state.rejected,failures:state.failures,rejectionReasons:state.rejectionReasons??{}});
  const {latest,continuing}=selectNewsWindows(enriched,now);
  const activeIds=new Set([...latest,...continuing].map(item=>item.id)); const retainedDetails=[...enriched,...(previous?.latest??[]),...(previous?.continuing??[]),...(previous?.retainedDetails??[])].filter(item=>!activeIds.has(item.id)&&Number.isFinite(Date.parse(item.publishedAt))&&Date.parse(item.publishedAt)<=Date.parse(now)).filter((item,index,array)=>array.findIndex(candidate=>candidate.id===item.id)===index).sort((a,b)=>Date.parse(b.publishedAt)-Date.parse(a.publishedAt)).slice(0,60);
  const status=sourceResults.some(result=>!result.ok)?'delayed':'fresh'; return {schemaVersion:1,attemptedAt:now,lastSuccessfulAt:now,nextExpectedAt:new Date(Date.parse(now)+3600_000).toISOString(),status,latest,continuing,retainedDetails,sourceHealth,...(status==='delayed'?{message:'部分新闻来源暂时异常，已发布其余可靠来源。'}:{})};
}
export async function updateNewsFeed({now=new Date().toISOString(),sourceResults,outputPath=defaultPath,statusPath=outputPath===defaultPath?resolve('public/data/update-status.json'):undefined,previous,enrichmentOptions}={}){
  const old=previous??await readJson(outputPath); const results=sourceResults??await Promise.all(newsSources.filter(source=>source.enabled).map(source=>fetchNewsSource(source,now))); const reviewedNews=sourceResults?[]:await refreshReviewedNews(now); const options=enrichmentOptions??{apiKey:process.env.GROQ_API_KEY,provider:'groq'}; const candidate=await buildNewsSnapshot({now,sourceResults:results,previous:old,enrichmentOptions:options,reviewedNews}); if(!validateNewsSnapshot(candidate)) throw new Error('Generated news snapshot is invalid'); await writeJsonAtomic(outputPath,candidate);
  if(statusPath){const existing=await readJson(statusPath);const others=(existing?.datasets??[]).filter(dataset=>dataset.id!=='news-feed');const newsHealth=candidate.sourceHealth.map(source=>({...source,id:`news-${source.id}`,name:`${source.name}（新闻）`}));const oldHealth=(existing?.sourceHealth??[]).filter(source=>!source.id.startsWith('news-'));const status={schemaVersion:1,attemptedAt:now,lastSuccessfulAt:candidate.lastSuccessfulAt,status:candidate.status,datasets:[...others,{id:'news-feed',status:candidate.status,lastSuccessfulAt:candidate.lastSuccessfulAt}],sourceHealth:[...oldHealth,...newsHealth],...(candidate.message?{message:candidate.message}:{})};await writeJsonAtomic(statusPath,status);}
  return candidate;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href) updateNewsFeed().then(value=>process.stdout.write(`News: latest=${value.latest.length}, continuing=${value.continuing.length}, status=${value.status}\n`)).catch(error=>{console.error(error);process.exitCode=1;});
