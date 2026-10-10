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
import {prepareNewsEvidence} from './summary-evidence.mjs';
import {economicNewsPriority} from './news-priority.mjs';
import {buildSourcePolicies,isSourceAllowed} from './source-policy.mjs';
import {buildFactualSummary,validateFactualSummary} from './factual-summary.mjs';
import {needsReview,reconcileReview,reconcileHistory} from './review-migration.mjs';
import {EDITORIAL_REVIEW_VERSION} from './editorial-audit.mjs';

const defaultPath=resolve('public/data/news-feed.json');
export async function buildNewsSnapshot({now,sourceResults,previous,enrichmentOptions={},reviewedNews=[]}){
  const healthy=sourceResults.filter(result=>result.ok); const sourceHealth=sourceResults.map(result=>({id:result.id,name:result.name,status:result.ok?'ok':'error',itemCount:result.items.length,...(result.error?{error:result.error}:{})}));
  const prior=[...(previous?.latest??[]),...(previous?.continuing??[]),...(previous?.retainedDetails??[])];
  reviewedNews=reviewedNews.map(record=>reconcileReview(record,prior,now));
  if(!healthy.length&&previous){
    const replacements=new Map(reviewedNews.map(item=>[item.canonicalUrl,item]));
    const cached=[...(previous.latest??[]),...(previous.continuing??[]),...(previous.retainedDetails??[])].filter(item=>!replacements.has(item.canonicalUrl));
    const all=[...reviewedNews,...reconcileHistory(cached,reviewedNews)].map(record=>toPublicEvidence(reconcileReview(record,prior,now)));
    const windows=selectNewsWindows(all,now),active=new Set([...windows.latest,...windows.continuing].map(item=>item.id));
    return {...previous,...windows,retainedDetails:all.filter(item=>!active.has(item.id)),attemptedAt:now,nextExpectedAt:new Date(Date.parse(now)+3600_000).toISOString(),status:'source_error',sourceHealth,message:'本轮新闻列表来源失败，保留此前已核验报道；正文复核变化与失效标记已同步。'};
  }
  reviewedNews=reviewedNews.filter(record=>{
   const current=healthy.flatMap(result=>result.items).find(raw=>raw.canonicalUrl===record.canonicalUrl);
   if(!current) return true;
   if(current.originalTitle!==record.originalTitle||current.publishedAt!==record.publishedAt)return false;
   if(current.article?.status==='complete'&&current.article.sha256!==record.article?.sha256)return false;
   if(record.article?.status!=='summary')return true;
   const evidence=prepareNewsEvidence(current).article;
   return evidence?.sha256===record.article.sha256&&current.originalTitle===record.originalTitle&&current.publishedAt===record.publishedAt;
  });
  const normalized=healthy.flatMap(result=>result.items).filter(raw=>!reviewedNews.some(item=>item.canonicalUrl===raw.canonicalUrl)).map(normalizeNewsItem).map(classifyNewsItem).map(prepareNewsEvidence);
  const clustered=clusterNewsItems(normalized),state={attempted:0,generated:0,rejected:0,failures:0,requests:0,limit:12,stopped:false};
  const working=[...reviewedNews],policies=buildSourcePolicies(newsSources,now);
  const previousAttempt=record=>prior.find(old=>old.canonicalUrl===record.canonicalUrl&&old.analysisAttempt?.sourceBodyHash===record.article?.sha256)?.analysisAttempt;
  const sourceCounts=new Map(),rounds=new Map(),sourceLastAttempt=new Map();
  const sourceFamily=record=>(record.sourceName??record.sourceId).split('·')[0].trim();
  for(const record of prior){const time=Date.parse(record.analysisAttempt?.lastAttemptAt);if(Number.isFinite(time)) sourceLastAttempt.set(sourceFamily(record),Math.max(time,sourceLastAttempt.get(sourceFamily(record))??0));}
  const priorityTier=record=>economicNewsPriority(record)>=60?2:economicNewsPriority(record)>0?1:0;
  for(const record of [...clustered].sort((a,b)=>economicNewsPriority(b)-economicNewsPriority(a)||Date.parse(b.publishedAt)-Date.parse(a.publishedAt))){const family=sourceFamily(record),count=sourceCounts.get(family)??0;rounds.set(record.id,count);sourceCounts.set(family,count+1);}
  for(const raw of clustered.sort((a,b)=>priorityTier(b)-priorityTier(a)||(sourceLastAttempt.get(sourceFamily(a))??0)-(sourceLastAttempt.get(sourceFamily(b))??0)||(previousAttempt(a)?.count??0)-(previousAttempt(b)?.count??0)||(rounds.get(a.id)??0)-(rounds.get(b.id)??0)||economicNewsPriority(b)-economicNewsPriority(a)||Date.parse(b.publishedAt)-Date.parse(a.publishedAt))){
   let record=reviewChineseArticle(raw);
   const attempt=previousAttempt(record);
   if(attempt) record={...record,analysisAttempt:attempt};
   const cached=['complete','summary'].includes(record.article?.status)&&record.article.sha256?prior.find(old=>old.editorial&&old.canonicalUrl===record.canonicalUrl&&old.originalTitle===record.originalTitle&&old.publishedAt===record.publishedAt&&old.editorial.sourceBodyHash===record.article.sha256):undefined;
   if(!record.editorial&&cached) record={...record,...(cached.editorial.language==='en'?{titleEn:cached.titleEn,summaryEn:cached.summaryEn}:{titleZh:cached.titleZh,summaryZh:cached.summaryZh}),translationStatus:cached.translationStatus,detailStatus:cached.detailStatus,editorial:cached.editorial};
   const priorSummary=prior.find(old=>old.factualSummary&&old.canonicalUrl===record.canonicalUrl&&validateFactualSummary(record,old.factualSummary,policies,now));
   if(priorSummary)record={...record,factualSummary:priorSummary.factualSummary};
   const oldQueue=prior.find(old=>old.id===record.id&&old.article?.sha256===record.article?.sha256)?.queue;
   record={...record,queue:{firstSeenAt:oldQueue?.firstSeenAt??now,summaryAttempt:oldQueue?.summaryAttemptVersion==='summary-diagnostics-v1'?oldQueue.summaryAttempt??0:0,summaryAttemptVersion:'summary-diagnostics-v1'}};
   working.push(record);
  }
  const current=record=>{const age=Date.parse(now)-Date.parse(record.publishedAt);return age>=0&&age<=86400_000;};
  const historical=reconcileHistory(prior,working);
  for(const record of historical)if(!working.some(r=>r.id===record.id))working.push(record);
  for(let i=0;i<working.length;i++){
   let record=reconcileReview(working[i],prior,now);
   const old=prior.find(old=>old.id===record.id&&old.article?.sha256===record.article?.sha256&&old.originalTitle===record.originalTitle&&old.publishedAt===record.publishedAt);
   if(!record.factualSummary&&old?.factualSummary&&validateFactualSummary(record,old.factualSummary,policies,now))record={...record,factualSummary:old.factualSummary};
   if(needsReview(record))record={...record,reviewMigration:{state:'pending',sourceHash:record.article.sha256,reviewVersion:EDITORIAL_REVIEW_VERSION,lastAttemptAt:old?.reviewMigration?.lastAttemptAt}};
   working[i]=record;
  }
  // Raw allowed Chinese publisher summaries need no API budget, even if a
  // model outage later stops all generation for this run.
  let originalSummaries=0,summaryAttempts=0,summaryGenerated=0;const summaryRejections={};
  for(let i=0;i<working.length;i++){
   const record=working[i];if(record.factualSummary||!current(record))continue;
   const factualSummary=await buildFactualSummary(record,{policies,budget:state,modelOptions:{},now});
   if(factualSummary){working[i]={...record,factualSummary};originalSummaries++;}
  }
  const deep=async index=>{
   if(!enrichmentOptions.apiKey||state.stopped||state.requests>9)return;
   const original=working[index],migrating=needsReview(original),before=state.attempted;
   const input=migrating?{...original,editorial:undefined,analysisAttempt:original.analysisAttempt?.reviewVersion===EDITORIAL_REVIEW_VERSION?original.analysisAttempt:undefined}:original;
   const result=await analyzeWithCerebras(input,{...enrichmentOptions,provider:'groq'},state);
   const migration={sourceHash:original.article.sha256,reviewVersion:EDITORIAL_REVIEW_VERSION,lastAttemptAt:now};
   if(result.editorial&&!needsReview(result))working[index]={...result,reviewMigration:{...migration,state:'approved'}};
   else if(migrating&&state.attempted>before)working[index]=state.stopped||state.protocolFailure?{...original,reviewMigration:{...migration,state:'pending'}}:{...result,editorial:undefined,inferences:[],reviewMigration:{...migration,state:'rejected'}};
   else working[index]=result;
  };
  const migrationCandidates=()=>working.map((record,index)=>({record,index})).filter(({record})=>needsReview(record)&&record.article?.text&&(record.analysisAttempt?.reviewVersion!==EDITORIAL_REVIEW_VERSION||(record.analysisAttempt?.count??0)<3)).sort((a,b)=>Date.parse(a.record.reviewMigration?.lastAttemptAt??'1970-01-01')-Date.parse(b.record.reviewMigration?.lastAttemptAt??'1970-01-01'));
  const eligibleDeep=()=>working.map((record,index)=>({record,index})).filter(({record})=>current(record)&&!record.editorial&&record.article?.text&&(record.analysisAttempt?.count??0)<3);
  const first=eligibleDeep()[0]??migrationCandidates()[0];if(first)await deep(first.index);
  const summaryLimit=Number(enrichmentOptions.maxSummaries)===0?0:Number(enrichmentOptions.maxSummaries)===1?1:2;
  const summaryOrder=working.map((record,index)=>({record,index})).sort((a,b)=>(a.record.originalLanguage==='en'?0:1)-(b.record.originalLanguage==='en'?0:1)).map(({index})=>index);
  for(const i of summaryOrder){
   if(summaryAttempts>=summaryLimit)break;
   const record=working[i];if(record.factualSummary||record.editorial||!current(record)||!isSourceAllowed(record,policies,now)||!record.article?.text||record.queue?.summaryAttempt>=3||!enrichmentOptions.apiKey||state.stopped||state.requests>10)continue;
   summaryAttempts++;
   let summaryRejection;
   const factualSummary=await buildFactualSummary(record,{policies,budget:state,modelOptions:enrichmentOptions,now,onReject:reason=>{summaryRejection=reason;summaryRejections[reason]=(summaryRejections[reason]??0)+1;}});
   if(factualSummary){working[i]={...record,factualSummary};summaryGenerated++;}
   else if(!state.stopped&&!state.protocolFailure)working[i]={...record,queue:{...record.queue,summaryAttempt:(record.queue?.summaryAttempt??0)+1,summaryRejection}};
  }
  const second=migrationCandidates().find(({index})=>index!==first?.index)??eligibleDeep().find(({index})=>index!==first?.index);
  if(second)await deep(second.index);
  const enriched=working.map(toPublicEvidence);
  sourceHealth.push({id:'groq-summary',name:'来源事实总结与中文整理',status:state.stopped||summaryAttempts>0&&summaryGenerated===0?'error':'ok',itemCount:originalSummaries+summaryGenerated,originalSummaries,attempted:summaryAttempts,generated:summaryGenerated,requests:state.requests,rejectionReasons:summaryRejections,...(state.reason?{error:state.reason}:{})});
  if(enrichmentOptions.apiKey) sourceHealth.push({id:'groq-editorial',name:'Groq 新闻摘要与机制解读',status:state.stopped||state.failures||(state.attempted>0&&state.generated===0)?'error':'ok',itemCount:state.generated,...(state.reason?{error:state.reason}:{}),attempted:state.attempted,rejected:state.rejected,failures:state.failures,stages:state.stages??{evidence:0,analysis:0,audit:0},rejectionReasons:state.rejectionReasons??{}});
  const {latest,continuing}=selectNewsWindows(enriched,now);
  const activeIds=new Set([...latest,...continuing].map(item=>item.id)); const retainedDetails=[...enriched,...(previous?.latest??[]),...(previous?.continuing??[]),...(previous?.retainedDetails??[])].filter(item=>!activeIds.has(item.id)&&Number.isFinite(Date.parse(item.publishedAt))&&Date.parse(item.publishedAt)<=Date.parse(now)).filter((item,index,array)=>array.findIndex(candidate=>candidate.id===item.id)===index).sort((a,b)=>Date.parse(b.publishedAt)-Date.parse(a.publishedAt)).slice(0,60);
  const status=sourceResults.some(result=>!result.ok)?'delayed':'fresh'; return {schemaVersion:1,attemptedAt:now,lastSuccessfulAt:now,nextExpectedAt:new Date(Date.parse(now)+3600_000).toISOString(),status,latest,continuing,retainedDetails,sourceHealth,...(status==='delayed'?{message:'部分新闻来源暂时异常，已发布其余可靠来源。'}:{})};
}
export async function updateNewsFeed({now=new Date().toISOString(),sourceResults,outputPath=defaultPath,statusPath=outputPath===defaultPath?resolve('public/data/update-status.json'):undefined,previous,enrichmentOptions}={}){
  const old=previous??await readJson(outputPath); const results=sourceResults??await Promise.all(newsSources.filter(source=>source.enabled).map(source=>fetchNewsSource(source,now))); const reviewedNews=sourceResults?[]:await refreshReviewedNews(now,fetch,undefined,{retainBody:true}); const options=enrichmentOptions??{apiKey:process.env.GROQ_API_KEY,provider:'groq',maxArticles:process.env.NEWS_MAX_ARTICLES_PER_RUN}; const candidate=await buildNewsSnapshot({now,sourceResults:results,previous:old,enrichmentOptions:options,reviewedNews}); if(!validateNewsSnapshot(candidate)) throw new Error('Generated news snapshot is invalid'); await writeJsonAtomic(outputPath,candidate);
  if(statusPath){const existing=await readJson(statusPath);const others=(existing?.datasets??[]).filter(dataset=>dataset.id!=='news-feed');const newsHealth=candidate.sourceHealth.map(source=>({...source,id:`news-${source.id}`,name:`${source.name}（新闻）`}));const oldHealth=(existing?.sourceHealth??[]).filter(source=>!source.id.startsWith('news-'));const status={schemaVersion:1,attemptedAt:now,lastSuccessfulAt:candidate.lastSuccessfulAt,status:candidate.status,datasets:[...others,{id:'news-feed',status:candidate.status,lastSuccessfulAt:candidate.lastSuccessfulAt}],sourceHealth:[...oldHealth,...newsHealth],...(candidate.message?{message:candidate.message}:{})};await writeJsonAtomic(statusPath,status);}
  return candidate;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href) updateNewsFeed().then(value=>process.stdout.write(`News: latest=${value.latest.length}, continuing=${value.continuing.length}, status=${value.status}\n`)).catch(error=>{console.error(error);process.exitCode=1;});
