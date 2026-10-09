import {EDITORIAL_REVIEW_VERSION} from './editorial-audit.mjs';
export function needsReview(record,version=EDITORIAL_REVIEW_VERSION){
 return !!record.editorial&&!record.invalidationReason&&(record.editorial.generator?.review!==version||!Array.isArray(record.editorial.impactAssessment)||record.editorial.impactAssessment.length!==6);
}
export function reconcileReview(record,prior,now){
 if(record.invalidationReason)return {...record,editorial:undefined,factualSummary:undefined};
 const old=prior.find(old=>old.id===record.id&&old.canonicalUrl===record.canonicalUrl&&old.article?.sha256===record.article?.sha256&&old.originalTitle===record.originalTitle&&old.publishedAt===record.publishedAt);
 if(old?.reviewMigration?.state==='rejected'&&old.reviewMigration.reviewVersion===EDITORIAL_REVIEW_VERSION)return {...record,editorial:undefined,analysisAttempt:old.analysisAttempt,reviewMigration:old.reviewMigration,factualSummary:old.factualSummary};
 let result=record;
 if(old?.editorial&&!needsReview(old))result={...record,editorial:old.editorial,titleZh:old.titleZh,summaryZh:old.summaryZh,titleEn:old.titleEn,summaryEn:old.summaryEn,translationStatus:old.translationStatus,reviewMigration:old.reviewMigration};
 if(needsReview(result))result={...result,reviewMigration:{state:'pending',sourceHash:result.article.sha256,reviewVersion:EDITORIAL_REVIEW_VERSION,lastAttemptAt:old?.reviewMigration?.lastAttemptAt}};
 return result;
}
export function reconcileHistory(prior,current){
 return prior.map(old=>{
  const latest=current.find(r=>r.canonicalUrl===old.canonicalUrl);
  if(latest&&(latest.originalTitle!==old.originalTitle||latest.publishedAt!==old.publishedAt||latest.article?.sha256!==old.article?.sha256||latest.invalidationReason))return {...old,editorial:undefined,factualSummary:undefined,inferences:[],invalidationReason:'superseded-source-version',supersededBy:latest.id};
  return old;
 });
}
