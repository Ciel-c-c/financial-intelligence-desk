import {articleHash,fetchFullArticle} from './full-article.mjs';
import {newsSources} from './source-registry.mjs';
import {buildSourcePolicies,isSourceAllowed} from './source-policy.mjs';
import {needsReview} from './review-migration.mjs';
/** Reuse the published source version. Only selected missing bodies need a bounded recheck. */
export async function preparePublishedNews(snapshot,{now,fetchImpl=fetch,maxBodyRechecks=2}={}){
 const policies=buildSourcePolicies(newsSources,now),records=[],health={id:'published-evidence',name:'Published evidence recheck',status:'ok',itemCount:0,attempted:0,unavailable:0,invalidated:0};
 const invalidate=(record,reason)=>{health.invalidated++;return {...record,editorial:undefined,factualSummary:undefined,inferences:[],invalidationReason:reason};};
 for(const original of [...snapshot.latest,...snapshot.continuing,...snapshot.retainedDetails]){
  let record={...original};
  if(record.invalidationReason){records.push(invalidate(record,record.invalidationReason));continue;}
  if(!isSourceAllowed(record,policies,now)){records.push(invalidate(record,'source-policy-expired'));continue;}
  if(typeof record.article?.text==='string'&&articleHash(record.article.text)!==record.article.sha256){records.push(invalidate(record,'source-evidence-mismatch'));continue;}
  const age=Date.parse(now)-Date.parse(record.publishedAt);
  const needsModel=age>=0&&age<=86400000&&(!record.editorial||needsReview(record)||record.originalLanguage==='en'&&record.factualSummary?.language!=='zh');
  if(needsModel&&record.article?.text===undefined&&['cnfin-body','yicai-body','ths-body'].includes(record.article?.reader)&&health.attempted<maxBodyRechecks){
   const source=newsSources.find(s=>s.id===record.sourceId&&s.enabled);
   if(source){
    health.attempted++;let confirmed;
    const article=await fetchFullArticle(record,source,now,fetchImpl,reason=>{confirmed=reason;});
    if(confirmed){records.push(invalidate(record,confirmed));continue;}
    if(article&&article.sha256!==record.article.sha256){records.push(invalidate(record,'source-version-changed'));continue;}
    if(article){record={...record,article};health.itemCount++;}
    else{health.unavailable++;if(record.originalLanguage==='en'&&record.factualSummary?.language!=='zh')record={...record,chineseSummary:{status:'unavailable',reason:'source-body-unavailable',attemptedAt:now}};}
   }
  }
  records.push(record);
 }
 if(health.unavailable||health.invalidated)health.status='error';
 return {records,health};
}
