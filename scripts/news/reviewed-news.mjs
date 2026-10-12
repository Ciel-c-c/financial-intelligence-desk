import { readJson } from '../snapshot-schema.mjs';
import { newsSources,articleSources } from './source-registry.mjs';
import { articleHash,fetchFullArticle,toPublicEvidence } from './full-article.mjs';
import { reviewChineseArticle } from './chinese-editorial.mjs';
import {needsReview} from './review-migration.mjs';
import {buildSourcePolicies,isSourceAllowed} from './source-policy.mjs';
export async function refreshReviewedNews(now,fetchImpl=fetch,records,{retainBody=false,pending,sourceResults=[]}={}){
  const staticRecords=records??(await readJson('public/data/reviewed-news.json'))?.items??[];
  const freshBodies=new Set(sourceResults.filter(s=>s.ok).flatMap(s=>s.items??[]).filter(r=>typeof r.article?.text==='string').map(r=>r.canonicalUrl));
  const policies=buildSourcePolicies(newsSources,now);
  const dynamic=[...(pending?.latest??[]),...(pending?.continuing??[]),...(pending?.retainedDetails??[])].filter(r=>{
    const age=Date.parse(now)-Date.parse(r.publishedAt);
    return age>=0&&age<=86400_000&&needsReview(r)&&r.article?.text===undefined&&['cnfin-body','yicai-body'].includes(r.article?.reader)
      &&newsSources.some(s=>s.id===r.sourceId&&s.enabled)&&isSourceAllowed(r,policies,now)&&!freshBodies.has(r.canonicalUrl);
  }).sort((a,b)=>Date.parse(a.reviewMigration?.lastAttemptAt??'1970-01-01')-Date.parse(b.reviewMigration?.lastAttemptAt??'1970-01-01'));
  const extra=[...new Map(dynamic.map(r=>[r.id,r])).values()].slice(0,2);
  const stored=[...new Map([...staticRecords,...extra].map(r=>[r.id,r])).values()];
  return Promise.all(stored.map(async item=>{
    if(!item.article||item.editorial?.sourceBodyHash!==item.article.sha256) return undefined;
    if(typeof item.article.text==='string'&&articleHash(item.article.text)!==item.article.sha256) return undefined;
    if(item.article.text===undefined&&(!['cnfin-body','yicai-body'].includes(item.article.reader)||(item.article.characterCount??0)<100)) return undefined;
    const source=[...newsSources,...articleSources].find(source=>source.id===item.sourceId);
    if(!source) return undefined;
    let confirmedFailure;
    const article=await fetchFullArticle(item,source,now,fetchImpl,reason=>{confirmedFailure=reason;});
    // A failed request retains the actual previous verification time. Changed
    // content invalidates the old translation and interpretation as one unit.
    if(!article){
      if(!confirmedFailure) return item;
      return {...item,fetchedAt:now,editorial:undefined,article:{status:'unreadable',reader:item.article.reader,sha256:'0'.repeat(64),sourceUrl:item.canonicalUrl,checkedAt:now},invalidationReason:confirmedFailure};
    }
    const updated={...item,fetchedAt:now,article,editorial:article.sha256===item.article.sha256?item.editorial:undefined};
    const result=updated.editorial?updated:reviewChineseArticle(updated);
    return retainBody?result:toPublicEvidence(result);
  })).then(items=>items.filter(Boolean));
}
